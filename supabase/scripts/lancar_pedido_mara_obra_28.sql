-- Pedido nº 9 da obra MARA (id 28), Jardim Ipanema.
-- Liga os 4 materiais da Rocha que foram lançados direto no relatório
-- (sem ordem de compra) ao pedido. Não cria relatório nem conta a pagar de novo.
--
--   1087  CIMENTO      10 Sc.    R$ 393,20   venc. 15/05/2026
--   1452  AREIA FINA   12 Lata   R$ 121,50   venc. 03/07/2026
--   1453  CIMENTO       2 Sc.    R$ 113,30   venc. 03/07/2026
--   1454  LIGA 10       3 Sc.    R$  60,00   venc. 03/07/2026
--   Total                        R$ 688,00
--
-- Fornecedor: ROCHA MATERIAIS PARA CONSTRUÇÃO
-- Emitente da ordem: Montezuma. Status: Comprado / pedido Entregue
-- (os quatro itens já constam como Entregue no relatório).

BEGIN;

DO $$
DECLARE
  v_obra_cliente text;
  v_ja_ligados int;
BEGIN
  SELECT cliente INTO v_obra_cliente FROM public.obras WHERE id = 28;
  IF v_obra_cliente IS NULL THEN
    RAISE EXCEPTION 'Obra 28 não encontrada.';
  END IF;
  IF v_obra_cliente <> 'MARA' THEN
    RAISE EXCEPTION 'Obra 28 não é a MARA (cliente atual: %).', v_obra_cliente;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.obra_pedidos WHERE obra_id = 28 AND numero = 9
  ) THEN
    RAISE EXCEPTION 'A obra 28 já tem o pedido nº 9.';
  END IF;

  SELECT count(*) INTO v_ja_ligados
  FROM public.obra_pedido_itens
  WHERE material_relatorio_id IN (1087, 1452, 1453, 1454);

  IF v_ja_ligados > 0 THEN
    RAISE EXCEPTION 'Algum desses materiais já está ligado a um pedido.';
  END IF;
END $$;

WITH novo_pedido AS (
  INSERT INTO public.obra_pedidos (
    obra_id,
    numero,
    status,
    status_manual,
    solicitante_nome,
    desconto_valor,
    desconto_percentual,
    desconto_modo,
    created_at,
    updated_at
  ) VALUES (
    28,
    9,
    'Entregue',
    false,
    'Gustavo',
    0,
    0,
    'percentual',
    '2026-05-08 12:00:00+00',
    now()
  )
  RETURNING id
),
nova_ordem AS (
  INSERT INTO public.obra_pedido_grupos_compra (
    pedido_id,
    numero,
    emitente,
    status,
    created_at,
    updated_at
  )
  SELECT
    id,
    1,
    'montezuma',
    'Comprado',
    '2026-05-08 12:00:00+00',
    now()
  FROM novo_pedido
  RETURNING id, pedido_id
)
INSERT INTO public.obra_pedido_itens (
  pedido_id,
  grupo_compra_id,
  material_relatorio_id,
  material,
  quantidade,
  unidade,
  data_entrega,
  data_pagamento,
  fornecedor_id,
  valor,
  valor_unitario,
  etapa_nome
)
SELECT
  o.pedido_id,
  o.id,
  m.id,
  m.material,
  m.quantidade,
  m.unidade,
  m.data_vencimento,
  m.data_vencimento,
  'dfd40fe7-d2a4-4fb4-b04d-3068c63f740b',
  m.valor,
  round(m.valor / m.quantidade, 4),
  NULL
FROM nova_ordem o
CROSS JOIN (
  VALUES
    (1087::bigint, 'CIMENTO'::text,    10::numeric, 'Sc.'::text,  '2026-05-15'::date, 393.20::numeric),
    (1452,         'AREIA FINA',       12,          'Lata',      '2026-07-03',       121.50),
    (1453,         'CIMENTO',           2,          'Sc.',       '2026-07-03',       113.30),
    (1454,         'LIGA 10',           3,          'Sc.',       '2026-07-03',        60.00)
) AS m(id, material, quantidade, unidade, data_vencimento, valor);

COMMIT;
