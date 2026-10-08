-- Pedido de material elétrico da obra MARA (id 28), Jardim Ipanema.
-- Lança o pedido como Pendente, no próximo número livre da obra.
-- Não cria ordem de compra, relatório nem conta a pagar.
-- A data de entrega é obrigatória na tabela; fica a data em que o script roda.
-- Os dois lançamentos de Fio 6mm Preto (40 m e 22 m) entram em linhas separadas.

BEGIN;

DO $$
DECLARE
  v_obra_cliente text;
BEGIN
  SELECT cliente INTO v_obra_cliente FROM public.obras WHERE id = 28;
  IF v_obra_cliente IS NULL THEN
    RAISE EXCEPTION 'Obra 28 não encontrada.';
  END IF;
  IF v_obra_cliente <> 'MARA' THEN
    RAISE EXCEPTION 'Obra 28 não é a MARA (cliente atual: %).', v_obra_cliente;
  END IF;
END $$;

WITH novo_pedido AS (
  INSERT INTO public.obra_pedidos (
    obra_id,
    numero,
    status,
    solicitante_nome
  )
  SELECT
    28,
    COALESCE((SELECT MAX(numero) FROM public.obra_pedidos WHERE obra_id = 28), 0) + 1,
    'Pendente',
    'Gustavo'
  RETURNING id
)
INSERT INTO public.obra_pedido_itens (
  pedido_id,
  material,
  quantidade,
  unidade,
  data_entrega
)
SELECT
  p.id,
  i.material,
  i.quantidade,
  i.unidade,
  CURRENT_DATE
FROM novo_pedido p
CROSS JOIN (
  VALUES
    ('FIO 6MM PRETO'::text,                  40::numeric,  'm'::text),
    ('FIO 6MM PRETO',                        22,           'm'),
    ('FIO 2/½ PRETO',                       300,           'm'),
    ('FIO 2/½ AZUL',                        300,           'm'),
    ('FIO 2/½ VERDE',                       200,           'm'),
    ('FIO 1/½ BRANCO',                      200,           'm'),
    ('FIO 1/½ AZUL',                        200,           'm'),
    ('FIO 2/½ BRANCO',                      100,           'm'),
    ('ILHÓS 2/½',                           100,           'Un.'),
    ('ILHÓS 1/½',                            30,           'Un.'),
    ('ILHÓS 6MM',                            20,           'Un.'),
    ('DISJUNTOR BIPOLAR 40A',                 2,           'Un.'),
    ('DISJUNTOR BIPOLAR 63A',                 1,           'Un.'),
    ('DISJUNTOR BIPOLAR 25A',                 5,           'Un.'),
    ('DISJUNTOR MONOPOLAR 25A',               4,           'Un.'),
    ('BARRAMENTO PENTE BIPOLAR PEQUENO',      2,           'Un.'),
    ('SUPORTE 2X4',                          33,           'Un.'),
    ('SUPORTE 4X4',                          10,           'Un.'),
    ('INTERRUPTOR PARALELO',                  4,           'Un.'),
    ('INTERRUPTOR SIMPLES',                  15,           'Un.'),
    ('MÓDULO TOMADA 10A',                    25,           'Un.'),
    ('MÓDULO TOMADA 20A',                     5,           'Un.'),
    ('MÓDULO TOMADA 20A VERMELHO',            3,           'Un.'),
    ('ESPELHO P/4 SEÇÕES 4X4',                6,           'Un.'),
    ('ESPELHO P/2 SEÇÕES 4X4',                4,           'Un.'),
    ('ESPELHO P/1 SEÇÃO 2X4',                25,           'Un.'),
    ('ESPELHO P/2 SEÇÃO 2X4',                 5,           'Un.'),
    ('ESPELHO P/3 SEÇÃO 2X4',                 3,           'Un.'),
    ('MÓDULO CEGO',                          10,           'Un.'),
    ('FITA ISOLANTE IMPERIAL',                2,           'Un.')
) AS i(material, quantidade, unidade);

COMMIT;
