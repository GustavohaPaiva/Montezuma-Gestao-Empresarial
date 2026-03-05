import { useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";

export default function ModalNovaObra({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nomeObra: "",
    cliente: "",
  });

  if (!isOpen) return null;

  // PERFORMANCE: Limpamos o estado na AÇÃO (click) e não no EFEITO.
  // Isso evita o erro do ESLint e impede renderizações duplas na tela.
  const handleCloseAndReset = () => {
    setFormData({ nomeObra: "", cliente: "" });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    handleCloseAndReset(); // Salva, avisa o pai e já limpa o lixo para a próxima vez
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-gray-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800 uppercase truncate">
            Cadastrar Nova Obra
          </h2>
          <button
            onClick={handleCloseAndReset}
            title="Fechar"
            className="flex items-center justify-center w-8 h-8 text-2xl text-gray-500 bg-transparent border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Corpo do Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-5 overflow-y-auto"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="nomeObra"
              className="text-xs font-bold text-gray-500 uppercase"
            >
              Local da Obra (Nome)
            </label>
            <input
              id="nomeObra"
              type="text"
              required
              placeholder="Ex: Edifício Aurora"
              className="w-full h-11 px-3 text-base border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:bg-white focus:outline-none transition-all"
              value={formData.nomeObra}
              onChange={(e) =>
                setFormData({ ...formData, nomeObra: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cliente"
              className="text-xs font-bold text-gray-500 uppercase"
            >
              Nome do Cliente
            </label>
            <input
              id="cliente"
              type="text"
              required
              placeholder="Ex: João Silva"
              className="w-full h-11 px-3 text-base border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:bg-white focus:outline-none transition-all"
              value={formData.cliente}
              onChange={(e) =>
                setFormData({ ...formData, cliente: e.target.value })
              }
            />
          </div>

          <ButtonDefault type="submit">Salvar Obra</ButtonDefault>
        </form>
      </div>
    </div>
  );
}
