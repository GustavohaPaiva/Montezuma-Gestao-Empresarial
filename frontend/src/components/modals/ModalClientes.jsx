import { useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";

export default function ModalClientes({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "",
    forma: "",
    valor_pago: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    if (!formData.nome) {
      alert("O nome é obrigatório!");
      return;
    }
    onSave(formData);
    // Limpar form após salvar
    setFormData({ nome: "", tipo: "", forma: "", valor_pago: "" });
  };

  return (
    // Wrapper posicionado no topo com mt-[15px], igual ao Orçamento
    <div className="fixed z-50 flex justify-center w-full mt-[15px]">
      <div className="bg-[#ffffff] gap-[20px] w-[400px] max-w-[95%] rounded-[16px] p-[20px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        {/* Header com o mesmo estilo e ícone de fechar */}
        <div className="flex justify-between">
          <h2 className="text-[24px] font-bold text-[#000000] text-center">
            Novo Cliente
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

        {/* --- CAMPOS DO FORMULÁRIO --- */}

        {/* Nome */}
        <div className="flex flex-col text-left gap-1">
          <label className="text-[#71717A] text-sm">Nome do Cliente</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
            placeholder="Ex: João da Silva"
          />
        </div>

        {/* Tipo */}
        <div className="flex flex-col text-left gap-1">
          <label className="text-[#71717A] text-sm">Tipo do Projeto</label>
          <input
            type="text"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
            placeholder="Ex: Residencial"
          />
        </div>

        {/* Forma de Pagamento */}
        <div className="flex flex-col text-left gap-1">
          <label className="text-[#71717A] text-sm">Forma de Pagamento</label>
          <select
            name="pagamento"
            value={formData.pagamento}
            onChange={handleChange}
            className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54] bg-white cursor-pointer font-semibold"
          >
            <option value="Á vista">Á vista</option>
            <option value="Parcelado">Parcelado</option>
            <option value="Cartão">Cartão</option>
            <option value="À combinar">À combinar</option>
          </select>
        </div>

        <div className="flex flex-col text-left gap-1">
          <label className="text-[#71717A] text-sm">Valor Cobrado (R$)</label>
          <input
            type="number"
            step="0.01"
            name="valor_pago"
            value={formData.valor_pago}
            onChange={handleChange}
            className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
            placeholder="0.00"
          />
        </div>

        {/* Botão Salvar (Padrão ButtonDefault) */}
        <div className="flex gap-2 mt-2">
          <div className="flex-1 w-full">
            <ButtonDefault onClick={handleSubmit} className="w-full">
              Salvar
            </ButtonDefault>
          </div>
        </div>
      </div>
    </div>
  );
}
