-- Campo livre para responsabilidades do cliente na OS

ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS responsabilidades_cliente text;
