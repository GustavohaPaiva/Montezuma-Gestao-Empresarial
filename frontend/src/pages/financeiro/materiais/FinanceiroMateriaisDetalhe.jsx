import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Loader2,
  Package,
  Wallet,
} from "lucide-react";
import BaseSelect from "../../../components/gerais/BaseSelect";
import ButtonDefault from "../../../components/gerais/ButtonDefault";
import ModuleHub from "../../../components/gerais/ModuleHub";
import TabelaSimples from "../../../components/gerais/TabelaSimples";
import { homeDictionary } from "../../../constants/dictionaries";
import { api } from "../../../services/api";
import { agregarFinanceiroFornecedor } from "../../fornecedores/fornecedorFinanceiro";
import {
  formatarDataBR,
  formatarMoeda,
} from "../../obras/detalhe/utils/formatters";
import {
  BUCKET_META,
  BUCKET_ORDER,
  getBucketPrioridade,
  isVencido,
  labelObraCliente,
  ordenarItensPorPrioridade,
  parseDataLocal,
  rankBucket,
} from "./materiaisPrioridade";

const hub = homeDictionary.financeiroHub;

const FILTRO_INPUT_CLASS =
  "box-border h-10 min-h-10 w-full min-w-0 shrink-0 rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-muted focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const FILTRO_SELECT_CLASS =
  "box-border h-10 min-h-10 w-full min-w-0 shrink-0 cursor-pointer rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const colSortClass =
  "cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary";

const btnAccentPremium =
  "!h-9 !cursor-pointer !rounded-xl !border !border-accent-primary !bg-accent-primary !px-3.5 !text-sm !font-semibold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!-translate-y-0.5 hover:!bg-accent-primary-dark hover:!shadow-lg focus:!outline-none focus:!ring-2 focus:!ring-accent-primary/35 focus:!ring-offset-2 active:!translate-y-0 disabled:!cursor-not-allowed";

const checkboxClass =
  "h-[18px] w-[18px] cursor-pointer accent-check-accent disabled:cursor-not-allowed disabled:opacity-40";

const PRIORIDADE_CHIP = {
  vencidos: {
    idle: "border-rose-200/80 bg-rose-50/70 text-rose-800 hover:border-rose-300",
    active: "border-rose-400 bg-rose-100 text-rose-900 ring-1 ring-rose-300/60",
  },
  proxima_semana: {
    idle: "border-amber-200/80 bg-amber-50/70 text-amber-900 hover:border-amber-300",
    active:
      "border-amber-400 bg-amber-100 text-amber-950 ring-1 ring-amber-300/60",
  },
  ate_um_mes: {
    idle: "border-sky-200/80 bg-sky-50/70 text-sky-900 hover:border-sky-300",
    active: "border-sky-400 bg-sky-100 text-sky-950 ring-1 ring-sky-300/60",
  },
  mais_de_um_mes: {
    idle: "border-slate-200/80 bg-slate-50 text-slate-700 hover:border-slate-300",
    active:
      "border-slate-400 bg-slate-100 text-slate-900 ring-1 ring-slate-300/60",
  },
  sem_vencimento: {
    idle: "border-violet-200/80 bg-violet-50/70 text-violet-900 hover:border-violet-300",
    active:
      "border-violet-400 bg-violet-100 text-violet-950 ring-1 ring-violet-300/60",
  },
};

const ORDEM_PRIORIDADE = Object.fromEntries(
  BUCKET_ORDER.map((id, idx) => [id, idx]),
);

function valorSort(item, campo) {
  switch (campo) {
    case "obra":
      return labelObraCliente(item.obras).toLowerCase();
    case "material":
      return (item.material || "").toLowerCase();
    case "valor":
      return parseFloat(item.valor) || 0;
    case "vencimento":
      return (
        parseDataLocal(item.data_vencimento)?.getTime() ??
        Number.POSITIVE_INFINITY
      );
    case "prioridade": {
      const bucket = getBucketPrioridade(item);
      return bucket != null
        ? (ORDEM_PRIORIDADE[bucket] ?? Number.POSITIVE_INFINITY)
        : Number.POSITIVE_INFINITY;
    }
    default:
      return "";
  }
}

function badgePrioridadeClass(bucket) {
  if (bucket === "vencidos") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (bucket === "proxima_semana") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  if (bucket === "ate_um_mes") {
    return "border-sky-200 bg-sky-50 text-sky-900";
  }
  if (bucket === "sem_vencimento") {
    return "border-violet-200 bg-violet-50 text-violet-900";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function FinanceiroMateriaisDetalhe() {
  const { fornecedorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [materiais, setMateriais] = useState([]);
  const [savingBulk, setSavingBulk] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroObraId, setFiltroObraId] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [sortConfig, setSortConfig] = useState({
    campo: null,
    direcao: "asc",
  });
  const [selecionados, setSelecionados] = useState(() => new Set());

  const carregar = useCallback(async () => {
    if (!fornecedorId) return;
    setLoading(true);
    try {
      const fornecedor = await api.getFornecedorById(fornecedorId);
      const todos = Array.isArray(fornecedor?.relatorio_materiais)
        ? fornecedor.relatorio_materiais
        : [];
      setMateriais(todos);
      setFornecedorNome(fornecedor?.nome || "Fornecedor");
    } catch (error) {
      console.error("[FinanceiroMateriaisDetalhe] carregar:", error);
      setMateriais([]);
      setFornecedorNome("Fornecedor");
    } finally {
      setLoading(false);
    }
  }, [fornecedorId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const itensEmAberto = useMemo(
    () => ordenarItensPorPrioridade(materiais),
    [materiais],
  );

  const totais = useMemo(
    () => agregarFinanceiroFornecedor(materiais),
    [materiais],
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
      if (filtroPrioridade) {
        const bucket = getBucketPrioridade(item);
        if (bucket !== filtroPrioridade) return false;
      }
      if (termo) {
        const obra = labelObraCliente(item.obras).toLowerCase();
        const material = (item.material || "").toLowerCase();
        if (!obra.includes(termo) && !material.includes(termo)) return false;
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
    } else {
      lista.sort((a, b) => {
        const rankDiff =
          rankBucket(getBucketPrioridade(a)) -
          rankBucket(getBucketPrioridade(b));
        if (rankDiff !== 0) return rankDiff;
        const ta =
          parseDataLocal(a.data_vencimento)?.getTime() ??
          Number.POSITIVE_INFINITY;
        const tb =
          parseDataLocal(b.data_vencimento)?.getTime() ??
          Number.POSITIVE_INFINITY;
        if (ta !== tb) return ta - tb;
        return String(a.id).localeCompare(String(b.id));
      });
    }

    return lista;
  }, [
    itensEmAberto,
    busca,
    filtroObraId,
    filtroPrioridade,
    sortConfig,
  ]);

  useEffect(() => {
    const idsVisiveis = new Set(itensFiltrados.map((i) => i.id));
    setSelecionados((prev) => {
      let mudou = false;
      const next = new Set();
      for (const id of prev) {
        if (idsVisiveis.has(id)) next.add(id);
        else mudou = true;
      }
      return mudou || next.size !== prev.size ? next : prev;
    });
  }, [itensFiltrados]);

  const totalFiltrado = useMemo(
    () =>
      itensFiltrados.reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0),
    [itensFiltrados],
  );

  const contagemPrioridade = useMemo(() => {
    const counts = Object.fromEntries(BUCKET_ORDER.map((id) => [id, 0]));
    for (const item of itensEmAberto) {
      const bucket = getBucketPrioridade(item);
      if (bucket && counts[bucket] != null) counts[bucket] += 1;
    }
    return counts;
  }, [itensEmAberto]);

  const totalSelecionado = useMemo(() => {
    let soma = 0;
    for (const item of itensFiltrados) {
      if (selecionados.has(item.id)) soma += parseFloat(item.valor) || 0;
    }
    return soma;
  }, [itensFiltrados, selecionados]);

  const resumo = useMemo(
    () => [
      {
        id: "itens",
        label: hub.detalheMetricItens,
        value: itensEmAberto.length,
        icon: <Package className="h-4 w-4" />,
        theme: "primary",
      },
      {
        id: "a-pagar",
        label: hub.materiaisMetricAPagar,
        value: `R$ ${formatarMoeda(totais.pendente)}`,
        icon: <Wallet className="h-4 w-4" />,
        theme: "amber",
      },
      {
        id: "vencido",
        label: hub.materiaisMetricVencidos,
        value: `R$ ${formatarMoeda(totais.vencido)}`,
        icon: <AlertCircle className="h-4 w-4" />,
        theme: "pink",
      },
      {
        id: "pago",
        label: hub.detalheMetricPago,
        value: `R$ ${formatarMoeda(totais.pago)}`,
        icon: <CheckCircle2 className="h-4 w-4" />,
        theme: "emerald",
      },
    ],
    [itensEmAberto.length, totais],
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

  const idsVisiveis = useMemo(
    () => itensFiltrados.map((item) => item.id).filter(Boolean),
    [itensFiltrados],
  );

  const todosSelecionados =
    idsVisiveis.length > 0 &&
    idsVisiveis.every((id) => selecionados.has(id));

  const toggleSelecao = (itemId) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleTodos = () => {
    setSelecionados((prev) => {
      if (idsVisiveis.length === 0) return prev;
      if (idsVisiveis.every((id) => prev.has(id))) return new Set();
      return new Set(idsVisiveis);
    });
  };

  const marcarItensComoPago = async (ids) => {
    const lista = (Array.isArray(ids) ? ids : []).filter(Boolean);
    if (!lista.length || savingBulk || savingId) return;

    const prev = materiais;
    setMateriais((atual) =>
      atual.map((m) =>
        lista.includes(m.id)
          ? {
              ...m,
              status_pagamento: "Pago",
              status_financeiro: "Pago",
            }
          : m,
      ),
    );
    setSelecionados((prevSel) => {
      const next = new Set(prevSel);
      for (const id of lista) next.delete(id);
      return next;
    });

    try {
      if (lista.length === 1) {
        setSavingId(lista[0]);
        await api.updateMaterialStatusFinanceiro(lista[0], "Pago");
      } else {
        setSavingBulk(true);
        await api.updateMateriaisStatusFinanceiroInIds(lista, "Pago");
      }
    } catch (error) {
      console.error("[FinanceiroMateriaisDetalhe] marcar pago:", error);
      setMateriais(prev);
    } finally {
      setSavingId(null);
      setSavingBulk(false);
    }
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
      key="col-material"
      className={colSortClass}
      onClick={() => handleSort("material")}
    >
      Material {getSortIcon("material")}
    </span>,
    <span
      key="col-valor"
      className={colSortClass}
      onClick={() => handleSort("valor")}
    >
      Valor {getSortIcon("valor")}
    </span>,
    <span
      key="col-venc"
      className={colSortClass}
      onClick={() => handleSort("vencimento")}
    >
      Vencimento {getSortIcon("vencimento")}
    </span>,
    <span
      key="col-prio"
      className={colSortClass}
      onClick={() => handleSort("prioridade")}
    >
      Prioridade {getSortIcon("prioridade")}
    </span>,
    <div
      key="col-pago"
      className="flex flex-col items-center gap-1 text-[10px] font-semibold uppercase leading-tight text-text-muted"
    >
      <span>Pago</span>
      <input
        type="checkbox"
        checked={todosSelecionados}
        onChange={toggleTodos}
        disabled={idsVisiveis.length === 0 || savingBulk}
        aria-label="Selecionar todos"
        className={checkboxClass}
      />
    </div>,
  ];

  const dadosTabela = itensFiltrados.map((item) => {
    const bucket = getBucketPrioridade(item);
    const meta = bucket ? BUCKET_META[bucket] : null;
    const vencido = isVencido(item);
    const selecionado = selecionados.has(item.id);
    const salvandoLinha = savingId === item.id;

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
          key={`mat-${item.id}`}
          type="button"
          title="Abrir no relatório da obra"
          onClick={() =>
            navigate(
              `/obrasD/${item.obra_id}?secao=relatorios&sub=materiais&item=${item.material_id ?? item.id}`,
            )
          }
          className="mx-auto max-w-[180px] cursor-pointer truncate text-center text-sm font-semibold text-accent-primary underline-offset-2 transition-colors hover:text-accent-primary-dark hover:underline"
        >
          {item.material || "—"}
        </button>
      ) : (
        <div
          key={`mat-${item.id}`}
          className="mx-auto max-w-[180px] truncate text-center text-sm text-text-primary"
          title={item.material}
        >
          {item.material || "—"}
        </div>
      ),
      <div
        key={`val-${item.id}`}
        className="text-center text-sm font-semibold tabular-nums text-text-primary"
      >
        R$ {formatarMoeda(item.valor)}
      </div>,
      <div
        key={`venc-${item.id}`}
        className={`text-center text-sm tabular-nums ${
          vencido ? "font-semibold text-rose-700" : "text-text-primary"
        }`}
      >
        {formatarDataBR(item.data_vencimento)}
      </div>,
      <div key={`prio-${item.id}`} className="text-center">
        <span
          className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${badgePrioridadeClass(bucket)}`}
        >
          {meta?.titulo || "—"}
        </span>
      </div>,
      <div key={`pago-${item.id}`} className="flex justify-center">
        {salvandoLinha ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent-primary" />
        ) : (
          <input
            type="checkbox"
            checked={selecionado}
            disabled={savingBulk}
            onChange={() => toggleSelecao(item.id)}
            aria-label={`Selecionar ${item.material || "item"}`}
            className={checkboxClass}
          />
        )}
      </div>,
    ];
  });

  const temPendencias = itensEmAberto.length > 0;
  const temResultados = itensFiltrados.length > 0;

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={fornecedorNome || hub.materiaisTitulo}
      onVoltar={() => navigate("/financeiro/materiais")}
      resumo={resumo}
      resumoLoading={loading}
      resumoVariant="metricCompact"
      dense
      acessos={[]}
      loading={loading}
      loadingTitulo={hub.materiaisLoadingTitulo}
      loadingDescricao={hub.materiaisLoadingDescricao}
      loadingIcon={<Building2 className="h-7 w-7" strokeWidth={2} />}
    >
      {!temPendencias ? (
        <div className="rounded-2xl border border-dashed border-border-primary/40 bg-white px-5 py-10 text-center shadow-sm">
          <CheckCircle2
            className="mx-auto mb-3 h-8 w-8 text-emerald-600/70"
            aria-hidden
          />
          <p className="text-sm font-medium text-text-primary">
            {hub.detalheVazioTitulo}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {hub.detalheVazioDescricao}
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
                  {temResultados && itensFiltrados.length !== itensEmAberto.length
                    ? ` · ${itensFiltrados.length} filtrado${itensFiltrados.length === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:max-w-[min(100%,42rem)]">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder={hub.detalheBuscaPlaceholder}
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

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFiltroPrioridade("")}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                  !filtroPrioridade
                    ? "border-accent-primary/40 bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/20"
                    : "border-border-primary/45 bg-[#FAFAFA] text-text-muted hover:border-border-primary/70 hover:text-text-primary"
                }`}
              >
                Todas
                <span className="tabular-nums opacity-80">
                  {itensEmAberto.length}
                </span>
              </button>
              {BUCKET_ORDER.map((id) => {
                const chip = PRIORIDADE_CHIP[id];
                const ativo = filtroPrioridade === id;
                const qtd = contagemPrioridade[id] || 0;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setFiltroPrioridade((prev) => (prev === id ? "" : id))
                    }
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      ativo ? chip.active : chip.idle
                    }`}
                  >
                    {BUCKET_META[id].titulo}
                    <span className="tabular-nums opacity-80">{qtd}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selecionados.size > 0 ? (
            <div className="flex flex-col gap-2 border-b border-accent-primary/15 bg-accent-primary/[0.04] px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {hub.detalheSelecionados(selecionados.size)}
                </p>
                <p className="text-xs tabular-nums text-text-muted">
                  R$ {formatarMoeda(totalSelecionado)}
                </p>
              </div>
              <ButtonDefault
                type="button"
                disabled={savingBulk}
                onClick={() => void marcarItensComoPago([...selecionados])}
                className={`${btnAccentPremium} !w-full sm:!w-auto`}
              >
                {savingBulk ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Salvando…
                  </span>
                ) : (
                  hub.detalheMarcarSelecionadosPago
                )}
              </ButtonDefault>
            </div>
          ) : null}

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
