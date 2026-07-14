import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  User,
} from "lucide-react";
import { api } from "../../services/api";
import { ESCRITORIO_NOME_POR_ID } from "../../constants/escritorios";
import { useEscritorioIdFromPath } from "../../hooks/useEscritorioIdFromPath";
import ModalCompromissoEscritorio from "../../components/modals/ModalCompromissoEscritorio";
import ModalConfirmacaoRecorrencia from "../../components/modals/ModalConfirmacaoRecorrencia";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const TIPO_COR = {
  Reunião: "bg-esc-tipo-reuniao",
  Reuniao: "bg-esc-tipo-reuniao",
  Visita: "bg-esc-tipo-visita",
  "Comprar Material": "bg-esc-tipo-comprar",
};

function normalizarTipo(raw) {
  if (!raw) return "";
  const s = String(raw).trim().replace(/\s+/g, " ");
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function corDoTipo(tipo) {
  const t = normalizarTipo(tipo);
  return TIPO_COR[t] || "bg-esc-tipo-outro";
}

function badgeTipoClasses(tipo) {
  const t = normalizarTipo(tipo).toLowerCase();
  if (t.includes("reuni"))
    return "border-esc-tipo-reuniao/40 bg-esc-tipo-reuniao/15 text-esc-tipo-reuniao";
  if (t === "visita")
    return "border-esc-tipo-visita/40 bg-esc-tipo-visita/15 text-esc-tipo-visita";
  if (t.includes("comprar") || t.includes("material"))
    return "border-esc-tipo-comprar/40 bg-esc-tipo-comprar/15 text-esc-tipo-comprar";
  return "border-esc-tipo-outro/40 bg-esc-tipo-outro/15 text-esc-tipo-outro";
}

function badgeStatusClasses(status) {
  const s = String(status || "").toLowerCase();
  if (s === "realizado")
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (s === "cancelado")
    return "border-rose-300 bg-rose-50 text-rose-700";
  return "border-esc-border bg-esc-bg text-esc-muted";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}
function isoDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfGrid(d) {
  const first = startOfMonth(d);
  const copy = new Date(first);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}
function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}
function mesmaData(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function tituloMes(d) {
  const raw = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
function horaBR(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const MAX_CHIPS_POR_DIA = 3;

function combinarDiaComHorarioDoCompromisso(diaAlvo, dataHoraIso) {
  const orig = new Date(dataHoraIso);
  if (Number.isNaN(orig.getTime())) return null;
  const novo = new Date(
    diaAlvo.getFullYear(),
    diaAlvo.getMonth(),
    diaAlvo.getDate(),
    orig.getHours(),
    orig.getMinutes(),
    0,
    0,
  );
  if (Number.isNaN(novo.getTime())) return null;
  return novo.toISOString();
}

function bordaEsquerdaTipo(tipo) {
  const t = normalizarTipo(tipo).toLowerCase();
  if (t.includes("reuni")) return "border-l-esc-tipo-reuniao";
  if (t === "visita") return "border-l-esc-tipo-visita";
  if (t.includes("comprar") || t.includes("material"))
    return "border-l-esc-tipo-comprar";
  return "border-l-esc-tipo-outro";
}

export default function AgendaEscritorio() {
  const navigate = useNavigate();
  const escritorioId = useEscritorioIdFromPath();
  const nomeEscritorio = ESCRITORIO_NOME_POR_ID[escritorioId] ?? "Escritório";

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [mesVisivel, setMesVisivel] = useState(() => startOfMonth(new Date()));
  const [diaSelecionado, setDiaSelecionado] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [compromissoEdicao, setCompromissoEdicao] = useState(null);
  const [escopoEdicao, setEscopoEdicao] = useState("evento");
  const [acaoId, setAcaoId] = useState(null);
  const [acaoRecorrencia, setAcaoRecorrencia] = useState(null);
  const [arrastandoId, setArrastandoId] = useState(null);
  const [diaSobreDrop, setDiaSobreDrop] = useState(null);
  const [movendoId, setMovendoId] = useState(null);
  const [miniCalAberto, setMiniCalAberto] = useState(false);
  const [miniCalAno, setMiniCalAno] = useState(() => new Date().getFullYear());
  const miniCalRef = useRef(null);
  const miniCalAnchorRef = useRef(null);

  useEffect(() => {
    if (!miniCalAberto) return;
    const handleClick = (e) => {
      if (
        miniCalRef.current &&
        !miniCalRef.current.contains(e.target) &&
        miniCalAnchorRef.current &&
        !miniCalAnchorRef.current.contains(e.target)
      ) {
        setMiniCalAberto(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setMiniCalAberto(false);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [miniCalAberto]);

  useEffect(() => {
    setMiniCalAno(mesVisivel.getFullYear());
  }, [mesVisivel]);

  const abrirMiniCal = () => {
    setMiniCalAno(mesVisivel.getFullYear());
    setMiniCalAberto((v) => !v);
  };

  const selecionarMesAno = (mes, ano) => {
    setMesVisivel(new Date(ano, mes, 1));
    setMiniCalAberto(false);
  };

  const inicioIso = useMemo(() => {
    const d = startOfGrid(mesVisivel);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, [mesVisivel]);

  const fimIso = useMemo(() => {
    const d = addDays(startOfGrid(mesVisivel), 41);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }, [mesVisivel]);

  const carregar = useCallback(async () => {
    if (!escritorioId) return;
    setLoading(true);
    setErro(null);
    try {
      const dados = await api.getAgenda(escritorioId, inicioIso, fimIso);
      setItems(Array.isArray(dados) ? dados : []);
    } catch (e) {
      console.error("[AgendaEscritorio] carregar:", e);
      setErro(e?.message || "Não foi possível carregar a agenda.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [escritorioId, inicioIso, fimIso]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const cells = useMemo(() => {
    const inicio = startOfGrid(mesVisivel);
    return Array.from({ length: 42 }, (_, i) => addDays(inicio, i));
  }, [mesVisivel]);

  const porDia = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const d = new Date(it.data_hora);
      if (Number.isNaN(d.getTime())) continue;
      const key = isoDate(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return map;
  }, [items]);

  const itensDoDia = useMemo(() => {
    const key = isoDate(diaSelecionado);
    const lista = porDia.get(key) || [];
    return [...lista].sort((a, b) =>
      String(a.data_hora).localeCompare(String(b.data_hora)),
    );
  }, [porDia, diaSelecionado]);

  const irProMesHoje = () => {
    const agora = new Date();
    agora.setHours(0, 0, 0, 0);
    setMesVisivel(startOfMonth(agora));
    setDiaSelecionado(agora);
  };

  const abrirNovo = () => {
    setCompromissoEdicao(null);
    setModalAberto(true);
  };

  const abrirEdicao = (item) => {
    if (item?.grupo_recorrencia_id) {
      setAcaoRecorrencia({ tipo: "editar", item });
      return;
    }
    setCompromissoEdicao(item);
    setEscopoEdicao("evento");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setCompromissoEdicao(null);
  };

  const onSaved = () => {
    void carregar();
  };

  const mudarStatus = async (item, novoStatus) => {
    if (!item?.id) return;
    if (item?.grupo_recorrencia_id) {
      setAcaoRecorrencia({ tipo: "status", item, novoStatus });
      return;
    }
    setAcaoId(`status:${item.id}`);
    try {
      await api.updateCompromisso(
        item.id,
        { status: novoStatus },
        escritorioId,
      );
      void carregar();
    } catch (e) {
      console.error(e);
    } finally {
      setAcaoId(null);
    }
  };

  const excluirSomenteItem = async (item) => {
    if (!item?.id) return;
    setAcaoId(`del:${item.id}`);
    try {
      await api.deleteCompromisso(item.id, escritorioId);
      void carregar();
    } catch (e) {
      console.error(e);
    } finally {
      setAcaoId(null);
    }
  };

  const excluir = async (item) => {
    if (!item?.id) return;
    if (item?.grupo_recorrencia_id) {
      setAcaoRecorrencia({ tipo: "excluir", item });
      return;
    }
    await excluirSomenteItem(item);
  };

  const moverCompromissoParaDia = useCallback(
    async (item, diaDestino) => {
      if (!item?.id || !diaDestino) return;
      const origem = new Date(item.data_hora);
      if (Number.isNaN(origem.getTime())) return;
      if (mesmaData(origem, diaDestino)) return;

      const novaDataHora = combinarDiaComHorarioDoCompromisso(
        diaDestino,
        item.data_hora,
      );
      if (!novaDataHora) return;

      setMovendoId(item.id);
      const anterior = item.data_hora;
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, data_hora: novaDataHora } : it,
        ),
      );

      try {
        await api.updateCompromisso(
          item.id,
          { data_hora: novaDataHora },
          escritorioId,
        );
        const destino = new Date(diaDestino);
        destino.setHours(0, 0, 0, 0);
        setDiaSelecionado(destino);
        if (destino.getMonth() !== mesVisivel.getMonth()) {
          setMesVisivel(startOfMonth(destino));
        }
      } catch (e) {
        console.error("[AgendaEscritorio] mover:", e);
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, data_hora: anterior } : it,
          ),
        );
      } finally {
        setMovendoId(null);
      }
    },
    [escritorioId, mesVisivel],
  );

  const iniciarArraste = (e, item) => {
    if (movendoId) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setArrastandoId(item.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(item.id));
    if (e.dataTransfer.setDragImage && e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 8, 12);
    }
  };

  const finalizarArraste = () => {
    setArrastandoId(null);
    setDiaSobreDrop(null);
  };

  const soltarNoDia = async (e, diaDestino) => {
    e.preventDefault();
    e.stopPropagation();
    setDiaSobreDrop(null);
    setArrastandoId(null);

    const rawId = e.dataTransfer.getData("text/plain");
    if (!rawId) return;
    const item = items.find((it) => String(it.id) === rawId);
    if (!item) return;

    const origem = new Date(item.data_hora);
    if (mesmaData(origem, diaDestino)) return;

    await moverCompromissoParaDia(item, diaDestino);
  };

  const executarAcaoRecorrencia = async (escopo) => {
    if (!acaoRecorrencia?.item?.id) return;
    const item = acaoRecorrencia.item;

    if (acaoRecorrencia.tipo === "editar") {
      setEscopoEdicao(escopo);
      setCompromissoEdicao(item);
      setModalAberto(true);
      setAcaoRecorrencia(null);
      return;
    }

    const acaoPrefixo = acaoRecorrencia.tipo === "status" ? "status" : "del";
    setAcaoId(`${acaoPrefixo}:${item.id}`);
    try {
      if (acaoRecorrencia.tipo === "status") {
        if (escopo === "futuros") {
          await api.updateCompromissosFuturos(
            item.grupo_recorrencia_id,
            item.data_hora,
            { status: acaoRecorrencia.novoStatus },
            escritorioId,
          );
        } else {
          await api.updateCompromisso(
            item.id,
            { status: acaoRecorrencia.novoStatus },
            escritorioId,
          );
        }
      } else if (escopo === "futuros") {
        await api.deleteCompromissosFuturos(
          item.grupo_recorrencia_id,
          item.data_hora,
          escritorioId,
        );
      } else {
        await api.deleteCompromisso(item.id, escritorioId);
      }
      void carregar();
    } catch (e) {
      console.error(e);
    } finally {
      setAcaoRecorrencia(null);
      setAcaoId(null);
    }
  };

  return (
    <div className="relative w-full max-w-full overflow-x-hidden">
      <div
        className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[min(400px,70vh)] w-[min(800px,100vw)] max-w-full -translate-x-1/2 bg-esc-destaque opacity-10 blur-[150px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full flex-col gap-6">
        <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex cursor-pointer items-center gap-2 text-esc-muted transition-colors hover:text-esc-destaque"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <button
            type="button"
            onClick={abrirNovo}
            className="inline-flex items-center gap-2 mr-2.5 rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 px-2 py-2 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all hover:bg-esc-destaque/30"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Novo Compromisso
          </button>
        </div>

        <div className="mb-2 flex flex-col gap-1">
          <h1 className="flex flex-row items-center gap-2 text-xl font-bold tracking-tight text-esc-text sm:text-3xl">
            Agenda — <p className="text-esc-destaque">{nomeEscritorio}</p>
          </h1>
          <p className="text-sm text-esc-muted">
            Compromissos e visitas do escritório
          </p>
        </div>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="rounded-xl border border-esc-border bg-esc-card shadow-sm lg:col-span-2">
            <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-esc-border px-5 py-4">
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  ref={miniCalAnchorRef}
                  onClick={abrirMiniCal}
                  aria-label="Selecionar mês e ano"
                  aria-expanded={miniCalAberto}
                  aria-haspopup="dialog"
                  title="Selecionar mês e ano"
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                    miniCalAberto
                      ? "border-esc-destaque/60 bg-esc-destaque/20 text-esc-destaque"
                      : "border-esc-border bg-esc-bg text-esc-destaque hover:border-esc-destaque/40 hover:bg-esc-destaque/15"
                  }`}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden />
                </button>
                <h2 className="text-sm font-semibold text-esc-text">
                  {tituloMes(mesVisivel)}
                </h2>

                {miniCalAberto ? (
                  <div
                    ref={miniCalRef}
                    role="dialog"
                    aria-label="Seletor de mês e ano"
                    className="absolute left-0 top-full z-30 mt-2 w-[280px] rounded-xl border border-esc-border bg-esc-card shadow-[0_0_40px_-15px_var(--color-esc-destaque)] backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between border-b border-esc-border px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setMiniCalAno((a) => a - 10)}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-bold text-esc-muted transition hover:bg-esc-bg hover:text-esc-text"
                        aria-label="10 anos antes"
                        title="10 anos antes"
                      >
                        « 10
                      </button>
                      <button
                        type="button"
                        onClick={() => setMiniCalAno((a) => a - 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-esc-muted transition hover:bg-esc-bg hover:text-esc-text"
                        aria-label="Ano anterior"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="flex-1 text-center text-sm font-bold text-esc-text">
                        {miniCalAno}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMiniCalAno((a) => a + 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-esc-muted transition hover:bg-esc-bg hover:text-esc-text"
                        aria-label="Próximo ano"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMiniCalAno((a) => a + 10)}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-bold text-esc-muted transition hover:bg-esc-bg hover:text-esc-text"
                        aria-label="10 anos depois"
                        title="10 anos depois"
                      >
                        10 »
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 p-3">
                      {MESES_CURTOS.map((nome, idx) => {
                        const ehAtual =
                          mesVisivel.getFullYear() === miniCalAno &&
                          mesVisivel.getMonth() === idx;
                        const ehHoje =
                          hoje.getFullYear() === miniCalAno &&
                          hoje.getMonth() === idx;
                        return (
                          <button
                            key={nome}
                            type="button"
                            onClick={() => selecionarMesAno(idx, miniCalAno)}
                            className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                              ehAtual
                                ? "border-esc-destaque/60 bg-esc-destaque/20 text-esc-destaque"
                                : ehHoje
                                  ? "border-esc-destaque/30 bg-esc-bg text-esc-text hover:bg-esc-bg"
                                  : "border-esc-border bg-esc-bg text-esc-muted hover:border-esc-border hover:bg-esc-bg hover:text-esc-text"
                            }`}
                          >
                            {nome}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-esc-border px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const agora = new Date();
                          agora.setHours(0, 0, 0, 0);
                          setMesVisivel(startOfMonth(agora));
                          setDiaSelecionado(agora);
                          setMiniCalAberto(false);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-esc-destaque/40 bg-esc-destaque/15 px-2.5 py-1 text-[11px] font-semibold text-esc-destaque transition hover:bg-esc-destaque/25"
                      >
                        Ir para hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => setMiniCalAberto(false)}
                        className="inline-flex items-center rounded-lg border border-esc-border bg-esc-bg px-2.5 py-1 text-[11px] font-semibold text-esc-muted transition hover:bg-esc-bg hover:text-esc-text"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setMesVisivel(
                      new Date(
                        mesVisivel.getFullYear(),
                        mesVisivel.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-esc-border bg-esc-bg text-esc-muted transition hover:border-esc-destaque/40 hover:bg-esc-destaque/10 hover:text-esc-destaque"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={irProMesHoje}
                  className="inline-flex items-center gap-1 rounded-lg border border-esc-border bg-esc-bg px-3 py-1.5 text-[11px] font-semibold text-esc-muted transition hover:border-esc-destaque/40 hover:bg-esc-destaque/10 hover:text-esc-destaque"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setMesVisivel(
                      new Date(
                        mesVisivel.getFullYear(),
                        mesVisivel.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-esc-border bg-esc-bg text-esc-muted transition hover:border-esc-destaque/40 hover:bg-esc-destaque/10 hover:text-esc-destaque"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </header>

            <div className="p-3 sm:p-4">
              <div className="mb-2 grid grid-cols-7 gap-1 px-1">
                {WEEKDAYS.map((d) => (
                  <p
                    key={d}
                    className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-esc-muted"
                  >
                    {d}
                  </p>
                ))}
              </div>

              <div className="relative">
                {loading ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-esc-card backdrop-blur-[2px]">
                    <Loader2
                      className="h-5 w-5 animate-spin text-esc-muted"
                      aria-hidden
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-7 gap-1">
                  {cells.map((d) => {
                    const key = isoDate(d);
                    const isOutro = d.getMonth() !== mesVisivel.getMonth();
                    const isHoje = mesmaData(d, hoje);
                    const isSel = mesmaData(d, diaSelecionado);
                    const isDropAlvo = diaSobreDrop === key && Boolean(arrastandoId);
                    const lista = porDia.get(key) || [];
                    const visiveis = lista.slice(0, MAX_CHIPS_POR_DIA);
                    const restantes = lista.length - visiveis.length;

                    const selecionarDia = () => {
                      setDiaSelecionado(d);
                      if (d.getMonth() !== mesVisivel.getMonth()) {
                        setMesVisivel(startOfMonth(d));
                      }
                    };

                    return (
                      <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={selecionarDia}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selecionarDia();
                          }
                        }}
                        onDoubleClick={() => {
                          selecionarDia();
                          setCompromissoEdicao(null);
                          setModalAberto(true);
                        }}
                        onDragOver={(e) => {
                          if (!arrastandoId) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDiaSobreDrop(key);
                        }}
                        onDragLeave={(e) => {
                          if (
                            e.currentTarget.contains(e.relatedTarget)
                          ) {
                            return;
                          }
                          setDiaSobreDrop((atual) =>
                            atual === key ? null : atual,
                          );
                        }}
                        onDrop={(e) => void soltarNoDia(e, d)}
                        className={`group relative flex min-h-[5.75rem] flex-col rounded-lg border p-1 text-left transition-all sm:min-h-[6.75rem] sm:p-1.5 ${
                          isDropAlvo
                            ? "border-esc-destaque/70 bg-esc-destaque/15 ring-1 ring-esc-destaque/40"
                            : isSel
                              ? "border-esc-destaque/60 bg-esc-destaque/10 shadow-[0_0_20px_-10px_var(--color-esc-destaque)]"
                              : "border-esc-border bg-esc-bg hover:border-esc-border hover:bg-esc-bg"
                        } ${isOutro ? "opacity-40" : ""}`}
                      >
                        <span
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors sm:h-6 sm:w-6 sm:text-[11px] ${
                            isHoje
                              ? "border border-esc-destaque text-esc-destaque"
                              : isSel
                                ? "text-esc-text"
                                : "text-esc-muted group-hover:text-esc-text"
                          }`}
                        >
                          {d.getDate()}
                        </span>

                        <div className="mt-0.5 flex min-h-0 w-full flex-1 flex-col gap-0.5 overflow-hidden">
                          {visiveis.map((item) => {
                            const arrastando = arrastandoId === item.id;
                            const movendo = movendoId === item.id;
                            return (
                              <div
                                key={item.id}
                                draggable={!movendoId}
                                onDragStart={(e) => iniciarArraste(e, item)}
                                onDragEnd={finalizarArraste}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selecionarDia();
                                }}
                                title={`${horaBR(item.data_hora)} — ${item.titulo}`}
                                className={`flex min-w-0 cursor-grab items-center gap-1 rounded border border-esc-border border-l-[3px] bg-esc-bg px-1 py-0.5 text-left active:cursor-grabbing ${bordaEsquerdaTipo(
                                  item.tipo,
                                )} ${
                                  arrastando || movendo
                                    ? "opacity-40"
                                    : "hover:bg-esc-card"
                                }`}
                              >
                                <span className="shrink-0 text-[8px] font-bold tabular-nums text-esc-muted sm:text-[9px]">
                                  {horaBR(item.data_hora)}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[9px] font-semibold leading-tight text-esc-text sm:text-[10px]">
                                  {item.titulo}
                                </span>
                                {movendo ? (
                                  <Loader2
                                    className="h-2.5 w-2.5 shrink-0 animate-spin text-esc-muted"
                                    aria-hidden
                                  />
                                ) : null}
                              </div>
                            );
                          })}
                          {restantes > 0 ? (
                            <span className="truncate px-0.5 text-[8px] font-semibold text-esc-muted sm:text-[9px]">
                              +{restantes} mais
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {erro ? (
                <p className="mt-3 text-[11px] text-rose-600/90">{erro}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-esc-border pt-3 text-[11px] text-esc-muted">
                <span className="w-full text-[10px] text-esc-muted/90 sm:w-auto">
                  Arraste um compromisso para outro dia para remarcar (o horário
                  é mantido).
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-esc-tipo-reuniao" />
                  Reunião
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-esc-tipo-visita" />
                  Visita
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-esc-tipo-comprar" />
                  Comprar Material
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-esc-tipo-outro" />
                  Outro
                </span>
              </div>
            </div>
          </article>

          <aside className="flex max-h-[675px] flex-col self-start rounded-xl border border-esc-border bg-esc-card shadow-sm">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-esc-border px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-esc-muted">
                  {diaSelecionado.toLocaleDateString("pt-BR", {
                    weekday: "long",
                  })}
                </p>
                <h3 className="text-sm font-semibold text-esc-text">
                  {diaSelecionado.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
              </div>
              <span className="rounded-full border border-esc-border bg-esc-bg px-2 py-0.5 text-[10px] font-semibold text-esc-muted">
                {itensDoDia.length} {itensDoDia.length === 1 ? "item" : "itens"}
              </span>
            </header>

            <div className="custom-scrollbar flex flex-col gap-3 overflow-y-auto p-4">
              {loading ? (
                <p className="flex items-center gap-2 text-xs text-esc-muted">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Carregando…
                </p>
              ) : itensDoDia.length === 0 ? (
                <p className="rounded-lg border border-esc-border bg-esc-bg px-3 py-4 text-center text-[11px] text-esc-muted">
                  Nenhum compromisso neste dia.
                </p>
              ) : (
                itensDoDia.map((item) => {
                  const statusAcao = acaoId === `status:${item.id}`;
                  const delAcao = acaoId === `del:${item.id}`;
                  return (
                    <article
                      key={item.id}
                      className="rounded-xl border border-esc-border bg-esc-bg p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 shrink-0 rounded-full ${corDoTipo(
                                item.tipo,
                              )}`}
                              aria-hidden
                            />
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-esc-text">
                              <Clock className="h-3 w-3 text-esc-muted" />
                              {horaBR(item.data_hora)}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeTipoClasses(
                                item.tipo,
                              )}`}
                            >
                              {normalizarTipo(item.tipo) || "—"}
                            </span>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeStatusClasses(
                                item.status,
                              )}`}
                            >
                              {item.status || "Agendado"}
                            </span>
                          </div>
                          <h4 className="mt-1.5 truncate text-sm font-semibold text-esc-text">
                            {item.titulo}
                          </h4>
                          {item.cliente?.nome ? (
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-esc-muted">
                              <User className="h-3 w-3" aria-hidden />
                              {item.cliente.nome}
                            </p>
                          ) : null}
                          {item.descricao ? (
                            <p className="mt-2 whitespace-pre-wrap text-xs text-esc-muted">
                              {item.descricao}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-esc-border pt-2.5">
                        <button
                          type="button"
                          onClick={() => abrirEdicao(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-esc-border bg-esc-bg px-2 py-1 text-[11px] font-semibold text-esc-muted transition hover:border-esc-destaque/30 hover:bg-esc-destaque/10 hover:text-esc-destaque"
                        >
                          <Pencil className="h-3 w-3" aria-hidden />
                          Editar
                        </button>
                        {item.status !== "Realizado" ? (
                          <button
                            type="button"
                            onClick={() => mudarStatus(item, "Realizado")}
                            disabled={statusAcao}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {statusAcao ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" aria-hidden />
                            )}
                            Concluir
                          </button>
                        ) : null}
                        {item.status !== "Cancelado" ? (
                          <button
                            type="button"
                            onClick={() => mudarStatus(item, "Cancelado")}
                            disabled={statusAcao}
                            className="inline-flex items-center gap-1 rounded-lg border border-esc-border bg-esc-bg px-2 py-1 text-[11px] font-semibold text-esc-muted transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          >
                            <X className="h-3 w-3" aria-hidden />
                            Cancelar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => excluir(item)}
                          disabled={delAcao}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-esc-border bg-esc-bg px-2 py-1 text-[11px] font-semibold text-esc-muted transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                        >
                          {delAcao ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" aria-hidden />
                          )}
                          Excluir
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </aside>
        </section>
      </div>

      <ModalCompromissoEscritorio
        isOpen={modalAberto}
        onClose={fecharModal}
        onSaved={onSaved}
        escritorioId={escritorioId}
        compromissoEdicao={compromissoEdicao}
        dataInicial={isoDate(diaSelecionado)}
        escopoRecorrencia={escopoEdicao}
      />
      <ModalConfirmacaoRecorrencia
        isOpen={Boolean(acaoRecorrencia)}
        escritorioId={escritorioId}
        loading={Boolean(acaoId)}
        titulo={
          acaoRecorrencia?.tipo === "excluir"
            ? "Excluir compromisso recorrente"
            : "Aplicar alteração na recorrência"
        }
        descricao={
          acaoRecorrencia?.tipo === "excluir"
            ? "Deseja excluir apenas este evento ou todos os eventos futuros da série?"
            : "Deseja aplicar esta alteração apenas a este evento ou a todos os eventos futuros da série?"
        }
        onClose={() => setAcaoRecorrencia(null)}
        onConfirmEvento={() => void executarAcaoRecorrencia("evento")}
        onConfirmFuturos={() => void executarAcaoRecorrencia("futuros")}
      />
    </div>
  );
}
