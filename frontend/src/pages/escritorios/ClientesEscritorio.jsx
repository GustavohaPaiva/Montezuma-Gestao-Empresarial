import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, UserPlus } from "lucide-react";
import { supabase } from "../../services/supabase";
import { api } from "../../services/api";
import ModalPortal from "../../components/gerais/ModalPortal";
import {
  ESCRITORIO_NOME_POR_ID,
  ID_VOGELKOP,
} from "../../constants/escritorios";
import { useEscritorioIdFromPath } from "../../hooks/useEscritorioIdFromPath";
import ModalClienteEscritorio from "../../components/modals/ModalClienteEscritorio";

const STATUS_FILTRO = [
  "Tudo",
  "Produção",
  "Prefeitura",
  "Caixa",
  "Cartorio",
  "Obra",
  "Finalizado",
];

const formatarDataBR = (dataString) => {
  if (!dataString) return "—";
  const data = new Date(dataString);
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

const formatarMoeda = (valor) => {
  const n = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const inputBarClass =
  "w-full rounded-xl border border-esc-border/70 bg-esc-bg/35 px-3 py-2.5 text-sm text-esc-text shadow-inner backdrop-blur-md transition-all duration-300 placeholder:text-esc-muted/60 focus:border-esc-destaque/55 focus:outline-none focus:ring-2 focus:ring-esc-destaque/20";

const inputDateBarClass =
  "w-full min-w-0 rounded-xl border border-esc-border/70 bg-esc-bg/35 px-3 py-2.5 text-sm text-esc-text shadow-inner backdrop-blur-md transition-all duration-300 focus:border-esc-destaque/55 focus:outline-none focus:ring-2 focus:ring-esc-destaque/20";

function clienteEstaFinalizado(status) {
  const s = (status || "").trim().toLowerCase();
  return s.includes("finaliz");
}

function ClienteStatusBadge({ status }) {
  const raw = (status || "").trim();
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm";
  if (!raw) {
    return (
      <span className={`${base} border-esc-border bg-esc-bg/70 text-esc-muted`}>
        —
      </span>
    );
  }
  const s = raw.toLowerCase();
  let tone = "border-esc-border/80 bg-black/50 text-esc-muted";
  if (clienteEstaFinalizado(status)) {
    tone =
      "border-status-concluida-text/45 bg-black/50 text-status-concluida-text";
  } else if (s === "produção" || s === "producao") {
    tone = "border-purple-700 bg-black/50 text-purple-700";
  } else if (s === "prefeitura") {
    tone =
      "border-status-andamento-text/45 bg-black/50 text-status-andamento-text";
  } else if (s === "caixa") {
    tone = "border-teal-700 bg-black/50 text-teal-700";
  } else if (s === "cartorio" || s === "cartório") {
    tone = "border-rose-600 bg-black/50 text-rose-600";
  } else if (s === "obra") {
    tone = "border-blue-700 bg-black/50 text-blue-700";
  }
  return <span className={`${base} ${tone}`}>{raw}</span>;
}

function ListaSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-xl border border-white/5 bg-esc-card/50 p-4 backdrop-blur-md"
        >
          <div className="h-12 w-12 shrink-0 rounded-lg bg-white/5" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-white/5" />
            <div className="h-3 w-1/2 rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ClientesEscritorio() {
  const navigate = useNavigate();
  const currentEscritorioId = useEscritorioIdFromPath();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEdicao, setClienteEdicao] = useState(null);

  const temaClasse =
    currentEscritorioId === ID_VOGELKOP ? "theme-vogelkop" : "theme-ybyoca";

  const [dialogo, setDialogo] = useState({
    aberto: false,
    titulo: "",
    mensagem: "",
    botoes: [],
  });

  const fecharDialogo = () =>
    setDialogo({ aberto: false, titulo: "", mensagem: "", botoes: [] });

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("clientes")
      .select("*")
      .eq("escritorio_id", currentEscritorioId)
      .order("data", { ascending: false });
    if (fetchError) {
      console.error(fetchError);
      setError(fetchError.message || "Erro ao carregar clientes.");
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  }, [currentEscritorioId]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void load();
    });
    return () => cancelAnimationFrame(id);
  }, [load]);

  const linhas = useMemo(() => {
    let lista = [...rows];
    if (filtroDataInicio && filtroDataFim) {
      const t0 = new Date(filtroDataInicio).getTime();
      const t1 = new Date(filtroDataFim).getTime();
      lista = lista.filter((item) => {
        const t = new Date(item.data || item.created_at).getTime();
        return t >= t0 && t <= t1;
      });
    }
    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      lista = lista.filter(
        (item) =>
          item.nome?.toLowerCase().includes(q) ||
          item.status?.toLowerCase().includes(q) ||
          item.tipo?.toLowerCase().includes(q),
      );
    }
    if (filtroStatus !== "Tudo") {
      lista = lista.filter((item) => item.status === filtroStatus);
    }
    const pipeline = ["Produção", "Prefeitura", "Caixa", "Cartorio", "Obra"];
    const pesoCliente = (st) => {
      const raw = (st || "").trim().toLowerCase();
      if (clienteEstaFinalizado(st)) return 100;
      const idx = pipeline.findIndex((o) => o.toLowerCase() === raw);
      if (idx >= 0) return idx;
      return 50;
    };
    lista.sort((a, b) => {
      const pa = pesoCliente(a.status);
      const pb = pesoCliente(b.status);
      if (pa !== pb) return pa - pb;
      return (
        new Date(b.data || b.created_at).getTime() -
        new Date(a.data || a.created_at).getTime()
      );
    });
    return lista;
  }, [rows, busca, filtroStatus, filtroDataInicio, filtroDataFim]);

  async function handleSalvarCliente(payload) {
    try {
      if (payload.id) {
        if (payload.escritorio_id !== currentEscritorioId) return;
        await api.updateCliente(
          payload.id,
          {
            nome: payload.nome,
            tipo: payload.tipo,
            pagamento: payload.pagamento,
            valor_pago: payload.valor_pago,
            status: payload.status,
          },
          currentEscritorioId,
        );
      } else {
        await api.createCliente({
          nome: payload.nome,
          tipo: payload.tipo,
          pagamento: payload.pagamento ?? "À combinar",
          status: payload.status || "Produção",
          data: new Date().toISOString(),
          escritorio_id: currentEscritorioId,
          valor_pago: payload.valor_pago ?? 0,
        });
      }
      setModalAberto(false);
      setClienteEdicao(null);
      await load();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar cliente.");
    }
  }

  const abrirExcluirCliente = (c) => {
    if (c.escritorio_id !== currentEscritorioId) return;
    setDialogo({
      aberto: true,
      titulo: "Excluir Registro",
      mensagem:
        "Tem certeza que deseja excluir este cliente? Essa ação não pode ser desfeita.",
      botoes: [
        {
          texto: "Cancelar",
          className:
            "rounded-xl border border-white/10 bg-transparent text-esc-text hover:bg-white/5",
          onClick: fecharDialogo,
        },
        {
          texto: "Excluir",
          className:
            "rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 text-esc-destaque hover:bg-esc-destaque/30 shadow-[0_0_15px_-3px_var(--color-esc-destaque)]",
          onClick: async () => {
            try {
              await api.deleteCliente(c.id, currentEscritorioId);
              fecharDialogo();
              await load();
            } catch (e) {
              console.error(e);
              alert("Erro ao excluir cliente.");
            }
          },
        },
      ],
    });
  };

  const nomeEscritorio =
    ESCRITORIO_NOME_POR_ID[currentEscritorioId] ?? "o escritório";

  return (
    <div className="w-full pb-12">
      {dialogo.aberto && (
        <ModalPortal>
          <div
            className={`${temaClasse} fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity`}
          >
            <div className="animate-premium-reveal relative flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-2xl border border-white/20 bg-esc-card p-7 text-center shadow-[0_0_80px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]"></div>
              <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/10 blur-[70px]"></div>

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-esc-destaque/30 bg-esc-destaque/10 shadow-[0_0_15px_-3px_var(--color-esc-destaque)]">
                <svg
                  className="h-8 w-8 text-esc-destaque"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <div>
                <h3 className="mb-2 text-xl font-bold text-esc-text">
                  {dialogo.titulo}
                </h3>
                <p className="text-sm leading-relaxed text-esc-muted">
                  {dialogo.mensagem}
                </p>
              </div>

              <div
                className={`mt-4 flex ${dialogo.botoes.length > 2 ? "flex-col gap-3" : "w-full flex-row justify-center gap-3"}`}
              >
                {dialogo.botoes.map((btn, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={btn.onClick}
                    className={`px-4 py-3 text-sm font-semibold transition-all duration-300 ${btn.className} ${dialogo.botoes.length > 2 ? "w-full" : "flex-1"}`}
                  >
                    {btn.texto}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 mt-4 flex cursor-pointer items-center gap-2 text-esc-muted transition-colors hover:text-esc-destaque"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Voltar
      </button>

      <header className="mb-6 flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-esc-text md:text-3xl">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-esc-muted">
            Base de clientes — {nomeEscritorio}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setClienteEdicao(null);
            setModalAberto(true);
          }}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-esc-destaque/30 bg-esc-destaque/10 px-4 py-2.5 text-sm font-semibold text-esc-destaque transition-all hover:bg-esc-destaque/20 sm:w-auto"
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          Novo Cliente
        </button>
      </header>

      <section className="mb-6 w-full rounded-2xl border border-esc-border/70 bg-esc-card/80 p-4 shadow-lg backdrop-blur-md md:p-5">
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:gap-3">
          <div className="w-full min-w-0 lg:min-w-0 lg:flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-esc-muted">
              Pesquisar
            </label>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, tipo ou status…"
              className={inputBarClass}
            />
          </div>
          <div className="w-full min-w-0 lg:w-[min(100%,15rem)] lg:flex-none">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-esc-muted">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className={inputBarClass}
            >
              {STATUS_FILTRO.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:gap-2 lg:w-auto lg:max-w-[min(100%,21rem)]">
            <div className="min-w-0 sm:min-w-[8.5rem] w-full">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-esc-muted">
                Data de
              </label>
              <input
                type="date"
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className={inputDateBarClass}
              />
            </div>
            <div className="min-w-0 sm:min-w-[8.5rem] w-full">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-esc-muted">
                Até
              </label>
              <input
                type="date"
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className={inputDateBarClass}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-esc-card backdrop-blur-md">
        {loading ? (
          <div className="p-4">
            <ListaSkeleton />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-esc-muted">{error}</div>
        ) : linhas.length === 0 ? (
          <div className="p-12 text-center text-sm text-esc-muted">
            Nenhum cliente encontrado para {nomeEscritorio}.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {linhas.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-esc-border bg-esc-bg text-esc-destaque">
                    <span className="text-lg font-bold">
                      {(c.nome || "?").slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-esc-text">
                      {c.nome || "—"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {c.tipo ? (
                        <span className="text-sm text-esc-muted">{c.tipo}</span>
                      ) : null}
                      {c.status ? (
                        <ClienteStatusBadge status={c.status} />
                      ) : null}
                    </div>
                    {c.pagamento ? (
                      <p className="mt-1 text-xs text-esc-muted">
                        Pagamento: {c.pagamento}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                  <div className="min-w-0 flex-1 text-left sm:text-right">
                    <p className="text-sm text-esc-text">
                      Saldo{" "}
                      <span className="font-semibold tabular-nums">
                        R$ {formatarMoeda(c.saldo)}
                      </span>
                    </p>
                    <p className="text-xs text-esc-muted">
                      {formatarDataBR(c.data || c.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (c.escritorio_id !== currentEscritorioId) return;
                        setClienteEdicao(c);
                        setModalAberto(true);
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-esc-border/80 bg-esc-bg/50 px-3 py-2 text-xs font-semibold text-esc-muted backdrop-blur-sm transition-all duration-300 hover:border-esc-destaque/45 hover:text-esc-destaque"
                      aria-label="Editar cliente"
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirExcluirCliente(c)}
                      className="cursor-pointer rounded-full border border-transparent p-2 text-esc-muted transition-all hover:border-esc-border hover:bg-white/5 hover:text-esc-destaque"
                      aria-label="Excluir cliente"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ModalClienteEscritorio
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setClienteEdicao(null);
        }}
        onSave={handleSalvarCliente}
        escritorioId={currentEscritorioId}
        clienteEdicao={clienteEdicao}
      />
    </div>
  );
}
