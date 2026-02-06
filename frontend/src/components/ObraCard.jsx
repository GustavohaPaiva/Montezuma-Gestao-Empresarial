import { useState } from "react";
import { Link } from "react-router-dom";

export default function ObraCard({
  id,
  nome,
  client,
  status,
  onUpdate,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(nome);
  const [editedClient, setEditedClient] = useState(client);

  const isAndamento = status.toLowerCase().includes("andamento");
  const bgColor = isAndamento ? "bg-[#FFF4E5]" : "bg-[#E6F4EA]";
  const textColor = isAndamento ? "text-[#B95000]" : "text-[#1E8E3E]";

  // Ativação do modo de edição
  const toggleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  // Cancelamento da edição e reversão dos valores
  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditedName(nome);
    setEditedClient(client);
    setIsEditing(false);
  };

  // Salvamento das alterações inline
  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await onUpdate(id, { local: editedName, cliente: editedClient });
    setIsEditing(false);
  };

  return (
    <Link
      to={isEditing ? "#" : `/obra/${id}`} // Desabilita navegação durante edição
      className={`relative no-underline text-inherit block bg-[#FAFAFA] rounded-[8px] w-full h-[220px] flex flex-col justify-between p-[15px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] max-w-[350px] box-border transition-transform ${
        !isEditing ? "hover:scale-[1.02] cursor-pointer" : "cursor-default"
      } text-black`}
    >
      <div className="right-4 flex gap-[8px] justify-end">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="border border-[#2E7D32] rounded-[50%] bg-[#cce7c9] hover:bg-[#C8E6C9] transition-colors w-[28px] h-[28px] text-center flex items-center justify-center mr-2"
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
              className="border border-[#ff5252] rounded-[50%] bg-[#ffbaba] hover:bg-[#ff5252] transition-colors w-[28px] h-[28px] text-center flex items-center justify-center mr-2"
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
                className="bg-white flex justify-center bg-[transparent] items-center border-none rounded-[10px]"
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
                  e.preventDefault();
                  onDelete();
                }}
                className="bg-white flex justify-center bg-[transparent] items-center border-none rounded-[10px]"
              >
                <img
                  width="18"
                  height="18"
                  src="https://img.icons8.com/material-outlined/24/filled-trash.png"
                  alt="filled-trash"
                />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center w-full">
        {isEditing ? (
          <div
            className="flex flex-col gap-[10px] w-full"
            onClick={(e) => e.preventDefault()}
          >
            <div className="flex flex-row gap-[8px]">
              <span className="text-[18px]">Obra:</span>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-[16px] h-[23px] text-start px-[8px] border border-[#] rounded-[10px] focus:outline-none bg-transparent w-full"
                autoFocus
              />
            </div>
            <div className="flex flex-row gap-[8px]">
              <span className="text-[18px]">Cliente:</span>
              <input
                type="text"
                value={editedClient}
                onChange={(e) => setEditedClient(e.target.value)}
                className="text-[16px] h-[23px] text-start px-[8px] border border-[#] rounded-[10px] focus:outline-none bg-transparent w-full"
              />
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-[22px] font-bold leading-tight mb-1 text-center truncate w-full px-2">
              {nome}
            </h2>
            <p className="text-[16px] text-gray-600 text-center truncate w-full px-2">
              <span className="font-semibold">Cliente:</span> {client}
            </p>
          </>
        )}
      </div>

      <div className="flex justify-center">
        <span
          className={`text-sm ${bgColor} ${textColor} w-[60%] px-4 rounded-[8px] h-[35px] flex font-bold items-center justify-center box-border`}
        >
          <img
            width="20"
            height="20"
            src="https://img.icons8.com/ios-glyphs/30/full-stop--v1.png"
            alt="status-icon"
            className="mr-1"
            style={{
              filter: isAndamento
                ? "invert(37%) sepia(93%) saturate(1200%) hue-rotate(10deg)"
                : "invert(36%) sepia(85%) saturate(450%) hue-rotate(95deg)",
            }}
          />
          {status}
        </span>
      </div>
    </Link>
  );
}
