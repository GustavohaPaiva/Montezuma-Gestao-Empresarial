import { useState } from "react";
import ButtonDefault from "./ButtonDefault";

export default function ModalMateriais({ isOpen, onClose, onSave, nomeObra }) {
  const [material, setMaterial] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-[10px]">
      <div className="bg-[#ffffff] w-full max-w-[500px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FBFBFC] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              Solicitação Material
            </h2>
            <p className="text-[13px] text-[#71717A] truncate">
              Obra: {nomeObra}
            </p>
          </div>
          <button
            onClick={onClose}
            className="border border-none bg-transparent w-[50px] h-[50px]"
          >
            <img
              width="40"
              height="40"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="multiply"
            />
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[15px] overflow-y-auto">
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Material
            </label>
            <input
              type="text"
              placeholder="Ex: Cimento CP-II"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border"
            />
          </div>

          <div className="flex gap-[12px] w-full">
            <div className="flex-[2] flex flex-col gap-[5px]">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Quant.
              </label>
              <input
                type="number"
                placeholder="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              />
            </div>
            <div className="flex-[1] flex flex-col gap-[5px]">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Un.
              </label>
              <input
                type="text"
                placeholder="Ex: sacos"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              />
            </div>
          </div>

          <ButtonDefault
            onClick={() => onSave({ material, quantidade, unidade })}
            className="w-full bg-[#464C54] text-white border-none h-[50px] text-[16px] font-bold mt-[10px]"
          >
            Confirmar Solicitação
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
