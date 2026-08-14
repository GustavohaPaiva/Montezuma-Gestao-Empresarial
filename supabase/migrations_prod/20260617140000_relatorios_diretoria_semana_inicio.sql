-- Semana de calendário (segunda a domingo) como chave canônica

ALTER TABLE relatorios_diretoria
  ADD COLUMN IF NOT EXISTS semana_inicio date;

-- Backfill a partir do modelo antigo (blocos de 7 dias no mês)
UPDATE relatorios_diretoria
SET semana_inicio = make_date(
  ano,
  mes,
  LEAST((semana_ref - 1) * 7 + 1, EXTRACT(DAY FROM (make_date(ano, mes, 1) + INTERVAL '1 month - 1 day'))::int)
)
WHERE semana_inicio IS NULL
  AND ano IS NOT NULL
  AND mes IS NOT NULL
  AND semana_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_relatorios_diretoria_semana_inicio
  ON relatorios_diretoria (obra_id, semana_inicio);

-- Nova unicidade por início da semana (quando preenchido)
ALTER TABLE relatorios_diretoria
  DROP CONSTRAINT IF EXISTS relatorios_diretoria_unique_semana;

CREATE UNIQUE INDEX IF NOT EXISTS relatorios_diretoria_unique_semana_inicio
  ON relatorios_diretoria (obra_id, modalidade, semana_inicio)
  WHERE semana_inicio IS NOT NULL;

-- Legado: mantém unicidade para registros sem semana_inicio
CREATE UNIQUE INDEX IF NOT EXISTS relatorios_diretoria_unique_semana_legado
  ON relatorios_diretoria (obra_id, modalidade, ano, mes, semana_ref)
  WHERE semana_inicio IS NULL;
