import { ArrowLeft, HardHat, Package } from "lucide-react";

export default function ObraDetalheHeader({
  navigate,
  obra,
  isReforma,
  isMobile,
  isEncarregado,
  onNovoMaterial,
  onNovaMaoDeObra,
}) {
  const nomeCliente = obra.clientes?.nome || obra.cliente;
  const temEnderecoObra = obra.clientes?.rua_obra || obra.clientes?.rua;

  const acoesClasse = isMobile
    ? "flex w-full flex-col gap-2"
    : "flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end";

  const botaoSecundario =
    "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border-primary/45 bg-white px-3 text-xs font-semibold text-text-primary shadow-sm transition-all hover:border-accent-primary/35 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent-primary/25 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[140px]";

  const botaoPrimario =
    "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-accent-primary/25 bg-accent-primary px-3 text-xs font-semibold text-white shadow-sm shadow-accent-primary/20 transition-all hover:bg-accent-primary-dark hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent-primary/35 focus:ring-offset-1 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[140px]";

  return (
    <header className="sticky top-0 z-[60] mb-1 w-full border-b border-border-primary/40 bg-[#FAFAFA]/95 shadow-sm backdrop-blur-sm">
      <div className="flex w-full flex-col gap-3 px-[5%] py-2.5 sm:py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/obras")}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-primary/50 bg-white text-text-primary shadow-sm transition-all hover:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/25 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div className="min-w-0 flex-1 rounded-lg  px-2.5 py-1.5 sm:px-3 sm:py-2">
            <h1 className="mt-0.5 text-xs font-bold leading-tight tracking-tight text-text-primary sm:text-sm md:text-base">
              <span className="text-accent-primary">{nomeCliente}</span>
              <span className="text-text-muted"> · </span>
              <span>{obra.local}</span>
              {isReforma ? (
                <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-800/90 sm:text-xs">
                  (Reforma)
                </span>
              ) : null}
            </h1>
            {temEnderecoObra ? (
              <p className="mt-1 line-clamp-2 text-[10px] font-medium uppercase leading-snug tracking-wide text-text-muted sm:text-[11px]">
                {obra.clientes.rua_obra || obra.clientes.rua}
                {obra.clientes.numero_obra
                  ? `, ${obra.clientes.numero_obra}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`${acoesClasse} shrink-0 md:w-auto`}>
          {!isEncarregado && onNovoMaterial ? (
            <button
              type="button"
              onClick={onNovoMaterial}
              className={botaoSecundario}
            >
              <Package className="h-3.5 w-3.5 shrink-0 text-accent-primary" />
              Novo material
            </button>
          ) : null}
          {onNovaMaoDeObra ? (
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
