import React, { useState, useCallback, memo } from "react";
import { Check, HardHat, ListTree } from "lucide-react";

const EtapaCard = memo(
  ({ etapa, index, isCliente, indicePrimeiraPendente, onChange }) => {
    const [progressoLocal, setProgressoLocal] = useState(etapa.progresso || 0);
    const [prevProgresso, setPrevProgresso] = useState(etapa.progresso || 0);

    if ((etapa.progresso || 0) !== prevProgresso) {
      setPrevProgresso(etapa.progresso || 0);
      setProgressoLocal(etapa.progresso || 0);
    }
    const progressoNum = parseInt(progressoLocal) || 0;
    const isConcluido = progressoNum === 100 || etapa.status === "concluído";

    const statusExibicao = isConcluido
      ? "concluído"
      : etapa.status === "em andamento" || index === indicePrimeiraPendente
        ? "em andamento"
        : "pendente";

    const handleSliderChange = (e) => {
      setProgressoLocal(e.target.value);
    };

    const handleCommitProgresso = (valorDigitado) => {
      let val = parseInt(valorDigitado);
      if (isNaN(val)) val = 0;
      if (val < 0) val = 0;
      if (val > 100) val = 100;

      setProgressoLocal(val);

      if (val !== (etapa.progresso || 0)) {
        onChange(etapa.nome, "progresso", val);
      }
    };

    const handleCheckboxChange = (e) => {
      const isChecked = e.target.checked;

      if (isChecked) {
        setProgressoLocal(100);
      } else if (progressoNum === 100) {
        setProgressoLocal(99);
      }

      onChange(etapa.nome, "status_checkbox", isChecked);
    };

    const corPreenchimento = isConcluido ? "#16a34a" : "#DC3B0B";

    const badgeStatus =
      isConcluido
        ? "bg-emerald-500/15 text-emerald-900 ring-emerald-500/30"
        : statusExibicao === "em andamento"
          ? "bg-amber-500/15 text-amber-950 ring-amber-400/35"
          : "bg-slate-500/10 text-slate-700 ring-slate-400/25";

    const inputDataClass =
      "h-9 w-full min-w-0 max-w-full rounded-lg border border-border-primary/50 bg-white px-2.5 text-xs text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

    return (
      <div
        className={`relative overflow-hidden rounded-xl border shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all duration-200 ${
          isConcluido
            ? "border-emerald-500/35 bg-gradient-to-br from-emerald-50/90 to-white ring-1 ring-emerald-500/15"
            : statusExibicao === "em andamento"
              ? "border-accent-primary/25 bg-gradient-to-br from-accent-primary-50/80 to-white ring-1 ring-accent-primary/10"
              : "border-border-primary/40 bg-white ring-1 ring-black/[0.03]"
        }`}
      >
        {!isConcluido && statusExibicao === "em andamento" ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent-primary to-accent-primary/50"
            aria-hidden
          />
        ) : null}
        {isConcluido ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-400/70"
            aria-hidden
          />
        ) : null}

        <div className="flex flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-3">
          <div className="flex items-start justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <h3
                className={`text-[13px] font-bold leading-snug tracking-tight sm:text-sm ${
                  isConcluido
                    ? "text-emerald-900 line-through decoration-emerald-600/50"
                    : "text-text-primary"
                }`}
              >
                {etapa.nome}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ${badgeStatus}`}
                >
                  {statusExibicao}
                </span>

                <div className="flex items-center rounded-full bg-black/[0.04] px-1.5 py-0.5 ring-1 ring-black/[0.05]">
                  {isCliente ? (
                    <span className="text-xs font-semibold tabular-nums text-text-muted">
                      {progressoLocal}%
                    </span>
                  ) : (
                    <>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={progressoLocal}
                        onChange={(e) => setProgressoLocal(e.target.value)}
                        onBlur={() => handleCommitProgresso(progressoLocal)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          handleCommitProgresso(progressoLocal)
                        }
                        className="w-9 bg-transparent text-center text-xs font-semibold tabular-nums text-text-primary [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="text-xs font-semibold text-text-muted">
                        %
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <input
              type="checkbox"
              checked={isConcluido}
              disabled={isCliente}
              onChange={handleCheckboxChange}
              className={`mt-0.5 h-4 w-4 shrink-0 rounded border-border-primary text-emerald-600 accent-emerald-600 focus:ring-2 focus:ring-emerald-500/30 ${
                isCliente ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            />
          </div>

          <div className="flex w-full flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.13em] text-text-muted">
                Progresso da etapa
              </label>
              <span className="text-[10px] font-semibold tabular-nums text-text-muted">
                {progressoNum}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progressoLocal}
              disabled={isCliente}
              onChange={handleSliderChange}
              onMouseUp={() => handleCommitProgresso(progressoLocal)}
              onTouchEnd={() => handleCommitProgresso(progressoLocal)}
              className={`h-1.5 w-full cursor-pointer appearance-none rounded-full accent-accent-primary disabled:cursor-not-allowed disabled:opacity-50 ${
                isCliente ? "" : ""
              }`}
              style={{
                background: `linear-gradient(to right, ${corPreenchimento} ${progressoNum}%, #E5E7EB ${progressoNum}%)`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-text-muted">
                Início
              </label>
              <input
                type="date"
                value={etapa.data_inicio || ""}
                disabled={isCliente}
                onChange={(e) =>
                  onChange(etapa.nome, "data_inicio", e.target.value)
                }
                className={inputDataClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-text-muted">
                Conclusão
              </label>
              <input
                type="date"
                value={etapa.data_conclusao || ""}
                disabled={isCliente}
                onChange={(e) =>
                  onChange(etapa.nome, "data_conclusao", e.target.value)
                }
                className={inputDataClass}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

function TimelineStep({ index, isConcluido, isActive, isLast }) {
  return (
    <div className="relative flex w-9 shrink-0 flex-col items-center sm:w-10">
      {!isLast ? (
        <div
          className="absolute left-1/2 top-9 z-0 h-[calc(100%+1.15rem)] w-px -translate-x-1/2 bg-gradient-to-b from-border-primary/45 via-border-primary/25 to-border-primary/10"
          aria-hidden
        />
      ) : null}
      <div
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold shadow-md transition-all sm:h-9 sm:w-9 ${
          isConcluido
            ? "border-emerald-500 bg-emerald-500 text-white shadow-emerald-500/25"
            : isActive
              ? "border-accent-primary bg-accent-primary-50 text-accent-primary shadow-accent-primary/15 ring-2 ring-accent-primary/20"
              : "border-border-primary/60 bg-white text-text-muted shadow-sm"
        }`}
      >
        {isConcluido ? (
          <Check className="h-5 w-5 sm:h-5 sm:w-5" strokeWidth={2.75} />
        ) : (
          <span className="tabular-nums">{index + 1}</span>
        )}
      </div>
    </div>
  );
}

export default function ListaEtapas({
  etapas = [],
  onUpdateEtapas,
  isCliente = false,
  headerAction = null,
}) {
  const handleChange = useCallback(
    (nomeEtapa, campo, valor) => {
      if (isCliente) return;

      const novasEtapas = etapas.map((etapa) => {
        if (etapa.nome === nomeEtapa) {
          let etapaAtualizada = { ...etapa, [campo]: valor };

          if (campo === "progresso") {
            const progressoNum = parseInt(valor);
            etapaAtualizada.progresso = progressoNum;

            if (progressoNum === 100) {
              etapaAtualizada.status = "concluído";
              if (!etapaAtualizada.data_conclusao) {
                etapaAtualizada.data_conclusao = new Date()
                  .toISOString()
                  .split("T")[0];
              }
            } else if (progressoNum > 0) {
              etapaAtualizada.status = "em andamento";
              etapaAtualizada.data_conclusao = "";
            } else {
              etapaAtualizada.status = "pendente";
            }
          }

          if (campo === "status_checkbox") {
            const concluido = valor;
            etapaAtualizada.status = concluido
              ? "concluído"
              : etapaAtualizada.data_inicio
                ? "em andamento"
                : "pendente";
            etapaAtualizada.progresso = concluido
              ? 100
              : etapaAtualizada.progresso === 100
                ? 99
                : etapaAtualizada.progresso;

            if (concluido && !etapaAtualizada.data_conclusao) {
              etapaAtualizada.data_conclusao = new Date()
                .toISOString()
                .split("T")[0];
            } else if (!concluido) {
              etapaAtualizada.data_conclusao = "";
            }
          }

          if (
            campo === "data_inicio" &&
            etapaAtualizada.status === "pendente" &&
            valor
          ) {
            etapaAtualizada.status = "em andamento";
          }

          return etapaAtualizada;
        }
        return etapa;
      });

      onUpdateEtapas(novasEtapas);
    },
    [etapas, isCliente, onUpdateEtapas],
  );

  const shellClass =
    "rounded-2xl border border-border-primary/35 bg-white px-4 py-5 shadow-[0_5px_20px_rgba(0,0,0,0.08)] sm:px-6 sm:py-6";

  if (!etapas || etapas.length === 0) {
    return (
      <div className={`${shellClass} mt-2 mb-4`}>
        <div className="mb-6 flex flex-col gap-4 border-b border-border-primary/25 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
              <ListTree className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
                Cronograma
              </p>
              <h2 className="mt-0.5 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Lista de etapas
              </h2>
              <p className="mt-1 max-w-xl text-sm text-text-muted">
                Organize as fases da obra e acompanhe o avanço de cada uma.
              </p>
            </div>
          </div>
          {headerAction ? (
            <div className="shrink-0 sm:self-center">{headerAction}</div>
          ) : null}
        </div>
        <div className="flex min-h-[22vh] w-full items-center justify-center rounded-2xl border border-dashed border-border-primary/50 bg-gradient-to-br from-[#FAFAFA] to-white px-4 py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-border-primary/30">
              <HardHat className="h-8 w-8 text-text-muted" strokeWidth={1.75} />
            </div>
            <h3 className="text-lg font-bold text-text-primary sm:text-xl">
              Nenhuma etapa definida
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Use o botão acima para adicionar etapas e montar o cronograma desta
              obra.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const indicePrimeiraPendente = etapas.findIndex(
    (e) => e.status !== "concluído",
  );

  const concluidas = etapas.filter(
    (e) => e.status === "concluído" || (e.progresso || 0) === 100,
  ).length;

  return (
    <div className={`${shellClass} mt-2 mb-4`}>
      <div className="mb-4 flex flex-col gap-3 border-b border-border-primary/25 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
              <ListTree className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              Cronograma
            </p>
              <h2 className="mt-0.5 text-base font-bold tracking-tight text-text-primary sm:text-lg">
              Lista de etapas
            </h2>
              <p className="mt-1 text-xs text-text-muted sm:text-sm">
              <span className="font-semibold text-text-primary">
                {concluidas}
              </span>
              {" de "}
              <span className="font-semibold text-text-primary">
                {etapas.length}
              </span>
              {" etapas concluídas"}
            </p>
          </div>
        </div>
        {headerAction ? (
          <div className="shrink-0 sm:self-center">{headerAction}</div>
        ) : null}
      </div>

      <div className="flex flex-col gap-0">
        {etapas.map((etapa, index) => {
          const progressoNum = parseInt(etapa.progresso) || 0;
          const isConcluido =
            progressoNum === 100 || etapa.status === "concluído";
          const isActive =
            etapa.status === "em andamento" || index === indicePrimeiraPendente;

          return (
            <div
              key={etapa.nome}
              className="relative flex gap-2 pb-4 last:pb-0 sm:gap-3"
            >
              <TimelineStep
                index={index}
                isConcluido={isConcluido}
                isActive={isActive && !isConcluido}
                isLast={index === etapas.length - 1}
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <EtapaCard
                  etapa={etapa}
                  index={index}
                  isCliente={isCliente}
                  indicePrimeiraPendente={indicePrimeiraPendente}
                  onChange={handleChange}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
