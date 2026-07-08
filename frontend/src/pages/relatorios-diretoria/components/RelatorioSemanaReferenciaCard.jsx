import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import BaseSelect from "../../../components/gerais/BaseSelect";
import {
  deslocarSemanaNoMes,
  isSemanaAtual,
  labelSemanaFromInicio,
  opcoesSemanaSelect,
  semanasDoMes,
} from "../relatoriosDiretoriaUtils";
import {
  relatorioPeriodoCampoClass,
  relatorioPeriodoNavBtnClass,
  relatorioPeriodoPanelClass,
  relatorioPeriodoPillClass,
  relatorioPeriodoTopBarClass,
  relatorioSecaoAccentLineClass,
  relatorioSecaoLabelAccentClass,
  relatorioSecaoTituloClass,
} from "../relatoriosDiretoriaUi";

export default function RelatorioSemanaReferenciaCard({
  semanaInicio,
  ano,
  mes,
  onTrocarSemana,
}) {
  const label = labelSemanaFromInicio(semanaInicio);
  const semanaAtual = isSemanaAtual(semanaInicio);
  const opcoes = opcoesSemanaSelect(ano, mes);
  const semanas = semanasDoMes(ano, mes);
  const idxAtual = semanas.findIndex((s) => s.inicio === semanaInicio);

  const podeAnterior = idxAtual > 0;
  const podeProxima = idxAtual >= 0 && idxAtual < semanas.length - 1;

  const irSemanaAnterior = () => {
    const nova = deslocarSemanaNoMes(ano, mes, semanaInicio, -1);
    if (nova) onTrocarSemana?.(nova);
  };

  const irSemanaSeguinte = () => {
    const nova = deslocarSemanaNoMes(ano, mes, semanaInicio, 1);
    if (nova) onTrocarSemana?.(nova);
  };

  return (
    <section className={relatorioPeriodoPanelClass}>
      <span className={relatorioPeriodoTopBarClass} aria-hidden />
      <div
        className="pointer-events-none absolute -right-8 -top-6 h-32 w-32 rounded-full bg-accent-primary/10 blur-[60px]"
        aria-hidden
      />
      <CalendarDays
        className="pointer-events-none absolute -bottom-2 -right-1 h-16 w-16 text-accent-primary/[0.07] sm:h-20 sm:w-20"
        strokeWidth={1}
        aria-hidden
      />

      <div className="relative z-10 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className={relatorioSecaoLabelAccentClass}>Calendário</span>
            <h2 className={`${relatorioSecaoTituloClass} mt-1.5`}>
              Semana de referência
            </h2>
            <div className={relatorioSecaoAccentLineClass} aria-hidden />
            <p className="mt-2 max-w-md text-xs leading-relaxed text-text-muted sm:text-sm">
              Navegue entre as semanas do mês ou selecione no calendário abaixo.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={irSemanaAnterior}
                disabled={!podeAnterior}
                className={`${relatorioPeriodoNavBtnClass} disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className={relatorioPeriodoPillClass}>{label}</span>
              <button
                type="button"
                onClick={irSemanaSeguinte}
                disabled={!podeProxima}
                className={`${relatorioPeriodoNavBtnClass} disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label="Próxima semana"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {semanaAtual ? (
              <span className="inline-flex rounded-full border border-accent-primary/25 bg-accent-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-primary">
                Semana atual
              </span>
            ) : null}
          </div>
        </div>

        <div className={relatorioPeriodoCampoClass}>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-text-primary">
            <CalendarDays className="h-3.5 w-3.5 text-accent-primary" />
            Semana do calendário
          </label>
          <BaseSelect
            searchable={false}
            value={semanaInicio}
            onChange={(e) => onTrocarSemana?.(e.target.value)}
            options={opcoes}
          />
        </div>
      </div>
    </section>
  );
}
