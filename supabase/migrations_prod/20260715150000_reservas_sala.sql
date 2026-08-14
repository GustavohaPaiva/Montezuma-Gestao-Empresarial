-- Reservas da sala única de reuniões (MVP)

CREATE TABLE IF NOT EXISTS reservas_sala (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  cliente_nome text,
  inicio timestamptz NOT NULL,
  fim timestamptz NOT NULL,
  criado_por uuid REFERENCES usuarios(id),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reservas_sala_fim_apos_inicio CHECK (fim > inicio),
  CONSTRAINT reservas_sala_duracao_minima CHECK (fim >= inicio + interval '30 minutes')
);

CREATE INDEX IF NOT EXISTS idx_reservas_sala_inicio_fim
  ON reservas_sala (inicio, fim);

CREATE OR REPLACE FUNCTION set_reservas_sala_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservas_sala_updated_at ON reservas_sala;
CREATE TRIGGER trg_reservas_sala_updated_at
  BEFORE UPDATE ON reservas_sala
  FOR EACH ROW
  EXECUTE PROCEDURE set_reservas_sala_updated_at();

CREATE OR REPLACE FUNCTION check_reservas_sala_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM reservas_sala r
    WHERE r.id IS DISTINCT FROM NEW.id
      AND r.inicio < NEW.fim
      AND r.fim > NEW.inicio
  ) THEN
    RAISE EXCEPTION 'reservas_sala_no_overlap: sala ocupada neste horário'
      USING ERRCODE = '23P01';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reservas_sala_no_overlap ON reservas_sala;
CREATE TRIGGER trg_reservas_sala_no_overlap
  BEFORE INSERT OR UPDATE OF inicio, fim ON reservas_sala
  FOR EACH ROW
  EXECUTE PROCEDURE check_reservas_sala_no_overlap();

ALTER TABLE reservas_sala ENABLE ROW LEVEL SECURITY;

CREATE POLICY reservas_sala_select ON reservas_sala
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    )
  );

CREATE POLICY reservas_sala_insert ON reservas_sala
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    )
  );

CREATE POLICY reservas_sala_update ON reservas_sala
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

CREATE POLICY reservas_sala_delete ON reservas_sala
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.tipo IN ('diretoria', 'gestor_master')
    )
  );
