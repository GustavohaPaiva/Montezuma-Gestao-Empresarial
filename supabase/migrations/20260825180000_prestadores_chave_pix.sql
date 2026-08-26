-- Chave PIX do prestador, usada no pagamento de mão de obra no financeiro

ALTER TABLE public.prestadores
  ADD COLUMN IF NOT EXISTS chave_pix text;
