import { useState } from "react";
import ButtonDefault from "../../../../components/gerais/ButtonDefault";

export default function ModalRelatorioPrestador({
  isOpen,
  onClose,
  onGenerate,
  prestadoresDisponiveis,
}) {
  const [selecionado, setSelecionado] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 flex w-full h-full items-center justify-center p-[10px] inset-0 bg-black/50">
      <div className="bg-[#ffffff] w-[400px] max-w-[95%] rounded-[16px] shadow-2xl flex flex-col overflow-hidden border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] flex justify-between items-center">
          <h2 className="text-[18px] font-bold text-[#464C54] uppercase">
            Relatório por Prestador
          </h2>
          <button
            onClick={onClose}
            className="border-none bg-transparent cursor-pointer"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="fechar"
            />
          </button>
        </div>
        <div className="p-[20px] flex flex-col gap-[15px]">
          <label className="text-[12px] font-bold text-[#71717A] uppercase">
            Selecione o Prestador
          </label>
          <select
            value={selecionado}
            onChange={(e) => setSelecionado(e.target.value)}
            className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none"
          >
            <option value="">Selecione...</option>
            {prestadoresDisponiveis.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
          <ButtonDefault
            onClick={() => {
              onGenerate(selecionado);
              setSelecionado("");
            }}
            disabled={!selecionado}
            className="w-full bg-[#464C54] text-black h-[50px] text-[16px] font-bold mt-[10px] disabled:opacity-50"
          >
            Gerar PDF
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
