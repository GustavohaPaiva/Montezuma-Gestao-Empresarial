-- Lotes de pagamento por obra (agrupamento de itens do extrato para pagamento em massa)

CREATE TABLE IF NOT EXISTS obra_lotes_pagamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  numero int NOT NULL,
  nome text,
  data_criacao date NOT NULL DEFAULT CURRENT_DATE,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'parcial', 'pago')),
  criado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT obra_lotes_pagamento_obra_numero_unique UNIQUE (obra_id, numero)
);

CREATE TABLE IF NOT EXISTS obra_lote_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES obra_lotes_pagamento(id) ON DELETE CASCADE,
  extrato_id uuid NOT NULL REFERENCES relatorio_extrato(id) ON DELETE CASCADE,
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT obra_lote_itens_lote_extrato_unique UNIQUE (lote_id, extrato_id)
);

CREATE INDEX IF NOT EXISTS idx_obra_lotes_pagamento_obra
  ON obra_lotes_pagamento (obra_id, status, data_criacao DESC);

CREATE INDEX IF NOT EXISTS idx_obra_lote_itens_lote
  ON obra_lote_itens (lote_id);

CREATE INDEX IF NOT EXISTS idx_obra_lote_itens_extrato
  ON obra_lote_itens (extrato_id);

-- Impede o mesmo extrato em dois lotes abertos (pendente ou parcial)
CREATE OR REPLACE FUNCTION check_extrato_not_in_open_lote()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM obra_lote_itens oli
    JOIN obra_lotes_pagamento olp ON olp.id = oli.lote_id
    WHERE oli.extrato_id = NEW.extrato_id
      AND olp.status IN ('pendente', 'parcial')
      AND oli.lote_id IS DISTINCT FROM NEW.lote_id
  ) THEN
    RAISE EXCEPTION 'Item do extrato já pertence a um lote de pagamento aberto';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_extrato_not_in_open_lote ON obra_lote_itens;
CREATE TRIGGER trg_check_extrato_not_in_open_lote
  BEFORE INSERT OR UPDATE ON obra_lote_itens
  FOR EACH ROW
  EXECUTE PROCEDURE check_extrato_not_in_open_lote();

ALTER TABLE obra_lotes_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE obra_lote_itens ENABLE ROW LEVEL SECURITY;

-- Leitura: perfis com acesso às obras
CREATE POLICY obra_lotes_pagamento_select ON obra_lotes_pagamento
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

CREATE POLICY obra_lote_itens_select ON obra_lote_itens
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

-- Escrita: exceto secretaria (somente leitura)
CREATE POLICY obra_lotes_pagamento_write ON obra_lotes_pagamento
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti', 'encarregado')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti', 'encarregado')
    )
  );

CREATE POLICY obra_lote_itens_write ON obra_lote_itens
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti', 'encarregado')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master', 'suporte_ti', 'encarregado')
    )
  );
