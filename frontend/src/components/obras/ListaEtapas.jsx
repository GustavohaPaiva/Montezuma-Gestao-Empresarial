import React from "react";
import { HardHat } from "lucide-react";

export default function ListaEtapas({
  etapas = [],
  onUpdateEtapas,
  isCliente = false,
}) {
  const handleChange = (nomeEtapa, campo, valor) => {
    if (isCliente) return; // Trava de segurança extra

    const novasEtapas = etapas.map((etapa) => {
      if (etapa.nome === nomeEtapa) {
        const etapaAtualizada = { ...etapa, [campo]: valor };

        if (campo === "status_checkbox") {
          etapaAtualizada.status = valor
            ? "concluído"
            : etapaAtualizada.data_inicio
              ? "em andamento"
              : "pendente";
          if (valor && !etapaAtualizada.data_conclusao) {
            etapaAtualizada.data_conclusao = new Date()
              .toISOString()
              .split("T")[0];
          }
          delete etapaAtualizada.status_checkbox;
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
  };

  if (!etapas || etapas.length === 0) {
    return (
      <div className="w-full flex justify-center items-center min-h-[30vh]">
        <div className="w-full bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <HardHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#464C54] mb-2">
            Nenhuma etapa definida
          </h2>
          <p className="text-gray-500">
            Acesse o menu de seleção de etapas para começar a montar o
            cronograma desta obra.
          </p>
        </div>
      </div>
    );
  }

  // Descobre qual é a primeira etapa não concluída para marcá-la como "em andamento"
  const indicePrimeiraPendente = etapas.findIndex(
    (e) => e.status !== "concluído",
  );

  return (
    <div className="p-4 bg-white rounded-[12px] shadow-sm mt-6 mb-6">
      <h2 className="text-[24px] font-bold text-[#464C54] mb-[20px]">
        Lista de Etapas
      </h2>
      <div className="grid grid-cols-1 gap-4 mt-4 mb-4">
        {etapas.map((etapa, index) => {
          const isConcluido = etapa.status === "concluído";

          // Regra de visualização: se não tá concluído e é a primeira da fila, joga "em andamento"
          const statusExibicao = isConcluido
            ? "concluído"
            : etapa.status === "em andamento" ||
                index === indicePrimeiraPendente
              ? "em andamento"
              : "pendente";

          return (
            <div
              key={etapa.nome}
              className={`py-2 px-3 rounded-xl border flex flex-col md:flex-row md:justify-between gap-4 shadow-sm transition-all duration-200 ${
                isConcluido
                  ? "bg-green-50 border-green-200"
                  : "bg-white border-[#C4C4C9]"
              }`}
            >
              {/* Cabeçalho do Card */}
              <div className="flex justify-between w-full items-start gap-2">
                <div className="flex-1">
                  <h3
                    className={`font-bold text-[16px] leading-tight ${isConcluido ? "text-green-800 line-through" : "text-[#464C54]"}`}
                  >
                    {etapa.nome}
                  </h3>
                  <span
                    className={`text-[12px] mt-4 font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                      isConcluido
                        ? "bg-green-200 text-green-800"
                        : statusExibicao === "em andamento"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {statusExibicao.toUpperCase()}
                  </span>
                </div>

                {/* Checkbox de Conclusão mobile */}
                <label
                  className={`flex md:hidden items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${isCliente ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-100"}`}
                >
                  <input
                    type="checkbox"
                    checked={isConcluido}
                    disabled={isCliente}
                    onChange={(e) =>
                      handleChange(
                        etapa.nome,
                        "status_checkbox",
                        e.target.checked,
                      )
                    }
                    className={`w-5 h-5 accent-green-600 ${isCliente ? "cursor-not-allowed" : "cursor-pointer"}`}
                    title={
                      isCliente ? "Apenas leitura" : "Marcar como concluído"
                    }
                  />
                </label>
              </div>

              <div className="flex flex-row justify-center items-center md:justify-end w-full">
                {/* Datas */}
                <div className="flex gap-3 mt-2 md:mx-5 md:w-auto w-full">
                  <div className="flex flex-col flex-1">
                    <label className="text-[12px] text-[#71717A] mb-1 font-medium">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={etapa.data_inicio || ""}
                      disabled={isCliente}
                      onChange={(e) =>
                        handleChange(etapa.nome, "data_inicio", e.target.value)
                      }
                      className={`p-1 text-[13px] border border-[#DBDADE] rounded-md bg-transparent ${isCliente ? "cursor-not-allowed opacity-60" : "focus:outline-none focus:border-[#464C54]"}`}
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-[12px] text-[#71717A] mb-1 font-medium">
                      Data Conclusão
                    </label>
                    <input
                      type="date"
                      value={etapa.data_conclusao || ""}
                      disabled={isCliente}
                      onChange={(e) =>
                        handleChange(
                          etapa.nome,
                          "data_conclusao",
                          e.target.value,
                        )
                      }
                      className={`p-1 text-[13px] border border-[#DBDADE] rounded-md bg-transparent ${isCliente ? "cursor-not-allowed opacity-60" : "focus:outline-none focus:border-[#464C54]"}`}
                    />
                  </div>
                </div>
                {/* Checkbox de Conclusão desktop */}
                <label
                  className={`md:flex hidden items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${isCliente ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-100"}`}
                >
                  <input
                    type="checkbox"
                    checked={isConcluido}
                    disabled={isCliente}
                    onChange={(e) =>
                      handleChange(
                        etapa.nome,
                        "status_checkbox",
                        e.target.checked,
                      )
                    }
                    className={`w-5 h-5 accent-green-600 ${isCliente ? "cursor-not-allowed" : "cursor-pointer"}`}
                    title={
                      isCliente ? "Apenas leitura" : "Marcar como concluído"
                    }
                  />
                </label>{" "}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
