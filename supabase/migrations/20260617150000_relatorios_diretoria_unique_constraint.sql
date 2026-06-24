-- Constraint única compatível com PostgREST (índices parciais não servem para ON CONFLICT)

UPDATE relatorios_diretoria
SET semana_inicio = make_date(
  ano,
  mes,
  LEAST(
    (semana_ref - 1) * 7 + 1,
    EXTRACT(DAY FROM (make_date(ano, mes, 1) + INTERVAL '1 month - 1 day'))::int
  )
)
WHERE semana_inicio IS NULL
  AND ano IS NOT NULL
  AND mes IS NOT NULL
  AND semana_ref IS NOT NULL;

DROP INDEX IF EXISTS relatorios_diretoria_unique_semana_inicio;
DROP INDEX IF EXISTS relatorios_diretoria_unique_semana_legado;

ALTER TABLE relatorios_diretoria
  DROP CONSTRAINT IF EXISTS relatorios_diretoria_unique_semana;

ALTER TABLE relatorios_diretoria
  DROP CONSTRAINT IF EXISTS relatorios_diretoria_unique_semana_inicio;

ALTER TABLE relatorios_diretoria
  ADD CONSTRAINT relatorios_diretoria_unique_semana_inicio
  UNIQUE (obra_id, modalidade, semana_inicio);
