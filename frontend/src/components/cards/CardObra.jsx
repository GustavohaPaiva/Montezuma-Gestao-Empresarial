import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Pencil,
  Trash2,
  Clock,
  Hammer,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// Dicionário de Status ATUALIZADO com as variáveis do Tailwind v4
const STATUS_CONFIG = {
  "Aguardando iniciação": {
    bg: "bg-status-aguardando-bg",
    text: "text-status-aguardando-text",
    icon: Clock,
  },
  "Em andamento": {
    bg: "bg-status-andamento-bg",
    text: "text-status-andamento-text",
    icon: Hammer,
  },
  Concluída: {
    bg: "bg-status-concluida-bg",
    text: "text-status-concluida-text",
    icon: CheckCircle2,
  },
  default: {
    bg: "bg-gray-100",
    text: "text-gray-700",
    icon: AlertCircle,
  },
};

export default function ObraCard({
  id,
  nome,
  client,
  status,
  tudoPago,
  onUpdate,
  onDelete,
}) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(nome);
  const [editedClient, setEditedClient] = useState(client);

  const statusAtual = STATUS_CONFIG[status] || STATUS_CONFIG["default"];
  const StatusIcon = statusAtual.icon;

  const handleCardClick = () => {
    if (!isEditing) navigate(`/obra/${id}`);
  };

  const toggleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditedName(nome);
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    await onUpdate(id, { local: editedName, cliente: editedClient });
    setIsEditing(false);
  };

  const handleStatusChange = async (e) => {
    e.stopPropagation();
    await onUpdate(id, { status: e.target.value });
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative flex flex-col justify-between w-full h-[220px] p-4 rounded-lg shadow-sm border border-gray-100 bg-[#FAFAFA] transition-all duration-200 md:max-w-[350px] ${
        !isEditing
          ? "hover:scale-[1.02] hover:shadow-md cursor-pointer"
          : "cursor-default"
      }`}
    >
      <div className="flex items-center justify-between w-full z-10">
        {/* Indicativo Financeiro */}
        <div
          className={`w-3 h-3 rounded-full shadow-sm transition-colors duration-300 ${
            tudoPago ? "bg-[#2E7D32]" : "bg-[#F57C00]"
          }`}
          title={tudoPago ? "Tudo pago" : "Pagamento pendente"}
        />

        {/* Botões de Ação */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center justify-center w-8 h-8 bg-green-100 border border-green-700 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                title="Salvar"
              >
                <Check size={16} strokeWidth={3} />
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center justify-center w-8 h-8 bg-red-100 border border-red-600 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                title="Cancelar"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleEdit}
                className="text-gray-500 hover:text-blue-600 transition-colors p-1"
                title="Editar"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-gray-500 hover:text-red-600 transition-colors p-1"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center w-full mt-4 px-2">
        {isEditing ? (
          <div
            className="flex flex-col gap-2 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full h-8 px-2 text-base uppercase border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Nome da Obra"
              autoFocus
            />
            <input
              type="text"
              value={editedClient}
              onChange={(e) => setEditedClient(e.target.value)}
              className="w-full h-8 px-2 text-base uppercase border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Cliente"
            />
          </div>
        ) : (
          <>
            <h2 className="w-full text-xl font-bold text-center uppercase truncate leading-tight text-gray-800">
              {nome}
            </h2>
            <p className="flex items-center justify-center w-full gap-1 text-base text-gray-600 mt-1">
              <span className="font-semibold">CLIENTE:</span>
              <span className="max-w-[200px] uppercase truncate">{client}</span>
            </p>
          </>
        )}
      </div>

      <div className="flex justify-center mt-auto pt-4 relative z-20">
        <div
          className={`relative flex items-center justify-center w-3/4 py-1.5 rounded-lg font-bold text-sm ${statusAtual.bg} ${statusAtual.text} border border-transparent hover:border-current transition-colors`}
        >
          <select
            value={status}
            onChange={handleStatusChange}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 appearance-none"
          >
            <option value="Aguardando iniciação">Aguardando iniciação</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluída">Concluída</option>
          </select>
          <div className="flex items-center gap-1.5 pointer-events-none z-10">
            <StatusIcon size={16} strokeWidth={2.5} />
            {status}
          </div>
        </div>
      </div>
    </div>
  );
}
