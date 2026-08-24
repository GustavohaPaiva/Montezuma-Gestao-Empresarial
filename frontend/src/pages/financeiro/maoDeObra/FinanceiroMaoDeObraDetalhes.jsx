import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  CircleDollarSign,
  HardHat,
  Package,
  Wallet,
} from "lucide-react";
import BaseSelect from "../../../components/gerais/BaseSelect";
import ModuleHub from "../../../components/gerais/ModuleHub";
import TabelaSimples from "../../../components/gerais/TabelaSimples";
import { homeDictionary } from "../../../constants/dictionaries";
import { api } from "../../../services/api";
import { formatarMoeda } from "../../obras/detalhe/utils/formatters";
import {
  agregarFinanceiroPrestador,
  itensEmAbertoPrestador,
  labelObraCliente,
} from "./maoDeobraPrioridade";

const hub = homeDictionary.financeiroHub;

const FILTRO_INPUT_CLASS =
  "box-border h-10 min-h-10 w-full min-w-0 shrink-0 rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-muted focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const FILTRO_SELECT_CLASS =
  "box-border h-10 min-h-10 w-full min-w-0 shrink-0 cursor-pointer rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const colSortClass =
  "cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary";

function valorSort(item, campo) {
  switch (campo) {
    case "obra":
      return labelObraCliente(item.obras).toLowerCase();
    case "descricao":
      return (item.descricao || "").toLowerCase();
    case "valor":
      return parseFloat(item.valor) || 0;
    default:
      return "";
  }
}

export default function FinanceiroMaoDeObraDetalhes() {
  const { prestadorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prestadorNome, setPrestadorNome] = useState("");
  const [contas, setContas] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroObraId, setFiltroObraId] = useState("");
  const [sortConfig, setSortConfig] = useState({
    campo: null,
    direcao: "asc",
  });

  const carregar = useCallback(async () => {
    if (!prestadorId) return;
    setLoading(true);
    try {
      const [todas, prestador] = await Promise.all([
        api.getContasPagarPrestador(),
        api.getPrestadorById(prestadorId).catch(() => null),
      ]);
      const doPrestador = (Array.isArray(todas) ? todas : []).filter(
        (item) => String(item?.prestador_id) === String(prestadorId),
      );
      setContas(doPrestador);
      setPrestadorNome(
        prestador?.nome ||
          doPrestador.find((item) => item?.prestadores?.nome)?.prestadores
            ?.nome ||
          "Prestador",
      );
    } catch (error) {
      console.error("[FinanceiroMaoDeObraDetalhes] carregar:", error);
      setContas([]);
      setPrestadorNome("Prestador");
    } finally {
      setLoading(false);
    }
  }, [prestadorId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const itensEmAberto = useMemo(
    () => itensEmAbertoPrestador(contas),
    [contas],
  );

  const totais = useMemo(
    () => agregarFinanceiroPrestador(contas),
    [contas],
  );

  const opcoesObras = useMemo(() => {
    const mapa = new Map();
    for (const item of itensEmAberto) {
      const obraId = item.obra_id != null ? String(item.obra_id) : "";
      if (!obraId || mapa.has(obraId)) continue;
      mapa.set(obraId, labelObraCliente(item.obras));
    }
    return Array.from(mapa.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [itensEmAberto]);

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let lista = itensEmAberto.filter((item) => {
      if (filtroObraId && String(item.obra_id) !== filtroObraId) return false;
      if (termo) {
        const obra = labelObraCliente(item.obras).toLowerCase();
        const descricao = (item.descricao || "").toLowerCase();
        if (!obra.includes(termo) && !descricao.includes(termo)) return false;
      }
      return true;
    });

    lista = [...lista];
    if (sortConfig.campo) {
      lista.sort((a, b) => {
        const valA = valorSort(a, sortConfig.campo);
        const valB = valorSort(b, sortConfig.campo);
        if (valA < valB) return sortConfig.direcao === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direcao === "asc" ? 1 : -1;
        return String(a.id).localeCompare(String(b.id));
      });
    }

    return lista;
  }, [itensEmAberto, busca, filtroObraId, sortConfig]);

  const totalFiltrado = useMemo(
    () =>
      itensFiltrados.reduce(
        (acc, item) => acc + (parseFloat(item.valor) || 0),
        0,
      ),
    [itensFiltrados],
  );

  const resumo = useMemo(
    () => [
      {
        id: "itens",
        label: hub.detalheMetricItens,
        value: totais.itensAbertos,
        icon: <Package className="h-4 w-4" />,
        theme: "primary",
      },
      {
        id: "a-pagar",
        label: hub.maoObraMetricAPagar,
        value: `R$ ${formatarMoeda(totais.aPagar)}`,
        icon: <Wallet className="h-4 w-4" />,
        theme: "amber",
      },
      {
        id: "pago",
        label: hub.maoObraMetricPago,
        value: `R$ ${formatarMoeda(totais.pago)}`,
        icon: <CheckCircle2 className="h-4 w-4" />,
        theme: "emerald",
      },
      {
        id: "total-lancado",
        label: hub.maoObraMetricTotalLancado,
        value: `R$ ${formatarMoeda(totais.totalLancado)}`,
        icon: <CircleDollarSign className="h-4 w-4" />,
        theme: "blue",
      },
    ],
    [totais],
  );

  const handleSort = (campo) => {
    setSortConfig((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (campo) => {
    if (sortConfig.campo !== campo) return "↕";
    return sortConfig.direcao === "asc" ? "↑" : "↓";
  };

  const colunasTabela = [
    <span
      key="col-obra"
      className={colSortClass}
      onClick={() => handleSort("obra")}
    >
      Obra / Cliente {getSortIcon("obra")}
    </span>,
    <span
      key="col-descricao"
      className={colSortClass}
      onClick={() => handleSort("descricao")}
    >
      Serviço {getSortIcon("descricao")}
    </span>,
    <span
      key="col-valor"
      className={colSortClass}
      onClick={() => handleSort("valor")}
    >
      Valor {getSortIcon("valor")}
    </span>,
  ];

  const dadosTabela = itensFiltrados.map((item) => {
    const descricao = item.descricao || "—";
    const itemId = item.mao_de_obra_id ?? item.id;

    return [
      <div
        key={`obra-${item.id}`}
        className="mx-auto max-w-[220px] truncate text-center text-sm font-semibold text-text-primary"
        title={labelObraCliente(item.obras)}
      >
        {labelObraCliente(item.obras)}
      </div>,
      item.obra_id != null ? (
        <button
          key={`desc-${item.id}`}
          type="button"
          title="Abrir no relatório da obra"
          onClick={() =>
            navigate(
              `/obrasD/${item.obra_id}?secao=relatorios&sub=mao&item=${itemId}`,
            )
          }
          className="mx-auto max-w-[220px] cursor-pointer truncate text-center text-sm font-semibold text-accent-primary underline-offset-2 transition-colors hover:text-accent-primary-dark hover:underline"
        >
          {descricao}
        </button>
      ) : (
        <div
          key={`desc-${item.id}`}
          className="mx-auto max-w-[220px] truncate text-center text-sm text-text-primary"
          title={descricao}
        >
          {descricao}
        </div>
      ),
      <div
        key={`val-${item.id}`}
        className="text-center text-sm font-semibold tabular-nums text-text-primary"
      >
        R$ {formatarMoeda(item.valor)}
      </div>,
    ];
  });

  const temPendencias = itensEmAberto.length > 0;
  const temResultados = itensFiltrados.length > 0;

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={prestadorNome || hub.maoObraTitulo}
      onVoltar={() => navigate("/financeiro/mao-de-obra")}
      resumo={resumo}
      resumoGridClass="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      resumoLoading={loading}
      resumoVariant="metricCompact"
      dense
      acessos={[]}
      loading={loading}
      loadingTitulo={hub.maoObraLoadingTitulo}
      loadingDescricao={hub.maoObraLoadingDescricao}
      loadingIcon={<HardHat className="h-7 w-7" strokeWidth={2} />}
    >
      {!temPendencias ? (
        <div className="rounded-2xl border border-dashed border-border-primary/40 bg-white px-5 py-10 text-center shadow-sm">
          <CheckCircle2
            className="mx-auto mb-3 h-8 w-8 text-emerald-600/70"
            aria-hidden
          />
          <p className="text-sm font-medium text-text-primary">
            {hub.detalheMaoObraVazioTitulo}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {hub.detalheMaoObraVazioDescricao}
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col gap-3 border-b border-border-primary/20 px-4 py-3.5 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-bold tracking-tight text-text-primary sm:text-lg">
                  {hub.detalhePainelTitulo}
                </h2>
                <p className="mt-0.5 text-xs text-text-muted">
                  {hub.detalhePainelSubtitulo(itensEmAberto.length)}
                  {temResultados &&
                  itensFiltrados.length !== itensEmAberto.length
                    ? ` · ${itensFiltrados.length} filtrado${itensFiltrados.length === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:max-w-[min(100%,42rem)]">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={hub.detalheMaoObraBuscaPlaceholder}
                  className={`${FILTRO_INPUT_CLASS} sm:min-w-0 sm:flex-1`}
                />
                <BaseSelect
                  searchable
                  value={filtroObraId}
                  onChange={(e) => setFiltroObraId(e.target.value)}
                  wrapperClassName="w-full shrink-0 sm:w-[11.5rem]"
                  className={`${FILTRO_SELECT_CLASS} w-full`}
                  options={[
                    { value: "", label: hub.detalheFiltroTodasObras },
                    ...opcoesObras,
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
            {!temResultados ? (
              <div className="rounded-xl border border-dashed border-border-primary/40 bg-[#FAFAFA] px-4 py-8 text-center">
                <p className="text-sm font-medium text-text-primary">
                  {hub.detalheFiltroVazioTitulo}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  {hub.detalheFiltroVazioDescricao}
                </p>
              </div>
            ) : (
              <>
                <TabelaSimples
                  variant="obraDetalhe"
                  dense
                  flush
                  rowIds={itensFiltrados.map((item) => item.id)}
                  colunas={colunasTabela}
                  dados={dadosTabela}
                />
                <div className="mt-3 flex min-h-10 w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-border-primary/35 bg-[#FAFAFA] px-3.5 py-2.5 text-sm shadow-inner ring-1 ring-black/4">
                  <span className="font-medium text-text-muted">
                    {hub.detalheTotalFiltrado}
                    <span className="ml-1 tabular-nums text-text-primary/70">
                      ({itensFiltrados.length})
                    </span>
                  </span>
                  <span className="font-bold tabular-nums text-text-primary">
                    R$ {formatarMoeda(totalFiltrado)}
                  </span>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </ModuleHub>
  );
}
