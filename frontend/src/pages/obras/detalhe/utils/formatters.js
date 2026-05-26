export function formatarDataBR(dataString) {
  if (!dataString) return "-";
  const [ano, mes, dia] = dataString.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarMoeda(valor) {
  const valorNumerico = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorNumerico);
}

export function getCorStatusMaterial(status) {
  const chip =
    "shadow-sm ring-1 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary/25";
  switch (status) {
    case "Pendente":
    case "Solicitado":
      return `${chip} bg-amber-500/18 text-amber-950 ring-amber-400/35`;
    case "Cancelado":
      return `${chip} bg-slate-500/15 text-slate-800 ring-slate-400/30`;
    case "Em cotação":
      return `${chip} bg-violet-500/15 text-violet-900 ring-violet-400/30`;
    case "Aprovado":
      return `${chip} bg-teal-500/15 text-teal-900 ring-teal-400/30`;
    case "Aguardando entrega":
      return `${chip} bg-sky-500/15 text-sky-950 ring-sky-400/30`;
    case "Entregue":
      return `${chip} bg-emerald-500/18 text-emerald-900 ring-emerald-500/35`;
    default:
      return `${chip} bg-sky-500/15 text-sky-950 ring-sky-400/30`;
  }
}

export function desempatePorId(a, b) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}

/**
 * Soma o intervalo (período + tipo de período) à data de coleta e devolve
 * a data de devolução no formato "YYYY-MM-DD".
 *
 * Aceita tipos: "Diário" | "Semanal" | "Mensal" | "Anual".
 * Retorna null para entradas inválidas — assim o chamador pode preservar
 * o valor original em vez de gravar algo errado.
 */
export function calcularDataDevolucao(dataColeta, periodo, tipoPeriodo) {
  if (!dataColeta) return null;
  const periodoNum = Math.trunc(Number(periodo));
  if (!Number.isFinite(periodoNum) || periodoNum <= 0) return null;
  const base = new Date(`${String(dataColeta).split("T")[0]}T12:00:00`);
  if (Number.isNaN(base.getTime())) return null;
  const tipo = String(tipoPeriodo || "").trim();
  if (tipo === "Diário") {
    base.setDate(base.getDate() + periodoNum);
  } else if (tipo === "Semanal") {
    base.setDate(base.getDate() + periodoNum * 7);
  } else if (tipo === "Mensal") {
    base.setMonth(base.getMonth() + periodoNum);
  } else if (tipo === "Anual") {
    base.setFullYear(base.getFullYear() + periodoNum);
  } else {
    return null;
  }
  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, "0");
  const dd = String(base.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
