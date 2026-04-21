import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import ModalPortal from "../../components/gerais/ModalPortal";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import { api } from "../../services/api";
import {
  Search,
  CircleDot,
  Loader2,
  AlertCircle,
  ListTodo,
  Inbox,
  X,
  Calendar,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  STATUS,
  extrairResponsaveis,
  filtrarTarefasVisiveis,
  nomeDesignadorTarefa,
  escritorioDesignadorTarefa,
  usuarioPodeSerResponsavelEmTarefa,
  normalizarStatus,
} from "./tarefasHelpers";
import {
  ID_MONTEZUMA,
  ID_VOGELKOP,
  ID_YBYOCA,
  ESCRITORIO_NOME_POR_ID,
} from "../../constants/escritorios";

const PRIORIDADES = ["Alta", "Média", "Baixa"];

const PODE_CRIAR = ["gestor_master", "diretoria"];

const GESTOR_OU_DIRETORIA = ["gestor_master", "diretoria"];

const VISAO_GLOBAL_TAREFAS = ["gestor_master", "diretoria", "secretaria"];

const ENVIAR_APROVACAO_TIPOS = ["suporte_ti", "secretaria", "funcionario"];

function iniciais(nome) {
  if (!nome || typeof nome !== "string") return "?";
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
  return nome.trim().slice(0, 2).toUpperCase() || "?";
}

function normalizarPrioridade(p) {
  if (PRIORIDADES.includes(p)) return p;
  return "Média";
}

function formatDataEntrega(dateStr) {
  if (!dateStr) return "Sem data definida";
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatarDataHoraProgresso(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDataAmigavel(dateStr) {
  if (!dateStr) return "Sem prazo";
  const alvo = new Date(`${dateStr}T12:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const d = new Date(alvo);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - hoje) / (86400 * 1000));
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff > 1 && diff <= 6) {
    const dias = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    return dias[alvo.getDay()];
  }
  return alvo.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
}

function badgePrioridadeClasses(pri) {
  switch (pri) {
    case "Alta":
      return "bg-red-600 text-white shadow-sm";
    case "Média":
      return "bg-amber-400 text-amber-950 shadow-sm";
    case "Baixa":
      return "bg-sky-600 text-white shadow-sm";
    default:
      return "bg-amber-400 text-amber-950 shadow-sm";
  }
}

const SELECT_STATUS_CLASS =
  "h-8 w-full rounded-lg border border-gray-200 bg-white pl-2.5 pr-8 text-xs font-medium text-gray-800 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-200";

function badgeStatusSolido(status) {
  switch (status) {
    case STATUS.pendente:
      return "bg-amber-500 text-white";
    case STATUS.emAndamento:
      return "bg-orange-500 text-white";
    case STATUS.aguardando:
      return "bg-yellow-500 text-yellow-950";
    case STATUS.concluida:
      return "bg-emerald-600 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

function secaoPrioridadeBarra(pri) {
  switch (pri) {
    case "Alta":
      return "border-l-[3px] border-red-600";
    case "Média":
      return "border-l-[3px] border-amber-400";
    case "Baixa":
      return "border-l-[3px] border-sky-600";
    default:
      return "border-l-[3px] border-gray-300";
  }
}

function rotuloEscritorioCard(tarefa) {
  const eid = tarefa?.escritorio_id;
  if (eid == null || String(eid).trim() === "") {
    return ESCRITORIO_NOME_POR_ID[ID_MONTEZUMA] ?? "Montezuma";
  }
  const key = String(eid);
  return ESCRITORIO_NOME_POR_ID[key] ?? "Escritório";
}

function badgeEscritorioClasses(tarefa) {
  const eid = tarefa?.escritorio_id;
  if (eid == null || String(eid).trim() === "") {
    return "border-white/10 text-esc-muted bg-white/5 shadow-[0_0_12px_-10px_rgba(255,255,255,0.35)]";
  }
  const key = String(eid);
  if (key === ID_VOGELKOP) {
    return "border-blue-500/50 text-blue-400 bg-blue-500/10 shadow-[0_0_14px_-8px_rgba(59,130,246,0.55)]";
  }
  if (key === ID_YBYOCA) {
    return "border-orange-500/50 text-orange-400 bg-orange-500/10 shadow-[0_0_14px_-8px_rgba(249,115,22,0.55)]";
  }
  return "border-white/10 text-esc-muted bg-white/5 shadow-[0_0_12px_-10px_rgba(255,255,255,0.35)]";
}

function useIsNarrowViewport() {
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(min-width: 768px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setNarrow(!mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return narrow;
}

function ordenarPorDataConclusao(a, b) {
  const da = a.data_conclusao || "";
  const db = b.data_conclusao || "";
  if (!da && !db) return (a.titulo || "").localeCompare(b.titulo || "");
  if (!da) return 1;
  if (!db) return -1;
  const c = da.localeCompare(db);
  if (c !== 0) return c;
  return (a.titulo || "").localeCompare(b.titulo || "");
}

/**
 * @param {{ embedded?: boolean, onClose?: () => void, onTasksUpdated?: () => void }} props
 */
export default function ListaTarefas({
  embedded = false,
  onClose,
  onTasksUpdated,
}) {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState([]);
  const [usuariosLista, setUsuariosLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [pillAtivo, setPillAtivo] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [selecionadaId, setSelecionadaId] = useState(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isNarrow = useIsNarrowViewport();

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    data_conclusao: "",
    prioridade: "Média",
    responsaveisIds: [],
  });
  const [feedProgresso, setFeedProgresso] = useState([]);
  const [carregandoFeedProgresso, setCarregandoFeedProgresso] = useState(false);
  const [textoNovoProgresso, setTextoNovoProgresso] = useState("");
  const [enviandoProgresso, setEnviandoProgresso] = useState(false);

  const podeCriar = PODE_CRIAR.includes(user?.tipo);
  const uid = user?.id ? String(user.id) : null;

  const verFiltroTodas = VISAO_GLOBAL_TAREFAS.includes(user?.tipo);

  useEffect(() => {
    if (user && !verFiltroTodas && pillAtivo === "todas") {
      setPillAtivo("minhas");
    }
  }, [user, verFiltroTodas, pillAtivo]);

  const onTasksUpdatedRef = useRef(onTasksUpdated);
  useEffect(() => {
    onTasksUpdatedRef.current = onTasksUpdated;
  }, [onTasksUpdated]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      let data;
      if (pillAtivo === "minhas") {
        if (!uid) {
          data = [];
        } else {
          data = await api.getTarefasGlobaisMontezumaMinhasResponsavel(uid);
        }
      } else {
        data = await api.getTarefasGlobaisMontezuma();
      }
      setTarefas(Array.isArray(data) ? data : []);
      onTasksUpdatedRef.current?.();
    } catch (e) {
      console.error(e);
      setErro(
        e?.message ||
          "Não foi possível carregar as tarefas. Verifique permissões (RLS) e conexão.",
      );
      setTarefas([]);
    } finally {
      setLoading(false);
    }
  }, [pillAtivo, uid]);

  const carregarUsuarios = useCallback(async () => {
    const aplicarLista = (list) => {
      setUsuariosLista(
        list.filter((u) => usuarioPodeSerResponsavelEmTarefa(u)),
      );
    };

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "listar_usuarios_responsaveis_tarefa",
      );
      if (!rpcError && Array.isArray(rpcData)) {
        aplicarLista(rpcData);
        return;
      }
      if (rpcError) {
        console.warn(
          "[Tarefas] RPC listar_usuarios_responsaveis_tarefa falhou; a usar select em usuarios (RLS pode limitar por escritório).",
          rpcError.code,
          rpcError.message,
        );
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, escritorio, tipo")
        .order("nome");
      if (error) throw error;
      aplicarLista(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("[Tarefas] carregarUsuarios:", e);
      setUsuariosLista([]);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (modalAberto && podeCriar) carregarUsuarios();
  }, [modalAberto, podeCriar, carregarUsuarios]);

  const tarefasVisiveis = useMemo(
    () => (user ? filtrarTarefasVisiveis(user, tarefas) : []),
    [tarefas, user],
  );

  const listaFiltrada = useMemo(() => {
    let list = [...tarefasVisiveis];
    const q = busca.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const tit = (t.titulo || "").toLowerCase();
        const desc = (t.descricao || "").toLowerCase();
        return tit.includes(q) || desc.includes(q);
      });
    }
    if (pillAtivo === "aguardando") {
      list = list.filter(
        (t) => normalizarStatus(t.status) === STATUS.aguardando,
      );
    } else if (pillAtivo === "concluidas") {
      list = list.filter(
        (t) => normalizarStatus(t.status) === STATUS.concluida,
      );
    }
    if (filtroStatus !== "todos") {
      list = list.filter((t) => normalizarStatus(t.status) === filtroStatus);
    }
    return list;
  }, [tarefasVisiveis, busca, pillAtivo, uid, filtroStatus]);

  const porPrioridade = useMemo(() => {
    const buckets = { Alta: [], Média: [], Baixa: [] };
    for (const t of listaFiltrada) {
      const p = normalizarPrioridade(t.prioridade);
      buckets[p].push(t);
    }
    for (const p of PRIORIDADES) {
      buckets[p].sort(ordenarPorDataConclusao);
    }
    return buckets;
  }, [listaFiltrada]);

  const idsListaPlana = useMemo(
    () => listaFiltrada.map((t) => String(t.id)),
    [listaFiltrada],
  );

  const prioridadesComItens = useMemo(
    () => PRIORIDADES.filter((p) => porPrioridade[p].length > 0),
    [porPrioridade],
  );

  const tarefaSelecionada = useMemo(
    () => tarefas.find((t) => String(t.id) === String(selecionadaId)) ?? null,
    [tarefas, selecionadaId],
  );

  useEffect(() => {
    if (!selecionadaId) {
      setFeedProgresso([]);
      setTextoNovoProgresso("");
      return;
    }
    let cancelled = false;
    (async () => {
      setCarregandoFeedProgresso(true);
      try {
        const rows = await api.getTarefaProgresso(selecionadaId);
        if (!cancelled) setFeedProgresso(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setFeedProgresso([]);
      } finally {
        if (!cancelled) setCarregandoFeedProgresso(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selecionadaId]);

  useEffect(() => {
    if (selecionadaId && !idsListaPlana.includes(String(selecionadaId))) {
      setSelecionadaId(null);
    }
  }, [idsListaPlana, selecionadaId]);

  const atualizarStatusTarefa = async (id, novoStatus) => {
    setAtualizandoStatus(true);
    try {
      const { error } = await supabase
        .from("tarefas")
        .update({ status: novoStatus })
        .eq("id", id);
      if (error) throw error;
      await carregar();
      onTasksUpdatedRef.current?.();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível atualizar o status.");
    } finally {
      setAtualizandoStatus(false);
    }
  };

  const adicionarAtualizacaoProgresso = async () => {
    const msg = textoNovoProgresso.trim();
    if (!selecionadaId || !user?.id || !msg) return;
    setEnviandoProgresso(true);
    try {
      await api.addTarefaProgresso(selecionadaId, user.id, msg);
      setTextoNovoProgresso("");
      const rows = await api.getTarefaProgresso(selecionadaId);
      setFeedProgresso(Array.isArray(rows) ? rows : []);
      onTasksUpdatedRef.current?.();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível adicionar a atualização.");
    } finally {
      setEnviandoProgresso(false);
    }
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setEditandoId(null);
  };

  const abrirModal = () => {
    setEditandoId(null);
    setForm({
      titulo: "",
      descricao: "",
      data_conclusao: new Date().toISOString().split("T")[0],
      prioridade: "Média",
      responsaveisIds: [],
    });
    setModalAberto(true);
  };

  const abrirModalEdicao = (t) => {
    if (!t?.id) return;
    const raw = t.data_conclusao;
    const dataStr =
      typeof raw === "string" && raw.length >= 10
        ? raw.slice(0, 10)
        : raw
          ? new Date(raw).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
    setEditandoId(String(t.id));
    setForm({
      titulo: t.titulo || "",
      descricao: t.descricao || "",
      data_conclusao: dataStr,
      prioridade: normalizarPrioridade(t.prioridade),
      responsaveisIds: extrairResponsaveis(t)
        .filter((r) => usuarioPodeSerResponsavelEmTarefa(r))
        .map((r) => r.id),
    });
    setModalAberto(true);
  };

  const toggleResponsavel = (id) => {
    const sid = String(id);
    setForm((prev) => {
      const next = new Set(prev.responsaveisIds.map(String));
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return { ...prev, responsaveisIds: [...next] };
    });
  };

  const sincronizarResponsaveis = async (tarefaId, ids) => {
    const { error: errDel } = await supabase
      .from("tarefa_responsaveis")
      .delete()
      .eq("tarefa_id", tarefaId);
    if (errDel) throw errDel;
    if (ids.length > 0) {
      const { error: errIns } = await supabase
        .from("tarefa_responsaveis")
        .insert(
          ids.map((x) => ({
            tarefa_id: tarefaId,
            usuario_id: x,
          })),
        );
      if (errIns) throw errIns;
    }
  };

  const salvarModal = async () => {
    if (!user?.id) return;
    if (!form.titulo.trim()) {
      alert("Informe o título.");
      return;
    }
    if (!form.data_conclusao) {
      alert("Informe a data de conclusão.");
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        const { error: errT } = await supabase
          .from("tarefas")
          .update({
            titulo: form.titulo.trim(),
            descricao: form.descricao.trim() || null,
            data_conclusao: form.data_conclusao,
            prioridade: form.prioridade,
          })
          .eq("id", editandoId);
        if (errT) throw errT;
        await sincronizarResponsaveis(editandoId, form.responsaveisIds);
        setModalAberto(false);
        setEditandoId(null);
        setSelecionadaId(editandoId);
        await carregar();
        onTasksUpdatedRef.current?.();
        return;
      }

      const nomeCriador =
        user.nome != null && String(user.nome).trim() !== ""
          ? String(user.nome).trim()
          : null;
      const escritorioCriador =
        user.escritorio != null && String(user.escritorio).trim() !== ""
          ? String(user.escritorio).trim()
          : null;

      const { data: inserted, error: errT } = await supabase
        .from("tarefas")
        .insert({
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim() || null,
          data_conclusao: form.data_conclusao,
          prioridade: form.prioridade,
          status: STATUS.pendente,
          criador_id: user.id,
          ...(nomeCriador ? { criador_nome: nomeCriador } : {}),
          ...(escritorioCriador
            ? { criador_escritorio: escritorioCriador }
            : {}),
        })
        .select("id")
        .single();
      if (errT) throw errT;
      const tarefaId = inserted?.id;
      if (!tarefaId) throw new Error("ID da tarefa não retornado.");
      if (form.responsaveisIds.length > 0) {
        await sincronizarResponsaveis(tarefaId, form.responsaveisIds);
      }
      setModalAberto(false);
      setEditandoId(null);
      setSelecionadaId(tarefaId);
      await carregar();
      onTasksUpdatedRef.current?.();
    } catch (e) {
      console.error(e);
      alert(
        e?.message ||
          (editandoId ? "Erro ao atualizar tarefa." : "Erro ao criar tarefa."),
      );
    } finally {
      setSalvando(false);
    }
  };

  const excluirTarefaSelecionada = async () => {
    if (!tarefaSelecionada?.id || excluindo) return;
    const ok = window.confirm(
      `Excluir a tarefa "${(tarefaSelecionada.titulo || "").slice(0, 80)}${(tarefaSelecionada.titulo || "").length > 80 ? "…" : ""}"? Esta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    const id = tarefaSelecionada.id;
    setExcluindo(true);
    try {
      const { error: errD } = await supabase
        .from("tarefa_responsaveis")
        .delete()
        .eq("tarefa_id", id);
      if (errD) throw errD;
      const { error: errT } = await supabase
        .from("tarefas")
        .delete()
        .eq("id", id);
      if (errT) throw errT;
      setSelecionadaId(null);
      await carregar();
      onTasksUpdatedRef.current?.();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível excluir a tarefa.");
    } finally {
      setExcluindo(false);
    }
  };

  const st = tarefaSelecionada
    ? normalizarStatus(tarefaSelecionada.status)
    : null;
  const respsSel = tarefaSelecionada
    ? extrairResponsaveis(tarefaSelecionada)
    : [];

  const nomeDesignadorSel = tarefaSelecionada
    ? nomeDesignadorTarefa(tarefaSelecionada)
    : null;
  const escritorioDesignadorSel = tarefaSelecionada
    ? escritorioDesignadorTarefa(tarefaSelecionada)
    : null;

  const isGestorDiretoria = GESTOR_OU_DIRETORIA.includes(user?.tipo);
  const souResponsavel = uid && respsSel.some((r) => r.id === uid);
  const podeEnviarAprovacaoTipo = ENVIAR_APROVACAO_TIPOS.includes(user?.tipo);

  const mostrarConcluirGestor =
    tarefaSelecionada &&
    isGestorDiretoria &&
    (st === STATUS.pendente || st === STATUS.emAndamento);

  const mostrarEnviarAprovacao =
    tarefaSelecionada &&
    podeEnviarAprovacaoTipo &&
    souResponsavel &&
    (st === STATUS.pendente || st === STATUS.emAndamento);

  const mostrarPainelAprovacao =
    tarefaSelecionada && isGestorDiretoria && st === STATUS.aguardando;

  const pillsFiltro = useMemo(() => {
    const base = [
      { id: "todas", label: "Todas" },
      { id: "minhas", label: "Minhas tarefas" },
      { id: "aguardando", label: "Aguardando validação" },
      { id: "concluidas", label: "Concluídas" },
    ];
    if (VISAO_GLOBAL_TAREFAS.includes(user?.tipo)) return base;
    return base.filter((p) => p.id !== "todas");
  }, [user?.tipo]);

  const totalNaLista = listaFiltrada.length;

  const mostrarLista = !isNarrow || !selecionadaId;
  const mostrarDetalhe = !isNarrow || !!selecionadaId;

  const shellClass = [
    embedded
      ? "flex h-full min-h-0 flex-1 flex-col bg-white"
      : "flex max-h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-white",
    isFullscreen
      ? "fixed inset-0 z-[110] h-[100dvh] max-h-[100dvh] w-screen max-w-none overflow-hidden"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const btnIconHeader =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-slate-50 hover:text-gray-900";

  const renderCardLista = (t) => {
    const pri = normalizarPrioridade(t.prioridade);
    const stt = normalizarStatus(t.status);
    const ativo = String(selecionadaId) === String(t.id);
    const responsaveisDaTarefa = extrairResponsaveis(t);
    const nomeResponsavel =
      responsaveisDaTarefa.length > 0
        ? responsaveisDaTarefa[0].nome || "Se"
        : "Sem responsáveis";
    const restantes = Math.max(responsaveisDaTarefa.length - 1, 0);
    const escritorioLabel = rotuloEscritorioCard(t);
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => setSelecionadaId(t.id)}
        className={`w-full rounded-xl border p-3 text-left shadow-sm transition hover:shadow ${
          ativo
            ? "border-gray-300 bg-white ring-1 ring-gray-200"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-800">
              {t.titulo}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgePrioridadeClasses(pri)}`}
              >
                {pri}
              </span>
              <span
                className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${badgeStatusSolido(stt)}`}
              >
                {stt}
              </span>
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${badgeEscritorioClasses(t)}`}
                title={`Escritório: ${escritorioLabel}`}
              >
                {escritorioLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span>
                <span className="font-medium text-gray-600">Entrega:</span>{" "}
                {formatDataAmigavel(t.data_conclusao)} ·{" "}
                {formatDataEntrega(t.data_conclusao)}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
              <span className="text-[10px] font-bold uppercase text-gray-500">
                RESPONSÁVEL:
              </span>
              <span className="rounded-md bg-gray-900 px-2 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm">
                {nomeResponsavel}
              </span>
              {restantes > 0 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  +{restantes}
                </span>
              )}
            </div>
          </div>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-gray-700 shadow-sm ring-1 ring-gray-200/80"
            title={nomeDesignadorTarefa(t) || "Quem designou"}
          >
            {iniciais(nomeDesignadorTarefa(t))}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className={shellClass}>
      {!embedded && (
        <div className="shrink-0">
          <Navbar />
        </div>
      )}

      {embedded && (
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-gray-800 shadow-sm ring-1 ring-gray-200/80">
              <ListTodo className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-gray-800">
                Tarefas
              </h2>
              <p className="text-[11px] text-gray-500">Painel de trabalho</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className={btnIconHeader}
              aria-label={
                isFullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"
              }
              title={
                isFullscreen ? "Minimizar painel" : "Expandir para tela cheia"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={btnIconHeader}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <aside
          className={`${
            mostrarLista ? "flex" : "hidden"
          } min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden border-b border-gray-200 bg-white shadow-sm md:flex md:h-auto md:min-h-0 md:w-[38%] md:min-w-[280px] md:flex-none md:border-b-0 md:border-r md:border-gray-200`}
        >
          <div className="shrink-0 space-y-3 border-b border-gray-200 bg-white p-3 md:p-4">
            {!embedded && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-gray-800 shadow-sm ring-1 ring-gray-200/80">
                    <ListTodo className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm font-semibold text-gray-800">
                      Tarefas
                    </h1>
                    <p className="text-[11px] text-gray-500">Por prioridade</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullscreen((v) => !v)}
                  className={btnIconHeader}
                  aria-label={
                    isFullscreen ? "Sair da tela cheia" : "Abrir em tela cheia"
                  }
                  title={
                    isFullscreen ? "Minimizar" : "Expandir para tela cheia"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            )}

            {podeCriar && (
              <ButtonDefault
                onClick={abrirModal}
                className="!h-8 w-full !rounded-lg !border-gray-800 !bg-gray-900 !px-3 !text-sm !font-medium !text-white hover:!bg-gray-800 shadow-sm"
              >
                + Nova tarefa
              </ButtonDefault>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-8 w-full rounded-lg border border-gray-200 bg-slate-50 pl-8 pr-2.5 text-xs text-gray-800 placeholder:text-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Status
              </label>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className={SELECT_STATUS_CLASS}
              >
                <option value="todos">Todos</option>
                <option value={STATUS.pendente}>{STATUS.pendente}</option>
                <option value={STATUS.emAndamento}>{STATUS.emAndamento}</option>
                <option value={STATUS.aguardando}>{STATUS.aguardando}</option>
                <option value={STATUS.concluida}>{STATUS.concluida}</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {pillsFiltro.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPillAtivo(p.id)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition shadow-sm ${
                    pillAtivo === p.id
                      ? "border-gray-800 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-slate-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 p-3 [-webkit-overflow-scrolling:touch] md:p-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="mb-2 h-7 w-7 animate-spin" />
                <span className="text-xs font-medium">Carregando tarefas…</span>
              </div>
            )}
            {erro && !loading && (
              <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-900 shadow-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Erro</p>
                  <p className="opacity-90">{erro}</p>
                  <button
                    type="button"
                    onClick={() => carregar()}
                    className="mt-1.5 text-[11px] font-semibold underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}
            {!loading && !erro && totalNaLista === 0 && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-10 text-center shadow-sm">
                <Inbox className="mb-2 h-9 w-9 text-gray-300" />
                <p className="text-sm font-medium text-gray-800">
                  Nenhuma tarefa
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Aguarde novas atribuições.
                </p>
              </div>
            )}
            {!loading &&
              !erro &&
              totalNaLista > 0 &&
              prioridadesComItens.map((pri) => {
                const itens = porPrioridade[pri];
                return (
                  <section
                    key={pri}
                    className={`mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm last:mb-0 ${secaoPrioridadeBarra(pri)}`}
                  >
                    <div className="border-b border-gray-100 bg-white px-3 py-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-800">
                        Prioridade {pri}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {itens.length} tarefa(s) · por data de entrega
                      </p>
                    </div>
                    <div className="space-y-2 bg-slate-50/80 p-2.5">
                      {itens.map((t) => renderCardLista(t))}
                    </div>
                  </section>
                );
              })}
          </div>
        </aside>

        <main
          className={`${
            mostrarDetalhe ? "flex" : "hidden"
          } min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-white [-webkit-overflow-scrolling:touch] md:flex md:min-h-0 md:w-full`}
        >
          {!tarefaSelecionada ? (
            <div className="hidden h-full min-h-0 flex-col items-center justify-center p-6 text-center md:flex">
              <div className="max-w-sm rounded-xl border border-gray-200 bg-slate-50/80 px-6 py-8 shadow-sm">
                <CircleDot className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm font-semibold text-gray-800">
                  Selecione uma tarefa
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Escolha um item na lista para ver detalhes.
                </p>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl flex-1 p-3 md:p-6 lg:p-8">
              <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <header className="border-b border-gray-100 bg-white px-3 py-3 md:px-5 md:py-4">
                  <button
                    type="button"
                    onClick={() => setSelecionadaId(null)}
                    className="mb-3 inline-flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-slate-50 md:hidden"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </button>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgePrioridadeClasses(normalizarPrioridade(tarefaSelecionada.prioridade))}`}
                    >
                      {normalizarPrioridade(tarefaSelecionada.prioridade)}
                    </span>
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${badgeStatusSolido(st)}`}
                    >
                      {st}
                    </span>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${badgeEscritorioClasses(tarefaSelecionada)}`}
                      title={`Escritório: ${rotuloEscritorioCard(tarefaSelecionada)}`}
                    >
                      {rotuloEscritorioCard(tarefaSelecionada)}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>
                        Entrega:{" "}
                        <span className="font-medium text-gray-800">
                          {formatDataEntrega(tarefaSelecionada.data_conclusao)}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <h2 className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight text-gray-800 md:text-xl">
                      {tarefaSelecionada.titulo}
                    </h2>
                    {podeCriar && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => abrirModalEdicao(tarefaSelecionada)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={excluindo || atualizandoStatus}
                          onClick={excluirTarefaSelecionada}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {excluindo ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                </header>

                <div className="space-y-5 px-3 py-4 md:space-y-6 md:px-5 md:py-5">
                  <section>
                    <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Descrição
                    </h3>
                    <div className="min-h-[72px] whitespace-pre-wrap rounded-lg border border-gray-200 bg-slate-50/90 p-3 text-sm leading-relaxed text-gray-700 shadow-sm">
                      {tarefaSelecionada.descricao?.trim()
                        ? tarefaSelecionada.descricao
                        : "Sem descrição registada."}
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
                    <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Diário de Progresso
                    </h3>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1">
                      {carregandoFeedProgresso ? (
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Carregando…
                        </p>
                      ) : feedProgresso.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          Nenhuma atualização ainda.
                        </p>
                      ) : (
                        feedProgresso.map((item) => (
                          <div
                            key={item.id}
                            className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm last:mb-0"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-gray-800 ring-1 ring-gray-200/80">
                                {iniciais(item.usuarios?.nome)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  {item.usuarios?.nome ?? "Usuário"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatarDataHoraProgresso(item.criado_em)}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap text-gray-700">
                              {item.mensagem}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <textarea
                        className="min-h-[80px] w-full rounded-xl border border-gray-700 p-3 text-sm text-gray-700 placeholder:text-gray-500 focus:border-gray-500 focus:ring-1 focus:ring-gray-400 focus:outline-none"
                        placeholder="Nova atualização…"
                        value={textoNovoProgresso}
                        onChange={(e) => setTextoNovoProgresso(e.target.value)}
                        rows={3}
                      />
                      <button
                        type="button"
                        disabled={
                          enviandoProgresso ||
                          !textoNovoProgresso.trim() ||
                          !user?.id
                        }
                        onClick={adicionarAtualizacaoProgresso}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {enviandoProgresso ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando…
                          </>
                        ) : (
                          "Adicionar Atualização"
                        )}
                      </button>
                    </div>
                  </section>

                  <section className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                    <div>
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Designado por
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-gray-800 shadow-sm ring-1 ring-gray-200/80">
                          {iniciais(nomeDesignadorSel)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {nomeDesignadorSel ?? "—"}
                          </p>
                          {escritorioDesignadorSel ? (
                            <p className="text-xs text-gray-500">
                              {escritorioDesignadorSel}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Responsáveis
                      </h3>
                      {respsSel.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          Sem responsáveis atribuídos.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {respsSel.map((r) => (
                            <li
                              key={r.id}
                              className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm"
                            >
                              {r.foto ? (
                                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-gray-200/80">
                                  <img
                                    src={r.foto}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                </span>
                              ) : (
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-gray-800 ring-1 ring-gray-200/80">
                                  {iniciais(r.nome)}
                                </span>
                              )}
                              <span className="text-sm font-semibold text-gray-800">
                                {r.nome && r.nome !== "—"
                                  ? r.nome
                                  : "Responsável"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>

                  {(mostrarConcluirGestor ||
                    mostrarEnviarAprovacao ||
                    mostrarPainelAprovacao) && (
                    <section className="border-t border-gray-100 pt-4">
                      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Ações
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {mostrarConcluirGestor && (
                          <button
                            type="button"
                            disabled={atualizandoStatus}
                            onClick={() =>
                              atualizarStatusTarefa(
                                tarefaSelecionada.id,
                                STATUS.concluida,
                              )
                            }
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
                          >
                            Concluir tarefa
                          </button>
                        )}
                        {mostrarEnviarAprovacao && (
                          <button
                            type="button"
                            disabled={atualizandoStatus}
                            onClick={() =>
                              atualizarStatusTarefa(
                                tarefaSelecionada.id,
                                STATUS.aguardando,
                              )
                            }
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
                          >
                            Enviar para aprovação
                          </button>
                        )}
                        {mostrarPainelAprovacao && (
                          <>
                            <button
                              type="button"
                              disabled={atualizandoStatus}
                              onClick={() =>
                                atualizarStatusTarefa(
                                  tarefaSelecionada.id,
                                  STATUS.concluida,
                                )
                              }
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-800 bg-gray-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
                            >
                              Aprovar e concluir
                            </button>
                            <button
                              type="button"
                              disabled={atualizandoStatus}
                              onClick={() =>
                                atualizarStatusTarefa(
                                  tarefaSelecionada.id,
                                  STATUS.emAndamento,
                                )
                              }
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                            >
                              Recusar / refazer
                            </button>
                          </>
                        )}
                      </div>
                      {atualizandoStatus && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />A
                          atualizar…
                        </p>
                      )}
                    </section>
                  )}
                </div>
              </article>
            </div>
          )}
        </main>
      </div>

      {modalAberto && (
        <ModalPortal>
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
              aria-hidden
              onClick={fecharModal}
            />
            <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800">
                  {editandoId ? "Editar tarefa" : "Nova tarefa"}
                </h2>
                <button
                  type="button"
                  disabled={salvando}
                  onClick={fecharModal}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4 overflow-y-auto p-6">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
                    Título
                  </label>
                  <input
                    className="h-12 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={form.titulo}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, titulo: e.target.value }))
                    }
                    placeholder="Resumo da tarefa"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
                    Descrição
                  </label>
                  <textarea
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    value={form.descricao}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, descricao: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
                      Prazo
                    </label>
                    <input
                      type="date"
                      className="h-12 w-full rounded-xl border border-gray-200 px-3 text-sm"
                      value={form.data_conclusao}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          data_conclusao: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase text-gray-500">
                      Prioridade
                    </label>
                    <select
                      className="h-12 w-full rounded-xl border border-gray-200 px-3 text-sm text-gray-800"
                      value={form.prioridade}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, prioridade: e.target.value }))
                      }
                    >
                      {PRIORIDADES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-gray-500">
                    Responsáveis
                  </label>
                  <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
                    {usuariosLista.length === 0 ? (
                      <p className="p-2 text-sm text-gray-500">Carregando…</p>
                    ) : (
                      usuariosLista.map((u) => (
                        <label
                          key={u.id}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={form.responsaveisIds
                              .map(String)
                              .includes(String(u.id))}
                            onChange={() => toggleResponsavel(u.id)}
                          />
                          <span className="flex-1 text-gray-800">{u.nome}</span>
                          {u.escritorio ? (
                            <span className="text-xs text-gray-500">
                              {u.escritorio}
                            </span>
                          ) : null}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4 shadow-sm">
                <button
                  type="button"
                  disabled={salvando}
                  onClick={fecharModal}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={salvando}
                  onClick={salvarModal}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  {editandoId ? "Guardar alterações" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
