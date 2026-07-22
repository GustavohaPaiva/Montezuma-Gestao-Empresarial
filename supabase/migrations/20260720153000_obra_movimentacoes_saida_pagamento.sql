-- Fase 2: saída automática ao pagar lote + vínculo lote_pagamento_id

ALTER TABLE obra_movimentacoes
  DROP CONSTRAINT IF EXISTS obra_movimentacoes_tipo_check;

ALTER TABLE obra_movimentacoes
  ADD CONSTRAINT obra_movimentacoes_tipo_check
  CHECK (tipo IN (
    'entrada',
    'transferencia_entrada',
    'transferencia_saida',
    'saida_pagamento'
  ));

ALTER TABLE obra_movimentacoes
  DROP CONSTRAINT IF EXISTS obra_movimentacoes_transferencia_exige_grupo;

ALTER TABLE obra_movimentacoes
  ADD CONSTRAINT obra_movimentacoes_transferencia_exige_grupo CHECK (
    (
      tipo IN ('entrada', 'saida_pagamento')
      AND transferencia_grupo_id IS NULL
      AND obra_contra_id IS NULL
    )
    OR (
      tipo IN ('transferencia_entrada', 'transferencia_saida')
      AND transferencia_grupo_id IS NOT NULL
      AND obra_contra_id IS NOT NULL
    )
  );

ALTER TABLE obra_movimentacoes
  ADD COLUMN IF NOT EXISTS lote_pagamento_id uuid
    REFERENCES obra_lotes_pagamento(id) ON DELETE SET NULL;

-- Uma saída de pagamento por lote
CREATE UNIQUE INDEX IF NOT EXISTS obra_movimentacoes_lote_pagamento_unique
  ON obra_movimentacoes (lote_pagamento_id)
  WHERE lote_pagamento_id IS NOT NULL;

-- saida_pagamento exige lote; demais tipos não usam lote
ALTER TABLE obra_movimentacoes
  DROP CONSTRAINT IF EXISTS obra_movimentacoes_saida_exige_lote;

ALTER TABLE obra_movimentacoes
  ADD CONSTRAINT obra_movimentacoes_saida_exige_lote CHECK (
    (tipo = 'saida_pagamento' AND lote_pagamento_id IS NOT NULL)
    OR (tipo <> 'saida_pagamento' AND lote_pagamento_id IS NULL)
  );

-- Atualiza saldo da RPC de transferência (inclui saidas_pagamento)
CREATE OR REPLACE FUNCTION transferir_saldo_obra(
  p_obra_origem_id bigint,
  p_obra_destino_id bigint,
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
BEGIN
  IF p_valor IS NULL OR p_valor <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser maior que zero';
  END IF;
  IF p_obra_origem_id IS NULL OR p_obra_destino_id IS NULL THEN
    RAISE EXCEPTION 'Obras de origem e destino são obrigatórias';
  END IF;
  IF p_obra_origem_id = p_obra_destino_id THEN
    RAISE EXCEPTION 'Origem e destino devem ser obras distintas';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM obras WHERE id = p_obra_origem_id) THEN
    RAISE EXCEPTION 'Obra de origem não encontrada';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM obras WHERE id = p_obra_destino_id) THEN
    RAISE EXCEPTION 'Obra de destino não encontrada';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('obra_caixa:' || p_obra_origem_id::text, 0)
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
  WHERE obra_id = p_obra_origem_id;

  IF v_saldo < p_valor THEN
    RAISE EXCEPTION 'Saldo insuficiente na obra de origem (disponível: %)', v_saldo;
  END IF;

  INSERT INTO obra_movimentacoes (
    obra_id, tipo, valor, descricao, data,
    transferencia_grupo_id, obra_contra_id, created_by
  ) VALUES
    (
      p_obra_origem_id, 'transferencia_saida', p_valor, p_descricao, v_data,
      v_grupo, p_obra_destino_id, auth.uid()
    ),
    (
      p_obra_destino_id, 'transferencia_entrada', p_valor, p_descricao, v_data,
      v_grupo, p_obra_origem_id, auth.uid()
    );

  RETURN v_grupo;
END;
$$;

-- RPC: debitar/estornar caixa ao pagar/reabrir lote
CREATE OR REPLACE FUNCTION registrar_saida_pagamento_lote(p_lote_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote RECORD;
  v_existente uuid;
  v_id uuid;
  v_valor numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid()
      AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti', 'encarregado')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para registrar saída de pagamento';
  END IF;

  SELECT id, obra_id, numero, total, status
  INTO v_lote
  FROM obra_lotes_pagamento
  WHERE id = p_lote_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote não encontrado';
  END IF;

  SELECT id INTO v_existente
  FROM obra_movimentacoes
  WHERE lote_pagamento_id = p_lote_id
  LIMIT 1;

  IF v_existente IS NOT NULL THEN
    RETURN v_existente;
  END IF;

  v_valor := COALESCE(v_lote.total, 0);
  IF v_valor <= 0 THEN
    RAISE EXCEPTION 'Lote sem valor para debitar do caixa';
  END IF;

  INSERT INTO obra_movimentacoes (
    obra_id, tipo, valor, descricao, data,
    lote_pagamento_id, created_by
  ) VALUES (
    v_lote.obra_id,
    'saida_pagamento',
    v_valor,
    'Pagamento extrato #' || v_lote.numero::text,
    CURRENT_DATE,
    p_lote_id,
    auth.uid()
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION estornar_saida_pagamento_lote(p_lote_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid()
      AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti', 'encarregado')
  ) THEN
    RAISE EXCEPTION 'Sem permissão para estornar saída de pagamento';
  END IF;

  DELETE FROM obra_movimentacoes
  WHERE lote_pagamento_id = p_lote_id
    AND tipo = 'saida_pagamento';
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_saida_pagamento_lote(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION estornar_saida_pagamento_lote(uuid) TO authenticated;
