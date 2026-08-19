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
import { agregarEmprestimosPorPapel } from "./emprestimosHub";

const d = homeDictionary;
const hub = d.financeiroHub;
const m = d.modulos;

const EMPRESTIMOS_VAZIO = {
  totalEmprestado: 0,
  qtdRelacoes: 0,
  qtdMovimentacoes: 0,
  emprestado: [],
  tomado: [],
};

function labelKind(kind) {
  if (kind === "obra") return "Obra";
  if (kind === "escritorio") return "Escritório";
  return "";
}

function ColunaHubEmprestimos({ titulo, descricao, vazio, itens }) {
  const total = (itens || []).reduce(
    (acc, item) => acc + (parseFloat(item.valor) || 0),
    0,
  );

  return (
    <section className="rounded-2xl border border-border-primary/40 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold tracking-tight text-text-primary">
          {titulo}
        </h3>
        <p className="text-sm text-text-muted">{descricao}</p>
      </div>

      {itens.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-primary/40 bg-slate-50/80 px-5 py-10 text-center">
          <Handshake
            className="mx-auto mb-3 h-8 w-8 text-text-muted/60"
            aria-hidden
          />
          <p className="text-sm font-medium text-text-primary">{vazio}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {itens.map((item) => (
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
                    {item.label}
                  </span>
                  {labelKind(item.kind) ? (
                    <span className="mt-0.5 block truncate text-xs text-text-muted">
                      {labelKind(item.kind)}
                      {item.qtd > 1 ? ` · ${item.qtd} empréstimos` : ""}
                    </span>
                  ) : null}
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

      <div className="mt-4 rounded-xl border border-border-primary/40 bg-[#FAFAFA] p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
          {hub.emprestimosTotalAberto}
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-text-primary">
          R$ {formatarMoeda(total)}
        </p>
      </div>
    </section>
  );
}

export default function FinanceiroHub() {
  const navigate = useNavigate();
  const [loadingEmprestimos, setLoadingEmprestimos] = useState(true);
  const [emprestimos, setEmprestimos] = useState(EMPRESTIMOS_VAZIO);

  const carregarEmprestimos = useCallback(async () => {
    setLoadingEmprestimos(true);
    try {
      const movs = await api.getEmprestimos({ apenasAbertos: true });
      setEmprestimos(agregarEmprestimosPorPapel(movs));
    } catch (error) {
      console.error("[FinanceiroHub] emprestimos:", error);
      setEmprestimos(EMPRESTIMOS_VAZIO);
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
          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border-primary/30 bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ColunaHubEmprestimos
              titulo={hub.emprestimosColunaEmprestado}
              descricao={hub.emprestimosColunaEmprestadoSub}
              vazio={hub.emprestimosVazioEmprestado}
              itens={emprestimos.emprestado}
            />
            <ColunaHubEmprestimos
              titulo={hub.emprestimosColunaTomado}
              descricao={hub.emprestimosColunaTomadoSub}
              vazio={hub.emprestimosVazioTomado}
              itens={emprestimos.tomado}
            />
          </div>
        )}
      </section>
    </ModuleHub>
  );
}
