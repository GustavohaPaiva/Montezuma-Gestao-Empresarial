import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  forwardRef,
} from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import BaseModal from "../gerais/BaseModal";
import FeedbackModal from "../gerais/FeedbackModal";

function toISODateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Início da semana (domingo 00:00) que contém `date` */
function startOfWeekSun(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/**
 * Grelha fixa 5×7 (35 células): semana a começar ao domingo.
 * Meses que exigiriam 6 linhas podem omitir o último dia no viewport.
 */
function getMonthGridRange(year, month) {
  const first = new Date(year, month, 1);
  const start = startOfWeekSun(first);
  const end = new Date(start);
  end.setDate(end.getDate() + 34);
  return { start, end };
}

function compareIso(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function minIso(a, b) {
  return compareIso(a, b) < 0 ? a : b;
}
function maxIso(a, b) {
  return compareIso(a, b) > 0 ? a : b;
}

/** Alinha a bigint; UUID permanece string */
function toObraIdForDb(obraId) {
  if (obraId == null || obraId === "") return null;
  const s = String(obraId).trim();
  if (/^\d+$/.test(s)) return Number(s);
  return s;
}

/**
 * Etapas: `ultra` = fundo do dia; `barSolid` = marcos no calendário (alto contraste).
 * Eventos manuais: `barClassEvento` via corParaBarraEvento (alinhado a accent-* / legado).
 */
const ETAPA_ACCENT = [
  {
    ultra: "bg-orange-500/12",
    barSolid:
      "w-full min-w-0 rounded-lg border-0 bg-orange-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
    dot: "bg-white shadow-sm ring-1 ring-orange-900/20",
  },
  {
    ultra: "bg-blue-500/12",
    barSolid:
      "w-full min-w-0 rounded-lg border-0 bg-blue-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
    dot: "bg-white shadow-sm ring-1 ring-blue-900/20",
  },
  {
    ultra: "bg-purple-500/12",
    barSolid:
      "w-full min-w-0 rounded-lg border-0 bg-purple-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
    dot: "bg-white shadow-sm ring-1 ring-purple-900/20",
  },
  {
    ultra: "bg-emerald-500/12",
    barSolid:
      "w-full min-w-0 rounded-lg border-0 bg-emerald-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
    dot: "bg-white shadow-sm ring-1 ring-emerald-900/20",
  },
  {
    ultra: "bg-amber-500/12",
    barSolid:
      "w-full min-w-0 rounded-lg border-0 bg-amber-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
    dot: "bg-white shadow-sm ring-1 ring-amber-900/20",
  },
  {
    ultra: "bg-pink-500/12",
    barSolid:
      "w-full min-w-0 rounded-lg border-0 bg-pink-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
    dot: "bg-white shadow-sm ring-1 ring-pink-900/20",
  },
  {
    ultra: "bg-indigo-500/12",
    barSolid:
      "w-full min-w-0 rounded-lg border-0 bg-indigo-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
    dot: "bg-white shadow-sm ring-1 ring-indigo-900/20",
  },
];

/** Cores consecutivas na lista de etapas nunca coincidem (desempate com +1). */
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

const EVENT_BAR_SOLID = {
  "accent-primary":
    "w-full min-w-0 rounded-lg border-0 bg-orange-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  "accent-blue":
    "w-full min-w-0 rounded-lg border-0 bg-blue-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  "accent-purple":
    "w-full min-w-0 rounded-lg border-0 bg-purple-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  "accent-emerald":
    "w-full min-w-0 rounded-lg border-0 bg-emerald-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  "accent-amber":
    "w-full min-w-0 rounded-lg border-0 bg-amber-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  "accent-pink":
    "w-full min-w-0 rounded-lg border-0 bg-pink-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  "accent-indigo":
    "w-full min-w-0 rounded-lg border-0 bg-indigo-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  accent:
    "w-full min-w-0 rounded-lg border-0 bg-orange-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  success:
    "w-full min-w-0 rounded-lg border-0 bg-emerald-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  warning:
    "w-full min-w-0 rounded-lg border-0 bg-amber-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
  danger:
    "w-full min-w-0 rounded-lg border-0 bg-rose-600 px-1.5 py-1 text-left text-[7px] font-bold leading-tight text-white shadow-sm ring-1 ring-black/20 sm:px-2 sm:text-[8px]",
};

function corParaBarraEvento(cor) {
  if (cor && EVENT_BAR_SOLID[cor]) return EVENT_BAR_SOLID[cor];
  return EVENT_BAR_SOLID["accent-primary"];
}

const ACCENT_AUTO_KEYS = [
  "accent-primary",
  "accent-blue",
  "accent-purple",
  "accent-emerald",
  "accent-amber",
  "accent-pink",
  "accent-indigo",
];

/** Mapeia string estável (data+título+contador) para uma das 7 cores accent */
function corAutomaticaEvento(seed) {
  const s = String(seed ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return ACCENT_AUTO_KEYS[h % ACCENT_AUTO_KEYS.length];
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

function isIsoInRange(dayIso, startIso, endIso) {
  return compareIso(dayIso, startIso) >= 0 && compareIso(dayIso, endIso) <= 0;
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

/** "Início" / "Fim" / "Início·Fim" / intermédio / fora do intervalo */
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

/** Rótulo na barra sólida do calendário (início, fim, dias intermédios). */
function rotuloBarraEtapa(papel, nome) {
  const n = String(nome || "").trim() || "Etapa";
  if (papel === "inicio") return `Início: ${n}`;
  if (papel === "fim") return `Fim: ${n}`;
  if (papel === "ambos") return `Início·Fim: ${n}`;
  return n;
}

const CronogramaObra = forwardRef(function CronogramaObra(
  { etapas = [], obraId, showLancarButton = true },
  ref,
) {
  const { user } = useAuth();
  const now = new Date();
  const [y, setY] = useState(now.getFullYear());
  const [m, setM] = useState(now.getMonth());
  const [weekStart, setWeekStart] = useState(() => startOfWeekSun(now));

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalDia, setModalDia] = useState(null);
  const [lancamentoAberto, setLancamentoAberto] = useState(false);
  const [lancData, setLancData] = useState(() => toISODateLocal(new Date()));
  const [lancTitulo, setLancTitulo] = useState("");
  const [lancDesc, setLancDesc] = useState("");
  const [lancDataFim, setLancDataFim] = useState("");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    variant: "error",
  });

  const showFeedback = useCallback((message, variant = "error") => {
    setFeedback({ open: true, message, variant });
  }, []);

  const { gridStartIso, gridEndIso, cells, monthLabel } = useMemo(() => {
    const { start, end: gridEnd } = getMonthGridRange(y, m);
    const startIso = toISODateLocal(start);
    const endIso = toISODateLocal(gridEnd);
    const list = [];
    const cur = new Date(start);
    for (let i = 0; i < 35; i++) {
      list.push(toISODateLocal(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return {
      gridStartIso: startIso,
      gridEndIso: endIso,
      cells: list,
      monthLabel: new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
      }).format(new Date(y, m, 1)),
    };
  }, [y, m]);

  const weekCells = useMemo(() => {
    const list = [];
    const c = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      list.push(toISODateLocal(c));
      c.setDate(c.getDate() + 1);
    }
    return list;
  }, [weekStart]);

  const weekStartIso = weekCells[0];
  const weekEndIso = weekCells[6];

  /** Janela de API: cobre a grelha mensal e a semana atual (visível em < md e ≥ md). */
  const { fetchDe, fetchAte } = useMemo(
    () => ({
      fetchDe: minIso(gridStartIso, weekStartIso),
      fetchAte: maxIso(gridEndIso, weekEndIso),
    }),
    [gridStartIso, gridEndIso, weekStartIso, weekEndIso],
  );

  const fetchRange = useCallback(
    async (de, ate) => {
      if (obraId == null || String(obraId) === "") {
        setEventos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const rows = await api.getCronogramaEventos(obraId, de, ate);
        setEventos(rows);
      } catch (e) {
        console.error("[CronogramaObra] fetch", e);
        setEventos([]);
      } finally {
        setLoading(false);
      }
    },
    [obraId],
  );

  useEffect(() => {
    fetchRange(fetchDe, fetchAte);
  }, [fetchDe, fetchAte, fetchRange]);

  const diasTotaisAgenda = useMemo(() => {
    const s = new Set([...cells, ...weekCells]);
    return Array.from(s).sort(compareIso);
  }, [cells, weekCells]);

  const eventosPorDia = useMemo(() => {
    const map = new Map();
    for (const dayIso of diasTotaisAgenda) {
      const list = eventos.filter((ev) => eventoCobreDia(ev, dayIso));
      if (list.length) map.set(dayIso, list);
    }
    return map;
  }, [eventos, diasTotaisAgenda]);

  const etapaCorSlots = useMemo(() => indicesCorEtapas(etapas || []), [etapas]);

  const buildEtapasComRange = useCallback(
    (gStart, gEnd) => {
      return (etapas || [])
        .map((e, i) => {
          const r = getEtapaRangeIso(e, gStart, gEnd);
          if (!r) return null;
          const corSlot = etapaCorSlots[i] ?? 0;
          return { etapa: e, range: r, corSlot, vis: ETAPA_ACCENT[corSlot] };
        })
        .filter(Boolean);
    },
    [etapas, etapaCorSlots],
  );

  const etapasComRangeMensal = useMemo(
    () => buildEtapasComRange(gridStartIso, gridEndIso),
    [buildEtapasComRange, gridStartIso, gridEndIso],
  );
  const etapasComRangeSemanal = useMemo(
    () => buildEtapasComRange(weekStartIso, weekEndIso),
    [buildEtapasComRange, weekStartIso, weekEndIso],
  );
  const etapasComRangeModal = useMemo(
    () => buildEtapasComRange(fetchDe, fetchAte),
    [buildEtapasComRange, fetchDe, fetchAte],
  );

  const etapasVigentesNoDia = (dayIso) =>
    etapasComRangeModal.filter(({ range }) =>
      isIsoInRange(dayIso, range.start, range.end),
    );

  const eventosNoModalDia = useMemo(() => {
    if (!modalDia) return [];
    return eventos.filter((ev) => eventoCobreDia(ev, modalDia));
  }, [eventos, modalDia]);

  const abrirLancamento = useCallback(() => {
    setLancData(toISODateLocal(new Date()));
    setLancTitulo("");
    setLancDesc("");
    setLancDataFim("");
    setLancamentoAberto(true);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      abrirLancamento,
    }),
    [abrirLancamento],
  );

  const salvarEvento = async (e) => {
    e?.preventDefault?.();
    if (!obraId) return;
    if (!user?.id) {
      showFeedback("É necessário iniciar sessão para lançar no cronograma.");
      return;
    }
    const t = String(lancTitulo || "").trim();
    if (!t) return;
    const obraIdValue = toObraIdForDb(obraId);
    if (obraIdValue == null) {
      showFeedback("Obra inválida.");
      return;
    }
    const fimStr = String(lancDataFim || "").trim();
    let dataFimVal = null;
    if (fimStr) {
      if (compareIso(fimStr, lancData) < 0) {
        showFeedback("A data de fim não pode ser anterior à data de início.");
        return;
      }
      dataFimVal = fimStr;
    }
    const corAtribuida = corAutomaticaEvento(
      `${lancData}|${t}|${eventos.length}`,
    );
    const payload = {
      obra_id: obraIdValue,
      titulo: t,
      descricao: String(lancDesc || "").trim() || null,
      data_evento: lancData,
      data_fim: dataFimVal,
      user_id: String(user.id),
      cor: corAtribuida,
    };
    try {
      const novo = await api.addCronogramaEvento(payload);
      setEventos((prev) =>
        [...prev, novo].sort((a, b) =>
          compareIso(a.data_evento, b.data_evento),
        ),
      );
      setLancamentoAberto(false);
    } catch (err) {
      console.error(err);
      showFeedback(
        err?.message
          ? `Não foi possível salvar: ${err.message}`
          : "Não foi possível salvar o evento.",
      );
    }
  };

  const excluirEvento = async (id) => {
    if (!window.confirm("Excluir este evento?")) return;
    try {
      await api.deleteCronogramaEvento(id);
      setEventos((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err) {
      console.error(err);
      showFeedback("Não foi possível excluir.");
    }
  };

  const prevMonth = () => {
    if (m === 0) {
      setM(11);
      setY((a) => a - 1);
    } else setM(m - 1);
  };
  const nextMonth = () => {
    if (m === 11) {
      setM(0);
      setY((a) => a + 1);
    } else setM(m + 1);
  };

  const prevWeek = () => {
    setWeekStart((s) => {
      const d = new Date(s);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };
  const nextWeek = () => {
    setWeekStart((s) => {
      const d = new Date(s);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };
  const goTodayWeek = () => setWeekStart(startOfWeekSun(new Date()));

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const formatarDiaPt = (iso) =>
    new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
    }).format(parseISODate(iso));

  return (
    <section className="w-full mx-auto mb-4 rounded-2xl border border-border-primary/50 bg-surface-alt p-3 shadow-sm ring-1 ring-slate-200/40 sm:mb-6 sm:p-5 md:p-6">
      <div className="mb-4 flex flex-col md:flex-row gap-4 border-b border-slate-200/50 pb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-[22px]">
            Cronograma da obra
          </h2>
          <p className="mt-0.5 text-sm tracking-tight text-slate-600">
            Etapas e eventos no mesmo calendário.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            <div className="hidden w-full items-center justify-end gap-2 md:flex md:w-auto">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50"
                aria-label="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[160px] text-center text-sm font-semibold capitalize tracking-tight text-slate-800">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50"
                aria-label="Próximo mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end md:hidden">
              <button
                type="button"
                onClick={prevWeek}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-800 shadow-sm"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[180px] text-center text-xs font-semibold tracking-tight text-slate-800">
                {formatarDiaPt(weekStartIso)} – {formatarDiaPt(weekEndIso)}
              </span>
              <button
                type="button"
                onClick={nextWeek}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-800 shadow-sm"
                aria-label="Próxima semana"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={goTodayWeek}
                className="rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm"
              >
                Hoje
              </button>
            </div>
          </div>
          {showLancarButton && (
            <div className="flex w-full md:justify-end">
              <button
                type="button"
                onClick={abrirLancamento}
                className="w-full min-w-[248px] rounded-lg border border-accent-primary bg-accent-primary px-4 py-2 text-sm font-semibold tracking-tight text-white shadow-sm transition hover:bg-accent-primary-dark md:w-auto"
              >
                Lançar no Cronograma
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && <p className="text-sm text-slate-600">A carregar eventos…</p>}

      {!loading && (
        <div className="hidden overflow-hidden rounded-2xl border border-border-primary/40 bg-white p-1.5 shadow-md shadow-slate-300/30 ring-1 ring-slate-200/50 sm:p-2 md:block">
          {/* Cabeçalho separado: destaque e colado à grelha de dias (evita “salto” visual) */}
          <div className="mb-0 grid grid-cols-7 overflow-hidden rounded-t-xl border border-b-0 border-slate-200/80 bg-accent-primary text-white shadow-sm">
            {diasSemana.map((nome) => (
              <div
                key={nome}
                className="border-r border-accent-primary-600 px-0.5 py-2.5 text-center last:border-r-0 sm:py-3"
              >
                <span className="block text-[10px] font-bold uppercase leading-tight tracking-wider sm:text-xs">
                  {nome}
                </span>
              </div>
            ))}
          </div>
          {/* 5 semanas x 7 colunas; domingo = primeira coluna */}
          <div className="grid grid-cols-7 grid-rows-5 gap-px rounded-b-xl border border-slate-200/80 bg-slate-200/60 p-px sm:gap-0.5">
            {cells.map((dayIso) => {
              const d = parseISODate(dayIso);
              const inMonth = d.getMonth() === m;
              const hoje = toISODateLocal(new Date()) === dayIso;
              const listEv = eventosPorDia.get(dayIso) || [];
              const barrasEtapas = etapasComRangeMensal
                .map((er) => {
                  const c = classificarDiaNaEtapa(dayIso, er.etapa, er.range);
                  if (c.papel === "fora") return null;
                  return {
                    papel: c.papel,
                    etapa: er.etapa,
                    vis: er.vis,
                  };
                })
                .filter(Boolean);

              return (
                <button
                  key={dayIso}
                  type="button"
                  onClick={() => setModalDia(dayIso)}
                  className={[
                    "flex min-h-[100px] mt-2 flex-col overflow-hidden rounded-md border border-slate-200/50 bg-white p-0 text-left transition hover:bg-slate-50/80 sm:min-h-[112px] sm:rounded-lg",
                    !inMonth ? "bg-slate-50/90 opacity-50" : "",
                    hoje
                      ? "z-[1] ring-2 ring-accent-primary/50 ring-offset-0"
                      : "shadow-sm",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex shrink-0 items-center justify-end border-b border-slate-200/80 px-1.5 py-0.5 sm:px-2 sm:py-1",
                      hoje
                        ? "bg-orange-50 font-bold text-accent-primary"
                        : inMonth
                          ? "bg-slate-50"
                          : "bg-slate-100/60",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "tabular-nums",
                        hoje
                          ? "text-sm font-bold sm:text-base"
                          : "text-xs font-bold text-slate-800 sm:text-sm",
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col items-stretch justify-center gap-1 px-0.5 py-1 sm:px-1 sm:py-1.5">
                    {barrasEtapas.map((M, i) => (
                      <span
                        key={`${M.etapa.nome}-${M.papel}-${i}`}
                        className={[M.vis.barSolid, "max-w-full truncate"].join(
                          " ",
                        )}
                        title={M.etapa.nome}
                      >
                        {rotuloBarraEtapa(M.papel, M.etapa.nome)}
                      </span>
                    ))}
                    {listEv.map((ev) => (
                      <span
                        key={ev.id}
                        className={[
                          "max-w-full min-w-0 truncate",
                          corParaBarraEvento(ev.cor),
                        ].join(" ")}
                        title={ev.titulo}
                      >
                        {ev.titulo}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!loading && (
        <div className="overflow-hidden rounded-2xl border border-border-primary/40 bg-white p-2 shadow-md shadow-slate-300/30 ring-1 ring-slate-200/50 md:hidden">
          <div className="flex flex-col gap-1.5">
            {weekCells.map((dayIso) => {
              const d2 = parseISODate(dayIso);
              const hoje = toISODateLocal(new Date()) === dayIso;
              const listEv = eventosPorDia.get(dayIso) || [];
              const barrasEtapas = etapasComRangeSemanal
                .map((er) => {
                  const c = classificarDiaNaEtapa(dayIso, er.etapa, er.range);
                  if (c.papel === "fora") return null;
                  return {
                    papel: c.papel,
                    etapa: er.etapa,
                    vis: er.vis,
                  };
                })
                .filter(Boolean);
              const temConteudo = barrasEtapas.length > 0 || listEv.length > 0;

              return (
                <button
                  key={dayIso}
                  type="button"
                  onClick={() => setModalDia(dayIso)}
                  className={[
                    "relative w-full text-left",
                    "flex min-h-[52px] flex-col gap-1.5 rounded-xl border border-slate-200/40 bg-white p-2.5 shadow-sm transition active:scale-[0.99] sm:min-h-0",
                    hoje ? "ring-1 ring-slate-300/50" : "",
                  ].join(" ")}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="min-w-0 pr-1">
                      <p className="text-[10px] font-bold uppercase leading-tight tracking-widest text-slate-500 sm:text-[11px]">
                        {diasSemana[d2.getDay()]}
                      </p>
                      <p className="mt-0.5 text-left text-sm font-bold tabular-nums text-slate-900 sm:text-base">
                        {d2.getDate()}{" "}
                        <span className="font-semibold text-slate-600">
                          {new Intl.DateTimeFormat("pt-BR", {
                            month: "short",
                          }).format(d2)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex min-h-0 w-full flex-col items-stretch justify-center gap-1 py-0.5">
                    {barrasEtapas.map((M, i) => (
                      <span
                        key={`${M.etapa.nome}-${M.papel}-m${i}`}
                        className={[M.vis.barSolid, "max-w-full truncate"].join(
                          " ",
                        )}
                        title={M.etapa.nome}
                      >
                        {rotuloBarraEtapa(M.papel, M.etapa.nome)}
                      </span>
                    ))}
                    {listEv.map((ev) => (
                      <span
                        key={ev.id}
                        className={[
                          "max-w-full min-w-0 truncate",
                          corParaBarraEvento(ev.cor),
                        ].join(" ")}
                        title={ev.titulo}
                      >
                        {ev.titulo}
                      </span>
                    ))}
                    {!temConteudo && (
                      <p className="text-[8px] tracking-tight text-slate-400">
                        Vazio
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <BaseModal
        isOpen={modalDia != null}
        onClose={() => setModalDia(null)}
        title={
          modalDia
            ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
                parseISODate(modalDia),
              )
            : ""
        }
        size="full"
        contentPaddingClass="p-6 sm:p-8"
      >
        {modalDia && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-tight text-slate-500">
                Etapas neste período
              </h3>
              {etapasVigentesNoDia(modalDia).length === 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  Nenhuma etapa ativa.
                </p>
              )}
              <ul className="mt-2 space-y-2">
                {etapasVigentesNoDia(modalDia).map(({ etapa, vis }) => {
                  return (
                    <li
                      key={etapa.nome}
                      className={[
                        "flex items-start gap-2 rounded-2xl border border-slate-200/50 bg-white px-3 py-2.5 shadow-sm",
                        vis.ultra,
                      ].join(" ")}
                    >
                      <span
                        className={`mt-0.5 h-3 w-1 shrink-0 rounded-full ${vis.dot}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate font-semibold tracking-tight text-slate-900"
                          title={etapa.nome}
                        >
                          {etapa.nome}
                        </p>
                        {(etapa.data_inicio || rawFim(etapa)) && (
                          <p className="text-xs text-slate-600">
                            {etapa.data_inicio &&
                              `Início: ${etapa.data_inicio}`}
                            {etapa.data_inicio && rawFim(etapa) ? " · " : ""}
                            {rawFim(etapa) &&
                              `${
                                etapa.data_fim != null &&
                                String(etapa.data_fim).trim() !== ""
                                  ? "Fim"
                                  : "Conclusão"
                              }: ${rawFim(etapa)}`}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-tight text-slate-500">
                Eventos manuais
              </h3>
              {eventosNoModalDia.length === 0 && (
                <p className="mt-2 text-sm text-slate-600">Nenhum evento.</p>
              )}
              <ul className="mt-2 space-y-2">
                {eventosNoModalDia.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start justify-between gap-2 rounded-2xl border border-slate-200/60 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <span
                        className={[
                          "mb-1 block w-full max-w-full truncate rounded-md px-2 py-1 text-xs font-bold tracking-tight",
                          corParaBarraEvento(ev.cor),
                        ].join(" ")}
                        title={ev.titulo}
                      >
                        {ev.titulo}
                      </span>
                      {ev.data_fim &&
                        String(ev.data_fim).slice(0, 10) !==
                          String(ev.data_evento).slice(0, 10) && (
                          <p className="text-[11px] font-medium text-slate-500">
                            {String(ev.data_evento).slice(0, 10)} →{" "}
                            {String(ev.data_fim).slice(0, 10)}
                          </p>
                        )}
                      {ev.descricao && (
                        <p className="text-xs text-slate-600">{ev.descricao}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => excluirEvento(ev.id)}
                      className="shrink-0 p-1.5 text-slate-500 transition hover:text-rose-600"
                      aria-label="Excluir evento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </BaseModal>

      <BaseModal
        isOpen={lancamentoAberto}
        onClose={() => setLancamentoAberto(false)}
        title="Lançar no cronograma"
        size="full"
        contentPaddingClass="p-6 sm:p-8"
      >
        <form className="space-y-4 tracking-tight" onSubmit={salvarEvento}>
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-tight text-text-muted"
              htmlFor="cronograma-data"
            >
              Data
            </label>
            <input
              id="cronograma-data"
              type="date"
              value={lancData}
              onChange={(e) => setLancData(e.target.value)}
              className="w-full rounded-2xl border border-border-primary bg-surface-alt px-4 py-3 text-sm font-medium text-text-primary transition focus:border-accent-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-tight text-text-muted"
              htmlFor="cronograma-data-fim"
            >
              Data de fim
            </label>
            <input
              id="cronograma-data-fim"
              type="date"
              value={lancDataFim}
              onChange={(e) => setLancDataFim(e.target.value)}
              min={lancData}
              className="w-full rounded-2xl border border-border-primary bg-surface-alt px-4 py-3 text-sm font-medium text-text-primary transition focus:border-accent-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-tight text-text-muted"
              htmlFor="cronograma-titulo"
            >
              Título
            </label>
            <input
              id="cronograma-titulo"
              type="text"
              value={lancTitulo}
              onChange={(e) => setLancTitulo(e.target.value)}
              className="w-full rounded-2xl border border-border-primary bg-surface-alt px-4 py-3 text-sm text-text-primary transition focus:border-accent-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
              placeholder="Ex.: reunião de vistoria"
            />
          </div>
          <div>
            <label
              htmlFor="cronograma-desc"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-tight text-text-muted"
            >
              Descrição
            </label>
            <textarea
              id="cronograma-desc"
              value={lancDesc}
              onChange={(e) => setLancDesc(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-2xl border border-border-primary bg-surface-alt px-4 py-3 text-sm text-text-primary transition focus:border-accent-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
              placeholder="Detalhes opcionais…"
            />
          </div>
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={!String(lancTitulo).trim()}
              className="h-10 w-full rounded-xl border border-accent-primary-dark/20 bg-accent-primary px-4 text-sm font-semibold tracking-tight text-white shadow-sm shadow-accent-primary/25 transition enabled:hover:bg-accent-primary-dark enabled:hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              Guardar evento
            </button>
            <button
              type="button"
              onClick={() => setLancamentoAberto(false)}
              className="h-10 w-full text-sm font-medium border border-border-primary rounded-xl text-text-muted underline-offset-2 hover:text-text-primary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </BaseModal>

      <FeedbackModal
        isOpen={feedback.open}
        onClose={() => setFeedback((f) => ({ ...f, open: false, message: "" }))}
        message={feedback.message}
        variant={feedback.variant}
      />
    </section>
  );
});

export default CronogramaObra;
