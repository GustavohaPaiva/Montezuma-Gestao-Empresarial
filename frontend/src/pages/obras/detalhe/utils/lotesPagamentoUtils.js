/**
 * Rótulos visíveis na seção Extrato financeiro.
 * Conceito interno continua "lote"; na UI o usuário vê "extrato".
 */
export const labelsExtratoFinanceiro = {
  numero: (n) => `Extrato #${n}`,
  nomePdf: (n) => `Extrato_${n}.pdf`,
  incluirNoExtrato: "Incluir no extrato",
  itemEmExtratoAberto: "Item já está em um extrato aberto",
  incluirNoExtratoPagamento: "Incluir no extrato de pagamento",
  selecionadosParaExtrato: "Selecionados para o extrato",
  gerarExtratoPagamento: "Gerar extrato de pagamento",
  extratosDePagamento: "Extratos de pagamento",
  nenhumExtratoPagamento: "Nenhum extrato de pagamento",
  hintGerarExtrato:
    'Selecione itens no extrato e clique em "Gerar extrato de pagamento" para criar um grupo.',
  marcarExtratoComoPago: "Marcar extrato como Pago",
  reabrirExtrato: "Reabrir extrato",
  removerDoExtrato: "Remover do extrato",
  removerDoExtratoSemAlterarStatus:
    "Remover do extrato sem alterar o status",
  confirmarMarcarExtratoPago: "Marcar extrato como pago",
  confirmarReabrirExtrato: "Reabrir extrato",
  confirmarPagamentoExtrato: (numero, total) =>
    `Confirmar pagamento do Extrato #${numero} (R$ ${total})? Todos os itens serão marcados como pagos.`,
  confirmarReabrirExtratoMsg: (numero) =>
    `Reabrir o Extrato #${numero}? Os itens voltarão para "Aguardando pagamento".`,
  confirmarRemoverItemExtrato: (descricao, numero) =>
    `Remover "${descricao}" do Extrato #${numero}? O status de pagamento não será alterado.`,
  extratoCriadoComSucesso: (numero) => `Extrato #${numero} criado com sucesso.`,
  extratoMarcadoComoPago: (numero) => `Extrato #${numero} marcado como pago.`,
  extratoReaberto: (numero) => `Extrato #${numero} reaberto.`,
  itemRemovidoDoExtrato: "Item removido do extrato.",
  erroProcessarExtrato: "Erro ao processar o extrato.",
  nenhumItemSelecionadoExtrato: "Nenhum item selecionado para o extrato.",
  itensEmOutroExtratoAberto: "Um ou mais itens já estão em outro extrato aberto.",
  extratoSemItensPdf: "Extrato sem itens para gerar PDF.",
  erroCriarExtratoPagamento: "Erro ao criar extrato de pagamento.",
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
    return "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30";
  }
  if (status === "parcial") {
    return "bg-blue-500/15 text-blue-800 ring-blue-500/30";
  }
  return "bg-amber-500/15 text-amber-900 ring-amber-400/35";
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
