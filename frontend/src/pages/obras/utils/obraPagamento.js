export function verificarStatusPagamento(obra) {
  const extrato = obra.extrato || obra.relatorioExtrato || [];
  const mdo = obra.maoDeObra || [];
  const mat = obra.materiais || [];

  if (extrato.length === 0 && mdo.length === 0 && mat.length === 0) {
    return true;
  }

  for (let e of extrato) {
    if ((e.status_financeiro || "").toLowerCase().trim() !== "pago") {
      return false;
    }
  }

  for (let m of mdo) {
    const orcado = parseFloat(m.valor_orcado) || 0;
    const pago = parseFloat(m.valor_pago) || 0;
    if (
      orcado - pago > 0.01 &&
      !extrato.some((e) => e.mao_de_obra_id === m.id)
    ) {
      return false;
    }
  }

  for (let m of mat) {
    if (
      (parseFloat(m.valor) || 0) > 0 &&
      !extrato.some((e) => e.material_id === m.id)
    ) {
      return false;
    }
  }

  return true;
}
