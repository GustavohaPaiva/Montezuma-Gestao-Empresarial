-- Agenda do diarista: presença do prestador em obras com horário

CREATE TABLE IF NOT EXISTS public.prestador_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id bigint NOT NULL
    REFERENCES public.prestadores(id) ON DELETE CASCADE,
  obra_id bigint NOT NULL
    REFERENCES public.obras(id),
  data date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT prestador_agenda_hora_fim_apos_inicio CHECK (hora_fim > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_prestador_agenda_prestador_data
  ON public.prestador_agenda (prestador_id, data);

CREATE OR REPLACE FUNCTION public.set_prestador_agenda_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prestador_agenda_updated_at ON public.prestador_agenda;
CREATE TRIGGER trg_prestador_agenda_updated_at
  BEFORE UPDATE ON public.prestador_agenda
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_prestador_agenda_updated_at();

ALTER TABLE public.prestador_agenda ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso Global Prestador Agenda" ON public.prestador_agenda;
CREATE POLICY "Acesso Global Prestador Agenda"
  ON public.prestador_agenda
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
