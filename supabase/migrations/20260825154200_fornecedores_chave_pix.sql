-- Chave PIX do fornecedor, usada no pagamento de materiais no financeiro

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS chave_pix text;
