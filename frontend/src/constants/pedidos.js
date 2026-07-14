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
  { id: "lista", label: "Pedidos lançados", sub: "Consultar pedidos desta obra" },
  { id: "novo", label: "Novo pedido", sub: "Adicionar materiais e lançar" },
];

export const STATUS_PEDIDO_PENDENTE = "Pendente";

export const STATUS_PEDIDO_OPCOES = [
  STATUS_PEDIDO_PENDENTE,
  "Em cotação",
  "Aprovado",
  "Aguardando entrega",
  "Entregue",
  "Cancelado",
];

export function isGestorPedidos(user) {
  if (!user?.subclasses) return false;
  return String(user.subclasses).includes(GESTOR_PEDIDOS_USER_ID);
}

export function isPedidoEditavel(status) {
  return String(status || "").trim().toLowerCase() === "pendente";
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
  "Pendente",
  "Em cotação",
  "Aprovado",
  "Aguardando entrega",
  "Comprado",
  "Cancelado",
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
  { id: "total", label: "Total de pedidos", colorTheme: "blue", filtro: "Tudo" },
  { id: "Pendente", label: "Pendente", colorTheme: "amber", filtro: "Pendente" },
  { id: "Em cotação", label: "Em cotação", colorTheme: "purple", filtro: "Em cotação" },
  { id: "Aprovado", label: "Aprovado", colorTheme: "indigo", filtro: "Aprovado" },
  {
    id: "Aguardando entrega",
    label: "Aguardando entrega",
    colorTheme: "blue",
    filtro: "Aguardando entrega",
  },
  { id: "Entregue", label: "Entregue", colorTheme: "emerald", filtro: "Entregue" },
  { id: "Cancelado", label: "Cancelado", colorTheme: "pink", filtro: "Cancelado" },
];
