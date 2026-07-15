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

/** Número exibido do pedido dentro da obra (1, 2, 3…). */
export function numeroPedidoObra(pedido) {
  const n = Number(pedido?.numero);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Rótulo principal: Pedido #1, Pedido #2… */
export function rotuloPedido(pedido) {
  const n = numeroPedidoObra(pedido);
  if (n != null) return `Pedido #${n}`;
  return `Pedido #${pedido?.id ?? "—"}`;
}

export function resumoPedidoCard(pedido) {
  const itens = Array.isArray(pedido?.itens) ? pedido.itens : [];
  const qtd = itens.length;
  const titulo = rotuloPedido(pedido);

  if (qtd === 0) {
    return { titulo, subtitulo: "Sem materiais" };
  }

  const entregas = [
    ...new Set(
      itens
        .map((i) => formatarDataBR(i.data_entrega))
        .filter((d) => d && d !== "-"),
    ),
  ];
  const subtitulo =
    qtd === 1
      ? `1 material · Entrega ${entregas[0] || "—"}`
      : `${qtd} materiais · ${entregas.length === 1 ? `Entrega ${entregas[0]}` : "Várias datas de entrega"}`;

  return { titulo, subtitulo };
}

/** Atribui numero (#1, #2…) por obra quando ainda não veio do banco. */
export function enriquecerNumerosPedidos(pedidos) {
  if (!Array.isArray(pedidos) || !pedidos.length) return pedidos || [];

  const porObra = {};
  for (const p of pedidos) {
    const chave = String(p.obra_id ?? "");
    if (!porObra[chave]) porObra[chave] = [];
    porObra[chave].push(p);
  }

  const mapa = new Map();
  for (const grupo of Object.values(porObra)) {
    const ordenados = [...grupo].sort((a, b) => {
      const na = numeroPedidoObra(a);
      const nb = numeroPedidoObra(b);
      if (na != null && nb != null && na !== nb) return na - nb;
      return (
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime()
      );
    });
    ordenados.forEach((p, idx) => {
      mapa.set(p.id, { ...p, numero: numeroPedidoObra(p) ?? idx + 1 });
    });
  }

  return pedidos.map((p) => mapa.get(p.id) ?? p);
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
        String(p.numero ?? ""),
        rotuloPedido(p),
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
    if (!status || status === "Tudo") {
      const sa = a.status || STATUS_PEDIDO_PENDENTE;
      const sb = b.status || STATUS_PEDIDO_PENDENTE;
      const ia = STATUS_PEDIDO_OPCOES.indexOf(sa);
      const ib = STATUS_PEDIDO_OPCOES.indexOf(sb);
      const ordA = ia === -1 ? STATUS_PEDIDO_OPCOES.length : ia;
      const ordB = ib === -1 ? STATUS_PEDIDO_OPCOES.length : ib;
      if (ordA !== ordB) return ordA - ordB;
    }

    const oa = String(a.obra_id ?? "");
    const ob = String(b.obra_id ?? "");
    if (oa !== ob) {
      const labelA =
        a.obras?.clientes?.nome || a.obras?.cliente || a.obras?.local || oa;
      const labelB =
        b.obras?.clientes?.nome || b.obras?.cliente || b.obras?.local || ob;
      const cmp = String(labelA).localeCompare(String(labelB), "pt-BR");
      if (cmp !== 0) return cmp;
    }
    const na = numeroPedidoObra(a);
    const nb = numeroPedidoObra(b);
    if (na != null && nb != null && na !== nb) return na - nb;
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return tb - ta;
  });
}

export function normalizarNomeMaterial(valor) {
  return String(valor ?? "")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

export function normalizarMateriaisLista(materiais) {
  if (!Array.isArray(materiais)) return materiais;
  return materiais.map((m) =>
    m && m.material != null
      ? { ...m, material: normalizarNomeMaterial(m.material) }
      : m,
  );
}

export function validarItemPedido({
  material,
  quantidade,
  unidade,
  data_entrega,
}) {
  const mat = normalizarNomeMaterial(material);
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
