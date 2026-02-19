import { useState } from "react";
import ButtonDefault from "./ButtonDefault";

export default function ModalFinanceiroSaida({ isOpen, onClose, onSave }) {
  // Ajustei o estado para refletir os campos reais do formulário
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    formaPagamento: "Á vista",
    parcelas: "1X",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed w-full z-50 flex items-center justify-center p-[10px]">
      <div className="bg-[#ffffff] max-w-[95%] w-[500px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        {/* Header do Modal */}
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              Nova Saída
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-[35px] h-[35px] flex items-center justify-center border border-[#C4C4C9] rounded-[8px] text-[24px] text-[#71717A] hover:bg-gray-100 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-[20px] flex flex-col gap-[15px] overflow-y-auto">
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Descrição da Saída"
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
            />
          </div>

          <div className="w-full flex flex-row gap-x-[20px]">
            <div className="flex flex-col gap-[5px] w-full">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Valor
              </label>
              <input
                type="number"
                placeholder="Valor da Saída"
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
                value={formData.valor}
                onChange={(e) =>
                  setFormData({ ...formData, valor: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col gap-[5px] w-full">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Data
              </label>
              <input
                type="date"
                placeholder="Data da Saída"
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
                value={formData.data}
                onChange={(e) =>
                  setFormData({ ...formData, data: e.target.value })
                }
              />
            </div>
          </div>

          {/* Select de Forma de Pagamento */}
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Forma de Pagamento
            </label>
            <select
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              value={formData.formaPagamento}
              onChange={(e) =>
                setFormData({ ...formData, formaPagamento: e.target.value })
              }
            >
              <option value="Á vista">Á vista</option>
              <option value="Debito">Débito</option>
              <option value="Crédito">Crédito</option>
              <option value="Parcelado">Parcelado</option>
            </select>
          </div>

          {/* Renderização Condicional do Select de Parcelas */}
          {formData.formaPagamento === "Parcelado" && (
            <div className="flex flex-col gap-[5px]">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Quantidade de Parcelas
              </label>
              <select
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
                value={formData.parcelas}
                onChange={(e) =>
                  setFormData({ ...formData, parcelas: e.target.value })
                }
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={`${i + 1}X`}>
                    {i + 1}X
                  </option>
                ))}
              </select>
            </div>
          )}

          <ButtonDefault
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="w-full bg-[#464C54] text-[#000000] h-[50px] text-[16px] font-bold mt-[10px]"
          >
            Salvar Saída
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
