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
import ModuleHub from "../../../components/gerais/ModuleHub";
import TabelaSimples from "../../../components/gerais/TabelaSimples";
import { homeDictionary } from "../../../constants/dictionaries";
import { api } from "../../../services/api";
import { agregarFinanceiroFornecedor } from "../../fornecedores/fornecedorFinanceiro";
import { formatarDataBR, formatarMoeda } from "../../obras/detalhe/utils/formatters";
import {
  BUCKET_META,
  getBucketPrioridade,
  isVencido,
  labelObraCliente,
  ordenarItensPorPrioridade,
} from "./materiaisPrioridade";

const hub = homeDictionary.financeiroHub;

export default function FinanceiroMateriaisDetalhe() {
  const { fornecedorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fornecedorNome, setFornecedorNome] = useState("");
  const [materiais, setMateriais] = useState([]);
  const [savingId, setSavingId] = useState(null);

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

  const itensOrdenados = useMemo(
    () => ordenarItensPorPrioridade(materiais),
    [materiais],
  );

  const totais = useMemo(
    () => agregarFinanceiroFornecedor(materiais),
    [materiais],
  );

  const resumo = useMemo(
    () => [
      {
        id: "itens",
        label: hub.detalheMetricItens,
        value: itensOrdenados.length,
        icon: <Package className="h-5 w-5" />,
        theme: "primary",
      },
      {
        id: "a-pagar",
        label: hub.materiaisMetricAPagar,
        value: `R$ ${formatarMoeda(totais.pendente)}`,
        icon: <Wallet className="h-5 w-5" />,
        theme: "amber",
      },
      {
        id: "vencido",
        label: hub.materiaisMetricVencidos,
        value: `R$ ${formatarMoeda(totais.vencido)}`,
        icon: <AlertCircle className="h-5 w-5" />,
        theme: "pink",
      },
      {
        id: "pago",
        label: hub.detalheMetricPago,
        value: `R$ ${formatarMoeda(totais.pago)}`,
        icon: <CheckCircle2 className="h-5 w-5" />,
        theme: "emerald",
      },
    ],
    [itensOrdenados.length, totais],
  );

  const handleTogglePago = async (item, checked) => {
    if (!item?.id || savingId) return;
    const novoStatus = checked ? "Pago" : "Aguardando pagamento";
    setSavingId(item.id);

    const prev = materiais;
    setMateriais((lista) =>
      lista.map((m) =>
        m.id === item.id ? { ...m, status_financeiro: novoStatus } : m,
      ),
    );

    try {
      await api.updateMaterialStatusFinanceiro(item.id, novoStatus);
    } catch (error) {
      console.error("[FinanceiroMateriaisDetalhe] toggle pago:", error);
      setMateriais(prev);
    } finally {
      setSavingId(null);
    }
  };

  const colunasTabela = [
    "Obra / Cliente",
    "Material",
    "Valor",
    "Vencimento",
    "Prioridade",
    "Pago",
  ];

  const dadosTabela = itensOrdenados.map((item) => {
    const bucket = getBucketPrioridade(item);
    const meta = bucket ? BUCKET_META[bucket] : null;
    const vencido = isVencido(item);

    return [
      <div
        key={`obra-${item.id}`}
        className="mx-auto max-w-[220px] truncate text-center text-sm font-semibold text-text-primary"
        title={labelObraCliente(item.obras)}
      >
        {labelObraCliente(item.obras)}
      </div>,
      <div
        key={`mat-${item.id}`}
        className="mx-auto max-w-[180px] truncate text-center text-sm text-text-primary"
        title={item.material}
      >
        {item.material || "—"}
      </div>,
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
          className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-medium ${
            bucket === "vencidos"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : bucket === "proxima_semana"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : bucket === "ate_um_mes"
                  ? "border-sky-200 bg-sky-50 text-sky-900"
                  : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {meta?.titulo || "—"}
        </span>
      </div>,
      <div key={`pago-${item.id}`} className="flex justify-center">
        {savingId === item.id ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent-primary" />
        ) : (
          <input
            type="checkbox"
            checked={false}
            onChange={(e) => void handleTogglePago(item, e.target.checked)}
            aria-label={`Marcar ${item.material || "item"} como pago`}
            className="h-4 w-4 cursor-pointer rounded border-border-primary text-accent-primary focus:ring-accent-primary/30"
          />
        )}
      </div>,
    ];
  });

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={fornecedorNome || hub.materiaisTitulo}
      onVoltar={() => navigate("/financeiro/materiais")}
      resumo={resumo}
      resumoLoading={loading}
      acessos={[]}
      loading={loading}
      loadingTitulo={hub.materiaisLoadingTitulo}
      loadingDescricao={hub.materiaisLoadingDescricao}
      loadingIcon={<Building2 className="h-7 w-7" strokeWidth={2} />}
    >
      {itensOrdenados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-primary/40 bg-slate-50/80 px-5 py-12 text-center">
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
        <div className="overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-sm">
          <TabelaSimples colunas={colunasTabela} dados={dadosTabela} />
        </div>
      )}
    </ModuleHub>
  );
}
