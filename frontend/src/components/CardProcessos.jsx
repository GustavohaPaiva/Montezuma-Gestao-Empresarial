import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Importamos o hook de navegação

export default function ObraCard({
  id,
  nome,
  client,
  status,
  onUpdate,
  onDelete,
}) {
  const navigate = useNavigate(); // Hook para navegar via código
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(nome);
  const [editedClient, setEditedClient] = useState(client);

  // --- LÓGICA DE CORES (Mantendo suas classes e lógica) ---
  let bgColor, textColor, iconFilter;

  if (status === "Em andamento") {
    bgColor = "bg-[#FFF4E5]";
    textColor = "text-[#B95000]";
    iconFilter = "invert(37%) sepia(93%) saturate(1200%) hue-rotate(10deg)";
  } else if (status === "Aguardando iniciação") {
    bgColor = "bg-[#FFEBEE]"; // Vermelho Claro
    textColor = "text-[#C62828]"; // Vermelho Escuro
    iconFilter =
      "invert(23%) sepia(51%) saturate(2793%) hue-rotate(338deg) brightness(88%) contrast(96%)";
  } else {
    // Concluída
    bgColor = "bg-[#E6F4EA]";
    textColor = "text-[#1E8E3E]";
    iconFilter = "invert(36%) sepia(85%) saturate(450%) hue-rotate(95deg)";
  }

  // --- NAVEGAÇÃO DO CARD ---
  const handleCardClick = () => {
    if (!isEditing) {
      navigate(`/obra/${id}`);
    }
  };

  // --- EDIÇÃO E AÇÕES ---
  const toggleEdit = (e) => {
    e.stopPropagation(); // Impede navegar ao clicar no edit
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

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Impede navegar ao clicar no lixo
    onDelete();
  };

  // --- MUDANÇA DE STATUS ---
  const handleStatusClick = (e) => {
    e.stopPropagation(); // O SEGREDO: Impede que o clique no select navegue para a obra
  };

  const handleStatusChange = async (e) => {
    // Não precisa de preventDefault aqui no change, apenas a lógica
    const novoStatus = e.target.value;
    await onUpdate(id, { status: novoStatus });
  };

  return (
    // TROCAMOS <Link> POR <div onClick={handleCardClick}>
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

      <div className="mt-6 flex flex-col items-center w-full px-2">
        {isEditing ? (
          <div
            className="flex flex-col gap-[10px] w-full"
            onClick={(e) => e.stopPropagation()} // Impede clique na área branca do input de navegar
          >
            <div className="flex flex-row gap-[8px] items-center">
              <span className="text-[18px] font-semibold">Obra:</span>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-[16px] h-[28px] px-[8px] border border-gray-300 rounded-[6px] w-full uppercase"
                autoFocus
              />
            </div>
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

      {/* ÁREA DO SELECT - AQUI ESTAVA O PROBLEMA */}
      <div
        className="flex justify-center mt-2 relative z-20"
        onClick={handleStatusClick} // Captura o clique antes do Card
      >
        <div
          className={`relative ${bgColor} ${textColor} w-[60%] h-[35px] rounded-[8px] flex items-center justify-center font-bold text-sm`}
        >
          {/* O Select real (Invisível mas clicável) */}
          <select
            value={status}
            onChange={handleStatusChange}
            onClick={handleStatusClick} // Reforço para garantir que não propague
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 appearance-none"
          >
            <option value="Aguardando iniciação">Aguardando iniciação</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluída">Concluída</option>
          </select>

          {/* O Visual do Badge */}
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
