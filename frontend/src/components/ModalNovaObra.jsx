import { useState } from "react";
import ButtonDefault from "./ButtonDefault";

export default function ModalNovaObra({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nomeObra: "",
    cliente: "",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-[10px]">
      <div className="bg-[#ffffff] w-[370px] max-w-[95%] rounded-[16px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              Cadastrar Nova Obra
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-[35px] h-[35px] flex items-center justify-center border border-[#C4C4C9] rounded-[8px] text-[24px] text-[#71717A] hover:bg-gray-100 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[15px] overflow-y-auto">
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Local da Obra (Nome)
            </label>
            <input
              type="text"
              placeholder="Ex: Edifício Aurora"
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, nomeObra: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Nome do Cliente
            </label>
            <input
              type="text"
              placeholder="Ex: João Silva"
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, cliente: e.target.value })
              }
            />
          </div>

          <ButtonDefault
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="w-full bg-[#464C54] text-white border-none h-[50px] text-[16px] font-bold mt-[10px]"
          >
            Salvar Obra
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
