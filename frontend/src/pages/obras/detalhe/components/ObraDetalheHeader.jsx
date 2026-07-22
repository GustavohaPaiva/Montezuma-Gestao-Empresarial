import { ArrowLeft, HardHat, Wallet } from "lucide-react";
import { formatarMoeda } from "../utils/formatters";

export default function ObraDetalheHeader({
  navigate,
  obra,
  isReforma,
  isMobile,
  isSecretaria,
  onNovaMaoDeObra,
  saldoConta,
}) {
  const nomeCliente = obra.clientes?.nome || obra.cliente;
  const temEnderecoObra = obra.clientes?.rua_obra || obra.clientes?.rua;
  const saldoNum = saldoConta == null ? null : parseFloat(saldoConta) || 0;
  const saldoNegativo = saldoNum != null && saldoNum < 0;

  const acoesClasse = isMobile
    ? "flex w-full flex-col gap-2"
    : "flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end";

  const botaoPrimario =
    "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-accent-primary px-3.5 text-xs font-semibold text-white shadow-sm shadow-accent-primary/20 transition-all hover:bg-accent-primary-dark hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/35 focus-visible:ring-offset-1 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[140px]";

  return (
    <header className="sticky top-0 z-[60] mb-1 w-full border-b border-border-primary/25 bg-white/80 shadow-[0_6px_24px_-16px_rgba(15,23,42,0.3)] backdrop-blur-xl">
      <div className="flex w-full flex-col gap-2.5 px-[5%] py-2.5 sm:py-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/obras")}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-primary/30 bg-white text-text-primary shadow-sm transition-all hover:border-accent-primary/30 hover:text-accent-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xs font-bold leading-tight tracking-tight text-text-primary sm:text-sm md:text-base">
              <span className="text-accent-primary">{nomeCliente}</span>
              <span className="mx-1.5 font-medium text-text-muted/50">·</span>
              <span>{obra.local}</span>
              {isReforma ? (
                <span className="ml-1.5 inline-flex align-middle rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800/90 ring-1 ring-amber-500/15">
                  Reforma
                </span>
              ) : null}
            </h1>
            {temEnderecoObra ? (
              <p className="mt-0.5 line-clamp-1 text-[10px] font-medium uppercase leading-snug tracking-wide text-text-muted sm:text-[11px]">
                {obra.clientes.rua_obra || obra.clientes.rua}
                {obra.clientes.numero_obra
                  ? `, ${obra.clientes.numero_obra}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`${acoesClasse} shrink-0 md:w-auto`}>
          {saldoNum != null ? (
            <div
              className={[
                "inline-flex h-10 w-full items-center gap-2 rounded-xl border px-2.5 sm:w-auto",
                saldoNegativo
                  ? "border-rose-500/25 bg-rose-50/90 text-rose-800 ring-1 ring-rose-500/10"
                  : "border-emerald-500/25 bg-emerald-50/90 text-emerald-800 ring-1 ring-emerald-500/10",
              ].join(" ")}
              title="Saldo disponível na conta da obra"
            >
              <Wallet className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2.25} />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Saldo
              </span>
              <span className="text-sm font-bold tabular-nums tracking-tight">
                R$ {formatarMoeda(saldoNum)}
              </span>
            </div>
          ) : null}

          {!isSecretaria && onNovaMaoDeObra ? (
            <button
              type="button"
              onClick={onNovaMaoDeObra}
              className={botaoPrimario}
            >
              <HardHat className="h-3.5 w-3.5 shrink-0 opacity-95" />
              Nova mão de obra
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
