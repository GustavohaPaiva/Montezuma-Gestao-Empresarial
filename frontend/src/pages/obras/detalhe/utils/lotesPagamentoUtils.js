/**
 * Rótulos visíveis na seção de lotes de pagamento.
 * Conceito interno e UI: "lote" (agrupamento de itens do extrato para cobrança).
 */
export const labelsExtratoFinanceiro = {
  numero: (n) => `Lote #${n}`,
  nomePdf: (n) => `Lote${n}.pdf`,
  incluirNoExtrato: "Incluir no lote",
  itemEmExtratoAberto: "Item já está em um lote aberto",
  incluirNoExtratoPagamento: "Incluir no lote de pagamento",
  selecionadosParaExtrato: "Selecionados para o lote",
  gerarExtratoPagamento: "Gerar lote de pagamento",
  extratosDePagamento: "Lotes de pagamento",
  nenhumExtratoPagamento: "Nenhum lote de pagamento",
  hintGerarExtrato:
    'Selecione itens no extrato e clique em "Gerar lote de pagamento" para criar um grupo.',
  marcarExtratoComoPago: "Marcar lote como Pago",
  reabrirExtrato: "Reabrir lote",
  removerDoExtrato: "Remover do lote",
  removerDoExtratoSemAlterarStatus:
    "Remover do lote sem alterar o status",
  confirmarMarcarExtratoPago: "Marcar lote como pago",
  confirmarReabrirExtrato: "Reabrir lote",
  confirmarPagamentoExtrato: (numero, total) =>
    `Confirmar pagamento do Lote #${numero} (R$ ${total})? Todos os itens serão marcados como pagos.`,
  confirmarReabrirExtratoMsg: (numero) =>
    `Reabrir o Lote #${numero}? Os itens voltarão para "Aguardando pagamento".`,
  confirmarRemoverItemExtrato: (descricao, numero) =>
    `Remover "${descricao}" do Lote #${numero}? O status de pagamento não será alterado.`,
  extratoCriadoComSucesso: (numero) => `Lote #${numero} criado com sucesso.`,
  extratoMarcadoComoPago: (numero) => `Lote #${numero} marcado como pago.`,
  extratoReaberto: (numero) => `Lote #${numero} reaberto.`,
  itemRemovidoDoExtrato: "Item removido do lote.",
  erroProcessarExtrato: "Erro ao processar o lote.",
  nenhumItemSelecionadoExtrato: "Nenhum item selecionado para o lote.",
  itensEmOutroExtratoAberto: "Um ou mais itens já estão em outro lote aberto.",
  extratoSemItensPdf: "Lote sem itens para gerar PDF.",
  erroCriarExtratoPagamento: "Erro ao criar lote de pagamento.",
};

export function isExtratoPago(statusFinanceiro) {
  return (statusFinanceiro || "").toLowerCase().trim() === "pago";
}

export function getExtratoIdsEmLotesAbertos(lotesPagamento = []) {
  const ids = new Set();
  lotesPagamento.forEach((lote) => {
    if (lote.status === "pendente" || lote.status === "parcial") {
      (lote.itens || []).forEach((item) => {
        if (item.extrato_id) ids.add(item.extrato_id);
      });
    }
  });
  return ids;
}

export function labelStatusLote(status) {
  if (status === "pago") return "Pago";
  if (status === "parcial") return "Parcial";
  return "Pendente";
}

export function classesStatusLote(status) {
  if (status === "pago") {
    return "bg-emerald-600 text-white ring-emerald-700/30";
  }
  if (status === "parcial") {
    return "bg-blue-600 text-white ring-blue-700/30";
  }
  return "bg-amber-500 text-white ring-amber-600/30";
}

/** Mapa extrato_id → { loteId, numero, status, loteItemId } */
export function getMapaLotesPorExtrato(lotesPagamento = []) {
  const mapa = new Map();
  lotesPagamento.forEach((lote) => {
    (lote.itens || []).forEach((item) => {
      if (item.extrato_id) {
        mapa.set(item.extrato_id, {
          loteId: lote.id,
          numero: lote.numero,
          status: lote.status,
          loteItemId: item.id,
        });
      }
    });
  });
  return mapa;
}

export function loteEstaAberto(status) {
  return status === "pendente" || status === "parcial";
}

/**
 * Abertos (pendente/parcial) primeiro; depois pagos.
 * Dentro de cada grupo: ordem de lançamento crescente (numero / data_criacao).
 */
export function ordenarLotesPagamento(lotesPagamento = []) {
  return [...(lotesPagamento || [])].sort((a, b) => {
    const abertoA = loteEstaAberto(a.status) ? 0 : 1;
    const abertoB = loteEstaAberto(b.status) ? 0 : 1;
    if (abertoA !== abertoB) return abertoA - abertoB;

    const numA = Number(a.numero) || 0;
    const numB = Number(b.numero) || 0;
    if (numA !== numB) return numA - numB;

    const tA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
    const tB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
    if (tA !== tB) return tA - tB;

    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

/** Total a pagar (lotes pendentes/parciais). */
export function totalLotesAPagar(lotesPagamento = []) {
  return (lotesPagamento || [])
    .filter((lote) => loteEstaAberto(lote.status))
    .reduce((acc, lote) => acc + (parseFloat(lote.total) || 0), 0);
}
