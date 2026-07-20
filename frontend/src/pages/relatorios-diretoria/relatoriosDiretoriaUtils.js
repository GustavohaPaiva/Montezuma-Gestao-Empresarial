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

/** Tópicos do schema v2 — usados só para migrar legado → resumo_geral HTML. */
const TOPICOS_RELATORIO_OBRA_LEGADO = [
  { id: "feito", label: "O que já foi feito" },
  { id: "sera_feito", label: "O que será feito" },
  { id: "pendencias", label: "Pendências" },
  { id: "materiais", label: "Materiais" },
];

function escaparHtmlTexto(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Extrai texto visível de HTML (para checagem de vazio). */
export function textoVisivelDeHtml(html) {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function resumoObraTemConteudo(html) {
  return textoVisivelDeHtml(html).length > 0;
}

function formatarPrazoObraLegado(prazo) {
  const iso = toISODate(prazo);
  if (!iso) return null;
  const d = parseISODate(iso);
  if (!d) return null;
  return d.toLocaleDateString("pt-BR");
}

function ordenarItensObraLegado(itens = []) {
  return [...itens].sort((a, b) => (b.ordem ?? 0) - (a.ordem ?? 0));
}

function topicosV2ParaResumoHtml(topicos) {
  const partes = [];
  TOPICOS_RELATORIO_OBRA_LEGADO.forEach((topico) => {
    const itens = ordenarItensObraLegado(topicos?.[topico.id] || []).filter(
      (item) => String(item?.texto ?? "").trim(),
    );
    if (!itens.length) return;
    partes.push(`<h3>${escaparHtmlTexto(topico.label)}</h3>`);
    partes.push("<ul>");
    itens.forEach((item) => {
      const prazoLabel = formatarPrazoObraLegado(item.prazo);
      const corpo = escaparHtmlTexto(item.texto).replace(/\n/g, "<br>");
      const prazoHtml = prazoLabel
        ? `<br><em>Prazo: ${escaparHtmlTexto(prazoLabel)}</em>`
        : "";
      partes.push(`<li>${corpo}${prazoHtml}</li>`);
    });
    partes.push("</ul>");
  });
  return partes.join("");
}

/**
 * Normaliza conteúdo da modalidade obra para schema v3 (`resumo_geral` HTML).
 * Migra v2 (tópicos) e legado `{ observacoes }` automaticamente.
 */
export function normalizarConteudoObra(conteudo) {
  if (!conteudo || typeof conteudo !== "object") {
    return { versao: 3, resumo_geral: "" };
  }

  if (
    conteudo.versao === 3 ||
    typeof conteudo.resumo_geral === "string"
  ) {
    return {
      versao: 3,
      resumo_geral: String(conteudo.resumo_geral ?? ""),
    };
  }

  if (
    conteudo.versao === 2 &&
    conteudo.topicos &&
    typeof conteudo.topicos === "object"
  ) {
    return {
      versao: 3,
      resumo_geral: topicosV2ParaResumoHtml(conteudo.topicos),
    };
  }

  const legado = normalizarConteudo(conteudo);
  if (legado.observacoes?.trim()) {
    const texto = escaparHtmlTexto(legado.observacoes.trim()).replace(
      /\n/g,
      "<br>",
    );
    return { versao: 3, resumo_geral: `<p>${texto}</p>` };
  }

  return { versao: 3, resumo_geral: "" };
}

/** Serializa o HTML do resumo geral no schema v3. */
export function serializarConteudoObra(resumoGeral) {
  const html =
    typeof resumoGeral === "string"
      ? resumoGeral
      : String(resumoGeral?.resumo_geral ?? "");
  return {
    versao: 3,
    resumo_geral: resumoObraTemConteudo(html) ? html.trim() : "",
  };
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
  const { resumo_geral } = normalizarConteudoObra(conteudo);
  return resumoObraTemConteudo(resumo_geral);
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
 * @returns {Array<{ tipo: 'obra_html', id: string, titulo: string, html: string } | { tipo: 'prosa', id: string, titulo: string, texto: string } | { tipo: 'financeiro', ... }>}
 */
export function montarBlocosRelatorioCorrico(consolidado) {
  const blocos = [];
  const porModalidade = consolidado?.porModalidade || {};

  const lancamentoObra = porModalidade.obra;
  if (lancamentoObra) {
    const { resumo_geral } = normalizarConteudoObra(lancamentoObra.conteudo);
    if (resumoObraTemConteudo(resumo_geral)) {
      blocos.push({
        tipo: "obra_html",
        id: "obra",
        titulo: "Obra",
        html: resumo_geral,
      });
    }
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
