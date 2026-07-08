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
  const isAllSelected = etapasSelecionadas.length === ETAPAS_OBRA.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setEtapasSelecionadas([]);
    } else {
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
        <div className="flex max-h-[95vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <div className="flex-1 min-w-0">
              <h2 className="truncate text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg">
                Seleção de Etapas
              </h2>
              <p className="truncate text-xs text-text-muted sm:text-sm">
                Obra: {nomeObra}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] transition-all hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            >
              <img
                width="20"
                height="20"
                src="https://img.icons8.com/ios/50/multiply.png"
                alt="fechar"
              />
            </button>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
            <div className="rounded-xl border border-border-primary/35 bg-[#FAFAFA] p-3 sm:p-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-text-primary sm:text-[15px]">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleAll}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-accent-primary"
                />
                <span className="truncate">Selecionar todas as etapas</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ETAPAS_OBRA.map((etapa) => (
                <label
                  key={etapa}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border-primary/30 bg-white px-3 py-2.5 text-sm text-text-primary transition-colors hover:bg-[#FAFAFA]"
                >
                  <input
                    type="checkbox"
                    checked={etapasSelecionadas.includes(etapa)}
                    onChange={() => handleToggle(etapa)}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-accent-primary"
                  />
                  <span className="truncate" title={etapa}>
                    {etapa}
                  </span>
                </label>
              ))}
            </div>

            <ButtonDefault
              onClick={handleConfirmar}
              className="!mt-1 !h-11 !w-full !cursor-pointer !rounded-xl !border !border-accent-primary !bg-accent-primary !text-sm !font-bold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!bg-accent-primary-dark hover:!shadow-lg"
            >
              Confirmar Seleção
            </ButtonDefault>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
