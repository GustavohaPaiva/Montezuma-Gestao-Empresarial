import { useMemo, useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";

export default function ModalPrestador({
  isOpen,
  onClose,
  onSave,
  classesDisponiveis = [],
  onCreateClasse,
  prestadorEdit,
}) {
  const [nome, setNome] = useState(prestadorEdit?.nome || "");
  const [cnpjCpf, setCnpjCpf] = useState(prestadorEdit?.cnpj_cpf || "");
  const [telefone, setTelefone] = useState(prestadorEdit?.telefone || "");
  const [email, setEmail] = useState(prestadorEdit?.email || "");
  const [classeIds, setClasseIds] = useState(
    (prestadorEdit?.prestadores_classes || []).map((rel) => rel.classe_id),
  );
  const [mostrarNovaClasse, setMostrarNovaClasse] = useState(false);
  const [novaClasseNome, setNovaClasseNome] = useState("");
  const [criandoClasse, setCriandoClasse] = useState(false);

  const classesAtivas = useMemo(
    () => classesDisponiveis || [],
    [classesDisponiveis],
  );

  if (!isOpen) return null;

  const toggleClasse = (idClasse) => {
    setClasseIds((prev) =>
      prev.includes(idClasse)
        ? prev.filter((id) => id !== idClasse)
        : [...prev, idClasse],
    );
  };

  const handleCriarClasse = async () => {
    const nomeLimpo = novaClasseNome.trim();
    if (!nomeLimpo) {
      alert("Informe o nome da nova classe.");
      return;
    }

    try {
      setCriandoClasse(true);
      const classeCriada = await onCreateClasse(nomeLimpo);
      if (classeCriada?.id) {
        setClasseIds((prev) =>
          prev.includes(classeCriada.id) ? prev : [...prev, classeCriada.id],
        );
      }
      setNovaClasseNome("");
      setMostrarNovaClasse(false);
    } catch (error) {
      console.error("Erro ao criar classe:", error);
      alert("Não foi possível criar a classe.");
    } finally {
      setCriandoClasse(false);
    }
  };

  const handleConfirmar = () => {
    if (!nome.trim()) {
      alert("O nome do prestador é obrigatório!");
      return;
    }

    const payload = {
      nome: nome.trim(),
      cnpj_cpf: cnpjCpf.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      classe_ids: classeIds,
    };

    if (prestadorEdit?.id) {
      payload.id = prestadorEdit.id;
    }

    onSave(payload);
  };

  return (
    <div className="fixed z-50 flex items-center justify-center w-[380px] sm:w-[500px] p-[10px]">
      <div className="bg-[#ffffff] w-full max-w-[500px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              {prestadorEdit ? "Editar Prestador" : "Novo Prestador"}
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
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Nome do Prestador *
            </label>
            <input
              type="text"
              placeholder="Ex: João da Elétrica"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border uppercase"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              CPF / CNPJ / NIF
            </label>
            <input
              type="text"
              placeholder="Documento fiscal"
              value={cnpjCpf}
              onChange={(e) => setCnpjCpf(e.target.value)}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border"
            />
          </div>

          <div className="flex gap-[12px] w-full">
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

            <div className="flex-[1] flex flex-col gap-[5px]">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                E-mail
              </label>
              <input
                type="email"
                placeholder="contato@prestador.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border lowercase"
              />
            </div>
          </div>

          <div className="bg-[#F7F7F8] border border-[#DBDADE] rounded-[10px] p-3 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Classes do Prestador
              </label>
              <button
                type="button"
                onClick={() => setMostrarNovaClasse((prev) => !prev)}
                className="text-[12px] font-bold text-[#464C54] cursor-pointer border-none bg-transparent hover:opacity-70"
              >
                + Nova Classe
              </button>
            </div>

            {mostrarNovaClasse && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaClasseNome}
                  onChange={(e) => setNovaClasseNome(e.target.value)}
                  placeholder="Ex: Pintura"
                  className="flex-1 h-[40px] text-[14px] px-[10px] border border-[#C4C4C9] rounded-[8px] bg-white focus:outline-none focus:border-[#464C54] uppercase"
                />
                <button
                  type="button"
                  onClick={handleCriarClasse}
                  disabled={criandoClasse}
                  className="h-[40px] px-3 rounded-[8px] border border-[#C4C4C9] bg-white text-[12px] font-bold text-[#464C54] cursor-pointer hover:bg-[#EEEDF0] disabled:opacity-50"
                >
                  {criandoClasse ? "..." : "Criar"}
                </button>
              </div>
            )}

            {classesAtivas.length === 0 ? (
              <p className="text-[12px] text-[#71717A]">
                Nenhuma classe cadastrada.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {classesAtivas.map((classe) => (
                  <label
                    key={classe.id}
                    className="flex items-center gap-2 text-[13px] text-[#464C54] font-medium bg-white border border-[#E6E5E8] rounded-[8px] px-2 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={classeIds.includes(classe.id)}
                      onChange={() => toggleClasse(classe.id)}
                      className="h-4 w-4 accent-[#464C54]"
                    />
                    <span className="uppercase truncate" title={classe.nome}>
                      {classe.nome}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <ButtonDefault
            onClick={handleConfirmar}
            className="w-full py-1 bg-[#464C54] text-black h-[50px] text-[16px] font-bold mt-[10px]"
          >
            {prestadorEdit ? "Guardar Alterações" : "Registar Prestador"}
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
