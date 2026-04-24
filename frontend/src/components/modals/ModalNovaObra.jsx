import { useState, useEffect } from "react";
import ButtonDefault from "../gerais/ButtonDefault";
import ModalPortal from "../gerais/ModalPortal";
import { supabase } from "../../services/supabase";
import { api } from "../../services/api";

export default function ModalNovaObra({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nomeObra: "",
    cliente_id: "",
    responsavel_id: "",
  });

  const [clientes, setClientes] = useState([]);
  const [diretoria, setDiretoria] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [cliRes, dirRes] = await Promise.all([
            supabase
              .from("clientes")
              .select("id, nome")
              .order("nome", { ascending: true }),
            api.listUsuariosDiretoria().catch((e) => {
              console.error(e);
              return [];
            }),
          ]);
          if (!cliRes.error && cliRes.data) setClientes(cliRes.data);
          else if (cliRes.error)
            console.error("Erro ao carregar clientes:", cliRes.error);
          setDiretoria(Array.isArray(dirRes) ? dirRes : []);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseAndReset = () => {
    setFormData({ nomeObra: "", cliente_id: "", responsavel_id: "" });
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      alert("Selecione um cliente válido.");
      return;
    }
    const cli = clientes.find((c) => c.id === formData.cliente_id);
    onSave({
      nomeObra: formData.nomeObra,
      cliente_id: formData.cliente_id,
      cliente: cli?.nome ?? "",
      responsavel_id: formData.responsavel_id || null,
    });
    handleCloseAndReset();
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-[10px]">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-gray-200">
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

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 p-5 overflow-y-auto"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="nomeObra"
                className="text-xs font-bold text-gray-500 uppercase"
              >
                Local da Obra (Bairro ou Apelido)
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
                htmlFor="cliente_id"
                className="text-xs font-bold text-gray-500 uppercase"
              >
                Cliente Responsável
              </label>
              <div className="flex gap-2">
                <select
                  id="cliente_id"
                  required
                  className="flex-1 h-11 px-3 text-base border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-400 focus:bg-white focus:outline-none transition-all cursor-pointer"
                  value={formData.cliente_id}
                  onChange={(e) =>
                    setFormData({ ...formData, cliente_id: e.target.value })
                  }
                  disabled={loading}
                >
                  <option value="" disabled>
                    {loading
                      ? "Carregando clientes..."
                      : "Selecione um cliente..."}
                  </option>
                  {clientes.map((cli) => (
                    <option key={cli.id} value={cli.id}>
                      {cli.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="responsavel_id"
                className="text-xs font-bold text-gray-500 uppercase"
              >
                Responsável (diretoria)
              </label>
              <select
                id="responsavel_id"
                className="h-11 w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 px-3 text-base transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={formData.responsavel_id}
                onChange={(e) =>
                  setFormData({ ...formData, responsavel_id: e.target.value })
                }
                disabled={loading}
              >
                <option value="">Nenhum selecionado</option>
                {diretoria.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Apenas utilizadores com perfil de diretoria.
              </p>
            </div>

            <ButtonDefault type="submit" className="mt-2">
              Salvar Obra
            </ButtonDefault>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
