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
  switch (status) {
    case "Solicitado":
      return "bg-[#FFF3E0] text-[#E65100]";
    case "Em cotação":
      return "bg-[#F3E5F5] text-[#7B1FA2]";
    case "Aprovado":
      return "bg-[#E0F2F1] text-[#00695C]";
    case "Aguardando entrega":
      return "bg-[#E3F2FD] text-[#1565C0]";
    case "Entregue":
      return "bg-[#E8F5E9] text-[#2E7D32]";
    default:
      return "bg-[#E3F2FD] text-[#1565C0]";
  }
}

export function desempatePorId(a, b) {
  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}
