import { useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";

export default function ModalMaoDeObra({
  isOpen,
  onClose,
  onSave,
  nomeObra,
  opcoesPrestador,
}) {
  const [formData, setFormData] = useState({
    tipo: "",
    profissional: "",
    valor: "",
  });

  const [customProfissional, setCustomProfissional] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    // Se "Outros" foi selecionado, manda o valor customizado. Senão, manda o valor do Select.
    const profissionalFinal =
      formData.profissional === "Outros"
        ? customProfissional
        : formData.profissional;

    onSave({ ...formData, profissional: profissionalFinal });

    // Limpa os campos para nova entrada e NÃO fecha o modal
    setFormData({ tipo: "", profissional: "", valor: "" });
    setCustomProfissional("");
  };

  return (
    <div className="fixed z-50 flex items-center justify-center w-[380px] sm:w-[500px] p-[10px]">
      <div className="bg-[#ffffff] w-[500px] max-w-[95%] rounded-[16px] shadow-2xl flex flex-col overflow-hidden border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
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
            className="border-none bg-transparent w-[50px] h-[50px] cursor-pointer flex justify-center items-center"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="multiply"
            />
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[15px] overflow-y-auto max-h-[70vh]">
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Serviço
            </label>
            <input
              type="text"
              placeholder="Ex: Pintura de fachada"
              value={formData.tipo}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Profissional (Prestador)
            </label>
            <select
              value={formData.profissional}
              onChange={(e) =>
                setFormData({ ...formData, profissional: e.target.value })
              }
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
            >
              <option value="">Selecione um prestador...</option>
              {opcoesPrestador?.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>

            {formData.profissional === "Outros" && (
              <input
                type="text"
                placeholder="Qual o nome/função do prestador?"
                value={customProfissional}
                className="w-full h-[45px] mt-[5px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
                onChange={(e) => setCustomProfissional(e.target.value)}
              />
            )}
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Valor Estimado
            </label>
            <input
              type="number"
              placeholder="R$ 0,00"
              value={formData.valor}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, valor: e.target.value })
              }
            />
          </div>

          <ButtonDefault
            onClick={handleSave}
            className="w-full bg-[#464C54] text-black h-[50px] text-[16px] font-bold mt-[10px]"
          >
            Confirmar Registro
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
