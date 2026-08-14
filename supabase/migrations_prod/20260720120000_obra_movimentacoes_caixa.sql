-- Caixa interno por obra: entradas e transferências entre obras

CREATE TABLE IF NOT EXISTS obra_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id bigint NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  tipo text NOT NULL
    CHECK (tipo IN ('entrada', 'transferencia_entrada', 'transferencia_saida')),
  valor numeric NOT NULL CHECK (valor > 0),
  descricao text,
  data date NOT NULL DEFAULT CURRENT_DATE,
  transferencia_grupo_id uuid,
  obra_contra_id bigint REFERENCES obras(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT obra_movimentacoes_transferencia_exige_grupo CHECK (
    (tipo = 'entrada' AND transferencia_grupo_id IS NULL AND obra_contra_id IS NULL)
    OR (
      tipo IN ('transferencia_entrada', 'transferencia_saida')
      AND transferencia_grupo_id IS NOT NULL
      AND obra_contra_id IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_obra_movimentacoes_obra_data
  ON obra_movimentacoes (obra_id, data DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_obra_movimentacoes_grupo
  ON obra_movimentacoes (transferencia_grupo_id)
  WHERE transferencia_grupo_id IS NOT NULL;

ALTER TABLE obra_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Leitura: perfis com acesso às obras (saldo visível no detalhe)
CREATE POLICY obra_movimentacoes_select ON obra_movimentacoes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN (
          'diretoria', 'gestor_master', 'suporte_ti',
          'secretaria', 'encarregado'
        )
    )
  );

-- Escrita: mesmo público do Resumo / controle financeiro
CREATE POLICY obra_movimentacoes_insert ON obra_movimentacoes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti')
    )
  );

CREATE POLICY obra_movimentacoes_update ON obra_movimentacoes
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti')
    )
  );

CREATE POLICY obra_movimentacoes_delete ON obra_movimentacoes
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti')
    )
  );

-- Transferência atômica com validação de saldo
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

  -- Evita corrida entre transferências da mesma origem
  PERFORM pg_advisory_xact_lock(
    hashtextextended('obra_caixa:' || p_obra_origem_id::text, 0)
  );

  SELECT COALESCE(SUM(
    CASE
      WHEN tipo IN ('entrada', 'transferencia_entrada') THEN valor
      WHEN tipo = 'transferencia_saida' THEN -valor
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

GRANT EXECUTE ON FUNCTION transferir_saldo_obra(
  bigint, bigint, numeric, text, date
) TO authenticated;
