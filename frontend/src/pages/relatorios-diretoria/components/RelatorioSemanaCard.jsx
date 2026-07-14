import { CheckCircle2, ChevronRight } from "lucide-react";
import {
  labelSemanaFromInicio,
  MODALIDADES_RELATORIO,
  modalidadeEstaPreenchida,
  resumoSemana,
} from "../relatoriosDiretoriaUtils";
import {
  relatorioSemanaCardAcaoClass,
  relatorioSemanaCardAtivoClass,
  relatorioSemanaCardBorderCompletoClass,
  relatorioSemanaCardBorderParcialClass,
  relatorioSemanaCardBorderVazioClass,
  relatorioSemanaCardClass,
  relatorioSemanaCardDataClass,
  relatorioSemanaCardRowClass,
  relatorioSemanaModalidadeChipPreenchidoClass,
  relatorioSemanaModalidadeChipVazioClass,
  relatorioSemanaProgressFillCompletoClass,
  relatorioSemanaProgressFillParcialClass,
  relatorioSemanaProgressFillVazioClass,
  relatorioSemanaProgressTrackClass,
  themeModalidade,
} from "../relatoriosDiretoriaUi";

function estadoSemana(resumo) {
  if (resumo.completo) return "completo";
  if (resumo.preenchidas > 0) return "parcial";
  return "vazio";
}

const BORDER_POR_ESTADO = {
  completo: relatorioSemanaCardBorderCompletoClass,
  parcial: relatorioSemanaCardBorderParcialClass,
  vazio: relatorioSemanaCardBorderVazioClass,
};

const FILL_POR_ESTADO = {
  completo: relatorioSemanaProgressFillCompletoClass,
  parcial: relatorioSemanaProgressFillParcialClass,
  vazio: relatorioSemanaProgressFillVazioClass,
};

export default function RelatorioSemanaCard({
  semanaInicio,
  lancamentos = [],
  financeiroResumo = null,
  isSemanaAtual,
  onVerRelatorio,
}) {
  const resumo = resumoSemana(lancamentos, financeiroResumo);
  const label = labelSemanaFromInicio(semanaInicio);
  const estado = estadoSemana(resumo);
  const pct = resumo.total > 0 ? (resumo.preenchidas / resumo.total) * 100 : 0;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onVerRelatorio?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onVerRelatorio}
      onKeyDown={handleKeyDown}
      aria-label={`Abrir relatório da semana ${label}`}
      className={`${relatorioSemanaCardClass} ${BORDER_POR_ESTADO[estado]} ${
        isSemanaAtual ? relatorioSemanaCardAtivoClass : ""
      } ${relatorioSemanaCardRowClass}`}
    >
      <div className={relatorioSemanaCardDataClass}>
        <p className="text-sm font-bold leading-tight text-text-primary sm:text-base">
          {label}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {resumo.completo ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Completo
            </span>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {MODALIDADES_RELATORIO.map((mod) => {
            const theme = themeModalidade(mod.colorTheme);
            const preenchido =
              mod.id === "financeiro"
                ? modalidadeEstaPreenchida(mod.id, null, financeiroResumo)
                : modalidadeEstaPreenchida(
                    mod.id,
                    resumo.porModalidade[mod.id],
                  );
            const Icon = mod.Icon;
            return (
              <span
                key={mod.id}
                className={
                  preenchido
                    ? `${relatorioSemanaModalidadeChipPreenchidoClass} ${theme.badge}`
                    : relatorioSemanaModalidadeChipVazioClass
                }
              >
                <Icon className="h-3 w-3 shrink-0" />
                {mod.label}
              </span>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex-1 ${relatorioSemanaProgressTrackClass}`}>
            <div
              className={FILL_POR_ESTADO[estado]}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={resumo.preenchidas}
              aria-valuemin={0}
              aria-valuemax={resumo.total}
              aria-label={`${resumo.preenchidas} de ${resumo.total} modalidades`}
            />
          </div>
          <p className="shrink-0 text-[11px] font-medium text-text-muted">
            {resumo.preenchidas}/{resumo.total}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end justify-center gap-1.5 self-end sm:self-center">
        {isSemanaAtual ? (
          <span className="inline-flex rounded-full border border-accent-primary/25 bg-accent-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-primary">
            Semana atual
          </span>
        ) : null}
        <div className={relatorioSemanaCardAcaoClass}>
          <span className="hidden sm:inline">Abrir relatório</span>
          <ChevronRight
            className="h-5 w-5 shrink-0 transition"
            strokeWidth={2.25}
          />
        </div>
      </div>
    </div>
  );
}
