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
    case "Solicitado":
      return `${chip} bg-amber-500/18 text-amber-950 ring-amber-400/35`;
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
