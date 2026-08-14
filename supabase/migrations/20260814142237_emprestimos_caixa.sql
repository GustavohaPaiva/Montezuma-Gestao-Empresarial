-- Empréstimos saem do caixa, não do mês.
-- Apaga lançamentos de teste (dual-write em entradas/saida) e cria ledger próprio.

-- ---------------------------------------------------------------------------
-- 1) Limpar testes: linhas de empréstimo obra↔escritório em entradas/saida
-- ---------------------------------------------------------------------------
DELETE FROM public.entradas e
WHERE e.grupo_id IN (
  SELECT om.transferencia_grupo_id::text
  FROM public.obra_movimentacoes om
  WHERE om.escritorio_contra_id IS NOT NULL
    AND om.transferencia_grupo_id IS NOT NULL
);

DELETE FROM public.saida s
WHERE s.grupo_id IN (
  SELECT om.transferencia_grupo_id::text
  FROM public.obra_movimentacoes om
  WHERE om.escritorio_contra_id IS NOT NULL
    AND om.transferencia_grupo_id IS NOT NULL
);

DELETE FROM public.obra_movimentacoes
WHERE escritorio_contra_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2) Tabelas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.emprestimos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origem_tipo text NOT NULL CHECK (origem_tipo IN ('escritorio', 'obra')),
  origem_escritorio_id uuid REFERENCES public.escritorios(id) ON DELETE RESTRICT,
  origem_obra_id bigint REFERENCES public.obras(id) ON DELETE RESTRICT,
  destino_tipo text NOT NULL CHECK (destino_tipo IN ('escritorio', 'obra')),
  destino_escritorio_id uuid REFERENCES public.escritorios(id) ON DELETE RESTRICT,
  destino_obra_id bigint REFERENCES public.obras(id) ON DELETE RESTRICT,
  valor_original numeric NOT NULL CHECK (valor_original > 0),
  saldo_aberto numeric NOT NULL CHECK (saldo_aberto >= 0),
  data date NOT NULL DEFAULT CURRENT_DATE,
  descricao text,
  status text NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto', 'parcial', 'quitado')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT emprestimos_origem_check CHECK (
    (origem_tipo = 'escritorio' AND origem_escritorio_id IS NOT NULL AND origem_obra_id IS NULL)
    OR (origem_tipo = 'obra' AND origem_obra_id IS NOT NULL AND origem_escritorio_id IS NULL)
  ),
  CONSTRAINT emprestimos_destino_check CHECK (
    (destino_tipo = 'escritorio' AND destino_escritorio_id IS NOT NULL AND destino_obra_id IS NULL)
    OR (destino_tipo = 'obra' AND destino_obra_id IS NOT NULL AND destino_escritorio_id IS NULL)
  ),
  CONSTRAINT emprestimos_pares_check CHECK (
    NOT (origem_tipo = 'obra' AND destino_tipo = 'obra')
    AND NOT (
      origem_tipo = 'escritorio'
      AND destino_tipo = 'escritorio'
      AND origem_escritorio_id = destino_escritorio_id
    )
  ),
  CONSTRAINT emprestimos_saldo_max_check CHECK (saldo_aberto <= valor_original)
);

CREATE INDEX IF NOT EXISTS idx_emprestimos_origem_esc
  ON public.emprestimos (origem_escritorio_id)
  WHERE origem_escritorio_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emprestimos_destino_esc
  ON public.emprestimos (destino_escritorio_id)
  WHERE destino_escritorio_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emprestimos_origem_obra
  ON public.emprestimos (origem_obra_id)
  WHERE origem_obra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emprestimos_destino_obra
  ON public.emprestimos (destino_obra_id)
  WHERE destino_obra_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emprestimos_abertos
  ON public.emprestimos (status)
  WHERE status <> 'quitado';

CREATE TABLE IF NOT EXISTS public.emprestimo_movimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emprestimo_id uuid NOT NULL REFERENCES public.emprestimos(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('concessao', 'amortizacao')),
  valor numeric NOT NULL CHECK (valor > 0),
  data date NOT NULL DEFAULT CURRENT_DATE,
  descricao text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emprestimo_movimentos_emp
  ON public.emprestimo_movimentos (emprestimo_id, data DESC);

ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimo_movimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS emprestimos_select ON public.emprestimos;
CREATE POLICY emprestimos_select ON public.emprestimos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti', 'secretaria')
    )
  );

DROP POLICY IF EXISTS emprestimo_movimentos_select ON public.emprestimo_movimentos;
CREATE POLICY emprestimo_movimentos_select ON public.emprestimo_movimentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti', 'secretaria')
    )
  );

-- ---------------------------------------------------------------------------
-- 3) Helpers de caixa
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.caixa_escritorio_valor(p_escritorio_id uuid)
RETURNS numeric
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT
    COALESCE((
      SELECT SUM(valor)::numeric FROM entradas
      WHERE escritorio_id = p_escritorio_id AND validacao = 1
    ), 0)
    - COALESCE((
      SELECT SUM(valor)::numeric FROM saida
      WHERE escritorio_id = p_escritorio_id AND validacao = 1
    ), 0)
    - COALESCE((
      SELECT SUM(saldo_aberto) FROM emprestimos
      WHERE origem_escritorio_id = p_escritorio_id AND saldo_aberto > 0
    ), 0)
    + COALESCE((
      SELECT SUM(saldo_aberto) FROM emprestimos
      WHERE destino_escritorio_id = p_escritorio_id AND saldo_aberto > 0
    ), 0);
$$;

CREATE OR REPLACE FUNCTION public.saldo_caixa_escritorio(p_escritorio_id uuid)
RETURNS TABLE (
  entradas numeric,
  saidas numeric,
  emprestado numeric,
  tomado numeric,
  saldo numeric
)
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT
    COALESCE((
      SELECT SUM(valor)::numeric FROM entradas
      WHERE escritorio_id = p_escritorio_id AND validacao = 1
    ), 0) AS entradas,
    COALESCE((
      SELECT SUM(valor)::numeric FROM saida
      WHERE escritorio_id = p_escritorio_id AND validacao = 1
    ), 0) AS saidas,
    COALESCE((
      SELECT SUM(saldo_aberto) FROM emprestimos
      WHERE origem_escritorio_id = p_escritorio_id AND saldo_aberto > 0
    ), 0) AS emprestado,
    COALESCE((
      SELECT SUM(saldo_aberto) FROM emprestimos
      WHERE destino_escritorio_id = p_escritorio_id AND saldo_aberto > 0
    ), 0) AS tomado,
    public.caixa_escritorio_valor(p_escritorio_id) AS saldo;
$$;

CREATE OR REPLACE FUNCTION public._saldo_obra(p_obra_id bigint)
RETURNS numeric
LANGUAGE sql
VOLATILE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN tipo IN ('entrada', 'transferencia_entrada') THEN valor
      WHEN tipo IN ('transferencia_saida', 'saida_pagamento') THEN -valor
      ELSE 0
    END
  ), 0)
  FROM obra_movimentacoes
  WHERE obra_id = p_obra_id;
$$;

CREATE OR REPLACE FUNCTION public._assert_pode_emprestar()
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid()
      AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para registrar empréstimo';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._lock_partes_emprestimo(
  p_esc_a uuid,
  p_esc_b uuid,
  p_obra_a bigint,
  p_obra_b bigint
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  FOR v_id IN
    SELECT x FROM unnest(ARRAY[p_esc_a, p_esc_b]) AS t(x)
    WHERE x IS NOT NULL
    ORDER BY 1
  LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended('escritorio_caixa:' || v_id::text, 0));
  END LOOP;

  IF p_obra_a IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('obra_caixa:' || p_obra_a::text, 0));
  END IF;
  IF p_obra_b IS NOT NULL AND (p_obra_a IS NULL OR p_obra_b <> p_obra_a) THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('obra_caixa:' || p_obra_b::text, 0));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public._label_obra(p_obra_id bigint)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_cliente text;
  v_local text;
  v_label text;
BEGIN
  SELECT cliente, local INTO v_cliente, v_local FROM obras WHERE id = p_obra_id;
  v_label := COALESCE(NULLIF(trim(v_cliente), ''), 'Obra');
  IF v_local IS NOT NULL AND length(trim(v_local)) > 0 THEN
    v_label := v_label || ' · ' || trim(v_local);
  END IF;
  RETURN v_label;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4) Registrar empréstimo (não toca entradas/saida)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.registrar_emprestimo(
  p_origem_tipo text,
  p_origem_escritorio_id uuid,
  p_origem_obra_id bigint,
  p_destino_tipo text,
  p_destino_escritorio_id uuid,
  p_destino_obra_id bigint,
  p_valor numeric,
  p_descricao text DEFAULT NULL,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_data date := COALESCE(p_data, CURRENT_DATE);
  v_desc text := NULLIF(trim(COALESCE(p_descricao, '')), '');
  v_esc_nome text;
  v_caixa numeric;
  v_obra_id bigint;
  v_obra_tipo text;
  v_esc_contra uuid;
BEGIN
  PERFORM public._assert_pode_emprestar();

  IF p_valor IS NULL OR p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;
  IF p_origem_tipo IS NULL OR p_origem_tipo NOT IN ('escritorio', 'obra') THEN
    RAISE EXCEPTION 'Origem inválida';
  END IF;
  IF p_destino_tipo IS NULL OR p_destino_tipo NOT IN ('escritorio', 'obra') THEN
    RAISE EXCEPTION 'Destino inválido';
  END IF;
  IF p_origem_tipo = 'obra' AND p_destino_tipo = 'obra' THEN
    RAISE EXCEPTION 'Empréstimo entre obras não usa este fluxo';
  END IF;

  IF p_origem_tipo = 'escritorio' THEN
    IF p_origem_escritorio_id IS NULL THEN
      RAISE EXCEPTION 'Escritório de origem é obrigatório';
    END IF;
    p_origem_obra_id := NULL;
    IF NOT EXISTS (SELECT 1 FROM escritorios WHERE id = p_origem_escritorio_id) THEN
      RAISE EXCEPTION 'Escritório de origem não encontrado';
    END IF;
  ELSE
    IF p_origem_obra_id IS NULL THEN
      RAISE EXCEPTION 'Obra de origem é obrigatória';
    END IF;
    p_origem_escritorio_id := NULL;
    IF NOT EXISTS (SELECT 1 FROM obras WHERE id = p_origem_obra_id) THEN
      RAISE EXCEPTION 'Obra de origem não encontrada';
    END IF;
  END IF;

  IF p_destino_tipo = 'escritorio' THEN
    IF p_destino_escritorio_id IS NULL THEN
      RAISE EXCEPTION 'Escritório de destino é obrigatório';
    END IF;
    p_destino_obra_id := NULL;
    IF NOT EXISTS (SELECT 1 FROM escritorios WHERE id = p_destino_escritorio_id) THEN
      RAISE EXCEPTION 'Escritório de destino não encontrado';
    END IF;
  ELSE
    IF p_destino_obra_id IS NULL THEN
      RAISE EXCEPTION 'Obra de destino é obrigatória';
    END IF;
    p_destino_escritorio_id := NULL;
    IF NOT EXISTS (SELECT 1 FROM obras WHERE id = p_destino_obra_id) THEN
      RAISE EXCEPTION 'Obra de destino não encontrada';
    END IF;
  END IF;

  IF p_origem_tipo = 'escritorio' AND p_destino_tipo = 'escritorio'
     AND p_origem_escritorio_id = p_destino_escritorio_id THEN
    RAISE EXCEPTION 'Origem e destino devem ser distintos';
  END IF;

  PERFORM public._lock_partes_emprestimo(
    p_origem_escritorio_id,
    p_destino_escritorio_id,
    p_origem_obra_id,
    p_destino_obra_id
  );

  IF p_origem_tipo = 'escritorio' THEN
    v_caixa := public.caixa_escritorio_valor(p_origem_escritorio_id);
    IF v_caixa < p_valor THEN
      RAISE EXCEPTION 'Saldo insuficiente no caixa (disponível: %)', v_caixa;
    END IF;
  ELSE
    v_caixa := public._saldo_obra(p_origem_obra_id);
    IF v_caixa < p_valor THEN
      RAISE EXCEPTION 'Saldo insuficiente na obra (disponível: %)', v_caixa;
    END IF;
  END IF;

  INSERT INTO emprestimos (
    id, origem_tipo, origem_escritorio_id, origem_obra_id,
    destino_tipo, destino_escritorio_id, destino_obra_id,
    valor_original, saldo_aberto, data, descricao, status, created_by
  ) VALUES (
    v_id, p_origem_tipo, p_origem_escritorio_id, p_origem_obra_id,
    p_destino_tipo, p_destino_escritorio_id, p_destino_obra_id,
    p_valor, p_valor, v_data, v_desc, 'aberto', auth.uid()
  );

  INSERT INTO emprestimo_movimentos (
    emprestimo_id, tipo, valor, data, descricao, created_by
  ) VALUES (
    v_id, 'concessao', p_valor, v_data, v_desc, auth.uid()
  );

  IF p_origem_tipo = 'obra' THEN
    v_obra_id := p_origem_obra_id;
    v_obra_tipo := 'transferencia_saida';
    v_esc_contra := p_destino_escritorio_id;
  ELSIF p_destino_tipo = 'obra' THEN
    v_obra_id := p_destino_obra_id;
    v_obra_tipo := 'transferencia_entrada';
    v_esc_contra := p_origem_escritorio_id;
  ELSE
    v_obra_id := NULL;
  END IF;

  IF v_obra_id IS NOT NULL THEN
    SELECT nome INTO v_esc_nome FROM escritorios WHERE id = v_esc_contra;
    INSERT INTO obra_movimentacoes (
      obra_id, tipo, valor, descricao, data,
      transferencia_grupo_id, obra_contra_id, pessoa_contra,
      escritorio_contra_id, created_by
    ) VALUES (
      v_obra_id, v_obra_tipo, p_valor, v_desc, v_data,
      v_id, NULL, COALESCE(NULLIF(trim(v_esc_nome), ''), 'Escritório'),
      v_esc_contra, auth.uid()
    );
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.amortizar_emprestimo(
  p_emprestimo_id uuid,
  p_valor numeric,
  p_descricao text DEFAULT NULL,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emp emprestimos%ROWTYPE;
  v_data date := COALESCE(p_data, CURRENT_DATE);
  v_desc text := NULLIF(trim(COALESCE(p_descricao, '')), '');
  v_caixa numeric;
  v_esc_nome text;
  v_obra_id bigint;
  v_obra_tipo text;
  v_esc_contra uuid;
  v_novo_saldo numeric;
  v_status text;
  v_mov_id uuid;
BEGIN
  PERFORM public._assert_pode_emprestar();

  IF p_emprestimo_id IS NULL THEN
    RAISE EXCEPTION 'Empréstimo é obrigatório';
  END IF;
  IF p_valor IS NULL OR p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;

  SELECT * INTO v_emp FROM emprestimos WHERE id = p_emprestimo_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Empréstimo não encontrado';
  END IF;
  IF v_emp.status = 'quitado' OR v_emp.saldo_aberto <= 0 THEN
    RAISE EXCEPTION 'Empréstimo já está quitado';
  END IF;
  IF p_valor > v_emp.saldo_aberto THEN
    RAISE EXCEPTION 'Valor maior que o saldo em aberto (%)', v_emp.saldo_aberto;
  END IF;

  PERFORM public._lock_partes_emprestimo(
    v_emp.origem_escritorio_id,
    v_emp.destino_escritorio_id,
    v_emp.origem_obra_id,
    v_emp.destino_obra_id
  );

  -- Quem devolve é o destino (tomou o empréstimo).
  IF v_emp.destino_tipo = 'escritorio' THEN
    v_caixa := public.caixa_escritorio_valor(v_emp.destino_escritorio_id);
    IF v_caixa < p_valor THEN
      RAISE EXCEPTION 'Saldo insuficiente no caixa de quem devolve (disponível: %)', v_caixa;
    END IF;
  ELSE
    v_caixa := public._saldo_obra(v_emp.destino_obra_id);
    IF v_caixa < p_valor THEN
      RAISE EXCEPTION 'Saldo insuficiente na obra (disponível: %)', v_caixa;
    END IF;
  END IF;

  v_novo_saldo := v_emp.saldo_aberto - p_valor;
  IF v_novo_saldo = 0 THEN
    v_status := 'quitado';
  ELSE
    v_status := 'parcial';
  END IF;

  UPDATE emprestimos
  SET saldo_aberto = v_novo_saldo, status = v_status
  WHERE id = p_emprestimo_id;

  INSERT INTO emprestimo_movimentos (
    emprestimo_id, tipo, valor, data, descricao, created_by
  ) VALUES (
    p_emprestimo_id, 'amortizacao', p_valor, v_data, v_desc, auth.uid()
  )
  RETURNING id INTO v_mov_id;

  IF v_emp.destino_tipo = 'obra' THEN
    v_obra_id := v_emp.destino_obra_id;
    v_obra_tipo := 'transferencia_saida';
    v_esc_contra := v_emp.origem_escritorio_id;
  ELSIF v_emp.origem_tipo = 'obra' THEN
    v_obra_id := v_emp.origem_obra_id;
    v_obra_tipo := 'transferencia_entrada';
    v_esc_contra := v_emp.destino_escritorio_id;
  ELSE
    v_obra_id := NULL;
  END IF;

  IF v_obra_id IS NOT NULL THEN
    SELECT nome INTO v_esc_nome FROM escritorios WHERE id = v_esc_contra;
    INSERT INTO obra_movimentacoes (
      obra_id, tipo, valor, descricao, data,
      transferencia_grupo_id, obra_contra_id, pessoa_contra,
      escritorio_contra_id, created_by
    ) VALUES (
      v_obra_id, v_obra_tipo, p_valor,
      COALESCE(v_desc, 'Amortização de empréstimo'), v_data,
      p_emprestimo_id, NULL, COALESCE(NULLIF(trim(v_esc_nome), ''), 'Escritório'),
      v_esc_contra, auth.uid()
    );
  END IF;

  RETURN v_mov_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.registrar_emprestimo_escritorio(
  p_obra_id bigint,
  p_escritorio_id uuid,
  p_sentido text,
  p_valor numeric,
  p_descricao text DEFAULT NULL,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_sentido IS NULL OR p_sentido NOT IN ('emprestar', 'receber') THEN
    RAISE EXCEPTION 'Sentido deve ser emprestar ou receber';
  END IF;

  -- receber: escritório empresta para a obra
  -- emprestar: obra empresta para o escritório
  IF p_sentido = 'receber' THEN
    RETURN public.registrar_emprestimo(
      'escritorio', p_escritorio_id, NULL,
      'obra', NULL, p_obra_id,
      p_valor, p_descricao, p_data
    );
  END IF;

  RETURN public.registrar_emprestimo(
    'obra', NULL, p_obra_id,
    'escritorio', p_escritorio_id, NULL,
    p_valor, p_descricao, p_data
  );
END;
$$;

GRANT SELECT ON public.emprestimos TO authenticated;
GRANT SELECT ON public.emprestimo_movimentos TO authenticated;

REVOKE ALL ON FUNCTION public.caixa_escritorio_valor(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.saldo_caixa_escritorio(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._saldo_obra(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._assert_pode_emprestar() FROM PUBLIC;
REVOKE ALL ON FUNCTION public._lock_partes_emprestimo(uuid, uuid, bigint, bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._label_obra(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_emprestimo(text, uuid, bigint, text, uuid, bigint, numeric, text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.amortizar_emprestimo(uuid, numeric, text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.registrar_emprestimo_escritorio(bigint, uuid, text, numeric, text, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.caixa_escritorio_valor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.saldo_caixa_escritorio(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_emprestimo(text, uuid, bigint, text, uuid, bigint, numeric, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.amortizar_emprestimo(uuid, numeric, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_emprestimo_escritorio(bigint, uuid, text, numeric, text, date) TO authenticated;
