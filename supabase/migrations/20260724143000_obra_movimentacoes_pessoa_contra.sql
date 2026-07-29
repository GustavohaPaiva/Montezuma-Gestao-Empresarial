-- Empréstimos obra ↔ pessoa (texto livre como contraparte)

ALTER TABLE obra_movimentacoes
  ADD COLUMN IF NOT EXISTS pessoa_contra text;

ALTER TABLE obra_movimentacoes
  DROP CONSTRAINT IF EXISTS obra_movimentacoes_transferencia_exige_grupo;

ALTER TABLE obra_movimentacoes
  ADD CONSTRAINT obra_movimentacoes_transferencia_exige_grupo CHECK (
    (
      tipo IN ('entrada', 'saida_pagamento')
      AND transferencia_grupo_id IS NULL
      AND obra_contra_id IS NULL
      AND pessoa_contra IS NULL
    )
    OR (
      tipo IN ('transferencia_entrada', 'transferencia_saida')
      AND transferencia_grupo_id IS NOT NULL
      AND (
        (obra_contra_id IS NOT NULL AND pessoa_contra IS NULL)
        OR (
          obra_contra_id IS NULL
          AND pessoa_contra IS NOT NULL
          AND length(trim(pessoa_contra)) > 0
        )
      )
    )
  );

CREATE OR REPLACE FUNCTION registrar_emprestimo_pessoa(
  p_obra_id bigint,
  p_pessoa text,
  p_sentido text,
  p_valor numeric,
  p_descricao text DEFAULT NULL,
  p_data date DEFAULT CURRENT_DATE
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_saldo numeric;
  v_grupo uuid := gen_random_uuid();
  v_data date := COALESCE(p_data, CURRENT_DATE);
  v_pessoa text := trim(COALESCE(p_pessoa, ''));
  v_tipo text;
BEGIN
  IF p_valor IS NULL OR p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;
  IF p_obra_id IS NULL THEN
    RAISE EXCEPTION 'Obra é obrigatória';
  END IF;
  IF v_pessoa = '' THEN
    RAISE EXCEPTION 'Nome da pessoa é obrigatório';
  END IF;
  IF p_sentido IS NULL OR p_sentido NOT IN ('emprestar', 'receber') THEN
    RAISE EXCEPTION 'Sentido deve ser emprestar ou receber';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM obras WHERE id = p_obra_id) THEN
    RAISE EXCEPTION 'Obra não encontrada';
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
    transferencia_grupo_id, obra_contra_id, pessoa_contra, created_by
  ) VALUES (
    p_obra_id, v_tipo, p_valor, p_descricao, v_data,
    v_grupo, NULL, v_pessoa, auth.uid()
  );

  RETURN v_grupo;
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_emprestimo_pessoa(
  bigint, text, text, numeric, text, date
) TO authenticated;
