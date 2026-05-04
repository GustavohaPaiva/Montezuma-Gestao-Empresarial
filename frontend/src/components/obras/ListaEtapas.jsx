import React, { useState, useCallback, memo } from "react";
import { HardHat } from "lucide-react";

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

    return (
      <div
        className={`p-4 rounded-xl border flex flex-col gap-4 shadow-sm transition-colors duration-200 ${
          isConcluido
            ? "bg-green-50 border-green-200"
            : "bg-white border-[#C4C4C9]"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3
              className={`font-bold text-[16px] ${isConcluido ? "text-green-800 line-through" : "text-[#464C54]"}`}
            >
              {etapa.nome}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  isConcluido
                    ? "bg-green-200 text-green-800"
                    : statusExibicao === "em andamento"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-200 text-gray-700"
                }`}
              >
                {statusExibicao}
              </span>

              <div className="flex items-center">
                {isCliente ? (
                  <span className="text-[12px] font-semibold text-gray-500">
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
                      className="w-8 text-[12px] font-semibold text-gray-700 bg-transparent border-b border-gray-300 focus:outline-none focus:border-[#464C54] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[12px] font-semibold text-gray-500 ml-0.5">
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
            className={`w-5 h-5 accent-green-600 flex-shrink-0 ${isCliente ? "cursor-not-allowed" : "cursor-pointer"}`}
          />
        </div>

        <div className="w-full flex flex-col gap-1">
          <label className="text-[11px] text-[#71717A] font-medium uppercase tracking-wider">
            Progresso da Etapa
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={progressoLocal}
            disabled={isCliente}
            onChange={handleSliderChange}
            onMouseUp={() => handleCommitProgresso(progressoLocal)}
            onTouchEnd={() => handleCommitProgresso(progressoLocal)}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#464C54] ${
              isCliente ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{
              background: `linear-gradient(to right, ${corPreenchimento} ${progressoNum}%, #E5E7EB ${progressoNum}%)`,
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-[12px] text-[#71717A] mb-1 font-medium">
              Início
            </label>
            <input
              type="date"
              value={etapa.data_inicio || ""}
              disabled={isCliente}
              onChange={(e) =>
                onChange(etapa.nome, "data_inicio", e.target.value)
              }
              className="p-1.5 text-[13px] border border-[#DBDADE] rounded-md bg-transparent focus:outline-none focus:border-[#464C54]"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[12px] text-[#71717A] mb-1 font-medium">
              Conclusão
            </label>
            <input
              type="date"
              value={etapa.data_conclusao || ""}
              disabled={isCliente}
              onChange={(e) =>
                onChange(etapa.nome, "data_conclusao", e.target.value)
              }
              className="p-1.5 text-[13px] border border-[#DBDADE] rounded-md bg-transparent focus:outline-none focus:border-[#464C54]"
            />
          </div>
        </div>
      </div>
    );
  },
);

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

  if (!etapas || etapas.length === 0) {
    return (
      <div className="p-4 bg-surface border border-border-primary rounded-[12px] shadow-sm mt-2 mb-4">
        <div className="mb-5 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 className="text-[24px] font-bold text-text-primary">
            Lista de Etapas
          </h2>
          {headerAction}
        </div>
        <div className="w-full flex justify-center items-center min-h-[24vh]">
          <div className="w-full bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <HardHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#464C54] mb-2">
              Nenhuma etapa definida
            </h2>
            <p className="text-gray-500">
              Acesse o menu de seleção de etapas para começar o cronograma.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const indicePrimeiraPendente = etapas.findIndex(
    (e) => e.status !== "concluído",
  );

  return (
    <div className="p-4 bg-surface border border-border-primary rounded-[12px] shadow-sm mt-2 mb-4">
      <div className="mb-5 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <h2 className="text-[24px] font-bold text-text-primary">
          Lista de Etapas
        </h2>
        {headerAction}
      </div>
      <div className="flex flex-col gap-4">
        {etapas.map((etapa, index) => (
          <EtapaCard
            key={etapa.nome}
            etapa={etapa}
            index={index}
            isCliente={isCliente}
            indicePrimeiraPendente={indicePrimeiraPendente}
            onChange={handleChange}
          />
        ))}
      </div>
    </div>
  );
}
