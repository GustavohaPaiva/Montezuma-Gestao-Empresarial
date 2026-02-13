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
    <div className="bg-opacity-50 flex justify-center items-center z-50 px-4">
      <div className="bg-white rounded-[12px] p-6 w-full max-w-[400px] shadow-lg flex flex-col gap-4">
        <h2 className="text-[24px] font-bold text-[#464C54] text-center">
          Novo Orçamento
        </h2>

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
          <button
            onClick={onClose}
            className="flex-1 border border-[#DBDADE] text-[#71717A] py-2 rounded-[8px] hover:bg-gray-50 transition"
          >
            Cancelar
          </button>

          <div className="flex-1">
            <ButtonDefault label="Salvar" onClick={handleSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
}
