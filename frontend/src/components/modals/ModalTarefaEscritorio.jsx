import { useEffect, useState, useCallback } from "react";
import { Calendar, Loader2, X } from "lucide-react";
import ModalPortal from "../gerais/ModalPortal";
import { ID_VOGELKOP } from "../../constants/escritorios";
import { api } from "../../services/api";
import {
  STATUS as TAREFA_STATUS,
  normalizarStatus,
} from "../../pages/tarefas/tarefasHelpers";
import { useAuth } from "../../contexts/AuthContext";

const PRIORIDADES = ["Alta", "Média", "Baixa"];
const STATUS_VALIDOS = new Set([
  TAREFA_STATUS.pendente,
  TAREFA_STATUS.aguardando,
  TAREFA_STATUS.concluida,
]);

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-esc-text shadow-inner transition-all duration-300 placeholder:text-esc-muted/40 focus:bg-black/60 focus:border-esc-destaque focus:outline-none focus:ring-1 focus:ring-esc-destaque";
const DATE_FIELD_CLASS = `${FIELD_CLASS} calendar-icon-esc`;

const TABS = [
  { id: "visao-geral", label: "Visão Geral" },
  { id: "editar-tarefa", label: "Editar Tarefa" },
];

function iniciaisNome(nome) {
  if (!nome || typeof nome !== "string") return "?";
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0][0]}${p[1][0]}`.toUpperCase();
  return nome.trim().slice(0, 2).toUpperCase() || "?";
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

function emptyForm() {
  return {
    titulo: "",
    descricao: "",
    data_conclusao: "",
    prioridade: "Média",
    status: TAREFA_STATUS.pendente,
    gestor_id: null,
    responsaveis: [],
  };
}

function statusSeguro(status) {
  const normalizado = normalizarStatus(status);
  if (normalizado === TAREFA_STATUS.emAndamento) return TAREFA_STATUS.pendente;
  return STATUS_VALIDOS.has(normalizado) ? normalizado : TAREFA_STATUS.pendente;
}

function mapUsuariosParaEquipe(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map((u) => ({
    id: u.id,
    nome: u.nome ?? "",
  }));
}

export default function ModalTarefaEscritorio({
  isOpen,
  onClose,
  onSaved,
  escritorioId,
  tarefaEdicao,
  usuariosEscritorio,
  usuariosEscritorioProntos,
}) {
  const { user } = useAuth();
  const modoEdicao = Boolean(tarefaEdicao?.id);
  const modoCriacao = !modoEdicao;
  const [form, setForm] = useState(emptyForm);
  const [equipe, setEquipe] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [progressoFeed, setProgressoFeed] = useState([]);
  const [carregandoProgresso, setCarregandoProgresso] = useState(false);
  const [textoNovoProgresso, setTextoNovoProgresso] = useState("");
  const [enviandoProgresso, setEnviandoProgresso] = useState(false);

  const temaClasse =
    escritorioId === ID_VOGELKOP ? "theme-vogelkop" : "theme-ybyoca";
  const overlayClass = `${temaClasse} fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md sm:p-6`;

  const isDonoOuAdmin = [
    "dono",
    "admin",
    "diretoria",
    "gestor_master",
  ].includes(String(user?.tipo || "").toLowerCase());
  const isDono = String(user?.tipo || "").toLowerCase() === "dono";
  const souGestor =
    tarefaEdicao?.gestor_id != null &&
    String(tarefaEdicao.gestor_id) === String(user?.id);
  const donoSemGestor =
    isDonoOuAdmin &&
    !tarefaEdicao?.gestor_id &&
    String(tarefaEdicao?.criador_id || "") === String(user?.id || "");
  const podeConcluir = souGestor || donoSemGestor;
  const donoSemBurocracia =
    isDono &&
    (!tarefaEdicao?.gestor_id ||
      String(tarefaEdicao?.gestor_id) === String(user?.id || ""));
  const podeFinalizar = podeConcluir || donoSemBurocracia;
  const souCriadorDaTarefa =
    modoEdicao &&
    String(tarefaEdicao?.criador_id || "") === String(user?.id || "");
  const podeEditarResponsaveis = modoCriacao || isDono || souCriadorDaTarefa;

  const carregarEquipe = useCallback(async () => {
    const eid = escritorioId ? String(escritorioId).trim() : "";
    if (!eid) {
      setEquipe([]);
      return;
    }
    try {
      const data = await api.getUsuariosTarefaEscritorio(eid);
      setEquipe(mapUsuariosParaEquipe(data));
    } catch (e) {
      console.error("[ModalTarefaEscritorio] equipe:", e);
      setEquipe([]);
    }
  }, [escritorioId]);

  useEffect(() => {
    if (!isOpen || !escritorioId) return;
    if (
      usuariosEscritorioProntos === true &&
      Array.isArray(usuariosEscritorio)
    ) {
      setEquipe(mapUsuariosParaEquipe(usuariosEscritorio));
      return;
    }
    void carregarEquipe();
  }, [
    isOpen,
    escritorioId,
    usuariosEscritorio,
    usuariosEscritorioProntos,
    carregarEquipe,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      if (modoEdicao && tarefaEdicao) {
        const ids = Array.isArray(tarefaEdicao.responsaveis)
          ? tarefaEdicao.responsaveis
              .map((r) => r?.usuario_id)
              .filter(Boolean)
              .map(String)
          : [];
        setForm({
          titulo: tarefaEdicao.titulo ?? "",
          descricao: tarefaEdicao.descricao ?? "",
          data_conclusao: tarefaEdicao.data_conclusao
            ? String(tarefaEdicao.data_conclusao).split("T")[0]
            : "",
          prioridade: tarefaEdicao.prioridade || "Média",
          status: statusSeguro(tarefaEdicao.status),
          gestor_id: tarefaEdicao.gestor_id ?? null,
          responsaveis: ids,
        });
      } else {
        setForm(emptyForm());
      }
      setActiveTab("visao-geral");
      setTextoNovoProgresso("");
    });
  }, [isOpen, modoEdicao, tarefaEdicao]);

  useEffect(() => {
    if (!isOpen || !modoEdicao || !tarefaEdicao?.id) {
      setProgressoFeed([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCarregandoProgresso(true);
      try {
        const rows = await api.getTarefaProgresso(tarefaEdicao.id);
        if (!cancelled) setProgressoFeed(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setProgressoFeed([]);
      } finally {
        if (!cancelled) setCarregandoProgresso(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, modoEdicao, tarefaEdicao?.id]);

  if (!isOpen || !escritorioId || !user?.id) return null;

  const toggleResponsavel = (uid) => {
    const sid = String(uid);
    setForm((prev) => {
      const setIds = new Set(prev.responsaveis.map(String));
      if (setIds.has(sid)) setIds.delete(sid);
      else setIds.add(sid);
      return { ...prev, responsaveis: [...setIds] };
    });
  };

  const adicionarAtualizacaoProgresso = async () => {
    const msg = textoNovoProgresso.trim();
    if (!modoEdicao || !tarefaEdicao?.id || !msg) return;
    setEnviandoProgresso(true);
    try {
      await api.addTarefaProgresso(tarefaEdicao.id, user.id, msg);
      setTextoNovoProgresso("");
      const rows = await api.getTarefaProgresso(tarefaEdicao.id);
      setProgressoFeed(Array.isArray(rows) ? rows : []);
      onSaved?.();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível adicionar a atualização.");
    } finally {
      setEnviandoProgresso(false);
    }
  };

  const atualizarStatusRapido = async (
    novoStatus,
    fecharAoFinalizar = false,
  ) => {
    if (!modoEdicao || !tarefaEdicao?.id) return;
    setSalvando(true);
    try {
      await api.updateTarefaEscritorio(
        tarefaEdicao.id,
        { status: novoStatus },
        escritorioId,
      );
      setForm((prev) => ({ ...prev, status: novoStatus }));
      onSaved?.();
      if (fecharAoFinalizar) onClose();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível atualizar o status.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirTarefa = async () => {
    if (!modoEdicao || !tarefaEdicao?.id) return;
    if (
      !window.confirm("Excluir esta tarefa? Esta ação não pode ser desfeita.")
    ) {
      return;
    }
    setSalvando(true);
    try {
      await api.deleteTarefaEscritorio(tarefaEdicao.id, escritorioId);
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível excluir a tarefa.");
    } finally {
      setSalvando(false);
    }
  };

  const salvar = async () => {
    if (!form.titulo.trim()) {
      alert("Informe o título da tarefa.");
      return;
    }
    if (!form.data_conclusao) {
      alert("Informe a data de vencimento.");
      return;
    }
    if (!podeFinalizar && form.status === TAREFA_STATUS.concluida) {
      alert("Somente o gestor da tarefa pode concluir.");
      return;
    }

    setSalvando(true);
    try {
      const responsaveisUnicos = [...new Set(form.responsaveis.map(String))];
      if (responsaveisUnicos.length === 0) {
        alert("Selecione ao menos um responsável para a tarefa.");
        return;
      }
      const payloadBase = {
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        data_conclusao: form.data_conclusao,
        prioridade: form.prioridade,
        status: form.status,
        gestor_id: form.gestor_id || null,
      };

      if (modoEdicao && tarefaEdicao?.id) {
        await api.updateTarefaEscritorio(
          tarefaEdicao.id,
          { ...payloadBase, responsaveis: responsaveisUnicos },
          escritorioId,
        );
        onSaved?.();
        setActiveTab("visao-geral");
        return;
      } else {
        const todosSaoEu =
          responsaveisUnicos.length > 0 &&
          responsaveisUnicos.every((rid) => rid === String(user.id));
        const gestorId =
          isDonoOuAdmin && responsaveisUnicos.length > 0 && !todosSaoEu
            ? user.id
            : null;

        await api.createTarefaEscritorio({
          ...payloadBase,
          criador_id: user.id,
          gestor_id: gestorId,
          escritorio_id: escritorioId,
          responsaveis: responsaveisUnicos,
        });
      }
      onSaved?.();
      onClose();
    } catch (e) {
      console.error(e);
      alert(
        e?.message ||
          (modoEdicao ? "Erro ao atualizar tarefa." : "Erro ao criar tarefa."),
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalPortal>
      <div className={overlayClass} role="dialog" aria-modal="true">
        {modoCriacao ? (
          <div className="animate-premium-reveal relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-esc-card shadow-[0_0_80px_-15px_var(--color-esc-destaque)]">
            <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]" />

            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h2 className="text-lg font-bold tracking-tight text-esc-text">
                Nova tarefa
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-esc-muted transition-all hover:bg-white/10 hover:text-esc-text"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="custom-scrollbar flex flex-col gap-5 overflow-y-auto p-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Título
                </label>
                <input
                  type="text"
                  className={`${FIELD_CLASS} mt-2`}
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Resumo da tarefa"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Descrição
                </label>
                <textarea
                  className={`${FIELD_CLASS} mt-2 min-h-[120px] resize-y`}
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  placeholder="Contexto e detalhes..."
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-esc-muted">
                    <Calendar className="h-3.5 w-3.5 text-esc-destaque" />
                    Data
                  </label>
                  <input
                    type="date"
                    className={`${DATE_FIELD_CLASS} mt-2`}
                    value={form.data_conclusao}
                    onChange={(e) =>
                      setForm({ ...form, data_conclusao: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                    Prioridade
                  </label>
                  <select
                    className={`${FIELD_CLASS} mt-2`}
                    value={form.prioridade}
                    onChange={(e) =>
                      setForm({ ...form, prioridade: e.target.value })
                    }
                  >
                    {PRIORIDADES.map((p) => (
                      <option
                        key={p}
                        value={p}
                        className="bg-esc-bg text-esc-text"
                      >
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Responsáveis
                </label>
                <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                  {equipe.map((u) => {
                    const uid = String(u.id);
                    const checked = form.responsaveis.map(String).includes(uid);
                    return (
                      <button
                        key={uid}
                        type="button"
                        disabled={!podeEditarResponsaveis}
                        onClick={() => toggleResponsavel(uid)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                          checked
                            ? "border-esc-destaque/50 bg-esc-destaque/20 text-esc-destaque"
                            : "border-white/10 bg-white/5 text-esc-muted hover:bg-white/10 hover:text-esc-text"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {u.nome || "—"}
                      </button>
                    );
                  })}
                  {equipe.length === 0 ? (
                    <p className="text-xs text-esc-muted">
                      Nenhum usuário disponível.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-esc-muted transition-colors hover:bg-white/5 hover:text-esc-text"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={salvando || !form.titulo.trim()}
                className="w-full rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 py-3 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all hover:bg-esc-destaque/30 disabled:opacity-50"
              >
                {salvando ? "Salvando…" : "Criar tarefa"}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-premium-reveal relative flex h-[95vh] w-[95vw] max-w-7xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-esc-card shadow-[0_0_80px_-15px_var(--color-esc-destaque)] md:flex-row">
            <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]" />

            <div className="custom-scrollbar flex flex-1 flex-col overflow-y-auto p-6 md:p-10">
              <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  {TABS.map((tab) => {
                    const ativa = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                          ativa
                            ? "border-esc-destaque/50 bg-esc-destaque/20 text-esc-destaque shadow-[0_0_16px_-8px_var(--color-esc-destaque)]"
                            : "border-white/10 bg-white/5 text-esc-muted hover:bg-white/10 hover:text-esc-text"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-esc-muted transition-all hover:bg-white/10 hover:text-esc-text"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {activeTab === "visao-geral" ? (
                <>
                  <div className="space-y-3 border-b border-white/10 pb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-esc-text md:text-4xl">
                      {form.titulo || "Sem título"}
                    </h1>
                    <p className="text-xs text-esc-muted">
                      Visão geral · acompanhe contexto e histórico de progresso
                    </p>
                  </div>

                  <div className="mt-8">
                    <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                      Descrição
                    </label>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-esc-text/90">
                      {form.descricao?.trim() || "Sem descrição"}
                    </p>
                  </div>

                  <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
                    <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-esc-text">
                      Diário de Progresso
                    </h3>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1">
                      {carregandoProgresso ? (
                        <p className="text-xs text-esc-muted">Carregando…</p>
                      ) : progressoFeed.length === 0 ? (
                        <p className="text-xs text-esc-muted">
                          Nenhuma atualização ainda.
                        </p>
                      ) : (
                        progressoFeed.map((item) => (
                          <div
                            key={item.id}
                            className="mb-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3 last:mb-0"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-esc-text ring-1 ring-white/10">
                                {iniciaisNome(item.usuarios?.nome)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                  {item.usuarios?.nome ?? "Usuário"}
                                </p>
                                <p className="text-xs text-esc-muted">
                                  {formatarDataHoraProgresso(item.criado_em)}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm whitespace-pre-wrap text-gray-300">
                              {item.mensagem}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <textarea
                        className="min-h-[80px] w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white focus:ring-1 focus:ring-esc-destaque focus:outline-none"
                        placeholder="Escreva uma nova atualização…"
                        value={textoNovoProgresso}
                        onChange={(e) => setTextoNovoProgresso(e.target.value)}
                        rows={3}
                      />
                      <button
                        type="button"
                        disabled={
                          enviandoProgresso ||
                          !textoNovoProgresso.trim() ||
                          !modoEdicao
                        }
                        onClick={adicionarAtualizacaoProgresso}
                        className="mt-2 rounded-lg border border-esc-destaque/50 bg-esc-destaque/20 px-4 py-2 font-bold text-esc-destaque transition-all hover:bg-esc-destaque/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {enviandoProgresso ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando…
                          </span>
                        ) : (
                          "Adicionar Atualização"
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                      Título
                    </label>
                    <input
                      type="text"
                      className={`${FIELD_CLASS} mt-2`}
                      value={form.titulo}
                      onChange={(e) =>
                        setForm({ ...form, titulo: e.target.value })
                      }
                      placeholder="Título da tarefa"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                      Descrição
                    </label>
                    <textarea
                      className={`${FIELD_CLASS} mt-2 min-h-[160px] resize-y`}
                      value={form.descricao}
                      onChange={(e) =>
                        setForm({ ...form, descricao: e.target.value })
                      }
                      placeholder="Detalhes da tarefa..."
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-esc-muted">
                        <Calendar className="h-3.5 w-3.5 text-esc-destaque" />
                        Data de Vencimento
                      </label>
                      <input
                        type="date"
                        className={`${DATE_FIELD_CLASS} mt-2`}
                        value={form.data_conclusao}
                        onChange={(e) =>
                          setForm({ ...form, data_conclusao: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                        Prioridade
                      </label>
                      <select
                        className={`${FIELD_CLASS} mt-2`}
                        value={form.prioridade}
                        onChange={(e) =>
                          setForm({ ...form, prioridade: e.target.value })
                        }
                      >
                        {PRIORIDADES.map((p) => (
                          <option
                            key={p}
                            value={p}
                            className="bg-esc-bg text-esc-text"
                          >
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                      Gestor
                    </label>
                    <select
                      className={`${FIELD_CLASS} mt-2`}
                      value={form.gestor_id || ""}
                      disabled={!podeEditarResponsaveis}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          gestor_id: e.target.value ? e.target.value : null,
                        })
                      }
                    >
                      <option value="" className="bg-esc-bg text-esc-text">
                        Sem gestor
                      </option>
                      {equipe.map((u) => (
                        <option
                          key={String(u.id)}
                          value={String(u.id)}
                          className="bg-esc-bg text-esc-text"
                        >
                          {u.nome || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                      Responsáveis
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-black/30 p-3">
                      {equipe.map((u) => {
                        const uid = String(u.id);
                        const checked = form.responsaveis
                          .map(String)
                          .includes(uid);
                        return (
                          <button
                            key={uid}
                            type="button"
                            disabled={!podeEditarResponsaveis}
                            onClick={() => toggleResponsavel(uid)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                              checked
                                ? "border-esc-destaque/50 bg-esc-destaque/20 text-esc-destaque"
                                : "border-white/10 bg-white/5 text-esc-muted hover:bg-white/10 hover:text-esc-text"
                            } disabled:cursor-not-allowed disabled:opacity-60`}
                          >
                            {u.nome || "—"}
                          </button>
                        );
                      })}
                      {equipe.length === 0 ? (
                        <p className="text-xs text-esc-muted">
                          Nenhum usuário disponível.
                        </p>
                      ) : null}
                    </div>
                    {!podeEditarResponsaveis ? (
                      <p className="mt-2 text-xs text-esc-muted">
                        Apenas o dono ou a administração podem alterar
                        responsáveis nesta tarefa.
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={salvar}
                    disabled={salvando || !form.titulo.trim()}
                    className="w-full rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 py-3 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all hover:bg-esc-destaque/30 disabled:opacity-50"
                  >
                    {salvando ? "Salvando…" : "Salvar Alterações"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-esc-muted transition-colors hover:bg-white/5 hover:text-esc-text"
                  >
                    Cancelar
                  </button>
                  {modoEdicao ? (
                    <button
                      type="button"
                      onClick={excluirTarefa}
                      disabled={salvando}
                      className="w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-esc-muted transition-colors hover:border-esc-destaque/35 hover:bg-white/5 hover:text-esc-destaque disabled:opacity-50"
                    >
                      Excluir tarefa
                    </button>
                  ) : null}
                </div>
              )}
              <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5">
                {activeTab === "visao-geral" &&
                form.status === TAREFA_STATUS.pendente ? (
                  donoSemBurocracia ? (
                    <button
                      type="button"
                      onClick={() =>
                        atualizarStatusRapido(TAREFA_STATUS.concluida, true)
                      }
                      disabled={salvando}
                      className="w-full rounded-xl border border-emerald-500 bg-emerald-500/20 py-3 text-sm font-bold text-emerald-400 shadow-[0_0_20px_-5px_var(--color-emerald-500)] transition-all hover:bg-emerald-500/30"
                    >
                      Concluir Tarefa
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        atualizarStatusRapido(TAREFA_STATUS.aguardando)
                      }
                      disabled={salvando}
                      className="w-full rounded-xl border border-esc-destaque/45 bg-esc-destaque/15 py-3 text-sm font-semibold text-esc-destaque transition-all hover:bg-esc-destaque/25"
                    >
                      Enviar para Aprovação
                    </button>
                  )
                ) : null}
                {activeTab === "visao-geral" &&
                form.status === TAREFA_STATUS.aguardando ? (
                  podeFinalizar ? (
                    <button
                      type="button"
                      onClick={() =>
                        atualizarStatusRapido(TAREFA_STATUS.concluida, true)
                      }
                      disabled={salvando}
                      className="w-full rounded-xl border border-emerald-500 bg-emerald-500/20 py-3 text-sm font-bold text-emerald-400 shadow-[0_0_20px_-5px_var(--color-emerald-500)] transition-all hover:bg-emerald-500/30"
                    >
                      Validar e Concluir Tarefa
                    </button>
                  ) : (
                    <p className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center text-xs text-esc-muted">
                      Aguardando validação do Gestor
                    </p>
                  )
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalPortal>
  );
}
