import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CardProcessos(id, client, status, onUpdate, onDelete) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
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
    if (!isEditing) {
      navigate(`/processo/${id}`);
    }
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    await onUpdate(id, { cliente: editedClient });
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
          </div>
        ) : (
          <>
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
            onChange={handleStatusChange}
            onClick={handleStatusClick}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 appearance-none"
          >
            <option value="Tudo">Tudo</option>
            <option value="Produção">Produção</option>
            <option value="Prefeitura">Prefeitura</option>
            <option value="Caixa">Caixa</option>
            <option value="Contrato">Contrato</option>
            <option value="Obra">Obra</option>
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
