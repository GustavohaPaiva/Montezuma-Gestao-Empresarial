import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Droplets,
  FileSpreadsheet,
  Wallet,
  ListTodo,
  CalendarCheck,
  Briefcase,
  TrendingUp,
  Flame,
  ChevronRight,
  Clock3,
  Loader2,
  Check,
  Circle,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { ESCRITORIO_NOME_POR_ID } from "../../constants/escritorios";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import { api } from "../../services/api";
import { useEscritorioIdFromPath } from "../../hooks/useEscritorioIdFromPath";
import { STATUS as TAREFA_STATUS } from "../tarefas/tarefasHelpers";

const ACESSOS_RAPIDOS = [
  {
    id: "clientes",
    titulo: "Projetos",
    descricao: "Processos e clientes",
    path: "clientes",
    Icon: Briefcase,
  },
  {
    id: "financeiro",
    titulo: "Financeiro",
    descricao: "Entradas e saídas",
    path: "financeiro",
    Icon: Wallet,
  },
  {
    id: "orcamentos",
    titulo: "Orçamentos",
    descricao: "Propostas do escritório",
    path: "orcamentos",
    Icon: FileSpreadsheet,
  },
  {
    id: "tarefas",
    titulo: "Tarefas",
    descricao: "Tarefas do escritório",
    path: "tarefas",
    Icon: ListTodo,
  },
  {
    id: "agenda",
    titulo: "Agenda",
    descricao: "Compromissos",
    path: "agenda",
    Icon: CalendarCheck,
  },
];

const PRIORIDADE_PESO = { Alta: 0, Média: 1, Media: 1, Baixa: 2 };

const TIPOS_ADMIN_CONCLUI = new Set([
  "dono",
  "admin",
  "diretoria",
  "gestor_master",
]);

function dataHojeExtenso() {
  const raw = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function formatarDataBR(raw) {
  if (!raw) return "—";
  const d = new Date(`${String(raw).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function diasAte(raw) {
  if (!raw) return null;
  const alvo = new Date(`${String(raw).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function prazoLabel(raw) {
  const d = diasAte(raw);
  if (d == null) return "Sem prazo";
  if (d < 0) return `Atrasada · ${Math.abs(d)}d`;
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  return `Em ${d}d`;
}

function prazoClass(raw) {
  const d = diasAte(raw);
  if (d == null) return "text-esc-muted";
  if (d < 0) return "text-rose-300";
  if (d <= 2) return "text-amber-300";
  return "text-esc-muted";
}

function formatarMoeda(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function badgePrioridade(prio) {
  const p = String(prio || "").trim();
  if (p === "Alta") {
    return "border-rose-400/40 bg-rose-400/15 text-rose-300";
  }
  if (p === "Média" || p === "Media") {
    return "border-amber-400/40 bg-amber-400/15 text-amber-300";
  }
  return "border-white/10 bg-white/5 text-esc-muted";
}

export default function HomeEscritorio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const escritorioIdPath = useEscritorioIdFromPath();
  const escritorioId = escritorioIdPath || user?.escritorio_id || null;
  const nomeEscritorio = ESCRITORIO_NOME_POR_ID[escritorioId] ?? "Escritório";

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [kpis, setKpis] = useState({
    novosOrcamentos: null,
    projetosAtivos: null,
    tarefasUrgentes: null,
    taxaConversao: null,
  });
  const [filaTrabalho, setFilaTrabalho] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [marcandoId, setMarcandoId] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!escritorioId) return;
    setLoading(true);
    setErro(null);
    try {
      const agora = new Date();
      const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const hojeStr = new Date().toISOString().slice(0, 10);
      const daqui2 = new Date();
      daqui2.setDate(daqui2.getDate() + 2);
      const daqui2Str = daqui2.toISOString().slice(0, 10);
      const daqui7 = new Date();
      daqui7.setDate(daqui7.getDate() + 7);
      const daqui7Str = daqui7.toISOString().slice(0, 10);

      const [
        orcamentosMes,
        orcamentosFechadosMes,
        projetosProducao,
        tarefasUrgentes,
        tarefasAbertas,
        pagar7d,
        receber7d,
      ] = await Promise.all([
        supabase
          .from("orcamentos")
          .select("id", { count: "exact", head: true })
          .eq("escritorio_id", escritorioId)
          .gte("data", primeiroDiaMes),
        supabase
          .from("orcamentos")
          .select("id", { count: "exact", head: true })
          .eq("escritorio_id", escritorioId)
          .gte("data", primeiroDiaMes)
          .eq("status", "Fechado"),
        supabase
          .from("clientes")
          .select("id", { count: "exact", head: true })
          .eq("escritorio_id", escritorioId)
          .eq("status", "Produção"),
        supabase
          .from("tarefas")
          .select("id", { count: "exact", head: true })
          .eq("escritorio_id", escritorioId)
          .neq("status", TAREFA_STATUS.concluida)
          .or(`prioridade.eq.Alta,data_conclusao.lte.${daqui2Str}`),
        supabase
          .from("tarefas")
          .select("id, titulo, prioridade, status, data_conclusao")
          .eq("escritorio_id", escritorioId)
          .neq("status", TAREFA_STATUS.concluida)
          .order("data_conclusao", { ascending: true })
          .limit(20),
        supabase
          .from("saida")
          .select("id, descricao, valor, data, forma")
          .eq("escritorio_id", escritorioId)
          .eq("validacao", 0)
          .gte("data", hojeStr)
          .lte("data", daqui7Str)
          .order("data", { ascending: true })
          .limit(5),
        supabase
          .from("entradas")
          .select("id, descricao, valor, data, forma")
          .eq("escritorio_id", escritorioId)
          .eq("validacao", 0)
          .gte("data", hojeStr)
          .lte("data", daqui7Str)
          .order("data", { ascending: true })
          .limit(5),
      ]);

      if (orcamentosMes.error) throw orcamentosMes.error;
      if (orcamentosFechadosMes.error) throw orcamentosFechadosMes.error;
      if (projetosProducao.error) throw projetosProducao.error;
      if (tarefasUrgentes.error) throw tarefasUrgentes.error;
      if (tarefasAbertas.error) throw tarefasAbertas.error;
      if (pagar7d.error) throw pagar7d.error;
      if (receber7d.error) throw receber7d.error;

      const totalMes = orcamentosMes.count ?? 0;
      const fechadosMes = orcamentosFechadosMes.count ?? 0;
      const taxa =
        totalMes > 0 ? Math.round((fechadosMes / totalMes) * 100) : null;

      setKpis({
        novosOrcamentos: totalMes,
        projetosAtivos: projetosProducao.count ?? 0,
        tarefasUrgentes: tarefasUrgentes.count ?? 0,
        taxaConversao: taxa,
      });

      const listaTarefas = Array.isArray(tarefasAbertas.data)
        ? [...tarefasAbertas.data]
        : [];
      listaTarefas.sort((a, b) => {
        const pa = PRIORIDADE_PESO[a.prioridade] ?? 99;
        const pb = PRIORIDADE_PESO[b.prioridade] ?? 99;
        if (pa !== pb) return pa - pb;
        const da = a.data_conclusao || "9999-12-31";
        const db = b.data_conclusao || "9999-12-31";
        return String(da).localeCompare(String(db));
      });
      setFilaTrabalho(listaTarefas.slice(0, 6));
      setContasPagar(Array.isArray(pagar7d.data) ? pagar7d.data : []);
      setContasReceber(Array.isArray(receber7d.data) ? receber7d.data : []);
    } catch (e) {
      console.error("[HomeEscritorio] fetch:", e);
      setErro(e?.message || "Não foi possível carregar os dados.");
      setKpis({
        novosOrcamentos: 0,
        projetosAtivos: 0,
        tarefasUrgentes: 0,
        taxaConversao: null,
      });
      setFilaTrabalho([]);
      setContasPagar([]);
      setContasReceber([]);
    } finally {
      setLoading(false);
    }
  }, [escritorioId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchDashboard();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchDashboard]);

  const marcarConcluida = async (tarefa) => {
    if (!tarefa?.id || !escritorioId) return;
    const tipo = String(user?.tipo || "").toLowerCase();
    const novoStatus = TIPOS_ADMIN_CONCLUI.has(tipo)
      ? TAREFA_STATUS.concluida
      : TAREFA_STATUS.aguardando;
    setMarcandoId(tarefa.id);
    try {
      await api.updateTarefaEscritorio(
        tarefa.id,
        { status: novoStatus },
        escritorioId,
      );
      setFilaTrabalho((prev) => prev.filter((t) => t.id !== tarefa.id));
      void fetchDashboard();
    } catch (e) {
      console.error(e);
      alert(e?.message || "Não foi possível atualizar a tarefa.");
    } finally {
      setMarcandoId(null);
    }
  };

  const KPI_CARDS = [
    {
      id: "novosOrcamentos",
      label: "Novos Orçamentos",
      hint: "Entrados este mês",
      valor: kpis.novosOrcamentos,
      sufixo: null,
      Icon: FileSpreadsheet,
    },
    {
      id: "projetosAtivos",
      label: "Projetos Ativos",
      hint: "Processos em Produção",
      valor: kpis.projetosAtivos,
      sufixo: null,
      Icon: Briefcase,
    },
    {
      id: "tarefasUrgentes",
      label: "Tarefas Urgentes",
      hint: "Alta prioridade ou prazo ≤ 2d",
      valor: kpis.tarefasUrgentes,
      sufixo: null,
      Icon: Flame,
    },
    {
      id: "taxaConversao",
      label: "Taxa de Conversão",
      hint: "Fechados ÷ total do mês",
      valor: kpis.taxaConversao,
      sufixo: "%",
      Icon: TrendingUp,
    },
  ];

  return (
    <div className="relative w-full max-w-full overflow-x-hidden">
      <div
        className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[min(400px,70vh)] w-[min(800px,100vw)] max-w-full -translate-x-1/2 bg-esc-destaque opacity-10 blur-[150px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full flex-col gap-8">
        <div className="relative w-full overflow-hidden rounded-2xl border mt-4 border-white/5 bg-esc-card/30 p-6 backdrop-blur-sm">
          <Droplets
            className="pointer-events-none absolute -bottom-6 -right-4 h-40 w-40 text-esc-destaque opacity-[0.05] sm:h-48 sm:w-48"
            strokeWidth={1}
            aria-hidden
          />
          <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="min-w-0">
              <h1 className="flex flex-col gap-2 text-3xl font-bold tracking-tight text-esc-text sm:flex-row">
                Bem-Vindo ao{" "}
                <p className="text-esc-destaque">{nomeEscritorio}</p>
              </h1>
              <p className="mt-2 text-base text-esc-muted">
                {dataHojeExtenso()}
              </p>
            </div>
          </div>
        </div>

        <section aria-labelledby="acessos-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2
                id="acessos-title"
                className="text-md font-bold uppercase tracking-wider text-esc-destaque"
              >
                Acessos Rápidos
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {ACESSOS_RAPIDOS.map((item) => {
              const { Icon } = item;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="group relative flex h-[170px] flex-col justify-between overflow-hidden rounded-xl border border-white/10 bg-esc-card/60 p-4 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-esc-destaque/60 hover:shadow-[0_0_40px_-10px_var(--color-esc-destaque)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 -top-10 h-20 bg-esc-destaque opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-20" />
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-esc-muted transition-all duration-300 group-hover:border-esc-destaque/40 group-hover:bg-esc-destaque/20 group-hover:text-esc-destaque">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-esc-text transition-colors duration-300 group-hover:text-white">
                      {item.titulo}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-esc-muted">
                      {item.descricao}
                    </p>
                  </div>
                  <ChevronRight
                    className="pointer-events-none absolute right-3 top-4 h-4 w-4 text-esc-muted opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-esc-destaque group-hover:opacity-100"
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="kpi-title">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="kpi-title"
              className="text-md font-bold uppercase tracking-wider text-esc-destaque"
            >
              Resumo do mês
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-esc-muted">
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  Atualizando…
                </>
              ) : (
                "Atualizado agora"
              )}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {KPI_CARDS.map((kpi) => {
              const { Icon } = kpi;
              const mostrarSkeleton = loading || kpi.valor === null;
              return (
                <div
                  key={kpi.id}
                  className="group relative overflow-hidden rounded-xl border border-white/5 bg-esc-card/40 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-esc-destaque/40 hover:shadow-[0_0_30px_-15px_var(--color-esc-destaque)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-esc-muted">
                        {kpi.label}
                      </p>
                      {mostrarSkeleton ? (
                        <div className="mt-2 h-9 w-20 animate-pulse rounded-lg bg-white/5" />
                      ) : (
                        <p className="mt-2 text-3xl font-bold tracking-tight text-esc-text">
                          {kpi.valor}
                          {kpi.sufixo ? (
                            <span className="text-xl text-esc-muted">
                              {kpi.sufixo}
                            </span>
                          ) : null}
                        </p>
                      )}
                      <p className="mt-2 text-[11px] text-esc-muted">
                        {kpi.hint}
                      </p>
                    </div>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-esc-muted transition-colors duration-300 group-hover:border-esc-destaque/30 group-hover:bg-esc-destaque/15 group-hover:text-esc-destaque">
                      <Icon
                        className="h-5 w-5"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {erro ? (
            <p className="mt-3 text-[11px] text-rose-300/80">{erro}</p>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="min-h-[380px] rounded-xl border border-white/5 bg-esc-card/40 shadow-sm backdrop-blur-sm lg:col-span-2">
            <header className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-esc-destaque">
                  <ListTodo className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-esc-text">
                    Minha Fila de Trabalho
                  </h3>
                  <p className="text-[11px] text-esc-muted">
                    Ordenadas por prioridade e prazo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("tarefas")}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-esc-muted transition hover:border-esc-destaque/40 hover:bg-esc-destaque/10 hover:text-esc-destaque"
              >
                Ver todas
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </header>

            <ul className="divide-y divide-white/5">
              {loading ? (
                <li className="flex items-center justify-center gap-2 px-5 py-10 text-xs text-esc-muted">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Carregando…
                </li>
              ) : filaTrabalho.length === 0 ? (
                <li className="px-5 py-10 text-center text-xs text-esc-muted">
                  Sem tarefas em aberto. Tudo em dia.
                </li>
              ) : (
                filaTrabalho.map((t) => {
                  const marcando = marcandoId === t.id;
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.03]"
                    >
                      <button
                        type="button"
                        onClick={() => marcarConcluida(t)}
                        disabled={marcando}
                        title="Marcar como concluída"
                        aria-label="Marcar como concluída"
                        className="group inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-esc-muted transition-all duration-200 hover:border-emerald-400/60 hover:bg-emerald-400/15 hover:text-emerald-300 disabled:cursor-wait disabled:opacity-60"
                      >
                        {marcando ? (
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden
                          />
                        ) : (
                          <>
                            <Circle
                              className="h-3.5 w-3.5 group-hover:hidden"
                              aria-hidden
                            />
                            <Check
                              className="hidden h-3.5 w-3.5 group-hover:block"
                              aria-hidden
                            />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate("tarefas")}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-esc-text">
                            {t.titulo || "Sem título"}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] ${prazoClass(
                              t.data_conclusao,
                            )}`}
                          >
                            <Clock3 className="h-3 w-3" aria-hidden />
                            {prazoLabel(t.data_conclusao)} ·{" "}
                            {formatarDataBR(t.data_conclusao)}
                          </span>
                        </span>
                        <span
                          className={`justify-self-end inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgePrioridade(
                            t.prioridade,
                          )}`}
                        >
                          {t.prioridade || "—"}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </article>

          <aside className="rounded-xl border border-white/5 bg-esc-card/40 shadow-sm backdrop-blur-sm">
            <header className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-esc-destaque">
                  <Wallet className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-esc-text">
                    Financeiro · 7 dias
                  </h3>
                  <p className="text-[11px] text-esc-muted">
                    Pendências do escritório
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("financeiro")}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-esc-muted transition hover:border-esc-destaque/40 hover:bg-esc-destaque/10 hover:text-esc-destaque"
              >
                Abrir
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </header>

            <div className="flex flex-col gap-4 p-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-300/80">
                  <ArrowUpRight className="h-3 w-3" aria-hidden />A Pagar
                </p>
                {loading ? (
                  <p className="text-xs text-esc-muted">Carregando…</p>
                ) : contasPagar.length === 0 ? (
                  <p className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] text-esc-muted">
                    Sem vencimentos nos próximos 7 dias.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {contasPagar.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-esc-text">
                            {c.descricao || "Sem descrição"}
                          </p>
                          <p className="text-[10px] text-esc-muted">
                            {formatarDataBR(c.data)} · {prazoLabel(c.data)}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-rose-300">
                          {formatarMoeda(c.valor)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="h-px bg-white/5" />

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300/80">
                  <ArrowDownLeft className="h-3 w-3" aria-hidden />A Receber
                </p>
                {loading ? (
                  <p className="text-xs text-esc-muted">Carregando…</p>
                ) : contasReceber.length === 0 ? (
                  <p className="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] text-esc-muted">
                    Sem recebimentos previstos.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {contasReceber.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-esc-text">
                            {c.descricao || "Sem descrição"}
                          </p>
                          <p className="text-[10px] text-esc-muted">
                            {formatarDataBR(c.data)} · {prazoLabel(c.data)}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-emerald-300">
                          {formatarMoeda(c.valor)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
