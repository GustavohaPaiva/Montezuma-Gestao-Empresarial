-- Marca status do pedido definido à mão, para não ser sobrescrito pelas ordens de compra.

ALTER TABLE public.obra_pedidos
  ADD COLUMN IF NOT EXISTS status_manual boolean DEFAULT false NOT NULL;
