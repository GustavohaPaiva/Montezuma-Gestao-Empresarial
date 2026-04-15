import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2, Plus, Search } from "lucide-react";
import { api } from "../../services/api";
import { ESCRITORIO_NOME_POR_ID } from "../../constants/escritorios";
import { useEscritorioIdFromPath } from "../../hooks/useEscritorioIdFromPath";
import { useAuth } from "../../contexts/AuthContext";
import ModalTarefaEscritorio from "../../components/modals/ModalTarefaEscritorio";
import {
  STATUS as TAREFA_STATUS,
  normalizarStatus,
} from "../tarefas/tarefasHelpers";

const PILLS = [
  { id: "todas", label: "Todas" },
  { id: "minhas", label: "Minhas Tarefas" },
  { id: "pendentes", label: "Pendentes" },
  { id: "aguardando", label: "Aguardando Validação" },
  { id: "concluidas", label: "Concluídas" },
];

const PRIORIDADE_PESO = { Alta: 0, Média: 1, Baixa: 2 };

function inicialNome(nome) {
  const n = (nome || "?").trim();
  return n.slice(0, 1).toUpperCase();
}

function formatDataCard(dateStr) {
  if (!dateStr) return "Sem prazo";
  const d = new Date(`${String(dateStr).split("T")[0]}T12:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function prioridadeBadge(pri) {
  if (pri === "Alta") {
    return "border border-red-500/50 bg-red-500/20 text-red-400";
  }
  if (pri === "Média") {
    return "border border-amber-500/50 bg-amber-500/20 text-amber-400";
  }
  return "border border-white/10 bg-white/5 text-esc-muted";
}

function prioridadeBorda(pri) {
  if (pri === "Alta") {
    return "border-l-4 border-l-red-500 shadow-[-10px_0_30px_-15px_rgba(239,68,68,0.3)]";
  }
  if (pri === "Média") return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-esc-border";
}

function statusVisual(status) {
  const s = normalizarStatus(status);
  if (s === TAREFA_STATUS.emAndamento) return TAREFA_STATUS.pendente;
  return s;
}

export default function TarefasEscritorio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const escritorioId = useEscritorioIdFromPath();
  const nomeEscritorio = ESCRITORIO_NOME_POR_ID[escritorioId] ?? "Escritório";

  const [tarefas, setTarefas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEdicao, setTarefaEdicao] = useState(null);
  const [filtrosAtivos, setFiltrosAtivos] = useState([]);
  const [busca, setBusca] = useState("");

  const uid = user?.id ? String(user.id) : "";
  const tipoUsuario = String(user?.tipo || "").toLowerCase();
  const isDonoOuAdmin = [
    "dono",
    "admin",
    "diretoria",
    "gestor_master",
  ].includes(tipoUsuario);

  const extrairIdsResponsaveis = useCallback(
    (tarefa) =>
      Array.isArray(tarefa?.responsaveis)
        ? tarefa.responsaveis
            .map((r) => r?.usuario_id)
            .filter(Boolean)
            .map(String)
        : [],
    [],
  );

  const usuariosNomePorId = useMemo(() => {
    const map = new Map();
    for (const u of usuarios) map.set(String(u.id), u.nome || "—");
    return map;
  }, [usuarios]);

  const load = useCallback(async () => {
    if (!escritorioId) return;
    setLoading(true);
    setErro(null);
    try {
      const [tarefasData, usuariosData] = await Promise.all([
        api.getTarefasEscritorio(escritorioId),
        api.getUsuariosTarefaEscritorio(escritorioId),
      ]);
      setTarefas(Array.isArray(tarefasData) ? tarefasData : []);
      setUsuarios(Array.isArray(usuariosData) ? usuariosData : []);
    } catch (e) {
      console.error(e);
      setErro(e?.message || "Não foi possível carregar as tarefas.");
      setTarefas([]);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [escritorioId]);

  useEffect(() => {
    void load();
  }, [load]);

  const tarefasVisiveis = useMemo(() => {
    if (!uid) return [];
    return tarefas.filter((t) => {
      const responsaveis = extrairIdsResponsaveis(t);
      const souResponsavel = responsaveis.includes(uid);
      if (!isDonoOuAdmin) return souResponsavel;
      const souCriador = String(t.criador_id || "") === uid;
      const souGestor = String(t.gestor_id || "") === uid;
      return souCriador || souGestor || souResponsavel;
    });
  }, [tarefas, uid, isDonoOuAdmin, extrairIdsResponsaveis]);

  const tarefasFiltradas = useMemo(() => {
    let list = [...tarefasVisiveis];
    if (filtrosAtivos.length > 0) {
      list = list.filter((t) => {
        const responsavel = extrairIdsResponsaveis(t).includes(uid);
        const status = statusVisual(t.status);
        return filtrosAtivos.every((f) => {
          if (f === "todas") return true;
          if (f === "minhas") return responsavel;
          if (f === "pendentes") return status === TAREFA_STATUS.pendente;
          if (f === "aguardando") return status === TAREFA_STATUS.aguardando;
          if (f === "concluidas") return status === TAREFA_STATUS.concluida;
          return true;
        });
      });
    }

    const q = busca.trim().toLowerCase();
    if (q)
      list = list.filter((t) => (t.titulo || "").toLowerCase().includes(q));

    list.sort((a, b) => {
      const pa = PRIORIDADE_PESO[a.prioridade] ?? 99;
      const pb = PRIORIDADE_PESO[b.prioridade] ?? 99;
      if (pa !== pb) return pa - pb;
      const da = (a.data_conclusao || "9999-12-31").split("T")[0];
      const db = (b.data_conclusao || "9999-12-31").split("T")[0];
      return da.localeCompare(db);
    });

    return list;
  }, [tarefasVisiveis, filtrosAtivos, busca, extrairIdsResponsaveis, uid]);

  const toggleFiltro = (id) => {
    setFiltrosAtivos((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  return (
    <div className="relative w-full max-w-full overflow-x-hidden">
      <div
        className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[min(400px,70vh)] w-[min(800px,100vw)] max-w-full -translate-x-1/2 bg-esc-destaque opacity-10 blur-[150px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full">
        <div className="my-4 flex w-full flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex cursor-pointer items-center gap-2 text-esc-muted transition-colors hover:text-esc-destaque"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-3xl flex flex-row items-center gap-2 font-bold tracking-tight text-esc-text">
              Tarefas — <p className="text-esc-destaque">{nomeEscritorio}</p>
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setTarefaEdicao(null);
              setModalAberto(true);
            }}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-esc-destaque/30 bg-esc-destaque/10 px-4 py-2.5 text-sm font-semibold text-esc-destaque transition-all hover:bg-esc-destaque/20 sm:w-auto"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nova tarefa
          </button>
        </div>

        <div className="mb-6 rounded-2xl border border-white/5 bg-esc-card/30 p-4 backdrop-blur-md">
          <div className="flex flex-wrap gap-2">
            {PILLS.map((pill) => {
              const ativa =
                filtrosAtivos.includes(pill.id) ||
                (pill.id === "todas" && filtrosAtivos.length === 0);
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => toggleFiltro(pill.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                    ativa
                      ? "border-esc-destaque/50 bg-esc-destaque/20 text-esc-destaque"
                      : "border-white/10 bg-white/5 text-esc-muted hover:bg-white/10 hover:text-esc-text"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
            <Search className="h-4 w-4 text-esc-muted" aria-hidden />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por título..."
              className="w-full bg-transparent text-sm text-esc-text placeholder:text-esc-muted/40 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div
            className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-esc-card/30 p-10 backdrop-blur-sm"
            role="status"
          >
            <Loader2 className="h-10 w-10 animate-spin text-esc-destaque" />
            <span className="text-sm text-esc-muted">Carregando tarefas…</span>
          </div>
        ) : erro ? (
          <div className="rounded-2xl border border-white/5 bg-esc-card/40 p-8 text-center text-sm text-esc-muted backdrop-blur-md">
            {erro}
          </div>
        ) : tarefasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-esc-card/30 p-10 text-center text-sm text-esc-muted backdrop-blur-md">
            Nenhuma tarefa encontrada para este filtro.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tarefasFiltradas.map((t) => {
              const pri = t.prioridade || "Média";
              const status = statusVisual(t.status);
              const respIds = extrairIdsResponsaveis(t);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTarefaEdicao(t);
                    setModalAberto(true);
                  }}
                  className={`group w-full rounded-xl border border-white/5 bg-esc-card/40 p-4 text-left shadow-inner backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-esc-destaque/40 ${prioridadeBorda(pri)}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-esc-text">
                        {t.titulo || "Sem título"}
                      </h3>
                      <p className="mt-1 text-xs text-esc-muted">{status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${prioridadeBadge(pri)}`}
                      >
                        {pri}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-esc-muted">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDataCard(t.data_conclusao)}
                      </span>
                    </div>
                  </div>

                  {t.descricao ? (
                    <p className="mt-2 line-clamp-2 text-xs text-esc-muted">
                      {t.descricao}
                    </p>
                  ) : null}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex -space-x-1">
                      {respIds.slice(0, 5).map((rid) => (
                        <span
                          key={rid}
                          title={usuariosNomePorId.get(rid) || "Responsável"}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-esc-border bg-esc-bg text-[10px] font-bold text-esc-destaque"
                        >
                          {inicialNome(usuariosNomePorId.get(rid) || "R")}
                        </span>
                      ))}
                    </div>
                    {respIds.length > 0 ? (
                      <span className="text-[10px] text-esc-muted">
                        {respIds.length} responsáveis
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <ModalTarefaEscritorio
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setTarefaEdicao(null);
        }}
        onSaved={() => void load()}
        escritorioId={escritorioId}
        tarefaEdicao={tarefaEdicao}
      />
    </div>
  );
}
