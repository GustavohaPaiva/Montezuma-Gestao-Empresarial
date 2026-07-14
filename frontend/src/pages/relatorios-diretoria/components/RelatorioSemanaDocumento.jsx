import { CalendarDays, CheckCircle2 } from "lucide-react";
import {
  isSemanaAtual,
  labelSemanaFromInicio,
} from "../relatoriosDiretoriaUtils";
import {
  relatorioCorridoCorpoClass,
  relatorioDocumentoHeaderClass,
  relatorioDocumentoMetaChipClass,
  relatorioDocumentoMetaChipLabelClass,
  relatorioDocumentoMetaChipValueClass,
  relatorioDocumentoMetaGridClass,
  relatorioDocumentoRodapeClass,
  relatorioDocumentoShellClass,
  relatorioPeriodoTopBarClass,
  relatorioSecaoAccentLineClass,
  relatorioSecaoLabelAccentClass,
  relatorioSecaoTituloClass,
} from "../relatoriosDiretoriaUi";
import RelatorioSemanaCorpoCorrido from "./RelatorioSemanaCorpoCorrido";

function MetaChip({ label, value }) {
  return (
    <div className={relatorioDocumentoMetaChipClass}>
      <p className={relatorioDocumentoMetaChipLabelClass}>{label}</p>
      <p className={relatorioDocumentoMetaChipValueClass}>{value || "—"}</p>
    </div>
  );
}

export default function RelatorioSemanaDocumento({
  semanaInicio,
  consolidado,
  ultimaAtualizacao,
}) {
  const label = labelSemanaFromInicio(semanaInicio);
  const semanaAtual = isSemanaAtual(semanaInicio);

  const dataEmissao = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className={relatorioDocumentoShellClass}>
      <span className={relatorioPeriodoTopBarClass} aria-hidden />

      <header className={relatorioDocumentoHeaderClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span className={relatorioSecaoLabelAccentClass}>Relatório</span>
            <h2
              className={`${relatorioSecaoTituloClass} mt-1 text-lg sm:text-xl`}
            >
              Relatório Semanal
            </h2>
            <div className={relatorioSecaoAccentLineClass} aria-hidden />
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-text-primary">
              <CalendarDays className="h-4 w-4 shrink-0 text-accent-primary" />
              {label}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {semanaAtual ? (
              <span className="inline-flex rounded-full border border-accent-primary/25 bg-accent-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-primary">
                Semana atual
              </span>
            ) : null}
            {consolidado.completo ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Completo
              </span>
            ) : null}
          </div>
        </div>

        <div className={relatorioDocumentoMetaGridClass}>
          <MetaChip label="Escopo" value="Geral da semana" />
          <MetaChip label="Período" value={label} />
          <MetaChip
            label="Última atualização"
            value={ultimaAtualizacao || "Sem lançamentos"}
          />
        </div>
      </header>

      <div className={relatorioCorridoCorpoClass}>
        <RelatorioSemanaCorpoCorrido consolidado={consolidado} />
      </div>

      <footer className={relatorioDocumentoRodapeClass}>
        Emitido em {dataEmissao}
        {ultimaAtualizacao ? ` · Última atualização: ${ultimaAtualizacao}` : ""}
      </footer>
    </article>
  );
}
