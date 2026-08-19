-- Escritório e Montezuma emprestam para qualquer um, mas só tomam emprestado entre si.
-- Obra não empresta para escritório/Montezuma.

ALTER TABLE public.emprestimos
  DROP CONSTRAINT IF EXISTS emprestimos_pares_check;

ALTER TABLE public.emprestimos
  ADD CONSTRAINT emprestimos_pares_check CHECK (
    NOT (origem_tipo = 'obra' AND destino_tipo = 'obra')
    AND NOT (origem_tipo = 'obra' AND destino_tipo = 'escritorio')
    AND NOT (
      origem_tipo = 'escritorio'
      AND destino_tipo = 'escritorio'
      AND origem_escritorio_id = destino_escritorio_id
    )
  );

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
  IF p_origem_tipo = 'obra' AND p_destino_tipo = 'escritorio' THEN
    RAISE EXCEPTION 'Escritório e Montezuma não tomam empréstimo de obra';
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
  IF p_sentido = 'emprestar' THEN
    RAISE EXCEPTION 'Escritório e Montezuma não tomam empréstimo de obra';
  END IF;
  IF p_sentido IS NULL OR p_sentido <> 'receber' THEN
    RAISE EXCEPTION 'Sentido deve ser receber';
  END IF;

  -- receber: escritório empresta para a obra
  RETURN public.registrar_emprestimo(
    'escritorio', p_escritorio_id, NULL,
    'obra', NULL, p_obra_id,
    p_valor, p_descricao, p_data
  );
END;
$$;
