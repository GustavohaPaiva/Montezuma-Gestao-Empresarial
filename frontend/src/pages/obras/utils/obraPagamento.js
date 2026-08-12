function isStatusPago(statusFinanceiro) {
  return (statusFinanceiro || "").toLowerCase().trim() === "pago";
}

/**
 * Status financeiro do card na listagem de obras (cobrança Cliente → Montezuma).
 * Usa apenas o extrato (+ locações com valor, ainda no fluxo de cobrança da obra).
 * Pagamento a fornecedores vive em contas_pagar_fornecedor e não entra aqui.
 */
export function verificarStatusPagamento(obra) {
  const extrato = obra.extrato || obra.relatorioExtrato || [];
  const loc = obra.locacoes || [];
  const mdo = obra.maoDeObra || [];

  if (extrato.length === 0 && mdo.length === 0 && loc.length === 0) {
    const mat = obra.materiais || [];
    if (mat.length === 0) return true;
  }

  for (const e of extrato) {
    if (!isStatusPago(e.status_financeiro)) return false;
  }

  for (const l of loc) {
    if ((parseFloat(l.valor) || 0) > 0 && !isStatusPago(l.status_financeiro)) {
      return false;
    }
  }

  return true;
}
