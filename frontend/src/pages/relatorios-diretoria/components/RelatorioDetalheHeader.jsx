import { ArrowLeft } from "lucide-react";

export default function RelatorioDetalheHeader({
  obra,
  onVoltar,
  subtitulo,
  acoes,
}) {
  const nomeCliente = obra?.clientes?.nome || obra?.cliente || "Obra";
  const local = obra?.local || "Local não informado";

  return (
    <header className="sticky top-0 z-[60] mb-1 w-full border-b border-border-primary/40 bg-[#FAFAFA]/95 shadow-sm backdrop-blur-sm">
      <div className="flex w-full flex-col gap-3 px-[5%] py-2.5 sm:py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onVoltar}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-primary/50 bg-white text-text-primary shadow-sm transition-all hover:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/25 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          </button>

          <div className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2">
            <h1 className="mt-0.5 text-xs font-bold leading-tight tracking-tight text-text-primary sm:text-sm md:text-base">
              <span className="text-accent-primary">{nomeCliente}</span>
              <span className="text-text-muted"> · </span>
              <span>{local}</span>
            </h1>
            {subtitulo ? (
              <p className="mt-1 line-clamp-2 text-[10px] font-medium uppercase leading-snug tracking-wide text-text-muted sm:text-[11px]">
                {subtitulo}
              </p>
            ) : null}
          </div>
        </div>

        {acoes ? (
          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end md:w-auto">
            {acoes}
          </div>
        ) : null}
      </div>
    </header>
  );
}
