import { formatarDataBR } from "../pages/obras/detalhe/utils/formatters";
import {
  STATUS_PEDIDO_OPCOES,
  STATUS_PEDIDO_PENDENTE,
  UNIDADES_MEDIDA_PEDIDO,
} from "../constants/pedidos";

/** Tema de cor do BaseCard conforme o status do pedido. */
export function getPedidoStatusColorTheme(status) {
  const s = String(status || STATUS_PEDIDO_PENDENTE).trim();
  switch (s) {
    case "Pendente":
      return "amber";
    case "Em cotação":
      return "purple";
    case "Aprovado":
      return "indigo";
    case "Aguardando entrega":
      return "blue";
    case "Entregue":
      return "emerald";
    case "Cancelado":
      return "pink";
    default:
      return "primary";
  }
}

/** Contagens por status para os cards informativos. */
export function calcularMetricasPedidos(pedidos) {
  const list = Array.isArray(pedidos) ? pedidos : [];
  const metricas = { total: list.length };
  STATUS_PEDIDO_OPCOES.forEach((status) => {
    metricas[status] = list.filter(
      (p) => (p.status || STATUS_PEDIDO_PENDENTE) === status,
    ).length;
  });
  return metricas;
}

export function formatarQuantidadePedido(valor) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(n);
}

export function resumoPedidoCard(pedido) {
  const itens = Array.isArray(pedido?.itens) ? pedido.itens : [];
  const qtd = itens.length;
  if (qtd === 0) {
    return {
      titulo: `Pedido #${pedido?.id ?? "—"}`,
      subtitulo: "Sem materiais",
    };
  }
  const primeiro = itens[0]?.material || "Material";
  const titulo =
    qtd === 1
      ? primeiro
      : `${primeiro} + ${qtd - 1} material${qtd > 2 ? "is" : ""}`;
  const entregas = [
    ...new Set(
      itens
        .map((i) => formatarDataBR(i.data_entrega))
        .filter((d) => d && d !== "-"),
    ),
  ];
  const subtitulo =
    qtd === 1
      ? `${formatarQuantidadePedido(itens[0].quantidade)} ${itens[0].unidade || "Un."} · Entrega ${entregas[0] || "—"}`
      : `${qtd} materiais · ${entregas.length === 1 ? `Entrega ${entregas[0]}` : "Várias datas de entrega"}`;
  return { titulo, subtitulo };
}

/**
 * Filtra pedidos por texto (id, materiais, solicitante, obra) e status.
 * @param {object[]} pedidos
 * @param {{ busca?: string, status?: string }} opts
 */
export function filtrarPedidos(pedidos, { busca = "", status = "Tudo" } = {}) {
  let list = Array.isArray(pedidos) ? [...pedidos] : [];

  if (status && status !== "Tudo") {
    list = list.filter((p) => (p.status || "Pendente") === status);
  }

  const termo = String(busca || "")
    .trim()
    .toLowerCase();
  if (termo) {
    list = list.filter((p) => {
      const partes = [
        String(p.id ?? ""),
        p.solicitante_nome,
        p.status,
        ...(Array.isArray(p.itens) ? p.itens.map((i) => i.material) : []),
      ];
      const obra = p.obras;
      if (obra) {
        partes.push(obra.clientes?.nome, obra.cliente, obra.local);
      }
      return partes.some((x) =>
        String(x || "")
          .toLowerCase()
          .includes(termo),
      );
    });
  }

  return list.sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return tb - ta;
  });
}

export function validarItemPedido({
  material,
  quantidade,
  unidade,
  data_entrega,
}) {
  const mat = String(material || "").trim();
  const qtd = Number(quantidade);
  const uni = String(unidade || "").trim();
  const entrega = String(data_entrega || "").trim();
  if (
    !mat ||
    !Number.isFinite(qtd) ||
    qtd <= 0 ||
    !entrega ||
    !UNIDADES_MEDIDA_PEDIDO.includes(uni)
  ) {
    return null;
  }
  return {
    material: mat,
    quantidade: qtd,
    unidade: uni,
    data_entrega: entrega,
  };
}
