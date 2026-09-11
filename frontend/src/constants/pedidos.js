/** Utilizador que gere pedidos no Home (gestão global). */
export const GESTOR_PEDIDOS_USER_ID = "gestor_pedidos";

/** Unidades de medida permitidas no lançamento de pedidos. */
export const UNIDADES_MEDIDA_PEDIDO = [
  "Sc.",
  "Kg.",
  "Lt.",
  "m²",
  "m³",
  "Un.",
  "Lata",
  "m",
  "cm",
  "Gl.",
  "Mensal",
  "Pç.",
  "Cx.",
];

export const SUB_ABAS_PEDIDOS_OBRA = [
  {
    id: "lista",
    label: "Pedidos lançados",
    sub: "Consultar pedidos desta obra",
  },
  { id: "novo", label: "Novo pedido", sub: "Adicionar materiais e lançar" },
];

export const STATUS_PEDIDO_PENDENTE = "Pendente";
export const STATUS_PEDIDO_EM_COTACAO = "Em cotação";
export const STATUS_PEDIDO_AGUARDANDO_APROVACAO = "Aguardando aprovação";
export const STATUS_PEDIDO_ENTREGUE = "Entregue";
export const STATUS_PEDIDO_CANCELADO = "Cancelado";

export const STATUS_PEDIDO_OPCOES = [
  STATUS_PEDIDO_PENDENTE,
  STATUS_PEDIDO_EM_COTACAO,
  STATUS_PEDIDO_AGUARDANDO_APROVACAO,
  "Aprovado",
  "Aguardando entrega",
  STATUS_PEDIDO_ENTREGUE,
  STATUS_PEDIDO_CANCELADO,
];

/** Ordem de exibição na lista (o que precisa de ação vem primeiro). */
export const STATUS_PEDIDO_ORDEM_LISTA = [
  STATUS_PEDIDO_AGUARDANDO_APROVACAO,
  ...STATUS_PEDIDO_OPCOES.filter((s) => s !== STATUS_PEDIDO_AGUARDANDO_APROVACAO),
];

export function isGestorPedidos(user) {
  if (!user?.subclasses) return false;
  return String(user.subclasses).includes(GESTOR_PEDIDOS_USER_ID);
}

export function isPedidoEditavel(status) {
  return (
    String(status || "")
      .trim()
      .toLowerCase() === "pendente"
  );
}

export const EMITENTE_ORDEM_CLIENTE = "cliente";
export const EMITENTE_ORDEM_MONTEZUMA = "montezuma";

/** Opções de emitente com o nome real do cliente da obra. */
export function getEmitenteOrdemOpcoes(obra) {
  const nomeCliente =
    obra?.clientes?.nome || obra?.cliente || "Cliente da obra";
  return [
    { value: EMITENTE_ORDEM_MONTEZUMA, label: "Montezuma" },
    { value: EMITENTE_ORDEM_CLIENTE, label: nomeCliente },
  ];
}

export function labelEmitenteGrupo(emitente, obra) {
  if (emitente === EMITENTE_ORDEM_CLIENTE) {
    return obra?.clientes?.nome || obra?.cliente || "Cliente";
  }
  return "Montezuma";
}

export const STATUS_GRUPO_COMPRA_OPCOES = [
  STATUS_PEDIDO_PENDENTE,
  STATUS_PEDIDO_EM_COTACAO,
  STATUS_PEDIDO_AGUARDANDO_APROVACAO,
  "Aprovado",
  "Aguardando entrega",
  "Comprado",
  STATUS_PEDIDO_CANCELADO,
];

export const STATUS_GRUPO_COMPRA_COMPRADO = "Comprado";

/** Dados fixos da Montezuma para ordens de compra. */
export const DADOS_EMITENTE_MONTEZUMA = {
  razao: "Montezuma Gestão de Obras",
  documento: "",
  endereco: "",
  contato: "",
};

/** Cards informativos (métricas) — alinhado às cores de status do sistema. */
export const PEDIDO_METRICAS_CONFIG = [
  {
    id: STATUS_PEDIDO_AGUARDANDO_APROVACAO,
    label: STATUS_PEDIDO_AGUARDANDO_APROVACAO,
    colorTheme: "yellow",
    filtro: STATUS_PEDIDO_AGUARDANDO_APROVACAO,
  },
  {
    id: "Pendente",
    label: "Pendente",
    colorTheme: "amber",
    filtro: "Pendente",
  },
  {
    id: "Em cotação",
    label: "Em cotação",
    colorTheme: "purple",
    filtro: "Em cotação",
  },
  {
    id: "Aprovado",
    label: "Aprovado",
    colorTheme: "indigo",
    filtro: "Aprovado",
  },
  {
    id: "Aguardando entrega",
    label: "Aguardando entrega",
    colorTheme: "blue",
    filtro: "Aguardando entrega",
  },
  {
    id: "Entregue",
    label: "Entregue",
    colorTheme: "emerald",
    filtro: "Entregue",
  },
  {
    id: "total",
    label: "Total de pedidos",
    colorTheme: "blue",
    filtro: "Tudo",
  },
];
