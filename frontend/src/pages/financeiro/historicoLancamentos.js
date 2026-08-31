import { isPago, isVencido } from "../fornecedores/fornecedorFinanceiro";
import { BUCKET_IDS, getBucketPrioridade, labelObraCliente } from "./materiais/materiaisPrioridade";

function statusPagamentoItem(item) {
  return item?.status_pagamento ?? item?.status_financeiro;
}

function valorNum(item) {
  return parseFloat(item?.valor) || 0;
}

function tempo(data) {
  if (!data) return 0;
  const t = new Date(String(data).slice(0, 10)).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function ordenarLancamentos(itens = []) {
  return [...itens].sort((a, b) => {
    const diff = tempo(b.data) - tempo(a.data);
    if (diff !== 0) return diff;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function somarLancamentos(itens = []) {
  return (itens || []).reduce((acc, item) => {
    const v = parseFloat(item?.valor) || 0;
    if (item?.sentido === "saida") return acc - v;
    if (item?.sentido === "entrada") return acc + v;
    return acc + v;
  }, 0);
}

export function linhaMaoDeObra(item, { prestadorNome } = {}) {
  const pago = isPago(statusPagamentoItem(item));
  const prestador =
    prestadorNome || item?.prestadores?.nome || "Prestador";
  return {
    id: item?.id,
    titulo: item?.descricao || "—",
    detalhe: [prestador, labelObraCliente(item?.obras)]
      .filter(Boolean)
      .join(" · "),
    data: item?.data_pagamento || null,
    valor: valorNum(item),
    status: pago ? "Pago" : "Em aberto",
    statusTom: pago ? "pago" : "aberto",
  };
}

export function linhaMaterial(item, { fornecedorNome } = {}) {
  const pago = isPago(statusPagamentoItem(item));
  const vencido = !pago && isVencido(item);
  const fornecedor =
    fornecedorNome || item?.fornecedores?.nome || "Fornecedor";
  return {
    id: item?.id,
    titulo: item?.material || item?.descricao || "—",
    detalhe: [fornecedor, labelObraCliente(item?.obras)]
      .filter(Boolean)
      .join(" · "),
    data: item?.data_vencimento || item?.data_pagamento || null,
    valor: valorNum(item),
    status: pago ? "Pago" : vencido ? "Vencido" : "Em aberto",
    statusTom: pago ? "pago" : vencido ? "vencido" : "aberto",
  };
}

export function linhaEscritorio(item, tipo = "saida") {
  const validado = item?.validacao === 1;
  const isEntrada = tipo === "entrada";
  return {
    id: `${tipo}-${item?.id}`,
    titulo: item?.descricao || "—",
    detalhe: item?.forma || "",
    data: item?.data || null,
    valor: valorNum(item),
    status: validado ? "Validado" : "Pendente",
    statusTom: validado ? "pago" : "aberto",
    sentido: isEntrada ? "entrada" : "saida",
  };
}

export function linhaEmprestimo(item) {
  const emprestou = Boolean(item?.emprestou);
  return {
    id: `emp-${item?.id}`,
    titulo: emprestou
      ? `Emprestado para ${item?.contraLabel || "—"}`
      : `Tomado de ${item?.contraLabel || "—"}`,
    detalhe: item?.descricao || "Empréstimo em aberto",
    data: item?.data || null,
    valor: parseFloat(item?.saldo_aberto) || valorNum(item),
    status: "Em aberto",
    statusTom: "aberto",
    sentido: emprestou ? "saida" : "entrada",
  };
}

export function historicoMaoDeObra(itens = [], kpiId, extras = {}) {
  const lista = itens || [];
  let filtrados = lista;
  if (kpiId === "pago") {
    filtrados = lista.filter((i) => isPago(statusPagamentoItem(i)));
  } else if (
    kpiId === "itens-abertos" ||
    kpiId === "itens" ||
    kpiId === "a-pagar"
  ) {
    filtrados = lista.filter((i) => !isPago(statusPagamentoItem(i)));
  }
  return ordenarLancamentos(filtrados.map((i) => linhaMaoDeObra(i, extras)));
}

export function historicoMateriais(itens = [], kpiId, extras = {}, hoje) {
  const lista = itens || [];
  let filtrados = lista;
  if (kpiId === "pago") {
    filtrados = lista.filter((i) => isPago(statusPagamentoItem(i)));
  } else if (kpiId === "vencidos" || kpiId === "vencido") {
    filtrados = lista.filter(
      (i) => getBucketPrioridade(i, hoje) === BUCKET_IDS.vencidos,
    );
  } else if (kpiId === "semana") {
    filtrados = lista.filter(
      (i) => getBucketPrioridade(i, hoje) === BUCKET_IDS.proximaSemana,
    );
  } else if (
    kpiId === "fornecedores" ||
    kpiId === "a-pagar" ||
    kpiId === "itens"
  ) {
    filtrados = lista.filter((i) => !isPago(statusPagamentoItem(i)));
  }
  return ordenarLancamentos(filtrados.map((i) => linhaMaterial(i, extras)));
}

export function historicoEscritorioMes({
  entradas = [],
  saidas = [],
  kpiId,
} = {}) {
  const mapE = (i) => linhaEscritorio(i, "entrada");
  const mapS = (i) => linhaEscritorio(i, "saida");
  const valE = entradas.filter((i) => i.validacao === 1);
  const valS = saidas.filter((i) => i.validacao === 1);
  const pendE = entradas.filter((i) => i.validacao !== 1);
  const pendS = saidas.filter((i) => i.validacao !== 1);

  let linhas = [];
  switch (kpiId) {
    case "saldo-validado":
      linhas = [...valE.map(mapE), ...valS.map(mapS)];
      break;
    case "saldo-previsto":
      linhas = [...entradas.map(mapE), ...saidas.map(mapS)];
      break;
    case "entradas":
    case "total-entradas-validado":
      linhas = valE.map(mapE);
      break;
    case "total-entradas-lancado":
      linhas = entradas.map(mapE);
      break;
    case "saidas":
    case "total-saidas-validado":
      linhas = valS.map(mapS);
      break;
    case "total":
    case "total-saidas-lancado":
      linhas = saidas.map(mapS);
      break;
    case "pendentes":
      linhas = [...pendE.map(mapE), ...pendS.map(mapS)];
      break;
    default:
      linhas = [];
  }
  return ordenarLancamentos(linhas);
}

export function historicoCaixa({
  entradas = [],
  saidas = [],
  emprestimos = [],
  kpiId,
} = {}) {
  const mapE = (i) => linhaEscritorio(i, "entrada");
  const mapS = (i) => linhaEscritorio(i, "saida");
  const emprestado = (emprestimos || []).filter((e) => e.emprestou);
  const tomado = (emprestimos || []).filter((e) => !e.emprestou);

  let linhas = [];
  switch (kpiId) {
    case "caixa-entradas":
      linhas = entradas.map(mapE);
      break;
    case "caixa-saidas":
      linhas = saidas.map(mapS);
      break;
    case "caixa-emprestado":
      linhas = emprestado.map(linhaEmprestimo);
      break;
    case "caixa-tomado":
      linhas = tomado.map(linhaEmprestimo);
      break;
    case "caixa-saldo":
      linhas = [
        ...entradas.map(mapE),
        ...saidas.map(mapS),
        ...emprestimos.map(linhaEmprestimo),
      ];
      break;
    default:
      linhas = [];
  }
  return ordenarLancamentos(linhas);
}
