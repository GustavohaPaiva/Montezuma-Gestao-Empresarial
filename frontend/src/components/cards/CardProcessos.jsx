import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CardProcessos({
  id,
  client,
  tipo,
  status,
  onUpdate,
  onDelete,
}) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(client);
  const [editedTipo, setEditedTipo] = useState(tipo);

  let bgColor, textColor, iconFilter;

  // Sincronizado exatamente com as cores e status da tabela de Clientes (Projetos.jsx)
  if (status === "Produção") {
    bgColor = "bg-[#F3E5F5]";
    textColor = "text-[#7B1FA2]";
    iconFilter =
      "invert(24%) sepia(50%) saturate(3825%) hue-rotate(272deg) brightness(87%) contrast(98%)";
  } else if (status === "Prefeitura") {
    bgColor = "bg-[#E3F2FD]";
    textColor = "text-[#1565C0]";
    iconFilter =
      "invert(29%) sepia(74%) saturate(2400%) hue-rotate(195deg) brightness(90%) contrast(93%)";
  } else if (status === "Caixa") {
    bgColor = "bg-[#E0F2F1]";
    textColor = "text-[#00695C]";
    iconFilter =
      "invert(26%) sepia(97%) saturate(1478%) hue-rotate(164deg) brightness(95%) contrast(102%)";
  } else if (status === "Obra") {
    bgColor = "bg-[#FFF3E0]";
    textColor = "text-[#E65100]";
    iconFilter =
      "invert(42%) sepia(98%) saturate(1831%) hue-rotate(1deg) brightness(97%) contrast(100%)";
  } else if (status === "Finalizado") {
    bgColor = "bg-[#E8F5E9]";
    textColor = "text-[#2E7D32]";
    iconFilter = "invert(36%) sepia(85%) saturate(450%) hue-rotate(95deg)";
  } else {
    // Fallback caso venha algum status diferente ou nulo
    bgColor = "bg-gray-100";
    textColor = "text-gray-600";
    iconFilter = "invert(50%)";
  }

  const handleCardClick = () => {
    if (!isEditing) {
      navigate(`/processo/${id}`);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditedClient(client);
    setEditedTipo(tipo);
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    await onUpdate(id, { nome: editedClient, tipo: editedTipo });
    setIsEditing(false);
  };

  const toggleEdit = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete();
  };

  const handleStatusClick = (e) => {
    e.stopPropagation();
  };

  const handleStatusChange = async (e) => {
    const novoStatus = e.target.value;
    await onUpdate(id, { status: novoStatus });
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative no-underline text-inherit block bg-[#FAFAFA] rounded-[8px] w-full h-[220px] flex flex-col justify-between p-[15px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] md:max-w-[350px] box-border transition-transform ${
        !isEditing ? "hover:scale-[1.02] cursor-pointer" : "cursor-default"
      } text-black`}
    >
      <div className="right-4 flex gap-[8px] justify-end relative z-10">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="border border-[#2E7D32] rounded-[50%] bg-[#cce7c9] hover:bg-[#C8E6C9] transition-colors w-[28px] h-[28px] flex items-center justify-center mr-2"
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
              className="border border-[#ff5252] rounded-[50%] bg-[#ffbaba] hover:bg-[#ff5252] transition-colors w-[28px] h-[28px] flex items-center justify-center mr-2"
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
            <div className="flex justify-end w-full gap-[8px]">
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
                onClick={handleDeleteClick}
                className="bg-transparent border-none cursor-pointer"
              >
                <img
                  width="18"
                  height="18"
                  src="https://img.icons8.com/material-outlined/24/filled-trash.png"
                  alt="trash"
                />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center w-full px-2">
        {isEditing ? (
          <div
            className="flex flex-col gap-[10px] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-row gap-[8px] items-center">
              <span className="text-[18px] font-semibold">Cliente:</span>
              <input
                type="text"
                value={editedClient}
                onChange={(e) => setEditedClient(e.target.value)}
                className="text-[16px] h-[28px] px-[8px] border border-gray-300 rounded-[6px] w-full uppercase"
              />
            </div>
            <div className="flex flex-row gap-[8px] items-center">
              <span className="text-[18px] font-semibold">Tipo:</span>
              <input
                type="text"
                value={editedTipo}
                onChange={(e) => setEditedTipo(e.target.value)}
                className="text-[16px] h-[28px] px-[8px] border border-gray-300 rounded-[6px] w-full uppercase"
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-[16px] text-gray-600 flex justify-center items-center w-full gap-[4px]">
              <span className="font-semibold mr-2">CLIENTE: </span>
              <span className="uppercase truncate max-w-[200px]">{client}</span>
            </p>
            <p className="text-[16px] text-gray-600 flex justify-center items-center w-full gap-[4px] mt-1">
              <span className="font-semibold mr-2">TIPO: </span>
              <span className="uppercase truncate max-w-[200px]">
                {tipo || "-"}
              </span>
            </p>
          </>
        )}
      </div>

      <div className="flex justify-center mt-2 relative z-20">
        <div
          className={`relative ${bgColor} ${textColor} w-[60%] h-[35px] rounded-[8px] flex items-center justify-center font-bold text-sm`}
        >
          <select
            value={status || "Produção"} // Fallback para exibir o valor inicial da lista caso venha vazio
            onChange={handleStatusChange}
            onClick={handleStatusClick}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 appearance-none"
          >
            <option value="Prefeitura">Prefeitura</option>
            <option value="Caixa">Caixa</option>
            <option value="Obra">Obra</option>
            <option value="Finalizado">Finalizado</option>
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
            {status || "Produção"}
          </div>
        </div>
      </div>
    </div>
  );
}
