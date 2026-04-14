import { useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";
import ModalPortal from "../gerais/ModalPortal";

const ETAPAS_OBRA = [
  "Infraestrutura",
  "Supraestrutura",
  "Paredes e Painéis",
  "Cobertura",
  "Revestimentos externos",
  "Revestimentos internos",
  "Hidráulica",
  "Estrutura Elétrica",
  "Primeira etapa de pintura",
  "Assentamento de piso",
  "Esquadrias",
  "Pedras",
  "Louças e metais",
  "Final Elétrica",
  "Final Pintura",
  "Detalhes e limpeza final",
];

export default function ModalEtapas({
  isOpen,
  onClose,
  onSave,
  nomeObra,
  etapasSalvas = [],
}) {
  const [etapasSelecionadas, setEtapasSelecionadas] = useState([]);

  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      const nomesJaSalvos = etapasSalvas.map((etapa) => etapa.nome);
      setEtapasSelecionadas(nomesJaSalvos);
    }
  }

  if (!isOpen) return null;

  // Lógica para saber se todas estão marcadas
  const isAllSelected = etapasSelecionadas.length === ETAPAS_OBRA.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      // Se tudo estiver marcado, limpa o array
      setEtapasSelecionadas([]);
    } else {
      // Se faltar alguma ou nenhuma estiver marcada, seleciona todas
      setEtapasSelecionadas([...ETAPAS_OBRA]);
    }
  };

  const handleToggle = (etapa) => {
    setEtapasSelecionadas((prev) =>
      prev.includes(etapa)
        ? prev.filter((item) => item !== etapa)
        : [...prev, etapa],
    );
  };

  const handleConfirmar = () => {
    const arrayFormatado = etapasSelecionadas.map((nomeEtapa) => {
      const etapaExistente = etapasSalvas.find((e) => e.nome === nomeEtapa);

      if (etapaExistente) {
        return etapaExistente;
      }

      return {
        nome: nomeEtapa,
        status: "pendente",
        data_inicio: null,
        data_conclusao: null,
      };
    });

    onSave(arrayFormatado);
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[10px]">
      <div className="bg-[#ffffff] w-full max-w-[600px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              Seleção de Etapas
            </h2>
            <p className="text-[13px] text-[#71717A] truncate">
              Obra: {nomeObra}
            </p>
          </div>
          <button
            onClick={onClose}
            className="border-none bg-transparent w-[50px] h-[50px] flex items-center justify-center cursor-pointer"
          >
            <img
              width="24"
              height="24"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="fechar"
            />
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[20px] overflow-y-auto">
          {/* Checkbox de Selecionar Todas */}
          <div className="pb-4 border-b border-[#DBDADE]">
            <label className="flex items-center gap-2 cursor-pointer text-[#464C54] text-[15px] font-bold">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleAll}
                className="w-4 h-4 cursor-pointer accent-[#464C54] flex-shrink-0"
              />
              <span className="truncate">Selecionar todas as etapas</span>
            </label>
          </div>

          <div className="grid grid-rows-8 grid-flow-col gap-x-4 gap-y-3">
            {ETAPAS_OBRA.map((etapa) => (
              <label
                key={etapa}
                className="flex items-center gap-2 cursor-pointer text-[#464C54] text-[14px]"
              >
                <input
                  type="checkbox"
                  checked={etapasSelecionadas.includes(etapa)}
                  onChange={() => handleToggle(etapa)}
                  className="w-4 h-4 cursor-pointer accent-[#464C54] flex-shrink-0"
                />
                <span className="truncate" title={etapa}>
                  {etapa}
                </span>
              </label>
            ))}
          </div>

          <ButtonDefault
            onClick={handleConfirmar}
            className="w-full h-[50px] text-[16px] font-bold mt-[10px]"
          >
            Confirmar Seleção
          </ButtonDefault>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
