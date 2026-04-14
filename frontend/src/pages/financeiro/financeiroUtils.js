/** Tipos que enxergam entradas + resumo anual no módulo financeiro. */
export const TIPOS_FINANCEIRO_ADMIN = [
  "gestor_master",
  "diretoria",
  "suporte_ti",
];

export const formatarDataBR = (dataString) => {
  if (!dataString) return "-";
  const [ano, mes, dia] = dataString.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
};

export const formatarMoeda = (valor) => {
  const valorNumerico = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorNumerico);
};

export const checkIsParcelado = (item) => {
  if (!item) return false;
  return Boolean(
    item.grupo_id ||
      (item.forma && String(item.forma).toLowerCase().includes("parcelado")) ||
      (item.descricao && /\(\d+\/\d+\)/.test(item.descricao)),
  );
};
