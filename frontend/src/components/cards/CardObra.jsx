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
  User,
} from "lucide-react";

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
  data,
  status,
  tudoPago,
  responsavel = null,
  responsavelId = null,
  diretoriaUsuarios = [],
  onUpdate,
  onDelete,
}) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(nome);
  const [editedDataInicial, setEditedDataInicial] = useState(data);
  const [editedResponsavelId, setEditedResponsavelId] = useState(() =>
    responsavelId != null ? String(responsavelId) : "",
  );

  const statusAtual = STATUS_CONFIG[status] || STATUS_CONFIG["default"];
  const StatusIcon = statusAtual.icon;

  const handleCardClick = () => {
    if (!isEditing) navigate(`/obrasD/${id}`);
  };

  const toggleEdit = (e) => {
    e.stopPropagation();
    setEditedName(nome);
    setEditedDataInicial(data);
    setEditedResponsavelId(responsavelId != null ? String(responsavelId) : "");
    setIsEditing(true);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditedName(nome);
    setEditedDataInicial(data);
    setEditedResponsavelId(responsavelId != null ? String(responsavelId) : "");
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    await onUpdate(id, {
      local: editedName,
      data: editedDataInicial,
      responsavel_id: editedResponsavelId ? editedResponsavelId : null,
    });
    setIsEditing(false);
  };

  const handleStatusChange = async (e) => {
    e.stopPropagation();
    await onUpdate(id, { status: e.target.value });
  };

  const responsavelTexto =
    responsavel != null && String(responsavel).trim() !== ""
      ? String(responsavel).trim()
      : null;

  return (
    <div
      onClick={handleCardClick}
      className={`relative flex w-full min-h-[232px] flex-col rounded-lg border border-gray-100 bg-surface p-4 shadow-sm transition-all duration-200 md:max-w-[350px] ${
        !isEditing
          ? "cursor-pointer hover:scale-[1.02] hover:shadow-md"
          : "cursor-default"
      }`}
    >
      <div className="z-10 flex w-full shrink-0 items-center justify-between">
        <div
          className={`w-3 h-3 rounded-full shadow-sm transition-colors duration-300 ${
            tudoPago ? "bg-success-primary" : "bg-warning-primary"
          }`}
          title={tudoPago ? "Tudo pago" : "Pagamento pendente"}
        />

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

      <div className="mt-3 flex min-h-0 w-full flex-1 flex-col items-center justify-center px-2">
        {isEditing ? (
          <div
            className="flex w-full flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={client}
              disabled
              title="O nome do cliente agora é gerido pela aba de Processos/Clientes"
              className="w-full h-8 px-2 text-base uppercase border border-gray-200 bg-gray-100 text-gray-400 rounded-md cursor-not-allowed focus:outline-none"
              placeholder="Cliente"
            />

            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="w-full h-8 px-2 text-base uppercase border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Nome da Obra"
              autoFocus
            />

            <input
              type="date"
              value={editedDataInicial}
              onChange={(e) => setEditedDataInicial(e.target.value)}
              className="w-full h-8 px-2 text-base uppercase border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="data"
            />
            {diretoriaUsuarios.length > 0 && (
              <div className="mt-1 flex w-full flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">
                  Responsável
                </span>
                <select
                  value={editedResponsavelId}
                  onChange={(e) => setEditedResponsavelId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Nenhum</option>
                  {diretoriaUsuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <>
            <h2 className="w-full text-xl font-bold text-center uppercase truncate leading-tight text-gray-800">
              {client}
            </h2>

            <p className="flex items-center justify-center w-full gap-1 text-base text-gray-600 mt-1">
              <span className="max-w-[200px] uppercase truncate">{nome}</span>
            </p>

            <p className="mt-1 flex w-full items-center justify-center gap-1 text-base text-gray-600">
              <span className="font-semibold">Data de Início:</span>
              <span className="max-w-[200px] uppercase truncate">{data}</span>
            </p>
            {responsavelTexto && (
              <div
                className="mt-3 flex w-full max-w-full items-center justify-center gap-1.5 text-xs text-slate-500"
                title={`Responsável: ${responsavelTexto}`}
              >
                <User
                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                  strokeWidth={2}
                />
                <span className="line-clamp-2 text-center">
                  <span className="text-slate-400">Resp:</span>{" "}
                  {responsavelTexto}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="relative z-20 mt-auto flex shrink-0 justify-center pt-3">
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
