export const STATUS_PROJECAO_OPCOES = [
  "Rascunho",
  "Em análise",
  "Enviada",
  "Aprovada",
  "Recusada",
];

export const TIPO_PROJECAO_ITEM = {
  DOCUMENTACAO: "documentacao",
  PROJETO: "projeto",
  OBRA: "obra",
  MAO_DE_OBRA: "mao_de_obra",
  MATERIAIS: "materiais",
};

export const TIPO_PROJECAO_OPCOES = [
  { value: TIPO_PROJECAO_ITEM.DOCUMENTACAO, label: "Documentação" },
  { value: TIPO_PROJECAO_ITEM.PROJETO, label: "Projeto" },
  { value: TIPO_PROJECAO_ITEM.OBRA, label: "Obra" },
  { value: TIPO_PROJECAO_ITEM.MAO_DE_OBRA, label: "Mão de Obra" },
  { value: TIPO_PROJECAO_ITEM.MATERIAIS, label: "Materiais" },
];

function normalizarTipoItem(tipo) {
  const t = String(tipo || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (t === "documentacao") return TIPO_PROJECAO_ITEM.DOCUMENTACAO;
  if (t === "projeto") return TIPO_PROJECAO_ITEM.PROJETO;
  if (t === "obra") return TIPO_PROJECAO_ITEM.OBRA;
  if (t === "mao_de_obra" || t === "mao de obra")
    return TIPO_PROJECAO_ITEM.MAO_DE_OBRA;
  if (t === "materiais" || t === "material")
    return TIPO_PROJECAO_ITEM.MATERIAIS;
  return TIPO_PROJECAO_ITEM.DOCUMENTACAO;
}

export function formatarMoedaProjecao(valor) {
  const n = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatarMoedaBRL(valor) {
  return (Number(valor) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarDataProjecao(dataString) {
  if (!dataString) return "—";
  const d = new Date(dataString);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export function normalizarDataItemProjecao(valor) {
  if (!valor) return null;
  const s = String(valor).trim();
  return s ? s.slice(0, 10) : null;
}

export function formatarPeriodoProjecao(dataInicio, dataFim) {
  const i = dataInicio ? formatarDataProjecao(dataInicio) : null;
  const f = dataFim ? formatarDataProjecao(dataFim) : null;
  if (i && f) return `${i} – ${f}`;
  if (i) return `Início ${i}`;
  if (f) return `Até ${f}`;
  return "—";
}

export function normalizarItensProjecao(itens) {
  if (!Array.isArray(itens)) return [];
  return itens.map((item, idx) => {
    const quantidade = parseFloat(item?.quantidade) || 0;
    const valorUnitario = parseFloat(item?.valor_unitario) || 0;
    const valorTotal =
      item?.valor_total != null
        ? parseFloat(item.valor_total) || 0
        : quantidade * valorUnitario;
    return {
      id: item?.id || `item-${idx}`,
      tipo: normalizarTipoItem(item?.tipo),
      descricao: String(item?.descricao || "").trim(),
      quantidade,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      data_inicio: normalizarDataItemProjecao(item?.data_inicio),
      data_fim: normalizarDataItemProjecao(item?.data_fim),
    };
  });
}

export function labelTipoProjecaoItem(tipo) {
  const opt = TIPO_PROJECAO_OPCOES.find(
    (o) => o.value === normalizarTipoItem(tipo),
  );
  return opt?.label || "Documentação";
}

export function calcularValorPorTipo(itens, tipo) {
  const alvo = normalizarTipoItem(tipo);
  return normalizarItensProjecao(itens)
    .filter((i) => i.tipo === alvo)
    .reduce((acc, i) => acc + (parseFloat(i.valor_total) || 0), 0);
}

export function calcularValoresPorTipo(itens) {
  return {
    valor_documentacao: calcularValorPorTipo(
      itens,
      TIPO_PROJECAO_ITEM.DOCUMENTACAO,
    ),
    valor_projeto: calcularValorPorTipo(itens, TIPO_PROJECAO_ITEM.PROJETO),
    valor_obra: calcularValorPorTipo(itens, TIPO_PROJECAO_ITEM.OBRA),
    valor_mao_de_obra: calcularValorPorTipo(
      itens,
      TIPO_PROJECAO_ITEM.MAO_DE_OBRA,
    ),
    valor_materiais: calcularValorPorTipo(itens, TIPO_PROJECAO_ITEM.MATERIAIS),
  };
}

export function sincronizarProjecaoComItens(projecao) {
  const itens = normalizarItensProjecao(projecao?.itens);
  const valores = calcularValoresPorTipo(itens);
  return {
    ...projecao,
    itens,
    ...valores,
  };
}

export function calcularTotalItens(itens) {
  return normalizarItensProjecao(itens).reduce(
    (acc, i) => acc + (parseFloat(i.valor_total) || 0),
    0,
  );
}

export function calcularTotalProjecao(projecao) {
  if (!projecao) return 0;
  const itens = normalizarItensProjecao(projecao.itens);
  if (itens.length > 0) {
    return calcularTotalItens(itens);
  }
  const doc = parseFloat(projecao.valor_documentacao) || 0;
  const proj = parseFloat(projecao.valor_projeto) || 0;
  const obra = parseFloat(projecao.valor_obra) || 0;
  const maoDeObra = parseFloat(projecao.valor_mao_de_obra) || 0;
  const materiais = parseFloat(projecao.valor_materiais) || 0;
  return doc + proj + obra + maoDeObra + materiais;
}

export function statusProjecaoBadgeClass(status) {
  const s = String(status || "Rascunho")
    .trim()
    .toLowerCase();
  if (s === "aprovada") {
    return "bg-emerald-500/18 text-emerald-900 ring-emerald-500/35";
  }
  if (s === "recusada") {
    return "bg-red-500/18 text-red-800 ring-red-400/35";
  }
  if (s === "enviada") {
    return "bg-blue-500/18 text-blue-900 ring-blue-400/35";
  }
  if (s === "em análise" || s === "em analise") {
    return "bg-amber-500/18 text-amber-950 ring-amber-400/35";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200/80";
}

export function slugifyProjecaoNome(nome) {
  return String(nome || "Projecao")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
