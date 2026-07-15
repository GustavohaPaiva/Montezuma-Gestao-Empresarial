import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Package,
  Search,
  Wallet,
} from "lucide-react";
import { formatarMoeda } from "../utils/formatters";
import { SEM_FORNECEDOR_ID } from "../utils/materiaisPorFornecedor";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function MateriaisFornecedoresHub({
  fornecedores = [],
  totaisObra = { comprado: 0, pago: 0, pendente: 0 },
  qtdFornecedores = 0,
  onSelectFornecedor,
}) {
  const [busca, setBusca] = useState("");

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return fornecedores;
    return fornecedores.filter((f) =>
      (f.nome || "").toLowerCase().includes(termo),
    );
  }, [fornecedores, busca]);

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <section className="w-full rounded-2xl border border-border-primary/35 bg-white p-4 shadow-sm ring-1 ring-slate-900/5 sm:p-5">
        <div className="flex flex-row items-center gap-2 border-b border-slate-100 pb-3">
          <Wallet
            className="h-5 w-5 shrink-0 text-accent-primary/70"
            aria-hidden
          />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
            Visão financeira da obra
          </h2>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-left sm:grid-cols-4">
          <div className="min-w-0">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Fornecedores
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
              {qtdFornecedores}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              <Wallet className="h-3.5 w-3.5 shrink-0 text-orange-600/55" aria-hidden />
              Comprado
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
              R$ {formatarMoeda(totaisObra.comprado)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              <CheckCircle2
                className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                aria-hidden
              />
              Pago
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
              R$ {formatarMoeda(totaisObra.pago)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {totaisObra.pendente > 0 ? (
                <AlertCircle
                  className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                  aria-hidden
                />
              ) : (
                <CheckCircle2
                  className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                  aria-hidden
                />
              )}
              A pagar
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
              R$ {formatarMoeda(totaisObra.pendente)}
            </dd>
          </div>
        </dl>
      </section>

      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden
        />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar fornecedor..."
          className="w-full rounded-xl border border-border-primary/40 bg-white py-2.5 pl-10 pr-3 text-sm text-text-primary shadow-sm outline-none ring-1 ring-transparent transition focus:border-accent-primary/40 focus:ring-accent-primary/20"
        />
      </div>

      {fornecedoresFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-primary/40 bg-slate-50/80 px-5 py-10 text-center">
          <Building2
            className="mx-auto mb-3 h-8 w-8 text-text-muted/60"
            aria-hidden
          />
          <p className="text-sm font-medium text-text-primary">
            {busca.trim()
              ? "Nenhum fornecedor encontrado"
              : "Nenhum material lançado nesta obra"}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {busca.trim()
              ? "Tente outro nome ou limpe a busca."
              : "Quando houver compras com fornecedor, eles aparecem aqui."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {fornecedoresFiltrados.map((f) => {
            const semFornecedor = f.id === SEM_FORNECEDOR_ID;
            const tudoPago = f.pendente <= 0 && f.comprado > 0;

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFornecedor?.(f.id)}
                className={joinClasses(
                  "flex w-full cursor-pointer flex-col items-start gap-3 rounded-2xl border p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all sm:p-5",
                  "border-border-primary/35 bg-white hover:-translate-y-0.5 hover:border-accent-primary/25 hover:shadow-md",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25",
                )}
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="min-w-0 flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary">
                      {semFornecedor ? (
                        <Package className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <Building2 className="h-4 w-4" strokeWidth={2} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold tracking-tight text-text-primary">
                        {f.nome}
                      </span>
                      <span className="mt-0.5 block text-xs text-text-muted">
                        {f.qtdItens}{" "}
                        {f.qtdItens === 1 ? "item lançado" : "itens lançados"}
                      </span>
                    </div>
                  </div>
                </div>

                <dl className="grid w-full grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Comprado
                    </dt>
                    <dd className="mt-0.5 truncate text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                      R$ {formatarMoeda(f.comprado)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Pago
                    </dt>
                    <dd className="mt-0.5 truncate text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                      R$ {formatarMoeda(f.pago)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      A pagar
                    </dt>
                    <dd className="mt-0.5 truncate text-xs font-semibold tabular-nums text-text-primary sm:text-sm">
                      R$ {formatarMoeda(f.pendente)}
                    </dd>
                  </div>
                </dl>

                <div
                  className={joinClasses(
                    "flex items-center gap-1.5 text-xs",
                    tudoPago
                      ? "font-medium text-emerald-700"
                      : f.pendente > 0
                        ? "font-medium text-amber-800"
                        : "text-slate-500",
                  )}
                >
                  {tudoPago ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Tudo pago
                    </>
                  ) : f.pendente > 0 ? (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                      Pendente: R$ {formatarMoeda(f.pendente)}
                    </>
                  ) : (
                    <>
                      <Building2 className="h-3.5 w-3.5" aria-hidden />
                      Sem valor registrado
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
