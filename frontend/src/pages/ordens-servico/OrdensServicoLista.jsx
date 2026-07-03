import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { ESCRITORIO_NOME_POR_ID } from "../../constants/escritorios";
import Navbar from "../../components/navbar/Navbar";
import BaseCard from "../../components/cards/BaseCard";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import BaseButton from "../../components/gerais/BaseButton";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import ModalNovaOrdemServico from "../../components/modals/ModalNovaOrdemServico";
import StatusOrdemServicoBadge from "../../components/ordens-servico/StatusOrdemServicoBadge";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { OS_STATUS } from "../../constants/ordemServico";
import {
  filtrarOrdensServicoVisiveis,
  podeAcessarModuloOrdemServico,
  podeEmitirOrdemServico,
  podeVerTodasOrdensServico,
} from "../../utils/ordemServicoPermissions";
import {
  formatarDataListaOS,
  getOrdensServicoBasePath,
  osEstaIncompleta,
  resolveEscritorioIdOrdemServico,
} from "./ordensServicoUtils";
import {
  navbarAcaoPrimariaClass,
  osGridCardsClass,
  osGridMetricasClass,
  osVkCardClass,
  osVkFiltroPainelClass,
} from "./ordensServicoUi";

const ABAS = [
  { id: "pendentes", label: "Pendentes" },
  { id: "concluidas", label: "Concluídas" },
  { id: "todas", label: "Todas" },
];

function badgeStatusVk(status) {
  const concluida = status === OS_STATUS.concluida;
  return concluida
    ? "border border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
    : "border border-amber-400/30 bg-amber-400/15 text-amber-300";
}

export default function OrdensServicoLista({ variant = "montezuma" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVk = variant === "vogelkop";
  const escritorioId = resolveEscritorioIdOrdemServico(
    variant,
    user?.escritorio_id,
  );
  const basePath = getOrdensServicoBasePath(variant);

  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("pendentes");
  const [modalAberto, setModalAberto] = useState(false);
  const [showElements, setShowElements] = useState(false);

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

  const autorizado = podeAcessarModuloOrdemServico(user);
  const podeCriar = podeEmitirOrdemServico(user);
  const veTodas = podeVerTodasOrdensServico(user);

  const abasVisiveis = useMemo(
    () => (veTodas ? ABAS : ABAS.filter((a) => a.id !== "todas")),
    [veTodas],
  );

  const carregar = useCallback(async () => {
    if (!autorizado) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await api.listOrdensServico({ escritorioId });
      setOrdens(filtrarOrdensServicoVisiveis(user, rows, variant));
      setErro(null);
    } catch (e) {
      console.error("[OrdensServicoLista]", e);
      setErro(e?.message || "Não foi possível carregar as ordens de serviço.");
      setOrdens([]);
    } finally {
      setLoading(false);
    }
  }, [autorizado, escritorioId, user, variant]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(t);
    }
    setShowElements(false);
  }, [loading]);

  useEffect(() => {
    if (!autorizado && user) {
      navigate(isVk ? "/escritorio/vogelkop" : "/", { replace: true });
    }
  }, [autorizado, user, navigate, isVk]);

  const ordensFiltradas = useMemo(() => {
    let lista = ordens;
    if (aba === "pendentes") {
      lista = lista.filter((o) => o.status === OS_STATUS.pendente);
    } else if (aba === "concluidas") {
      lista = lista.filter((o) => o.status === OS_STATUS.concluida);
    }
    const q = busca.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((o) => {
      const texto = [
        o.numero,
        o.cliente_nome,
        o.responsavel?.nome,
        o.responsavel_tecnico,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [ordens, aba, busca]);

  const metricas = useMemo(() => {
    const pendentes = ordens.filter(
      (o) => o.status === OS_STATUS.pendente,
    ).length;
    const concluidas = ordens.filter(
      (o) => o.status === OS_STATUS.concluida,
    ).length;
    return { total: ordens.length, pendentes, concluidas };
  }, [ordens]);

  const abrirModal = () => setModalAberto(true);

  const filtrosNavbar = [
    <BaseInput
      key="busca-os"
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
      placeholder="Buscar por nº, cliente ou responsável…"
    />,
    <BaseSelect
      key="aba-os"
      searchable={false}
      value={aba}
      onChange={(e) => setAba(e.target.value)}
      options={abasVisiveis.map((a) => ({
        value: a.id,
        label: a.label,
      }))}
    />,
  ];

  const renderVkCard = (os) => {
    const incompleta = osEstaIncompleta(os);
    const responsavelNome =
      os.responsavel?.nome || os.responsavel_tecnico || "—";
    return (
      <button
        key={os.id}
        type="button"
        onClick={() => navigate(`${basePath}/${os.id}`)}
        className={osVkCardClass}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-semibold text-esc-text">
              OS Nº {os.numero}
              {os.cliente_nome ? ` · ${os.cliente_nome}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-esc-muted">
              Responsável Técnico: {responsavelNome}
            </p>
            <p className="mt-1 text-[11px] text-esc-muted">
              Emissão: {formatarDataListaOS(os.data_emissao)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeStatusVk(os.status)}`}
            >
              {os.status === OS_STATUS.concluida ? "Concluída" : "Pendente"}
            </span>
            {incompleta && os.status !== OS_STATUS.concluida ? (
              <span className="text-[10px] font-medium text-indigo-300">
                Em preenchimento
              </span>
            ) : null}
          </div>
        </div>
      </button>
    );
  };

  const renderListaConteudo = () => {
    if (ordens.length === 0) {
      return (
        <div
          className={
            isVk
              ? "rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center"
              : "rounded-2xl border border-dashed border-border-primary/40 bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/[0.03]"
          }
        >
          <div
            className={
              isVk
                ? "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-esc-destaque/25 bg-esc-destaque/10 text-esc-destaque"
                : "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15"
            }
          >
            <ClipboardList className="h-7 w-7" strokeWidth={2} />
          </div>
          <p
            className={
              isVk
                ? "text-base font-semibold text-esc-text"
                : "text-base font-semibold text-text-primary"
            }
          >
            Nenhuma ordem de serviço cadastrada
          </p>
          <p
            className={
              isVk
                ? "mt-2 text-sm text-esc-muted"
                : "mt-2 text-sm text-text-muted"
            }
          >
            {podeCriar
              ? 'Use "Nova OS" para lançar a primeira solicitação.'
              : "Quando receber uma OS designada, ela aparecerá aqui."}
          </p>
        </div>
      );
    }

    if (ordensFiltradas.length === 0) {
      return (
        <p
          className={
            isVk
              ? "rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-esc-muted"
              : "rounded-2xl border border-dashed border-border-primary/40 bg-white px-4 py-10 text-center text-sm text-text-muted shadow-sm ring-1 ring-black/[0.03]"
          }
        >
          Nenhuma ordem corresponde aos filtros aplicados.
        </p>
      );
    }

    return (
      <>
        <p
          className={
            isVk
              ? "mb-4 text-xs font-medium text-esc-muted"
              : "mb-4 text-xs font-medium text-text-muted"
          }
        >
          {ordensFiltradas.length} de {ordens.length} ordem
          {ordens.length !== 1 ? "ens" : ""}
        </p>
        {isVk ? (
          <div className="grid gap-3">{ordensFiltradas.map(renderVkCard)}</div>
        ) : (
          <div className={osGridCardsClass}>
            {ordensFiltradas.map((os) => (
              <BaseCard
                key={os.id}
                variant="entity"
                colorTheme="indigo"
                title={`OS Nº ${os.numero}`}
                value={os.cliente_nome || "Cliente não informado"}
                statusElement={
                  <StatusOrdemServicoBadge
                    status={os.status}
                    incompleta={osEstaIncompleta(os)}
                  />
                }
                onClick={() => navigate(`${basePath}/${os.id}`)}
                metadata={[
                  {
                    icon: <UserRound className="h-3.5 w-3.5 text-text-muted" />,
                    label:
                      os.responsavel?.nome || os.responsavel_tecnico || "—",
                  },
                  {
                    icon: (
                      <CalendarDays className="h-3.5 w-3.5 text-text-muted" />
                    ),
                    label: formatarDataListaOS(os.data_emissao),
                  },
                ]}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  if (isVk) {
    const nomeEscritorio = ESCRITORIO_NOME_POR_ID[escritorioId] ?? "Escritório";

    return (
      <div className="relative w-full max-w-full overflow-x-hidden">
        <div
          className="pointer-events-none fixed -top-40 left-1/2 -z-10 h-[min(400px,70vh)] w-[min(800px,100vw)] max-w-full -translate-x-1/2 bg-esc-destaque opacity-10 blur-[150px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full">
          <button
            type="button"
            onClick={() => navigate("/escritorio/vogelkop/")}
            className="mb-6 mt-4 flex cursor-pointer items-center gap-2 text-esc-muted transition-colors hover:text-esc-destaque"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Voltar</span>
          </button>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex flex-col gap-1 text-xl font-bold tracking-tight text-esc-text min-[480px]:flex-row min-[480px]:flex-wrap min-[480px]:items-center sm:text-3xl">
                <span>Ordens de Serviço —</span>
                <span className="text-esc-destaque">{nomeEscritorio}</span>
              </h1>
              <p className="mt-1 text-sm text-esc-muted">
                Solicitações internas e documentos para clientes
              </p>
            </div>
            {podeCriar ? (
              <button
                type="button"
                onClick={abrirModal}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-esc-destaque/30 bg-esc-destaque/10 px-4 py-2.5 text-sm font-semibold text-esc-destaque transition-all hover:bg-esc-destaque/20 sm:w-auto"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Nova OS
              </button>
            ) : null}
          </div>

          <div className={`mb-6 ${osVkFiltroPainelClass}`}>
            <div className="mb-3 flex flex-wrap gap-2">
              {abasVisiveis.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAba(item.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    aba === item.id
                      ? "border-esc-destaque/50 bg-esc-destaque/15 text-esc-destaque"
                      : "border-white/10 bg-white/5 text-esc-muted hover:text-esc-text"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-esc-muted"
                aria-hidden
              />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nº, cliente ou responsável…"
                className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-esc-text placeholder:text-esc-muted focus:border-esc-destaque focus:outline-none"
              />
            </div>
          </div>

          {erro ? (
            <p className="mb-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-300">
              {erro}
            </p>
          ) : null}

          {loading ? (
            <LoadingPainel
              variant="escritorio"
              titulo="Carregando ordens de serviço"
              descricao="Buscando solicitações do escritório."
              icon={<ClipboardList className="h-7 w-7" strokeWidth={2} />}
            />
          ) : (
            renderListaConteudo()
          )}

          <ModalNovaOrdemServico
            isOpen={modalAberto}
            onClose={() => setModalAberto(false)}
            onSaved={carregar}
            variant={variant}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 flex-col items-center overflow-x-hidden bg-bg-primary">
      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out ${
          isNavVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Navbar
          title="Ordens de Serviço"
          filters={filtrosNavbar}
          actions={
            podeCriar
              ? [
                  {
                    key: "nova-os",
                    label: "Nova OS",
                    onClick: abrirModal,
                    icon: <Plus className="h-4 w-4" aria-hidden />,
                    className: navbarAcaoPrimariaClass,
                  },
                ]
              : []
          }
        />
      </div>

      {loading ? (
        <LoadingPainel
          titulo="Carregando ordens de serviço"
          descricao="Buscando solicitações."
          icon={<ClipboardList className="h-7 w-7" strokeWidth={2} />}
        />
      ) : (
        <main
          ref={refMain}
          className={`w-full px-[5%] pb-12 pt-2 transition-all duration-700 ease-out ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          {erro ? (
            <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
              {erro}
            </p>
          ) : null}

          {ordens.length > 0 ? (
            <section className={`mb-6 ${osGridMetricasClass}`}>
              <BaseCard
                variant="metric"
                title="Total"
                value={String(metricas.total)}
                icon={<ClipboardList className="h-5 w-5" />}
                colorTheme="indigo"
              />
              <BaseCard
                variant="metric"
                title="Pendentes"
                value={String(metricas.pendentes)}
                icon={<Clock className="h-5 w-5" />}
                colorTheme="amber"
              />
              <BaseCard
                variant="metric"
                title="Concluídas"
                value={String(metricas.concluidas)}
                icon={<CheckCircle2 className="h-5 w-5" />}
                colorTheme="emerald"
              />
            </section>
          ) : null}

          {renderListaConteudo()}
        </main>
      )}

      <ModalNovaOrdemServico
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSaved={carregar}
        variant={variant}
      />
    </div>
  );
}
