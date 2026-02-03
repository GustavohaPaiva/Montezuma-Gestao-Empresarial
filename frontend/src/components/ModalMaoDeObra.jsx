import { useState } from "react";
import ButtonDefault from "./ButtonDefault";

export default function ModalMaoDeObra({ isOpen, onClose, onSave, nomeObra }) {
  const [formData, setFormData] = useState({
    tipo: "",
    profissional: "",
    valor: "",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-[10px]">
      <div className="bg-[#ffffff] w-[370px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden ">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FBFBFC] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              Solicitação Mão de Obra
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
              Serviço
            </label>
            <input
              type="text"
              placeholder="Ex: Pintura de fachada"
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Profissional
            </label>
            <input
              type="text"
              placeholder="Ex: Pedreiro, Pintor..."
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, profissional: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Valor Estimado
            </label>
            <input
              type="text"
              placeholder="R$ 0,00"
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, valor: e.target.value })
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
            Confirmar Registro
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
