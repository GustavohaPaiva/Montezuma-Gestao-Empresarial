export function isPago(statusFinanceiro) {
  return String(statusFinanceiro || "")
    .trim()
    .toLowerCase() === "pago";
}

function inicioDoDia(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseDataLocal(dataIso) {
  if (!dataIso) return null;
  const raw = String(dataIso).slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!match) {
    const fallback = new Date(dataIso);
    if (Number.isNaN(fallback.getTime())) return null;
    return inicioDoDia(fallback);
  }
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function isVencido(item, hoje = new Date()) {
  if (!item || isPago(item.status_financeiro)) return false;
  const vencimento = parseDataLocal(item.data_vencimento);
  if (!vencimento) return false;
  return vencimento.getTime() < inicioDoDia(hoje).getTime();
}

export function agregarFinanceiroFornecedor(materiais = []) {
  let comprado = 0;
  let pago = 0;
  let vencido = 0;
  let qtdVencidos = 0;

  for (const m of materiais || []) {
    const val = parseFloat(m.valor) || 0;
    comprado += val;

    if (isPago(m.status_financeiro)) {
      pago += val;
      continue;
    }

    if (isVencido(m)) {
      vencido += val;
      qtdVencidos += 1;
    }
  }

  return {
    comprado,
    pago,
    pendente: comprado - pago,
    vencido,
    qtdVencidos,
  };
}
