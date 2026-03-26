import { useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";

export default function ModalFornecedor({
  isOpen,
  onClose,
  onSave,
  fornecedorEdit,
}) {
  // Como agora o componente é "recriado" pelo pai (usando key), podemos iniciar o estado direto:
  const [nome, setNome] = useState(fornecedorEdit?.nome || "");
  const [cnpj, setCnpj] = useState(fornecedorEdit?.cnpj || "");
  const [telefone, setTelefone] = useState(fornecedorEdit?.telefone || "");
  const [email, setEmail] = useState(fornecedorEdit?.email || "");

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (!nome) {
      alert("O nome do fornecedor é obrigatório!");
      return;
    }

    onSave({
      id: fornecedorEdit?.id,
      nome,
      cnpj,
      telefone,
      email,
    });
  };

  return (
    <div className="fixed z-50 flex items-center justify-center w-[380px] sm:w-[500px] p-[10px]">
      <div className="bg-[#ffffff] w-full max-w-[500px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              {fornecedorEdit ? "Editar Fornecedor" : "Novo Fornecedor"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border-none bg-transparent w-[50px] h-[50px] cursor-pointer flex items-center justify-center"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="fechar"
            />
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[15px] overflow-y-auto">
          {/* Input Nome */}
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Nome do Fornecedor *
            </label>
            <input
              type="text"
              placeholder="Ex: Depósito do Zé..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border uppercase"
            />
          </div>

          {/* Input CNPJ */}
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              CNPJ / NIF
            </label>
            <input
              type="text"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border"
            />
          </div>

          <div className="flex gap-[12px] w-full">
            {/* Input Telefone */}
            <div className="flex-[1] flex flex-col gap-[5px]">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Telefone
              </label>
              <input
                type="text"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border"
              />
            </div>

            {/* Input Email */}
            <div className="flex-[1] flex flex-col gap-[5px]">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                E-mail
              </label>
              <input
                type="email"
                placeholder="contato@loja.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border lowercase"
              />
            </div>
          </div>

          <ButtonDefault
            onClick={handleConfirmar}
            className="w-full bg-[#464C54] text-black h-[50px] text-[16px] font-bold mt-[10px]"
          >
            {fornecedorEdit ? "Guardar Alterações" : "Registar Fornecedor"}
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
