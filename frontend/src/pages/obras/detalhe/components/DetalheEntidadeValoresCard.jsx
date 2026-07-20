import { AlertCircle, CheckCircle2, Wallet } from "lucide-react";
import { formatarMoeda } from "../utils/formatters";

/**
 * Card compacto de totais no detalhe de fornecedor/prestador
 * (mesmo visual da visão macro / hub).
 */
export default function DetalheEntidadeValoresCard({
  primarioLabel = "Contratado",
  primarioValor = 0,
  pago = 0,
  pendente = 0,
}) {
  return (
    <section className="w-full rounded-2xl border border-border-primary/35 bg-white p-3 shadow-sm ring-1 ring-slate-900/5 sm:p-4">
      <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-left sm:gap-x-6">
        <div className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
            <Wallet
              className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
              aria-hidden
            />
            {primarioLabel}
          </dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-text-primary sm:text-lg">
            R$ {formatarMoeda(primarioValor)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
              aria-hidden
            />
            Pago
          </dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-text-primary sm:text-lg">
            R$ {formatarMoeda(pago)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
            {pendente > 0 ? (
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
          <dd className="mt-1 text-base font-semibold tabular-nums text-text-primary sm:text-lg">
            R$ {formatarMoeda(pendente)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
