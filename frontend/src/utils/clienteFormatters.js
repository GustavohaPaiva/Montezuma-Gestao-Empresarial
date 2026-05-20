/** Formatação de campos do cliente (processos) — exibição, formulário e PDFs */

export function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatCPFCNPJ(value) {
  const d = onlyDigits(value).slice(0, 14);
  if (!d) return "";

  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatRG(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const alnum = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!alnum) return "";

  let uf = "";
  let idx = 0;
  if (/^[A-Z]{2}/.test(alnum)) {
    uf = alnum.slice(0, 2);
    idx = 2;
  }

  const digits = alnum.slice(idx);
  if (!uf && !digits) return raw;

  let formatted = digits;
  if (digits.length > 2 && digits.length <= 5) {
    formatted = `${digits.slice(0, 2)}.${digits.slice(2)}`;
  } else if (digits.length > 5 && digits.length <= 8) {
    formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  } else if (digits.length > 8) {
    formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8, 9)}`;
  }

  return uf ? `${uf}-${formatted}` : formatted;
}

export function formatCEP(value) {
  const d = onlyDigits(value).slice(0, 8);
  if (!d) return "";
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatTelefone(value) {
  const d = onlyDigits(value).slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** DD/MM/AAAA — aceita ISO, BR ou só dígitos */
export function formatDataBR(value) {
  const s = String(value ?? "").trim();
  if (!s) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  const d = onlyDigits(s).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function formatEstado(value) {
  return String(value ?? "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);
}

/** Números de alvará, ART, código etc. — agrupa de 3 em 3 */
export function formatNumeroDocumento(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const d = onlyDigits(raw);
  if (!d) return raw;
  return d.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Processo municipal: 12345/2024 quando só dígitos */
export function formatNumeroProcesso(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw.includes("/")) return raw;
  const d = onlyDigits(raw);
  if (d.length <= 4) return d;
  return `${d.slice(0, d.length - 4)}/${d.slice(-4)}`;
}

export function formatTamanhoM2(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/m²|m2/i.test(raw)) return raw.replace(/\s*m2\s*$/i, " m²");
  const num = raw.replace(",", ".").replace(/[^\d.]/g, "");
  if (!num) return raw;
  return `${num} m²`;
}

export function formatEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

/** Campos com formatação automática */
export const FORMATADORES_POR_CAMPO = {
  cpf: formatCPFCNPJ,
  rg: formatRG,
  cep: formatCEP,
  telefone: formatTelefone,
  estado: formatEstado,
  data_expedicao: formatDataBR,
  numero_alvara: formatNumeroDocumento,
  n_alvara: formatNumeroDocumento,
  art: formatNumeroDocumento,
  numero_processo: formatNumeroProcesso,
  codigo_identificacao_imovel: formatNumeroDocumento,
  tamanho_m2: formatTamanhoM2,
  email: formatEmail,
};

const CAMPOS_FORMATADOS = Object.keys(FORMATADORES_POR_CAMPO);

export function formatClienteCampo(campo, valor) {
  const fn = FORMATADORES_POR_CAMPO[campo];
  if (!fn) return valor ?? "";
  return fn(valor);
}

/** Aplica formatação em todos os campos conheidos do registro */
export function formatClienteRecord(cliente) {
  if (!cliente || typeof cliente !== "object") return cliente;

  const out = { ...cliente };
  for (const campo of CAMPOS_FORMATADOS) {
    if (out[campo] != null && out[campo] !== "") {
      out[campo] = formatClienteCampo(campo, out[campo]);
    }
  }
  return out;
}

/** Alias para PDFs e documentos */
export function formatClienteParaDocumentos(cliente) {
  return formatClienteRecord(cliente);
}

/** Exibição na tabela de etapas (pipeline) */
export function formatValorPipeline(campo, valor, tipoInput) {
  if (valor == null || valor === "") return "-";
  if (tipoInput === "date") {
    const iso = String(valor);
    if (/^\d{4}-\d{2}-\d{2}/.test(iso)) return formatDataBR(iso);
    return formatDataBR(valor);
  }
  if (FORMATADORES_POR_CAMPO[campo]) {
    return formatClienteCampo(campo, valor) || "-";
  }
  return String(valor);
}
