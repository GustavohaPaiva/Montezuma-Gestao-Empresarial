-- Relatórios semanais da diretoria por obra e modalidade

CREATE TABLE IF NOT EXISTS relatorios_diretoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  modalidade text NOT NULL CHECK (modalidade IN ('obra', 'financeiro', 'compras')),
  ano int NOT NULL,
  mes int NOT NULL CHECK (mes >= 1 AND mes <= 12),
  semana_ref int NOT NULL CHECK (semana_ref >= 1 AND semana_ref <= 5),
  conteudo jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT relatorios_diretoria_unique_semana
    UNIQUE (obra_id, modalidade, ano, mes, semana_ref)
);

CREATE INDEX IF NOT EXISTS idx_relatorios_diretoria_obra_periodo
  ON relatorios_diretoria (obra_id, ano, mes, semana_ref);

ALTER TABLE relatorios_diretoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY relatorios_diretoria_select ON relatorios_diretoria
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    )
  );

CREATE POLICY relatorios_diretoria_insert ON relatorios_diretoria
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    )
  );

CREATE POLICY relatorios_diretoria_update ON relatorios_diretoria
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    )
  );

CREATE POLICY relatorios_diretoria_delete ON relatorios_diretoria
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    )
  );
