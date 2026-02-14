import { useState } from "react";
import ButtonDefault from "./ButtonDefault";

export default function ModalMateriais({ isOpen, onClose, onSave, nomeObra }) {
  const [material, setMaterial] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("Un.");

  const listaUnidades = [
    "Sc.",
    "Kg.",
    "Lt.",
    "m²",
    "m³",
    "Un.",
    "Lata",
    "m",
    "cm",
    "Gl.",
    "Mensal",
    "Pç.",
  ];

  if (!isOpen) return null;

  const handleConfirmar = () => {
    // Validação básica
    if (!material || !quantidade) {
      alert("Preencha o material e a quantidade!");
      return;
    }

    // --- ALTERAÇÃO AQUI: Adicionado 'fornecedor' ao objeto salvo ---
    onSave({ material, fornecedor, quantidade, unidade });

    // Limpa os campos
    setMaterial("");
    setFornecedor("");
    setQuantidade("");
    setUnidade("Un.");
  };

  return (
    <div className="fixed z-50 flex items-center justify-center w-[380px] sm:w-[500px] p-[10px]">
      <div className="bg-[#ffffff] w-full max-w-[500px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
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
            className="border-none bg-transparent w-[50px] h-[50px] cursor-pointer"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="fechar"
            />
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[15px] overflow-y-auto">
          {/* Input Material */}
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Material
            </label>
            <input
              type="text"
              placeholder="Ex: Cimento, tijolo..."
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border"
            />
          </div>

          {/* Input Fornecedor */}
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Fornecedor
            </label>
            <input
              type="text"
              placeholder="Ex: RC, Casa do pintor..."
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
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
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] cursor-pointer appearance-none"
              >
                {listaUnidades.map((un) => (
                  <option key={un} value={un}>
                    {un}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ButtonDefault
            onClick={handleConfirmar}
            className="w-full bg-[#464C54] text-black h-[50px] text-[16px] font-bold mt-[10px]"
          >
            Confirmar Solicitação
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
