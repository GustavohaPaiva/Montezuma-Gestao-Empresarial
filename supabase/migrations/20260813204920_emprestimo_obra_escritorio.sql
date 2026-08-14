-- Empréstimo obra ↔ escritório: contraparte tipada + lançamento no financeiro.

ALTER TABLE public.obra_movimentacoes
  ADD COLUMN IF NOT EXISTS escritorio_contra_id uuid
    REFERENCES public.escritorios(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_obra_movimentacoes_escritorio_contra
  ON public.obra_movimentacoes (escritorio_contra_id)
  WHERE escritorio_contra_id IS NOT NULL;

ALTER TABLE public.obra_movimentacoes
  DROP CONSTRAINT IF EXISTS obra_movimentacoes_transferencia_exige_grupo;

ALTER TABLE public.obra_movimentacoes
  ADD CONSTRAINT obra_movimentacoes_transferencia_exige_grupo CHECK (
    (
      tipo IN ('entrada', 'saida_pagamento')
      AND transferencia_grupo_id IS NULL
      AND obra_contra_id IS NULL
      AND pessoa_contra IS NULL
      AND escritorio_contra_id IS NULL
    )
    OR (
      tipo IN ('transferencia_entrada', 'transferencia_saida')
      AND transferencia_grupo_id IS NOT NULL
      AND (
        (
          obra_contra_id IS NOT NULL
          AND pessoa_contra IS NULL
          AND escritorio_contra_id IS NULL
        )
        OR (
          obra_contra_id IS NULL
          AND pessoa_contra IS NOT NULL
          AND length(trim(pessoa_contra)) > 0
        )
      )
    )
  );

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
DECLARE
  v_saldo numeric;
  v_grupo uuid := gen_random_uuid();
  v_data date := COALESCE(p_data, CURRENT_DATE);
  v_tipo text;
  v_escritorio_nome text;
  v_obra_cliente text;
  v_obra_local text;
  v_label_obra text;
  v_desc_fin text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid()
      AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para registrar empréstimo com escritório';
  END IF;

  IF p_valor IS NULL OR p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;
  IF p_obra_id IS NULL THEN
    RAISE EXCEPTION 'Obra é obrigatória';
  END IF;
  IF p_escritorio_id IS NULL THEN
    RAISE EXCEPTION 'Escritório é obrigatório';
  END IF;
  IF p_sentido IS NULL OR p_sentido NOT IN ('emprestar', 'receber') THEN
    RAISE EXCEPTION 'Sentido deve ser emprestar ou receber';
  END IF;

  SELECT nome INTO v_escritorio_nome
  FROM escritorios
  WHERE id = p_escritorio_id;

  IF v_escritorio_nome IS NULL OR length(trim(v_escritorio_nome)) = 0 THEN
    RAISE EXCEPTION 'Escritório não encontrado';
  END IF;
  v_escritorio_nome := trim(v_escritorio_nome);

  SELECT cliente, local INTO v_obra_cliente, v_obra_local
  FROM obras
  WHERE id = p_obra_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Obra não encontrada';
  END IF;

  v_label_obra := COALESCE(NULLIF(trim(v_obra_cliente), ''), 'Obra');
  IF v_obra_local IS NOT NULL AND length(trim(v_obra_local)) > 0 THEN
    v_label_obra := v_label_obra || ' · ' || trim(v_obra_local);
  END IF;

  v_desc_fin := NULLIF(trim(COALESCE(p_descricao, '')), '');
  IF v_desc_fin IS NULL THEN
    IF p_sentido = 'emprestar' THEN
      v_desc_fin := 'Pagamento de empréstimo da obra ' || v_label_obra;
    ELSE
      v_desc_fin := 'Empréstimo para obra ' || v_label_obra;
    END IF;
  END IF;

  IF p_sentido = 'emprestar' THEN
    v_tipo := 'transferencia_saida';

    PERFORM pg_advisory_xact_lock(
      hashtextextended('obra_caixa:' || p_obra_id::text, 0)
    );

    SELECT COALESCE(SUM(
      CASE
        WHEN tipo IN ('entrada', 'transferencia_entrada') THEN valor
        WHEN tipo IN ('transferencia_saida', 'saida_pagamento') THEN -valor
        ELSE 0
      END
    ), 0)
    INTO v_saldo
    FROM obra_movimentacoes
    WHERE obra_id = p_obra_id;

    IF v_saldo < p_valor THEN
      RAISE EXCEPTION 'Saldo insuficiente na obra (disponível: %)', v_saldo;
    END IF;
  ELSE
    v_tipo := 'transferencia_entrada';
  END IF;

  INSERT INTO obra_movimentacoes (
    obra_id, tipo, valor, descricao, data,
    transferencia_grupo_id, obra_contra_id, pessoa_contra,
    escritorio_contra_id, created_by
  ) VALUES (
    p_obra_id, v_tipo, p_valor, NULLIF(trim(COALESCE(p_descricao, '')), ''), v_data,
    v_grupo, NULL, v_escritorio_nome,
    p_escritorio_id, auth.uid()
  );

  IF p_sentido = 'receber' THEN
    INSERT INTO saida (
      descricao, forma, valor, data,
      escritorio_id, escritorio, grupo_id, validacao
    ) VALUES (
      v_desc_fin, 'Á vista', p_valor, v_data,
      p_escritorio_id, v_escritorio_nome, v_grupo::text, 1
    );
  ELSE
    INSERT INTO entradas (
      descricao, forma, valor, data,
      escritorio_id, escritorio, grupo_id, validacao
    ) VALUES (
      v_desc_fin, 'Á vista', p_valor, v_data,
      p_escritorio_id, v_escritorio_nome, v_grupo::text, 1
    );
  END IF;

  RETURN v_grupo;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_emprestimo_escritorio(
  bigint, uuid, text, numeric, text, date
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.registrar_emprestimo_escritorio(
  bigint, uuid, text, numeric, text, date
) TO authenticated;
