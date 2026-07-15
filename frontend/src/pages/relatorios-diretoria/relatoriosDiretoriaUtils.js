import { Hammer, ShoppingCart, Wallet } from "lucide-react";

export const MODALIDADES_RELATORIO = [
  {
    id: "obra",
    label: "Obra",
    descricao: "Acompanhamento da execução",
    colorTheme: "amber",
    Icon: Hammer,
  },
  {
    id: "financeiro",
    label: "Financeiro",
    descricao: "Situação financeira automática da semana (todas as obras)",
    colorTheme: "primary",
    Icon: Wallet,
  },
  {
    id: "compras",
    label: "Compras",
    descricao: "Compras e pedidos da semana",
    colorTheme: "emerald",
    Icon: ShoppingCart,
  },
];

export const MODALIDADE_IDS = MODALIDADES_RELATORIO.map((m) => m.id);

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

/** Mínimo de dias da semana dentro do mês para listar; abaixo disso rola para o mês seguinte. */
const MIN_DIAS_SEMANA_NO_MES = 4;

export function parseISODate(iso) {
  if (!iso) return null;
  const s = String(iso).slice(0, 10);
  const d = new Date(`${s}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toISODate(data) {
  if (!data) return "";
  const d = data instanceof Date ? data : parseISODate(data);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Segunda-feira da semana de calendário que contém a data. */
export function inicioSemanaCalendar(data = new Date()) {
  const d = parseISODate(data) || new Date(data);
  d.setHours(12, 0, 0, 0);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

export function fimSemanaCalendar(inicio) {
  const d = inicioSemanaCalendar(inicio);
  d.setDate(d.getDate() + 6);
  return d;
}

export function semanaAtualInicio() {
  return toISODate(inicioSemanaCalendar(new Date()));
}

export function diasSemanaNoMes(inicio, ano, mes) {
  const primeiro = new Date(ano, mes - 1, 1, 12, 0, 0, 0);
  const ultimo = new Date(ano, mes, 0, 12, 0, 0, 0);
  const start = inicioSemanaCalendar(inicio);
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (d >= primeiro && d <= ultimo) count++;
  }
  return count;
}

/**
 * Semanas de calendário (seg–dom) que intersectam o mês.
 * Semanas com menos de 4 dias no mês são omitidas (rolam para o mês seguinte).
 * Retorna em ordem cronológica (mais antiga → mais recente).
 */
export function semanasDoMes(ano, mes) {
  const primeiro = new Date(ano, mes - 1, 1, 12, 0, 0, 0);
  const ultimo = new Date(ano, mes, 0, 12, 0, 0, 0);
  let cursor = inicioSemanaCalendar(primeiro);
  const semanas = [];
  const seen = new Set();
  let guard = 0;

  while (guard < 10) {
    guard++;
    const inicioIso = toISODate(cursor);
    if (seen.has(inicioIso)) break;

    const diasNoMes = diasSemanaNoMes(cursor, ano, mes);

    if (diasNoMes === 0) {
      if (cursor > ultimo) break;
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 7);
      continue;
    }

    if (diasNoMes < MIN_DIAS_SEMANA_NO_MES) {
      cursor = new Date(cursor);
      cursor.setDate(cursor.getDate() + 7);
      continue;
    }

    seen.add(inicioIso);
    const fim = fimSemanaCalendar(cursor);
    semanas.push({
      inicio: inicioIso,
      fim: toISODate(fim),
      diasNoMes,
    });

    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);

    if (cursor > ultimo && diasSemanaNoMes(cursor, ano, mes) === 0) break;
  }

  return semanas;
}

/**
 * Semanas do mês já iniciadas (exclui futuras), para listagem e seleção.
 * Por padrão: mais recente → mais antiga.
 */
export function semanasDisponiveisDoMes(ano, mes, { ordem = "desc" } = {}) {
  const limite = semanaAtualInicio();
  const filtradas = semanasDoMes(ano, mes).filter(
    (semana) => semana.inicio <= limite,
  );
  if (ordem === "asc") return filtradas;
  return [...filtradas].reverse();
}

export function labelSemanaFromInicio(semanaInicio) {
  const inicio = parseISODate(semanaInicio);
  if (!inicio) return "Semana";
  const fim = fimSemanaCalendar(inicio);
  const fmt = (d) => {
    const dia = String(d.getDate()).padStart(2, "0");
    const mesLabel = MESES_CURTOS[d.getMonth()] || "";
    return `${dia} ${mesLabel}`;
  };
  const anoFim = fim.getFullYear();
  const anoIni = inicio.getFullYear();
  if (anoIni === anoFim && inicio.getMonth() === fim.getMonth()) {
    return `${fmt(inicio)} – ${String(fim.getDate()).padStart(2, "0")} ${MESES_CURTOS[fim.getMonth()]}/${anoFim}`;
  }
  return `${fmt(inicio)}/${anoIni} – ${fmt(fim)}/${anoFim}`;
}

/** @deprecated Use labelSemanaFromInicio */
export function labelSemana(ano, mes, semanaRef) {
  const semanas = semanasDoMes(ano, mes);
  const idx = Number(semanaRef) - 1;
  if (semanas[idx]) return labelSemanaFromInicio(semanas[idx].inicio);
  return `Semana ${semanaRef}`;
}

export function opcoesSemanaSelect(ano, mes) {
  return semanasDisponiveisDoMes(ano, mes, { ordem: "desc" }).map(
    (semana, i) => ({
      value: semana.inicio,
      label: labelSemanaFromInicio(semana.inicio),
      ordem: i + 1,
    }),
  );
}

export function deslocarSemanaNoMes(ano, mes, semanaInicio, delta) {
  const semanas = semanasDisponiveisDoMes(ano, mes, { ordem: "asc" });
  const idx = semanas.findIndex((s) => s.inicio === semanaInicio);
  if (idx < 0) return null;
  const alvo = semanas[idx + delta];
  return alvo?.inicio ?? null;
}

const MESES_LONGOS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function labelPeriodo(ano, mes) {
  const idx = Number(mes) - 1;
  const nome = MESES_LONGOS[idx] || MESES_LONGOS[0];
  return `${nome} ${ano}`;
}

export function opcoesMesSelect() {
  return MESES_CURTOS.map((label, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: label.charAt(0).toUpperCase() + label.slice(1),
  }));
}

/** Avança ou retrocede um mês no período { ano, mes }. */
export function deslocarPeriodo(periodo, delta) {
  const d = new Date(periodo.ano, periodo.mes - 1 + delta, 1);
  return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
}

export function opcoesAnoSelect(anos = 3) {
  const atual = new Date().getFullYear();
  return Array.from({ length: anos }, (_, i) => {
    const ano = atual - i;
    return { value: String(ano), label: String(ano) };
  });
}

export function periodoAtual() {
  const hoje = new Date();
  const semana_inicio = semanaAtualInicio();
  const inicio = parseISODate(semana_inicio);
  return {
    ano: hoje.getFullYear(),
    mes: hoje.getMonth() + 1,
    semana_inicio,
    semana_ref: inicio ? inicio.getMonth() + 1 : 1,
  };
}

export function modalidadePorId(id) {
  return MODALIDADES_RELATORIO.find((m) => m.id === id) || null;
}

export function normalizarConteudo(conteudo) {
  if (!conteudo || typeof conteudo !== "object") {
    return { observacoes: "" };
  }
  return {
    observacoes:
      typeof conteudo.observacoes === "string" ? conteudo.observacoes : "",
    ...conteudo,
  };
}

export const TOPICOS_RELATORIO_OBRA = [
  { id: "feito", label: "O que já foi feito" },
  { id: "sera_feito", label: "O que será feito" },
  { id: "pendencias", label: "Pendências" },
  { id: "materiais", label: "Materiais" },
];

export const TOPICO_IDS_OBRA = TOPICOS_RELATORIO_OBRA.map((t) => t.id);

function gerarIdItemObra() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function criarItemObra(ordem = 0) {
  return {
    id: gerarIdItemObra(),
    texto: "",
    prazo: null,
    ordem: Number(ordem) || 0,
  };
}

export function estadoTopicosObraVazio() {
  return TOPICO_IDS_OBRA.reduce((acc, id) => {
    acc[id] = [];
    return acc;
  }, {});
}

function normalizarItemObra(raw, fallbackOrdem = 0) {
  if (!raw || typeof raw !== "object") return null;
  const texto = typeof raw.texto === "string" ? raw.texto : "";
  const id = raw.id ? String(raw.id) : gerarIdItemObra();
  let prazo = null;
  if (raw.prazo) {
    const iso = toISODate(raw.prazo);
    prazo = iso || null;
  }
  return {
    id,
    texto,
    prazo,
    ordem: Number.isFinite(Number(raw.ordem))
      ? Number(raw.ordem)
      : fallbackOrdem,
  };
}

export function ordenarItensObra(itens = []) {
  return [...itens].sort((a, b) => (b.ordem ?? 0) - (a.ordem ?? 0));
}

export function proximaOrdemItemObra(itens = []) {
  if (!itens.length) return 0;
  return Math.max(...itens.map((i) => Number(i.ordem) || 0)) + 1;
}

export function reindexarOrdensItensObra(itensOrdenados) {
  const total = itensOrdenados.length;
  return itensOrdenados.map((item, index) => ({
    ...item,
    ordem: total - 1 - index,
  }));
}

/**
 * Normaliza conteúdo da modalidade obra para schema v2.
 * Migra legado `{ observacoes }` para um item em `feito`.
 */
export function normalizarConteudoObra(conteudo) {
  const vazio = estadoTopicosObraVazio();

  if (!conteudo || typeof conteudo !== "object") {
    return { versao: 2, topicos: vazio };
  }

  if (
    conteudo.versao === 2 &&
    conteudo.topicos &&
    typeof conteudo.topicos === "object"
  ) {
    const topicos = { ...vazio };
    TOPICO_IDS_OBRA.forEach((topicoId) => {
      const lista = Array.isArray(conteudo.topicos[topicoId])
        ? conteudo.topicos[topicoId]
        : [];
      topicos[topicoId] = ordenarItensObra(
        lista
          .map((item, idx) => normalizarItemObra(item, lista.length - 1 - idx))
          .filter(Boolean),
      );
    });
    return { versao: 2, topicos };
  }

  const legado = normalizarConteudo(conteudo);
  if (legado.observacoes?.trim()) {
    vazio.feito = [criarItemObra(0)];
    vazio.feito[0].texto = legado.observacoes.trim();
  }

  return { versao: 2, topicos: vazio };
}

export function serializarConteudoObra(topicosState) {
  const topicos = estadoTopicosObraVazio();
  TOPICO_IDS_OBRA.forEach((topicoId) => {
    const lista = Array.isArray(topicosState?.[topicoId])
      ? topicosState[topicoId]
      : [];
    topicos[topicoId] = ordenarItensObra(
      lista
        .filter((item) => String(item?.texto ?? "").trim())
        .map((item) => ({
          id: item.id || gerarIdItemObra(),
          texto: String(item.texto).trim(),
          prazo: item.prazo ? toISODate(item.prazo) || null : null,
          ordem: Number(item.ordem) || 0,
        })),
    );
  });
  return { versao: 2, topicos };
}

export function formatarPrazoObra(prazo) {
  const iso = toISODate(prazo);
  if (!iso) return null;
  const d = parseISODate(iso);
  if (!d) return null;
  return d.toLocaleDateString("pt-BR");
}

export function rotaListaRelatorios({ ano, mes } = {}) {
  if (ano != null && mes != null) {
    return `/relatorios-diretoria${buildSemanaSearchParams(ano, mes)}`;
  }
  return "/relatorios-diretoria";
}

export function rotaRelatorioSemana(
  semanaInicio,
  { ano, mes } = {},
) {
  const base = `/relatorios-diretoria/semana/${String(semanaInicio).slice(0, 10)}`;
  if (ano != null && mes != null) {
    return `${base}${buildSemanaSearchParams(ano, mes)}`;
  }
  return base;
}

export function rotaLancamentoObra(
  semanaInicio,
  { ano, mes, origem = "lista" } = {},
) {
  const base = `/relatorios-diretoria/semana/${String(semanaInicio).slice(0, 10)}/obra`;
  if (ano != null && mes != null) {
    return `${base}${buildLancamentoObraParams(ano, mes, origem)}`;
  }
  return base;
}

export function rotaRelatorioFinanceiro(
  semanaInicio,
  { ano, mes, origem = "lista" } = {},
) {
  const base = `/relatorios-diretoria/semana/${String(semanaInicio).slice(0, 10)}/financeiro`;
  if (ano != null && mes != null) {
    return `${base}${buildLancamentoObraParams(ano, mes, origem)}`;
  }
  return base;
}

export function conteudoObraTemItens(conteudo) {
  const { topicos } = normalizarConteudoObra(conteudo);
  return TOPICO_IDS_OBRA.some((id) => (topicos[id] || []).length > 0);
}

export function chaveSemanaLancamento(lancamento) {
  if (lancamento?.semana_inicio) {
    return String(lancamento.semana_inicio).slice(0, 10);
  }
  if (
    lancamento?.ano != null &&
    lancamento?.mes != null &&
    lancamento?.semana_ref != null
  ) {
    const semanas = semanasDoMes(lancamento.ano, lancamento.mes);
    const idx = Number(lancamento.semana_ref) - 1;
    if (semanas[idx]?.inicio) return semanas[idx].inicio;
    const dia = Math.min(
      (Number(lancamento.semana_ref) - 1) * 7 + 1,
      new Date(lancamento.ano, lancamento.mes, 0).getDate(),
    );
    return toISODate(
      inicioSemanaCalendar(new Date(lancamento.ano, lancamento.mes - 1, dia)),
    );
  }
  return "";
}

export function montarRelatorioConsolidado(
  lancamentosDaSemana = [],
  { financeiroResumo = null } = {},
) {
  const porModalidade = {};
  MODALIDADE_IDS.forEach((id) => {
    porModalidade[id] = null;
  });

  (lancamentosDaSemana || []).forEach((l) => {
    if (l?.modalidade && MODALIDADE_IDS.includes(l.modalidade)) {
      porModalidade[l.modalidade] = {
        ...l,
        conteudo:
          l.modalidade === "obra"
            ? normalizarConteudoObra(l.conteudo)
            : normalizarConteudo(l.conteudo),
      };
    }
  });

  const preenchidas = MODALIDADE_IDS.filter((id) =>
    modalidadeEstaPreenchida(id, porModalidade[id], financeiroResumo),
  ).length;

  return {
    porModalidade,
    financeiroResumo,
    preenchidas,
    total: MODALIDADE_IDS.length,
    completo: preenchidas === MODALIDADE_IDS.length,
  };
}

export function modalidadeEstaPreenchida(
  id,
  lancamento,
  financeiroResumo = null,
) {
  if (id === "financeiro") {
    const obs = lancamento
      ? normalizarConteudo(lancamento.conteudo).observacoes?.trim()
      : "";
    if (obs) return true;
    if (financeiroResumo != null) {
      const temExtrato = (financeiroResumo.extratoSemana?.length || 0) > 0;
      const temEspera = (financeiroResumo.emEsperaSemana?.length || 0) > 0;
      return temExtrato || temEspera;
    }
    return false;
  }
  if (!lancamento) return false;
  if (id === "obra") return conteudoObraTemItens(lancamento.conteudo);
  const obs = normalizarConteudo(lancamento.conteudo).observacoes;
  return Boolean(obs?.trim());
}

/**
 * Monta blocos ordenados para o relatório corrido (apenas conteúdo preenchido).
 * @returns {Array<{ tipo: 'itens', id: string, titulo: string, itens: object[] } | { tipo: 'prosa', id: string, titulo: string, texto: string }>}
 */
export function montarBlocosRelatorioCorrico(consolidado) {
  const blocos = [];
  const porModalidade = consolidado?.porModalidade || {};

  const lancamentoObra = porModalidade.obra;
  if (lancamentoObra) {
    const { topicos } = normalizarConteudoObra(lancamentoObra.conteudo);
    TOPICOS_RELATORIO_OBRA.forEach((topico) => {
      const itens = ordenarItensObra(topicos?.[topico.id] || []).filter((i) =>
        i.texto?.trim(),
      );
      if (itens.length > 0) {
        blocos.push({
          tipo: "itens",
          id: topico.id,
          titulo: topico.label,
          itens,
        });
      }
    });
  }

  ["compras"].forEach((modId) => {
    const lancamento = porModalidade[modId];
    const texto = lancamento
      ? normalizarConteudo(lancamento.conteudo).observacoes?.trim()
      : "";
    if (texto) {
      const mod = modalidadePorId(modId);
      blocos.push({
        tipo: "prosa",
        id: modId,
        titulo: mod?.label || modId,
        texto,
      });
    }
  });

  const financeiroResumo = consolidado?.financeiroResumo;
  const lancamentoFinanceiro = porModalidade.financeiro;
  const observacoesFinanceiro = lancamentoFinanceiro
    ? normalizarConteudo(lancamentoFinanceiro.conteudo).observacoes?.trim()
    : "";
  if (financeiroResumo) {
    const temExtrato = (financeiroResumo.extratoSemana?.length || 0) > 0;
    const temEspera = (financeiroResumo.emEsperaSemana?.length || 0) > 0;
    if (temExtrato || temEspera || observacoesFinanceiro) {
      blocos.push({
        tipo: "financeiro",
        id: "financeiro",
        titulo: "Financeiro",
        resumo: financeiroResumo,
        observacoes: observacoesFinanceiro || "",
      });
    }
  } else if (observacoesFinanceiro) {
    blocos.push({
      tipo: "financeiro",
      id: "financeiro",
      titulo: "Financeiro",
      resumo: null,
      observacoes: observacoesFinanceiro,
    });
  }

  return blocos;
}

export function agruparLancamentosPorSemana(lancamentos = []) {
  const mapa = {};
  lancamentos.forEach((l) => {
    const chave = chaveSemanaLancamento(l);
    if (!chave) return;
    if (!mapa[chave]) mapa[chave] = [];
    mapa[chave].push(l);
  });
  return mapa;
}

export function resumoSemana(lancamentosDaSemana = [], financeiroResumo = null) {
  return montarRelatorioConsolidado(lancamentosDaSemana, { financeiroResumo });
}

export function isSemanaAtual(semanaInicio) {
  return semanaInicio === semanaAtualInicio();
}

export function derivarPeriodoDaSemana(semanaInicio) {
  const d = parseISODate(semanaInicio);
  if (!d) return periodoAtual();
  return {
    ano: d.getFullYear(),
    mes: d.getMonth() + 1,
    semana_inicio: toISODate(d),
  };
}

export function buildSemanaSearchParams(ano, mes) {
  return `?ano=${ano}&mes=${mes}`;
}

export function buildLancamentoObraParams(ano, mes, origem = "lista") {
  return `${buildSemanaSearchParams(ano, mes)}&origem=${origem}`;
}
