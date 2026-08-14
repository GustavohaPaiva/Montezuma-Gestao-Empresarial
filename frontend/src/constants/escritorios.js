import logoArruda from "../assets/logos/arruda-logotipo.png";

export const ID_MONTEZUMA = "11111111-1111-1111-1111-111111111111";
export const ID_VOGELKOP = "22222222-2222-2222-2222-222222222222";
export const ID_YBYOCA = "33333333-3333-3333-3333-333333333333";
export const ID_ARRUDA = "44444444-4444-4444-4444-444444444444";

export const SLUG_VOGELKOP = "vogelkop";
export const SLUG_YBYOCA = "ybyoca";
export const SLUG_ARRUDA = "arruda";

export const TEMA_VOGELKOP = "theme-vogelkop";
export const TEMA_YBYOCA = "theme-ybyoca";
export const TEMA_ARRUDA = "theme-arruda";

export const ESCRITORIO_NOME_POR_ID = {
  [ID_MONTEZUMA]: "Montezuma",
  [ID_VOGELKOP]: "VogelKop Arquitetura",
  [ID_YBYOCA]: "Ybyoca Arquitetura",
  [ID_ARRUDA]: "Arruda Arquitetura",
};

export const ESCRITORIOS_ARQUITETURA = [ID_VOGELKOP, ID_YBYOCA, ID_ARRUDA];

export const ESCRITORIOS_COM_OS = [ID_VOGELKOP];

export const ESCRITORIO_SLUG_POR_ID = {
  [ID_VOGELKOP]: SLUG_VOGELKOP,
  [ID_YBYOCA]: SLUG_YBYOCA,
  [ID_ARRUDA]: SLUG_ARRUDA,
};

export const ESCRITORIO_ID_POR_SLUG = {
  [SLUG_VOGELKOP]: ID_VOGELKOP,
  [SLUG_YBYOCA]: ID_YBYOCA,
  [SLUG_ARRUDA]: ID_ARRUDA,
};

export const ESCRITORIO_TEMA_POR_ID = {
  [ID_VOGELKOP]: TEMA_VOGELKOP,
  [ID_YBYOCA]: TEMA_YBYOCA,
  [ID_ARRUDA]: TEMA_ARRUDA,
};

/** Contatos usados em documentos da prefeitura. */
export const ESCRITORIO_CONTATO_POR_ID = {
  [ID_YBYOCA]: {
    telefone: "34 9 9855-3710",
    email: "ybyoca.studio@gmail.com",
  },
  [ID_VOGELKOP]: {
    telefone: "34 9 8417-4206",
    email: "arquiteturavogelkop@gmail.com",
  },
  [ID_ARRUDA]: {
    telefone: "",
    email: "contato@arrudaarquitetura.com.br",
  },
};

/** Identidade visual e dados do arquiteto. */
export const ESCRITORIO_BRAND_POR_ID = {
  [ID_VOGELKOP]: {
    cor: "#22d3ee",
    slogan: "",
    arquiteto: {
      nome: "Leonardo Silva Oliveira",
      cnpj: "55.265.345/0001-69",
      cau: "262276-9",
    },
  },
  [ID_YBYOCA]: {
    cor: "#ff6000",
    corEscura: "#111111",
    slogan: "",
    arquiteto: {
      nome: "",
      cnpj: "",
      cau: "",
    },
  },
  [ID_ARRUDA]: {
    cor: "#E10600",
    corEscura: "#111111",
    logo: logoArruda,
    slogan: "PROJETAR É TRANSFORMAR INTENÇÕES EM ESPAÇOS",
    arquiteto: {
      nome: "Paulo Vitor Arruda",
      cnpj: "",
      cau: "",
    },
  },
};

export function slugEscritorio(id) {
  return ESCRITORIO_SLUG_POR_ID[id] ?? SLUG_YBYOCA;
}

export function temaEscritorio(id) {
  return ESCRITORIO_TEMA_POR_ID[id] ?? TEMA_YBYOCA;
}

export function pathEscritorio(id) {
  const slug = ESCRITORIO_SLUG_POR_ID[id];
  return slug ? `/escritorio/${slug}` : null;
}

export function isEscritorioArquitetura(id) {
  return ESCRITORIOS_ARQUITETURA.includes(id);
}

export function temOrdensServicoEscritorio(id) {
  return ESCRITORIOS_COM_OS.includes(id);
}

export function contatoEscritorio(id, fallback = {}) {
  const contato = ESCRITORIO_CONTATO_POR_ID[id];
  if (!contato) {
    return {
      telefone: fallback.telefone || "",
      email: fallback.email || "",
    };
  }
  return {
    telefone: contato.telefone || fallback.telefone || "",
    email: contato.email || fallback.email || "",
  };
}

export function escritorioIdFromPathname(pathname) {
  const p = String(pathname || "").toLowerCase();
  if (p.includes("/escritorio/vogelkop") || p.includes("vogelkop")) {
    return ID_VOGELKOP;
  }
  if (p.includes("/escritorio/ybyoca") || p.includes("ybyoca")) {
    return ID_YBYOCA;
  }
  if (
    p.includes("/escritorio/arruda") ||
    p.includes("arruda") ||
    p.includes("/escritorio/pv")
  ) {
    return ID_ARRUDA;
  }
  return ID_YBYOCA;
}
