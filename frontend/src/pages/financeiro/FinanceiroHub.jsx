import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Construction,
  Handshake,
  Package,
  Wallet,
} from "lucide-react";
import ModuleHub from "../../components/gerais/ModuleHub";
import { homeDictionary } from "../../constants/dictionaries";
import {
  homeSectionAccentLineClass,
  homeSectionHeaderClass,
  homeSectionLabelAccentClass,
  homeSectionTitleClass,
} from "../home/homeUi";
import { api } from "../../services/api";
import { formatarMoeda } from "../obras/detalhe/utils/formatters";
import { agregarEmprestimosLedger } from "./emprestimosHub";

const d = homeDictionary;
const hub = d.financeiroHub;
const m = d.modulos;

export default function FinanceiroHub() {
  const navigate = useNavigate();
  const [loadingEmprestimos, setLoadingEmprestimos] = useState(true);
  const [emprestimos, setEmprestimos] = useState({
    totalEmprestado: 0,
    qtdRelacoes: 0,
    qtdMovimentacoes: 0,
    itens: [],
  });

  const carregarEmprestimos = useCallback(async () => {
    setLoadingEmprestimos(true);
    try {
      const movs = await api.getEmprestimos({ apenasAbertos: true });
      setEmprestimos(agregarEmprestimosLedger(movs));
    } catch (error) {
      console.error("[FinanceiroHub] emprestimos:", error);
      setEmprestimos({
        totalEmprestado: 0,
        qtdRelacoes: 0,
        qtdMovimentacoes: 0,
        itens: [],
      });
    } finally {
      setLoadingEmprestimos(false);
    }
  }, []);

  useEffect(() => {
    void carregarEmprestimos();
  }, [carregarEmprestimos]);

  const acessos = useMemo(
    () => [
      {
        id: "escritorio",
        titulo: hub.escritorioTitulo,
        descricao: hub.escritorioDescricao,
        destaques: hub.escritorioDestaques,
        colorTheme: "emerald",
        Icon: Building2,
        onClick: () => navigate("/financeiro/escritorio"),
      },
      {
        id: "materiais",
        titulo: hub.materiaisTitulo,
        descricao: hub.materiaisDescricao,
        destaques: hub.materiaisDestaques,
        colorTheme: "amber",
        Icon: Package,
        onClick: () => navigate("/financeiro/materiais"),
      },
      {
        id: "mao-de-obra",
        titulo: hub.maoObraTitulo,
        descricao: hub.maoObraDescricao,
        destaques: hub.maoObraDestaques,
        colorTheme: "indigo",
        Icon: Construction,
        onClick: () => navigate("/financeiro/mao-de-obra"),
      },
    ],
    [navigate],
  );

  const resumo = useMemo(
    () => [
      {
        id: "relacoes",
        label: hub.metricEmprestimosRelacoes,
        value: loadingEmprestimos ? "…" : emprestimos.qtdRelacoes,
        icon: <Handshake className="h-5 w-5" />,
        theme: "primary",
      },
      {
        id: "volume",
        label: hub.metricEmprestimosVolume,
        value: loadingEmprestimos
          ? "…"
          : `R$ ${formatarMoeda(emprestimos.totalEmprestado)}`,
        icon: <Wallet className="h-5 w-5" />,
        theme: "amber",
      },
    ],
    [emprestimos, loadingEmprestimos],
  );

  const itensEmprestimo = emprestimos.itens.slice(0, 9);

  return (
    <ModuleHub
      eyebrow={hub.eyebrow}
      titulo={m.financeiro}
      onVoltar={() => navigate("/")}
      resumo={resumo}
      resumoLoading={loadingEmprestimos}
      acessos={acessos}
      loading={false}
      loadingIcon={<Wallet className="h-7 w-7" strokeWidth={2} />}
    >
      <section className="mb-4">
        <div className={homeSectionHeaderClass}>
          <div>
            <span className={homeSectionLabelAccentClass}>
              {hub.emprestimosLabel}
            </span>
            <h2 className={`${homeSectionTitleClass} mt-1`}>
              {hub.emprestimosTitulo}
            </h2>
            <div className={homeSectionAccentLineClass} aria-hidden />
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              {hub.emprestimosDescricao}
            </p>
          </div>
        </div>

        {loadingEmprestimos ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-border-primary/30 bg-white"
              />
            ))}
          </div>
        ) : itensEmprestimo.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border-primary/40 bg-slate-50/80 px-5 py-10 text-center">
            <Handshake
              className="mx-auto mb-3 h-8 w-8 text-text-muted/60"
              aria-hidden
            />
            <p className="text-sm font-medium text-text-primary">
              {hub.emprestimosVazioTitulo}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              {hub.emprestimosVazioDescricao}
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {itensEmprestimo.map((item) => (
              <div
                key={item.key}
                className="flex w-full flex-col gap-3 rounded-2xl border border-border-primary/35 bg-white p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-5"
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                    <Handshake className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold tracking-tight text-text-primary">
                      {item.origemLabel}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-text-muted">
                      → {item.destinoLabel}
                      {item.destinoKind === "obra"
                        ? " (obra)"
                        : item.destinoKind === "escritorio"
                          ? " (escritório)"
                          : ""}
                    </span>
                  </div>
                </div>
                <dl className="grid w-full grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Em aberto
                    </dt>
                    <dd className="mt-0.5 truncate text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                      R$ {formatarMoeda(item.valor)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Original
                    </dt>
                    <dd className="mt-0.5 truncate text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                      R$ {formatarMoeda(item.original ?? item.valor)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </section>
    </ModuleHub>
  );
}
