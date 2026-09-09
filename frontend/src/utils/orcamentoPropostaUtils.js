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
  "Hidrossanitário",
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
export const MAX_CARACTERES_COMPLEMENTARES_OUTROS = 120;

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
  const complementares = normalizarLista(
    (Array.isArray(src.complementares) ? src.complementares : []).map((item) =>
      String(item).trim() === "Hidro" ? "Hidrossanitário" : item,
    ),
    OPCOES_COMPLEMENTARES,
  );
  const complementares_outros = String(src.complementares_outros ?? "")
    .trim()
    .slice(0, MAX_CARACTERES_COMPLEMENTARES_OUTROS);

  return {
    tecnico: normalizarLista(src.tecnico, OPCOES_TECNICO),
    tramites: normalizarLista(src.tramites, OPCOES_TRAMITES),
    complementares,
    complementares_outros: complementares.includes("Outros")
      ? complementares_outros
      : "",
    renderizacoes: normalizarLista(src.renderizacoes, OPCOES_RENDERIZACOES),
    valores: normalizarValores(src.valores),
    descricao,
  };
}

/** Rótulo exibido no PDF/UI quando a opção é "Outros" com texto livre. */
export function rotuloComplementar(item, outrosTexto) {
  if (item === "Outros") {
    const t = String(outrosTexto ?? "").trim();
    return t || "Outros";
  }
  return item;
}

export function listaComplementaresExibicao(complementares, outrosTexto) {
  return normalizarLista(complementares, OPCOES_COMPLEMENTARES).map((item) =>
    rotuloComplementar(item, outrosTexto),
  );
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

/** Capa Ybyoca: 015_26 (número com 3 dígitos + underscore + 2 dígitos do ano). */
export function formatarCodigoPropostaYB(numero, dataReferencia) {
  if (!numero) return "—";
  const d = dataReferencia ? new Date(dataReferencia) : new Date();
  const ano = Number.isNaN(d.getTime())
    ? String(new Date().getFullYear()).slice(-2)
    : String(d.getFullYear()).slice(-2);
  return `${String(numero).padStart(3, "0")}_${ano}`;
}

/** Cabeçalho interno Ybyoca: 09 JUL 2026. */
export function formatarDataCabecalhoYB(dataReferencia) {
  const MESES_CURTOS = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];
  const d = dataReferencia ? new Date(dataReferencia) : new Date();
  const valida = Number.isNaN(d.getTime()) ? new Date() : d;
  const dd = String(valida.getUTCDate()).padStart(2, "0");
  const mes = MESES_CURTOS[valida.getUTCMonth()];
  const yyyy = valida.getUTCFullYear();
  return `${dd} ${mes} ${yyyy}`;
}

export const MAX_CARACTERES_CONTATO_YB = 40;
export const MAX_CARACTERES_ENDERECO_YB = 80;

export const OPCOES_ENTREGA_YB = [
  "Planta baixa humanizada e técnica",
  "Planta de cobertura",
  "Fachadas",
  "Cortes",
  "Planta de locação e implantação no terreno",
  "Planta com Layout",
  "Quadro de esquadrias e acabamentos",
  "Imagens 3D",
  "Emissão de ART de projeto",
  "Pranchas técnicas em PDF e impressas",
  "Imagens 3D de apresentação",
];

export const OPCOES_COMPLEMENTARES_YB = [
  "Projeto Hidrossanitário",
  "Projeto Elétrico",
  "Projeto de Interiores",
  "Regularização de Imóveis",
  "Estudo de Viabilidade Financeira",
  "Assessoria para Investimento Imobiliário",
  "Outros",
];

export const OPCOES_TRAMITES_YB = ["Trâmites e Documentações"];

export const OPCOES_GESTAO_YB = ["Gestão de Obras"];

export const CHAVES_VALORES_YB = [
  { key: "arquitetonico", label: "Projeto Arquitetônico" },
  { key: "tramites", label: "Trâmites" },
  { key: "complementares", label: "Complementares" },
  { key: "gestao", label: "Gestão de Obras" },
];

export const SECOES_PROPOSTA_YBYOCA = [
  {
    id: "arquitetonico",
    titulo: "Projeto Arquitetônico",
    opcoes: OPCOES_ENTREGA_YB,
  },
  {
    id: "complementares",
    titulo: "Complementares e demais serviços",
    opcoes: OPCOES_COMPLEMENTARES_YB,
  },
  { id: "tramites", titulo: "Trâmites", opcoes: OPCOES_TRAMITES_YB },
  { id: "gestao", titulo: "Gestão de Obras", opcoes: OPCOES_GESTAO_YB },
];

function normalizarValoresYbyoca(raw) {
  const base = {
    arquitetonico: null,
    tramites: null,
    complementares: null,
    gestao: null,
  };
  if (!raw || typeof raw !== "object") return base;
  for (const { key } of CHAVES_VALORES_YB) {
    const n = parseFloat(raw[key]);
    base[key] = Number.isFinite(n) && n >= 0 ? n : null;
  }
  return base;
}

/**
 * Dados da proposta Ybyoca: capa + questionário de serviços/valores.
 */
export function normalizarPropostaDadosYbyoca(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  const contato = String(src.contato ?? "")
    .trim()
    .slice(0, MAX_CARACTERES_CONTATO_YB);
  const endereco = String(src.endereco ?? "")
    .trim()
    .slice(0, MAX_CARACTERES_ENDERECO_YB);
  const descricao = String(src.descricao ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .slice(0, MAX_LINHAS_DESCRICAO)
    .join("\n");
  const complementares = normalizarLista(
    src.complementares,
    OPCOES_COMPLEMENTARES_YB,
  );
  const complementares_outros = String(src.complementares_outros ?? "")
    .trim()
    .slice(0, MAX_CARACTERES_COMPLEMENTARES_OUTROS);

  return {
    contato,
    endereco,
    arquitetonico: normalizarLista(src.arquitetonico, OPCOES_ENTREGA_YB),
    tramites: normalizarLista(src.tramites, OPCOES_TRAMITES_YB),
    complementares,
    complementares_outros: complementares.includes("Outros")
      ? complementares_outros
      : "",
    gestao: normalizarLista(src.gestao, OPCOES_GESTAO_YB),
    valores: normalizarValoresYbyoca(src.valores),
    descricao,
  };
}

export function calcularTotalValoresPropostaYbyoca(valores) {
  const v = normalizarValoresYbyoca(valores);
  return CHAVES_VALORES_YB.reduce(
    (acc, { key }) => acc + (parseFloat(v[key]) || 0),
    0,
  );
}

/** Soma sem gestão de obras (valor mensal, exibido à parte). */
export function calcularTotalProjetosYbyoca(valores) {
  const v = normalizarValoresYbyoca(valores);
  return (
    (parseFloat(v.arquitetonico) || 0) +
    (parseFloat(v.tramites) || 0) +
    (parseFloat(v.complementares) || 0)
  );
}

const ORDEM_SERVICOS_YB = [
  "Projeto Arquitetônico",
  "Projetos Complementares",
  "Projeto de Interiores",
  "Regularização de Imóveis",
  "Trâmites e Documentações",
  "Estudo de Viabilidade Financeira",
  "Gestão de Obras",
  "Assessoria para Investimento Imobiliário",
];

const COMPLEMENTARES_PACOTE_YB = new Set([
  "Projeto Hidrossanitário",
  "Projeto Elétrico",
  "Outros",
]);

export function listaServicosOferecidosYbyoca(proposta) {
  const p = proposta && typeof proposta === "object" ? proposta : {};
  const selecionados = new Set();
  if ((p.arquitetonico || []).length) selecionados.add("Projeto Arquitetônico");
  const comps = p.complementares || [];
  if (comps.some((item) => COMPLEMENTARES_PACOTE_YB.has(item))) {
    selecionados.add("Projetos Complementares");
  }
  for (const item of comps) {
    if (item !== "Outros" && !COMPLEMENTARES_PACOTE_YB.has(item)) {
      selecionados.add(item);
    }
  }
  if ((p.tramites || []).length) selecionados.add("Trâmites e Documentações");
  if ((p.gestao || []).length) selecionados.add("Gestão de Obras");
  return ORDEM_SERVICOS_YB.filter((item) => selecionados.has(item));
}

export function listaDemaisServicosYbyoca(proposta) {
  const p = proposta && typeof proposta === "object" ? proposta : {};
  const demais = [];
  for (const item of p.complementares || []) {
    demais.push(rotuloComplementar(item, p.complementares_outros));
  }
  for (const item of p.tramites || []) demais.push(item);
  for (const item of p.gestao || []) demais.push(item);
  return demais;
}

export function textoEntregaArquitetonicoYbyoca(itens) {
  const lista = normalizarLista(itens, OPCOES_ENTREGA_YB);
  if (!lista.length) return "";
  return `${lista.join("; ")}.`;
}

/** Cabeçalho INFO GERAIS — dia|mês - ano a partir da coluna `data` do orçamento. */
export function formatarInfoGeraisCabecalho(dataReferencia) {
  const d = dataReferencia ? new Date(dataReferencia) : new Date();
  if (Number.isNaN(d.getTime())) return "INFO GERAIS";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `INFO GERAIS - ${dd} | ${mm} - ${yyyy}`;
}

const MESES_CAPA_PT = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

/** Capa: { mes: 'AGOSTO', ano: '2026' }. */
export function formatarMesAnoCapa(dataReferencia) {
  const d = dataReferencia ? new Date(dataReferencia) : new Date();
  const valida = Number.isNaN(d.getTime()) ? new Date() : d;
  return {
    mes: MESES_CAPA_PT[valida.getUTCMonth()],
    ano: String(valida.getUTCFullYear()),
  };
}

export function limitarLinhasDescricao(texto) {
  return String(texto ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .slice(0, MAX_LINHAS_DESCRICAO)
    .join("\n");
}

/** Linha termina frase completa (não cortada). */
function linhaTerminaFrase(linha) {
  const t = String(linha ?? "").trim();
  if (!t) return true;
  return /[.!?…]["')\]]*$/.test(t);
}

export function textoTerminaFraseCompleta(texto) {
  const linhas = String(texto ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!linhas.length) return true;
  return linhaTerminaFrase(linhas[linhas.length - 1]);
}

export function textoExcedeLinhasDescricao(
  texto,
  maxLinhas = MAX_LINHAS_DESCRICAO,
) {
  return contarLinhasDescricao(texto) > maxLinhas;
}

export function precisaAjusteSugestaoIA(
  texto,
  maxLinhas = MAX_LINHAS_DESCRICAO,
) {
  const t = String(texto ?? "").trim();
  if (!t) return false;
  return (
    textoExcedeLinhasDescricao(t, maxLinhas) || !textoTerminaFraseCompleta(t)
  );
}

/** Remove linha final cortada no meio (sem pontuação de fim). */
export function removerFinalIncompleto(texto) {
  const linhas = String(texto ?? "").replace(/\r\n/g, "\n").split("\n");
  while (linhas.length > 0 && !linhaTerminaFrase(linhas[linhas.length - 1])) {
    linhas.pop();
  }
  return linhas.join("\n").trim();
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
