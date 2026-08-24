import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  CircleDollarSign,
  HardHat,
  Package,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";
import ModuleHub from "../../../components/gerais/ModuleHub";
import { homeDictionary } from "../../../constants/dictionaries";
import { formatarMoeda } from "../../obras/detalhe/utils/formatters";
import { api } from "../../../services/api";
import { resumirKpisMaoDeObra, prestadoresEmAberto } from "./maoDeobraPrioridade";

const hub = homeDictionary.financeiroHub;

export default function FinanceiroMaoDeObra() {
  const navigate = useNavigate();
  const [maoDeObra, setMaoDeObra] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  useEffect(() =>{
    api.getContasPagarPrestador()
    .then((dados) => {
      setMaoDeObra(Array.isArray(dados) ? dados : []);      
    })
    .catch((error) => {
      console.error("[FinanceiroMaoDeObra] carregar:", error);
      setMaoDeObra([]);
    })
    .finally(() => {
      setLoading(false);
    })
    
  }, [])
  const kpis = useMemo(() => resumirKpisMaoDeObra(maoDeObra), [maoDeObra]);

  const prestadores = useMemo(() => prestadoresEmAberto(maoDeObra), [maoDeObra]);

  const resumo = useMemo(
    () => [
      {
        id: "itens-abertos",
        label: hub.maoObraMetricItensAbertos,
        value: kpis.itensAbertos,
        icon: <Package className="h-5 w-5" />,
        theme: "primary",
      },
      {
        id: "a-pagar",
        label: hub.maoObraMetricAPagar,
        value: `R$ ${formatarMoeda(kpis.aPagar)}`,
        icon: <Wallet className="h-5 w-5" />,
        theme: "amber",
      },
      {
        id: "pago",
        label: hub.maoObraMetricPago,
        value: `R$ ${formatarMoeda(kpis.pago)}`,
        icon: <CheckCircle2 className="h-5 w-5" />,
        theme: "emerald",
      },
      {
        id: "total-lancado",
        label: hub.maoObraMetricTotalLancado,
        value: `R$ ${formatarMoeda(kpis.totalLancado)}`,
        icon: <CircleDollarSign className="h-5 w-5" />,
        theme: "blue",
      },
    ],
    [kpis],
  );

  const termo = busca.trim().toLowerCase();
  const prestadoresFiltrados = termo
    ? prestadores.filter((p) => (p.nome || "").toLowerCase().includes(termo))
    : prestadores;

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={hub.maoObraTitulo}
      onVoltar={() => navigate("/financeiro")}
      resumo={resumo}
      resumoGridClass="grid grid-cols-2 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4"
      acessos={[]}
      resumoLoading={loading}
      loading={false}
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
          placeholder={hub.maoObraBuscaPlaceholder}
          className="w-full rounded-xl border border-border-primary/40 bg-white py-2.5 pl-10 pr-3 text-sm text-text-primary shadow-sm outline-none ring-1 ring-transparent transition focus:border-accent-primary/40 focus:ring-accent-primary/20"
        />
      </div>

      {prestadoresFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-primary/40 bg-slate-50/80 px-5 py-10 text-center">
          <HardHat
            className="mx-auto mb-3 h-8 w-8 text-text-muted/60"
            aria-hidden
          />
          <p className="text-sm font-medium text-text-primary">
            {termo ? hub.maoObraVazioBusca : hub.maoObraVazioTitulo}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {termo
              ? "Tente outro nome ou limpe a busca."
              : hub.maoObraVazioDescricao}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {prestadoresFiltrados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/financeiro/mao-de-obra/${p.id}`)}
              className="flex w-full cursor-pointer flex-col gap-2 rounded-2xl border border-border-primary/35 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25 sm:p-5"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                  <UserRound className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-bold tracking-tight text-text-primary">
                    {p.nome}
                  </span>
                  <span className="mt-0.5 block text-xs text-text-muted">
                    {p.qtdItens} {p.qtdItens === 1 ? "item" : "itens"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-text-muted">{hub.maoObraMetricAPagar}</span>
                <span className="font-semibold tabular-nums text-text-primary">
                  R$ {formatarMoeda(p.aPagar)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </ModuleHub>
  );
}
