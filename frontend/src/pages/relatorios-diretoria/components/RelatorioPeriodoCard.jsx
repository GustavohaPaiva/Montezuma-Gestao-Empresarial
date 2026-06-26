import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import BaseSelect from "../../../components/gerais/BaseSelect";
import {
  deslocarPeriodo,
  labelPeriodo,
  opcoesAnoSelect,
  opcoesMesSelect,
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

export default function RelatorioPeriodoCard({ periodo, onAtualizarPeriodo }) {
  const irMesAnterior = () => {
    const novo = deslocarPeriodo(periodo, -1);
    onAtualizarPeriodo(novo);
  };

  const irMesSeguinte = () => {
    const novo = deslocarPeriodo(periodo, 1);
    onAtualizarPeriodo(novo);
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
              Período de referência
            </h2>
            <div className={relatorioSecaoAccentLineClass} aria-hidden />
            <p className="mt-2 max-w-md text-xs leading-relaxed text-text-muted sm:text-sm">
              Escolha o mês para ver as semanas e lançamentos correspondentes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={irMesAnterior}
              className={relatorioPeriodoNavBtnClass}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className={relatorioPeriodoPillClass}>
              {labelPeriodo(periodo.ano, periodo.mes)}
            </span>
            <button
              type="button"
              onClick={irMesSeguinte}
              className={relatorioPeriodoNavBtnClass}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={relatorioPeriodoCampoClass}>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              <Calendar className="h-3.5 w-3.5 text-accent-primary" />
              Mês
            </label>
            <BaseSelect
              searchable={false}
              value={String(periodo.mes).padStart(2, "0")}
              onChange={(e) =>
                onAtualizarPeriodo({ mes: Number(e.target.value) })
              }
              options={opcoesMesSelect()}
            />
          </div>
          <div className={relatorioPeriodoCampoClass}>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              <CalendarDays className="h-3.5 w-3.5 text-accent-primary" />
              Ano
            </label>
            <BaseSelect
              searchable={false}
              value={String(periodo.ano)}
              onChange={(e) =>
                onAtualizarPeriodo({ ano: Number(e.target.value) })
              }
              options={opcoesAnoSelect(5)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
