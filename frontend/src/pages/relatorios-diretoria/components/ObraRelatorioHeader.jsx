import { HardHat, MapPin } from "lucide-react";
import {
  badgeStatusObra,
  relatorioSecaoClass,
  relatorioDetalheHeaderClass,
} from "../relatoriosDiretoriaUi";

export default function ObraRelatorioHeader({ obra }) {
  const cliente = obra?.clientes?.nome || obra?.cliente || "Cliente não informado";
  const local = obra?.local || "Local não informado";
  const status = obra?.status;

  return (
    <section className={relatorioSecaoClass}>
      <div className={relatorioDetalheHeaderClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
              <HardHat className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Obra em acompanhamento
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                {cliente}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                <MapPin className="h-4 w-4 shrink-0 text-accent-primary/80" />
                <span>{local}</span>
              </div>
            </div>
          </div>
          {status ? (
            <span
              className={`inline-flex shrink-0 self-start rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${badgeStatusObra(status)}`}
            >
              {status}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
