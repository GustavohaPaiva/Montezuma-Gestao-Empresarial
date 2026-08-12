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

export const stripIndiceGrupo = (descricao) =>
  String(descricao || "")
    .replace(/\s*\(\d+\s*\/\s*\d+\)\s*$/i, "")
    .trim();

export const checkIsRecorrente = (item) => {
  if (!item?.grupo_id) return false;
  return String(item.grupo_id).startsWith("rec_");
};

export const checkIsParcelado = (item) => {
  if (!item) return false;
  if (checkIsRecorrente(item)) return false;
  return Boolean(
    item.grupo_id ||
      (item.forma && String(item.forma).toLowerCase().includes("parcelado")) ||
      (item.descricao && /\(\d+\/\d+\)/.test(item.descricao)),
  );
};

export const checkIsGrupoFinanceiro = (item) =>
  Boolean(item?.grupo_id) || checkIsParcelado(item) || checkIsRecorrente(item);
