-- Vincula compromisso da agenda à reserva da sala de reuniões

ALTER TABLE agenda
  ADD COLUMN IF NOT EXISTS reserva_sala_id uuid REFERENCES reservas_sala(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agenda_reserva_sala_id
  ON agenda (reserva_sala_id)
  WHERE reserva_sala_id IS NOT NULL;
