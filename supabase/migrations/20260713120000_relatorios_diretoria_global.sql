-- Relatórios semanais globais (empresa), sem vínculo com obra.
-- Histórico por obra é descartado de propósito.

DELETE FROM relatorios_diretoria;

-- Constraints primeiro (índices únicos ligados a elas não podem ser dropados antes)
ALTER TABLE relatorios_diretoria
  DROP CONSTRAINT IF EXISTS relatorios_diretoria_unique_semana;

ALTER TABLE relatorios_diretoria
  DROP CONSTRAINT IF EXISTS relatorios_diretoria_unique_semana_inicio;

ALTER TABLE relatorios_diretoria
  DROP CONSTRAINT IF EXISTS relatorios_diretoria_obra_id_fkey;

ALTER TABLE relatorios_diretoria
  DROP CONSTRAINT IF EXISTS relatorios_diretoria_unique_modalidade_semana;

DROP INDEX IF EXISTS idx_relatorios_diretoria_obra_periodo;
DROP INDEX IF EXISTS idx_relatorios_diretoria_semana_inicio;
DROP INDEX IF EXISTS relatorios_diretoria_unique_semana_inicio;
DROP INDEX IF EXISTS relatorios_diretoria_unique_semana_legado;

ALTER TABLE relatorios_diretoria
  DROP COLUMN IF EXISTS obra_id;

ALTER TABLE relatorios_diretoria
  ALTER COLUMN semana_inicio SET NOT NULL;

ALTER TABLE relatorios_diretoria
  ADD CONSTRAINT relatorios_diretoria_unique_modalidade_semana
  UNIQUE (modalidade, semana_inicio);

CREATE INDEX IF NOT EXISTS idx_relatorios_diretoria_semana_inicio
  ON relatorios_diretoria (semana_inicio);

CREATE INDEX IF NOT EXISTS idx_relatorios_diretoria_periodo
  ON relatorios_diretoria (ano, mes);
