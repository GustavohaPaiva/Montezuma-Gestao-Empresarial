function isStatusPago(statusFinanceiro) {
  return (statusFinanceiro || "").toLowerCase().trim() === "pago";
}

/**
 * Status financeiro do card na listagem de obras.
 * Alinhado aos hubs / extrato do detalhe:
 * - extrato: todos os lançamentos "Pago"
 * - materiais / locações: status_financeiro "Pago" (quando há valor)
 *
 * A regra antiga também exigia (1) material presente no extrato e
 * (2) mão de obra com valor_orcado > valor_pago sem extrato vinculado.
 * Isso marcava "Pendente" em obras cujo extrato e materiais já estavam
 * pagos — a MdO só entra no fluxo de pagamento ao gerar extrato.
 */
export function verificarStatusPagamento(obra) {
  const extrato = obra.extrato || obra.relatorioExtrato || [];
  const mat = obra.materiais || [];
  const loc = obra.locacoes || [];
  const mdo = obra.maoDeObra || [];

  if (
    extrato.length === 0 &&
    mdo.length === 0 &&
    mat.length === 0 &&
    loc.length === 0
  ) {
    return true;
  }

  for (const e of extrato) {
    if (!isStatusPago(e.status_financeiro)) return false;
  }

  for (const m of mat) {
    if ((parseFloat(m.valor) || 0) > 0 && !isStatusPago(m.status_financeiro)) {
      return false;
    }
  }

  for (const l of loc) {
    if ((parseFloat(l.valor) || 0) > 0 && !isStatusPago(l.status_financeiro)) {
      return false;
    }
  }

  return true;
}
