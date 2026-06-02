export const OPCOES_TECNICO = [
  "Planta Baixa",
  "Planta layout",
  "Planta áreas",
  "Planta Cobertura",
  "Cortes e vistas",
  "Detalhes pertinentes",
  "Destruir e construir",
];

export const OPCOES_TRAMITES = ["Cartório", "Caixa", "PMU"];

export const OPCOES_COMPLEMENTARES = [
  "Hidro",
  "Estrutural",
  "Elétrico",
  "Outros",
];

export const OPCOES_RENDERIZACOES = [
  "Sala/Cozinha",
  "Gourmet",
  "Garagem",
  "Quarto 1",
  "Quarto 2",
  "Suíte",
  "Suíte Master",
  "Fachada interna",
  "Fachada externa",
];

export const CHAVES_VALORES = [
  { key: "pacote_tecnico", label: "Pacote Técnico" },
  { key: "tramites", label: "Trâmites" },
  { key: "complementares", label: "Complementares" },
  { key: "renderizados", label: "Renderizados" },
];

export const MAX_LINHAS_DESCRICAO = 10;

const CHAVES_LISTA = ["tecnico", "tramites", "complementares", "renderizacoes"];

function normalizarLista(valor, opcoesValidas) {
  if (!Array.isArray(valor)) return [];
  const setValidos = new Set(opcoesValidas);
  return valor.filter((item) => setValidos.has(String(item).trim()));
}

function normalizarValores(raw) {
  const base = {
    pacote_tecnico: null,
    tramites: null,
    complementares: null,
    renderizados: null,
  };
  if (!raw || typeof raw !== "object") return base;
  for (const { key } of CHAVES_VALORES) {
    const n = parseFloat(raw[key]);
    base[key] = Number.isFinite(n) && n >= 0 ? n : null;
  }
  return base;
}

export function normalizarPropostaDados(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const descricao = String(src.descricao ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .slice(0, MAX_LINHAS_DESCRICAO)
    .join("\n");
  return {
    tecnico: normalizarLista(src.tecnico, OPCOES_TECNICO),
    tramites: normalizarLista(src.tramites, OPCOES_TRAMITES),
    complementares: normalizarLista(src.complementares, OPCOES_COMPLEMENTARES),
    renderizacoes: normalizarLista(src.renderizacoes, OPCOES_RENDERIZACOES),
    valores: normalizarValores(src.valores),
    descricao,
  };
}

export function calcularTotalValoresProposta(valores) {
  const v = normalizarValores(valores);
  return CHAVES_VALORES.reduce(
    (acc, { key }) => acc + (parseFloat(v[key]) || 0),
    0,
  );
}

export function formatarMoedaBRL(valor) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarDataPropostaBR(dataString) {
  if (!dataString) return "—";
  const d = new Date(dataString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Capa/UI: número/ano (ex.: 026/26). */
export function formatarNumeroPropostaCapa(numero, dataReferencia) {
  if (!numero) return "—";
  const d = dataReferencia ? new Date(dataReferencia) : new Date();
  const ano = Number.isNaN(d.getTime())
    ? String(new Date().getFullYear()).slice(-2)
    : String(d.getFullYear()).slice(-2);
  return `${String(numero).padStart(3, "0")}/${ano}`;
}

/** Capa do PDF: PROPOSTA VK - 0126 (número com 2 dígitos + 2 dígitos do ano). */
export function formatarCodigoPropostaVK(numero, dataReferencia) {
  if (!numero) return "—";
  const d = dataReferencia ? new Date(dataReferencia) : new Date();
  const ano = Number.isNaN(d.getTime())
    ? String(new Date().getFullYear()).slice(-2)
    : String(d.getFullYear()).slice(-2);
  return `${String(numero).padStart(2, "0")}${ano}`;
}

/** Cabeçalho INFO GERAIS - 26|05 - 2026 */
export function formatarInfoGeraisCabecalho(numero, dataReferencia) {
  const d = dataReferencia ? new Date(dataReferencia) : new Date();
  if (Number.isNaN(d.getTime())) return "INFO GERAIS";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  const num = String(numero).padStart(2, "0") ?? "—";
  return `INFO GERAIS - ${num}|${mm} - ${yyyy}`;
}

export function limitarLinhasDescricao(texto) {
  return String(texto ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .slice(0, MAX_LINHAS_DESCRICAO)
    .join("\n");
}

export function contarLinhasDescricao(texto) {
  const t = String(texto ?? "").replace(/\r\n/g, "\n");
  if (!t) return 1;
  return t.split("\n").length;
}

export function toggleOpcaoLista(lista, opcao) {
  const set = new Set(Array.isArray(lista) ? lista : []);
  if (set.has(opcao)) set.delete(opcao);
  else set.add(opcao);
  return [...set];
}

export function propostaDadosParaPayload(dados) {
  const norm = normalizarPropostaDados(dados);
  return {
    proposta_dados: norm,
    valor: calcularTotalValoresProposta(norm.valores),
  };
}

export function slugifyOrcamentoNome(nome) {
  return (
    String(nome || "proposta")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 48) || "proposta"
  );
}

export const SECOES_PROPOSTA = [
  { id: "tecnico", titulo: "Técnico", opcoes: OPCOES_TECNICO },
  { id: "tramites", titulo: "Trâmites", opcoes: OPCOES_TRAMITES },
  {
    id: "complementares",
    titulo: "Complementares",
    opcoes: OPCOES_COMPLEMENTARES,
  },
  {
    id: "renderizacoes",
    titulo: "Renderizações",
    opcoes: OPCOES_RENDERIZACOES,
  },
];
