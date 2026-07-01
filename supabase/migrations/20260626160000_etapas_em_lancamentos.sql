-- Rastreamento de etapa em lançamentos (materiais, mão de obra, locações e extrato)

ALTER TABLE relatorio_materiais
  ADD COLUMN IF NOT EXISTS etapa_nome text;

ALTER TABLE relatorio_mao_de_obra
  ADD COLUMN IF NOT EXISTS etapa_nome text;

ALTER TABLE relatorio_locacoes
  ADD COLUMN IF NOT EXISTS etapa_nome text;

ALTER TABLE relatorio_extrato
  ADD COLUMN IF NOT EXISTS etapa_nome text;

ALTER TABLE obra_pedido_itens
  ADD COLUMN IF NOT EXISTS etapa_nome text;

CREATE INDEX IF NOT EXISTS idx_relatorio_materiais_obra_etapa
  ON relatorio_materiais (obra_id, etapa_nome);

CREATE INDEX IF NOT EXISTS idx_relatorio_mao_de_obra_obra_etapa
  ON relatorio_mao_de_obra (obra_id, etapa_nome);

CREATE INDEX IF NOT EXISTS idx_relatorio_locacoes_obra_etapa
  ON relatorio_locacoes (obra_id, etapa_nome);

CREATE INDEX IF NOT EXISTS idx_relatorio_extrato_obra_etapa
  ON relatorio_extrato (obra_id, etapa_nome);
