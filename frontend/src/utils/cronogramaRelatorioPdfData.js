/** Cores sólidas para etapas no PDF (mesma ordem do calendário na UI). */
export const CORES_ETAPA_PDF = [
  "#EA580C",
  "#2563EB",
  "#7C3AED",
  "#059669",
  "#D97706",
  "#DB2777",
  "#4F46E5",
];

const CORES_EVENTO_PDF = {
  "accent-primary": "#EA580C",
  "accent-blue": "#2563EB",
  "accent-purple": "#7C3AED",
  "accent-emerald": "#059669",
  "accent-amber": "#D97706",
  "accent-pink": "#DB2777",
  "accent-indigo": "#4F46E5",
  accent: "#EA580C",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
};

function compareIso(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function parseISODate(iso) {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

function fimEfetivoEvento(ev) {
  const ini = String(ev.data_evento).slice(0, 10);
  if (ev.data_fim == null || String(ev.data_fim).trim() === "") return ini;
  const f = String(ev.data_fim).slice(0, 10);
  return compareIso(f, ini) < 0 ? ini : f;
}

function eventoCobreDia(ev, dayIso) {
  const ini = String(ev.data_evento).slice(0, 10);
  const f = fimEfetivoEvento(ev);
  return compareIso(dayIso, ini) >= 0 && compareIso(dayIso, f) <= 0;
}

function fimEfetivoEtapa(etapa) {
  if (etapa.data_fim != null && String(etapa.data_fim).trim() !== "")
    return String(etapa.data_fim).slice(0, 10);
  if (etapa.data_conclusao) return String(etapa.data_conclusao).slice(0, 10);
  return null;
}

function getEtapaRangeIso(etapa, gridStartIso, gridEndIso) {
  const ini = etapa.data_inicio;
  if (!ini) return null;
  const startE = String(ini).slice(0, 10);
  const fimE = fimEfetivoEtapa(etapa);
  let endE = fimE ?? gridEndIso;
  if (compareIso(endE, startE) < 0) endE = startE;
  const s = compareIso(startE, gridStartIso) < 0 ? gridStartIso : startE;
  const e = compareIso(endE, gridEndIso) > 0 ? gridEndIso : endE;
  if (compareIso(s, e) > 0) return null;
  return { start: s, end: e };
}

function rawInicio(etapa) {
  if (!etapa.data_inicio) return null;
  return String(etapa.data_inicio).slice(0, 10);
}

function rawFim(etapa) {
  if (etapa.data_fim != null && String(etapa.data_fim).trim() !== "")
    return String(etapa.data_fim).slice(0, 10);
  if (etapa.data_conclusao) return String(etapa.data_conclusao).slice(0, 10);
  return null;
}

function isIsoInRange(dayIso, startIso, endIso) {
  return compareIso(dayIso, startIso) >= 0 && compareIso(dayIso, endIso) <= 0;
}

function classificarDiaNaEtapa(dayIso, etapa, range) {
  if (!isIsoInRange(dayIso, range.start, range.end)) return { papel: "fora" };
  const s = rawInicio(etapa);
  const f = rawFim(etapa);
  if (s && f) {
    if (dayIso === s && dayIso === f) return { papel: "ambos" };
    if (dayIso === s) return { papel: "inicio" };
    if (dayIso === f) return { papel: "fim" };
    if (compareIso(dayIso, s) > 0 && compareIso(dayIso, f) < 0)
      return { papel: "intermedio" };
    return { papel: "fora" };
  }
  if (s) {
    if (dayIso === s) return { papel: "inicio" };
    if (compareIso(dayIso, s) > 0) return { papel: "intermedio" };
  }
  return { papel: "fora" };
}

function rotuloBarraEtapa(papel, nome) {
  const n = String(nome || "").trim() || "Etapa";
  if (papel === "inicio") return `Início: ${n}`;
  if (papel === "fim") return `Fim: ${n}`;
  if (papel === "ambos") return `Início·Fim: ${n}`;
  return n;
}

function indicesCorEtapas(etapas) {
  const L = (etapas && etapas.length) || 0;
  const out = new Array(L);
  for (let i = 0; i < L; i++) {
    const raw = String(etapas[i]?.nome ?? i);
    let h = 0;
    for (let c = 0; c < raw.length; c++) h = (h * 31 + raw.charCodeAt(c)) >>> 0;
    let slot = h % 7;
    if (i > 0 && slot === out[i - 1]) slot = (slot + 1) % 7;
    if (i > 0 && slot === out[i - 1]) slot = (slot + 1) % 7;
    out[i] = slot;
  }
  return out;
}

function corEventoPdf(cor) {
  return CORES_EVENTO_PDF[cor] || CORES_EVENTO_PDF["accent-primary"];
}

function toISODateLocal(d) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/**
 * Monta payload serializável para RelatorioCronogramaPDF.
 */
export function montarDadosRelatorioCronograma({
  y,
  m,
  monthLabel,
  cells,
  gridStartIso,
  gridEndIso,
  etapas = [],
  eventos = [],
  obraInfo = {},
  diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
}) {
  const hojeIso = toISODateLocal(new Date());
  const etapaCorSlots = indicesCorEtapas(etapas);

  const etapasComRange = etapas
    .map((e, i) => {
      const range = getEtapaRangeIso(e, gridStartIso, gridEndIso);
      if (!range) return null;
      return { etapa: e, range, corSlot: etapaCorSlots[i] ?? 0 };
    })
    .filter(Boolean);

  const eventosNoMes = eventos.filter((ev) => {
    const ini = String(ev.data_evento).slice(0, 10);
    const f = fimEfetivoEvento(ev);
    return compareIso(f, gridStartIso) >= 0 && compareIso(ini, gridEndIso) <= 0;
  }).length;

  const diasCalendario = cells.map((dayIso) => {
    const d = parseISODate(dayIso);
    const inMonth = d.getMonth() === m;
    const itens = [];

    for (const er of etapasComRange) {
      const c = classificarDiaNaEtapa(dayIso, er.etapa, er.range);
      if (c.papel === "fora") continue;
      itens.push({
        texto: rotuloBarraEtapa(c.papel, er.etapa.nome),
        cor: CORES_ETAPA_PDF[er.corSlot] || CORES_ETAPA_PDF[0],
      });
    }

    for (const ev of eventos) {
      if (!eventoCobreDia(ev, dayIso)) continue;
      itens.push({
        texto: String(ev.titulo || "").trim() || "Evento",
        cor: corEventoPdf(ev.cor),
      });
    }

    return {
      dayIso,
      dayNum: d.getDate(),
      inMonth,
      hoje: hojeIso === dayIso,
      itens,
    };
  });

  const semanas = [];
  for (let i = 0; i < diasCalendario.length; i += 7) {
    semanas.push(diasCalendario.slice(i, i + 7));
  }

  const referenciaSlug = `${y}-${String(m + 1).padStart(2, "0")}`;

  return {
    referencia: monthLabel,
    referenciaSlug,
    obra: {
      cliente: obraInfo.cliente,
      local: obraInfo.local,
      endereco: obraInfo.endereco,
      tipoObra: obraInfo.tipoObra,
    },
    resumo: [
      { label: "Período", value: monthLabel },
      { label: "Etapas no mês", value: String(etapasComRange.length) },
      { label: "Eventos no mês", value: String(eventosNoMes) },
    ],
    diasSemana: diasSemana.map((d) => String(d).toUpperCase()),
    semanas,
  };
}
