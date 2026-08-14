import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Building2,
  Plus,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
import BaseButton from "../../../../components/gerais/BaseButton";
import { formatarDataBR, formatarMoeda } from "../utils/formatters";
import {
  TIPOS_MOVIMENTACAO_OBRA,
  agregarEmprestimosPorContra,
  formatarValorMovimentacao,
  resumirCaixaObra,
  tituloMovimentacao,
  valorAssinadoMovimentacao,
} from "../utils/obraCaixa";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

function iconeMovimentacao(tipo) {
  switch (tipo) {
    case TIPOS_MOVIMENTACAO_OBRA.entrada:
      return ArrowDownLeft;
    case TIPOS_MOVIMENTACAO_OBRA.saida_pagamento:
      return Receipt;
    case TIPOS_MOVIMENTACAO_OBRA.transferencia_saida:
      return ArrowUpRight;
    case TIPOS_MOVIMENTACAO_OBRA.transferencia_entrada:
      return ArrowDownLeft;
    default:
      return Wallet;
  }
}

export default function ObraDetalheControleFinanceiro({
  movimentacoes = [],
  emprestimosLedger = [],
  onNovaEntrada,
  onTransferir,
  onAmortizarEmprestimo,
}) {
  const resumo = useMemo(
    () => resumirCaixaObra(movimentacoes),
    [movimentacoes],
  );

  const emprestimos = useMemo(() => {
    const obraPessoa = agregarEmprestimosPorContra(movimentacoes).filter(
      (row) => row.kind !== "escritorio",
    );
    const ledger = (emprestimosLedger || []).map((item) => ({
      key: `ledger:${item.id}`,
      kind: "escritorio",
      ledger: true,
      emprestimo: item,
      label: item.contraLabel,
      emprestou: item.emprestou ? parseFloat(item.valor_original) || 0 : 0,
      pegouEmprestado: item.emprestou
        ? 0
        : parseFloat(item.valor_original) || 0,
      liquido: item.emprestou
        ? parseFloat(item.saldo_aberto) || 0
        : -(parseFloat(item.saldo_aberto) || 0),
    }));
    return [...ledger, ...obraPessoa];
  }, [movimentacoes, emprestimosLedger]);

  const timeline = useMemo(
    () =>
      [...(movimentacoes || [])].sort((a, b) => {
        const da = String(a.data || "");
        const db = String(b.data || "");
        if (da !== db) return db.localeCompare(da);
        return String(b.created_at || "").localeCompare(
          String(a.created_at || ""),
        );
      }),
    [movimentacoes],
  );

  const cardsResumo = [
    {
      id: "saldo",
      label: "Saldo disponível",
      valor: resumo.saldo,
      className: resumo.saldo >= 0 ? "text-emerald-700" : "text-rose-700",
      icon: Wallet,
    },
    {
      id: "entradas",
      label: "Entradas",
      valor: resumo.totalEntradas,
      className: "text-text-primary",
      icon: ArrowDownLeft,
    },
    {
      id: "saidas",
      label: "Saídas (pagamentos)",
      valor: resumo.totalSaidasPagamento,
      className: "text-text-primary",
      icon: Receipt,
    },
    {
      id: "emprestou",
      label: "Emprestou",
      valor: resumo.totalTransferenciasEnviadas,
      className: "text-text-primary",
      icon: ArrowUpRight,
    },
    {
      id: "recebeu",
      label: "Pegou emprestado",
      valor: resumo.totalTransferenciasRecebidas,
      className: "text-text-primary",
      icon: ArrowDownLeft,
    },
  ];

  return (
    <div className="mb-6 flex w-full flex-col gap-5 sm:gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border-primary/35 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
            <Wallet className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Caixa da obra
            </p>
            <h2 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              Controle financeiro
            </h2>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <BaseButton
            type="button"
            onClick={onNovaEntrada}
            icon={<Plus className="h-4 w-4" strokeWidth={2.25} />}
            className="w-full sm:w-auto"
          >
            Nova entrada
          </BaseButton>
          <BaseButton
            type="button"
            variant="outline"
            onClick={onTransferir}
            icon={<ArrowLeftRight className="h-4 w-4" strokeWidth={2.25} />}
            className="w-full sm:w-auto"
          >
            Transferir saldo
          </BaseButton>
        </div>
      </div>

      <section className="w-full rounded-2xl border border-border-primary/35 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:p-5">
        <div className="flex flex-row items-center gap-2 border-b border-slate-100 pb-3">
          <Wallet
            className="h-5 w-5 shrink-0 text-accent-primary/70"
            aria-hidden
          />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
            Visão do caixa
          </h3>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-left sm:grid-cols-3 lg:grid-cols-5">
          {cardsResumo.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <Icon
                    className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                    aria-hidden
                  />
                  {card.label}
                </dt>
                <dd
                  className={`mt-1 text-lg font-semibold tabular-nums sm:text-xl ${card.className}`}
                >
                  R$ {formatarMoeda(card.valor)}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">
          Empréstimos
        </h3>
        {emprestimos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-primary/40 bg-slate-50/80 px-5 py-10 text-center">
            <Building2
              className="mx-auto mb-3 h-8 w-8 text-text-muted/60"
              aria-hidden
            />
            <p className="text-sm font-medium text-text-primary">
              Nenhum empréstimo ainda
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Empréstimo com escritório aparece com o saldo em aberto. Obra e
              pessoa continuam pelo histórico de transferências.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {emprestimos.map((item) => {
              const liquidoPositivo = item.liquido >= 0;
              const IconContra = item.kind === "pessoa" ? User : Building2;
              return (
                <div
                  key={item.key}
                  className="flex w-full flex-col gap-3 rounded-2xl border border-border-primary/35 bg-white p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-5"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                      <IconContra className="h-4 w-4" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold tracking-tight text-text-primary">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-text-muted">
                        {item.kind === "pessoa"
                          ? "Pessoa · "
                          : item.kind === "escritorio"
                            ? "Escritório · "
                            : "Obra · "}
                        {liquidoPositivo
                          ? "Esta obra tem a receber"
                          : "Esta obra tem a devolver"}
                      </span>
                    </div>
                  </div>

                  <dl className="grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                    <div className="min-w-0">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Emprestou
                      </dt>
                      <dd className="mt-0.5 truncate text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                        R$ {formatarMoeda(item.emprestou)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Pegou
                      </dt>
                      <dd className="mt-0.5 truncate text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                        R$ {formatarMoeda(item.pegouEmprestado)}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Líquido
                      </dt>
                      <dd
                        className={joinClasses(
                          "mt-0.5 truncate text-xs font-semibold tabular-nums sm:text-sm",
                          liquidoPositivo ? "text-emerald-700" : "text-rose-700",
                        )}
                      >
                        {liquidoPositivo ? "+" : "−"} R${" "}
                        {formatarMoeda(Math.abs(item.liquido))}
                      </dd>
                    </div>
                  </dl>
                  {item.ledger && typeof onAmortizarEmprestimo === "function" ? (
                    <BaseButton
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => onAmortizarEmprestimo(item.emprestimo)}
                    >
                      {item.liquido < 0 ? "Devolver" : "Receber"}
                    </BaseButton>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-text-muted">
          Movimentações recentes
        </h3>
        {timeline.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-primary/40 bg-white px-5 py-10 text-center text-sm text-text-muted">
            Nenhuma movimentação ainda. Lance uma entrada para iniciar o caixa
            desta obra.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {timeline.map((mov) => {
              const Icon = iconeMovimentacao(mov.tipo);
              const assinado = valorAssinadoMovimentacao(mov);
              const positivo = assinado >= 0;
              return (
                <li
                  key={mov.id}
                  className="flex items-start gap-3 rounded-2xl border border-border-primary/35 bg-white px-4 py-3.5 shadow-sm sm:items-center sm:px-5"
                >
                  <span
                    className={joinClasses(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:mt-0",
                      positivo
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700",
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {tituloMovimentacao(mov)}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {formatarDataBR(mov.data)}
                      {mov.descricao?.trim() &&
                      mov.tipo !== TIPOS_MOVIMENTACAO_OBRA.entrada &&
                      mov.tipo !== TIPOS_MOVIMENTACAO_OBRA.saida_pagamento
                        ? ` · ${mov.descricao.trim()}`
                        : ""}
                    </p>
                  </div>
                  <p
                    className={joinClasses(
                      "shrink-0 text-sm font-bold tabular-nums",
                      positivo ? "text-emerald-700" : "text-rose-700",
                    )}
                  >
                    {formatarValorMovimentacao(mov)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
