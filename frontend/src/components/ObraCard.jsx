import { useState } from "react";
import { Link } from "react-router-dom";

export default function ObraCard({
  id,
  nome,
  client,
  status,
  onUpdate, // Recebe a função handleUpdateInline do pai
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(nome);
  const [editedClient, setEditedClient] = useState(client);

  const isAndamento = status?.toLowerCase().includes("andamento");
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
    setEditedName(nome); // Reseta para o valor original
    setEditedClient(client); // Reseta para o valor original
    setIsEditing(false);
  };

  // Salvamento das alterações inline
  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Chama a função do pai passando o objeto com as chaves certas da API
    await onUpdate(id, { local: editedName, cliente: editedClient });
    setIsEditing(false);
  };

  // Filtro para ícone
  const iconFilter = isAndamento
    ? "invert(37%) sepia(93%) saturate(1200%) hue-rotate(10deg)"
    : "invert(36%) sepia(85%) saturate(450%) hue-rotate(95deg)";

  return (
    <Link
      to={isEditing ? "#" : `/obra/${id}`} // Desabilita navegação durante edição
      className={`relative no-underline text-inherit block bg-[#FAFAFA] rounded-[8px] w-full h-[220px] flex flex-col justify-between p-[15px] shadow-[0_5px_20px_rgba(0,0,0,0.15)] max-w-[350px] box-border transition-transform ${
        !isEditing ? "hover:scale-[1.02] cursor-pointer" : "cursor-default"
      } text-black`}
    >
      <div className="right-4 flex gap-[8px] justify-end relative z-10">
        {isEditing ? (
          <>
            {/* Botão Salvar (Check) */}
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
            {/* Botão Cancelar (X) */}
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
              {/* Botão Editar (Lápis) */}
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
              {/* Botão Deletar (Lixo) */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Garante que não navegue
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

      <div className="mt-6 flex flex-col items-center w-full px-2">
        {isEditing ? (
          <div
            className="flex flex-col gap-[10px] w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }} // Previne clique no Link ao clicar na área branca dos inputs
          >
            <div className="flex flex-row gap-[8px] items-center">
              <span className="text-[18px] font-semibold">Obra:</span>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-[16px] h-[28px] text-start px-[8px] border border-gray-300 rounded-[6px] focus:outline-none focus:border-blue-500 bg-white w-full uppercase"
                autoFocus
              />
            </div>
            <div className="flex flex-row gap-[8px] items-center">
              <span className="text-[18px] font-semibold">Cliente:</span>
              <input
                type="text"
                value={editedClient}
                onChange={(e) => setEditedClient(e.target.value)}
                className="text-[16px] h-[28px] text-start px-[8px] border border-gray-300 rounded-[6px] focus:outline-none focus:border-blue-500 bg-white w-full uppercase"
              />
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-[22px] font-bold leading-tight mb-1 text-center truncate w-full uppercase">
              {nome}
            </h2>
            {/* CORREÇÃO AQUI: mr-2 forçado no span do label */}
            <p className="text-[16px] text-gray-600 flex justify-center items-center w-full gap-[4px]">
              <span className="font-semibold mr-2">CLIENTE: </span>
              <span className="uppercase truncate max-w-[200px]">{client}</span>
            </p>
          </>
        )}
      </div>

      <div className="flex justify-center mt-2">
        <span
          className={`text-sm ${bgColor} ${textColor} w-[60%] px-4 rounded-[8px] h-[35px] flex font-bold items-center justify-center box-border`}
        >
          <img
            width="20"
            height="20"
            src="https://img.icons8.com/ios-glyphs/30/full-stop--v1.png"
            alt="status-icon"
            className="mr-1"
            style={{ filter: iconFilter }}
          />
          {status}
        </span>
      </div>
    </Link>
  );
}
