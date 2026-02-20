import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

  let bgColor, textColor, iconFilter;

  if (status === "Em andamento") {
    bgColor = "bg-[#FFF4E5]";
    textColor = "text-[#B95000]";
    iconFilter = "invert(37%) sepia(93%) saturate(1200%) hue-rotate(10deg)";
  } else if (status === "Aguardando iniciação") {
    bgColor = "bg-[#FFEBEE]";
    textColor = "text-[#C62828]";
    iconFilter =
      "invert(23%) sepia(51%) saturate(2793%) hue-rotate(338deg) brightness(88%) contrast(96%)";
  } else {
    bgColor = "bg-[#E6F4EA]";
    textColor = "text-[#1E8E3E]";
    iconFilter = "invert(36%) sepia(85%) saturate(450%) hue-rotate(95deg)";
  }

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

  return (
    <div
      onClick={handleCardClick}
      className={`relative no-underline text-inherit block bg-[#FAFAFA] rounded-[8px] w-full h-[220px] flex flex-col justify-between p-[15px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] md:max-w-[350px] box-border transition-transform ${
        !isEditing ? "hover:scale-[1.02] cursor-pointer" : "cursor-default"
      } text-black`}
    >
      <div className="flex items-center justify-between relative z-10 w-full">
        {/* Indicativo Financeiro */}
        <div className="flex items-center">
          <div
            className={`w-[12px] h-[12px] rounded-full shadow-sm transition-colors duration-300 ${
              tudoPago ? "bg-[#2E7D32]" : "bg-[#F57C00]"
            }`}
            title={tudoPago ? "Tudo pago" : "Pagamento pendente"}
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-[8px]">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="border border-[#2E7D32] rounded-[50%] bg-[#cce7c9] hover:bg-[#C8E6C9] w-[28px] h-[28px] flex items-center justify-center"
              >
                <img
                  width="18"
                  height="18"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={handleCancel}
                className="border border-[#ff5252] rounded-[50%] bg-[#ffbaba] hover:bg-[#ff5252] w-[28px] h-[28px] flex items-center justify-center"
              >
                <img
                  width="18"
                  height="18"
                  src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
                  alt="cancelar"
                />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleEdit}
                className="bg-transparent border-none cursor-pointer"
              >
                <img
                  width="18"
                  height="18"
                  src="https://img.icons8.com/ios/50/edit--v1.png"
                  alt="editar"
                />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-transparent border-none cursor-pointer"
              >
                <img
                  width="18"
                  height="18"
                  src="https://img.icons8.com/material-outlined/24/filled-trash.png"
                  alt="trash"
                />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center w-full px-2">
        {isEditing ? (
          <div
            className="flex flex-col gap-[10px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-[16px] h-[28px] px-[8px] border border-gray-300 rounded-[6px] w-full uppercase"
              placeholder="Nome da Obra"
              autoFocus
            />
            <input
              type="text"
              value={editedClient}
              onChange={(e) => setEditedClient(e.target.value)}
              className="text-[16px] h-[28px] px-[8px] border border-gray-300 rounded-[6px] w-full uppercase"
              placeholder="Cliente"
            />
          </div>
        ) : (
          <>
            <h2 className="text-[22px] font-bold leading-tight mb-1 text-center truncate w-full uppercase">
              {nome}
            </h2>
            <p className="text-[16px] text-gray-600 flex justify-center items-center w-full gap-[4px]">
              <span className="font-semibold mr-2">CLIENTE: </span>
              <span className="uppercase truncate max-w-[200px]">{client}</span>
            </p>
          </>
        )}
      </div>

      <div className="flex justify-center mt-2 relative z-20">
        <div
          className={`relative ${bgColor} ${textColor} w-[60%] h-[35px] rounded-[8px] flex items-center justify-center font-bold text-sm`}
        >
          <select
            value={status}
            onChange={async (e) =>
              await onUpdate(id, { status: e.target.value })
            }
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 appearance-none"
          >
            <option value="Aguardando iniciação">Aguardando iniciação</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluída">Concluída</option>
          </select>
          <div className="flex items-center justify-center pointer-events-none z-10">
            <img
              width="20"
              height="20"
              src="https://img.icons8.com/ios-glyphs/30/full-stop--v1.png"
              alt="status-icon"
              className="mr-1"
              style={{ filter: iconFilter }}
            />
            {status}
          </div>
        </div>
      </div>
    </div>
  );
}
