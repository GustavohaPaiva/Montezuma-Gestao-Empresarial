import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CalendarClock,
  Package,
  Search,
  Wallet,
  CircleDollarSign,
} from "lucide-react";
import ModuleHub from "../../../components/gerais/ModuleHub";
import { homeDictionary } from "../../../constants/dictionaries";
import { api } from "../../../services/api";
import { formatarMoeda } from "../../obras/detalhe/utils/formatters";
import {
  BUCKET_META,
  BUCKET_ORDER,
  agregarFornecedoresKanban,
  resumirKpisMateriais,
} from "./materiaisPrioridade";

const hub = homeDictionary.financeiroHub;

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const BUCKET_COLUMN_STYLES = {
  vencidos: "border-rose-200/80 bg-rose-50/40",
  proxima_semana: "border-amber-200/80 bg-amber-50/40",
  ate_um_mes: "border-sky-200/80 bg-sky-50/40",
  mais_de_um_mes: "border-slate-200/80 bg-slate-50/50",
  sem_vencimento: "border-violet-200/80 bg-violet-50/40",
};

export default function FinanceiroMateriais() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [materiais, setMateriais] = useState([]);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await api.getMateriaisFinanceiro();
      setMateriais(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error("[FinanceiroMateriais] carregar:", error);
      setMateriais([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const kpis = useMemo(() => resumirKpisMateriais(materiais), [materiais]);
  const colunas = useMemo(
    () => agregarFornecedoresKanban(materiais),
    [materiais],
  );

  const resumo = useMemo(
    () => [
      {
        id: "fornecedores",
        label: hub.materiaisMetricFornecedores,
        value: kpis.fornecedoresDebito,
        icon: <Building2 className="h-5 w-5" />,
        theme: "primary",
      },
      {
        id: "a-pagar",
        label: hub.materiaisMetricAPagar,
        value: `R$ ${formatarMoeda(kpis.aPagar)}`,
        icon: <Wallet className="h-5 w-5" />,
        theme: "amber",
      },
      {
        id: "vencidos",
        label: hub.materiaisMetricVencidos,
        value: `R$ ${formatarMoeda(kpis.vencidosValor)}`,
        icon: <AlertCircle className="h-5 w-5" />,
        theme: "pink",
      },
      {
        id: "semana",
        label: hub.materiaisMetricProximaSemana,
        value: `R$ ${formatarMoeda(kpis.proximaSemanaValor)}`,
        icon: <CalendarClock className="h-5 w-5" />,
        theme: "emerald",
      },
      {
        id: "total-lancado",
        label: hub.materiaisMetricTotalLancado,
        value: `R$ ${formatarMoeda(kpis.totalLancado)}`,
        icon: <CircleDollarSign className="h-5 w-5" />,
        theme: "blue",
      }
    ],
    [kpis],
  );

  const termo = busca.trim().toLowerCase();

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={hub.materiaisTitulo}
      onVoltar={() => navigate("/financeiro")}
      resumo={resumo}
      resumoGridClass="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:grid-cols-5"
      resumoLoading={loading}
      acessos={[]}
      loading={loading}
      loadingTitulo={hub.materiaisLoadingTitulo}
      loadingDescricao={hub.materiaisLoadingDescricao}
      loadingIcon={<Package className="h-7 w-7" strokeWidth={2} />}
    >
      <div className="relative mb-5 w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={hub.materiaisBuscaPlaceholder}
          className="w-full rounded-xl border border-border-primary/40 bg-white py-2.5 pl-10 pr-3 text-sm text-text-primary shadow-sm outline-none ring-1 ring-transparent transition focus:border-accent-primary/40 focus:ring-accent-primary/20"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 lg:grid-cols-2">
        {BUCKET_ORDER.map((bucketId) => {
          const meta = BUCKET_META[bucketId];
          const cards = (colunas[bucketId] || []).filter((f) =>
            termo ? (f.nome || "").toLowerCase().includes(termo) : true,
          );

          return (
            <section
              key={bucketId}
              className={joinClasses(
                "flex min-h-[12rem] flex-col rounded-2xl border p-3 sm:p-4",
                BUCKET_COLUMN_STYLES[bucketId],
              )}
            >
              <header className="mb-3 border-b border-black/5 pb-2">
                <h3 className="text-sm font-bold tracking-tight text-text-primary">
                  {meta.titulo}
                </h3>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  {meta.descricao} · {cards.length}
                </p>
              </header>

              {cards.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-text-muted">
                  {hub.materiaisColunaVazia}
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {cards.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        navigate(`/financeiro/materiais/${f.id}`)
                      }
                      className="flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-border-primary/35 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
                          <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-text-primary">
                            {f.nome}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-text-muted">
                            {f.qtdItens}{" "}
                            {f.qtdItens === 1 ? "item" : "itens"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                        <span className="text-text-muted">A pagar</span>
                        <span className="font-semibold tabular-nums text-text-primary">
                          R$ {formatarMoeda(f.aPagar)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </ModuleHub>
  );
}
