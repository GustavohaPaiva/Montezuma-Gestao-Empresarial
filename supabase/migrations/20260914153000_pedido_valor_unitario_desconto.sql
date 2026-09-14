-- Valor unitário por material e desconto no total do pedido.

ALTER TABLE public.obra_pedido_itens
  ADD COLUMN IF NOT EXISTS valor_unitario numeric(14,4);

ALTER TABLE public.obra_pedidos
  ADD COLUMN IF NOT EXISTS desconto_valor numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_percentual numeric(8,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS desconto_modo text NOT NULL DEFAULT 'percentual';

ALTER TABLE public.obra_pedidos
  DROP CONSTRAINT IF EXISTS obra_pedidos_desconto_modo_check;
ALTER TABLE public.obra_pedidos
  ADD CONSTRAINT obra_pedidos_desconto_modo_check
  CHECK (desconto_modo IN ('percentual', 'valor'));

ALTER TABLE public.obra_pedidos
  DROP CONSTRAINT IF EXISTS obra_pedidos_desconto_nao_negativo;
ALTER TABLE public.obra_pedidos
  ADD CONSTRAINT obra_pedidos_desconto_nao_negativo
  CHECK (desconto_valor >= 0 AND desconto_percentual >= 0 AND desconto_percentual <= 100);

UPDATE public.obra_pedido_itens
SET valor_unitario = ROUND(valor / quantidade, 4)
WHERE valor_unitario IS NULL
  AND valor IS NOT NULL
  AND quantidade > 0;
