import { useState } from "react";
import ButtonDefault from "./ButtonDefault"; // Reutilizando seu botão se possível, ou use HTML button normal

export default function ModalOrcamento({ isOpen, onClose, onSave }) {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!nome || !valor) {
      alert("Preencha todos os campos!");
      return;
    }

    // Envia os dados para o componente pai
    onSave({
      nome,
      valor: parseFloat(valor), // Garante que seja número
    });

    // Limpa os campos
    setNome("");
    setValor("");
  };

  return (
    <div className="fixed z-50 flex items-center justify-center w-full ">
      <div className="bg-[#ffffff] gap-[20px] w-[400px] max-w-[95%] rounded-[16px] p-[20px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        <div className="flex justify-between">
          <h2 className="text-[24px] font-bold text-[#000000] text-center">
            Novo Orçamento
          </h2>

          <button onClick={onClose} className="">
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="fechar"
            />
          </button>
        </div>

        <div className="flex flex-col text-left gap-1">
          <label className="text-[#71717A] text-sm">Nome do Cliente</label>
          <input
            type="text"
            className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: João Silva"
          />
        </div>

        <div className="flex flex-col text-left gap-1">
          <label className="text-[#71717A] text-sm">Valor (R$)</label>
          <input
            type="number"
            className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <ButtonDefault label="Salvar" onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}
