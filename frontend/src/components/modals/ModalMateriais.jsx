import { useState, useEffect } from "react";
import ButtonDefault from "../gerais/ButtonDefault";
import { api } from "../../services/api";

export default function ModalMateriais({ isOpen, onClose, onSave, nomeObra }) {
  const [material, setMaterial] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("Un.");

  const [listaFornecedores, setListaFornecedores] = useState([]);
  const [carregandoFornecedores, setCarregandoFornecedores] = useState(false);

  const listaUnidades = [
    "Sc.",
    "Kg.",
    "Lt.",
    "m²",
    "m³",
    "Un.",
    "Lata",
    "m",
    "cm",
    "Gl.",
    "Mensal",
    "Pç.",
    "Cx.",
  ];

  useEffect(() => {
    if (isOpen) {
      const carregarFornecedores = async () => {
        setCarregandoFornecedores(true);
        try {
          const dados = await api.getFornecedoresSimples();
          setListaFornecedores(dados || []);
        } catch (error) {
          console.error("Erro ao carregar lista de fornecedores", error);
        } finally {
          setCarregandoFornecedores(false);
        }
      };
      carregarFornecedores();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (!material || !quantidade || !fornecedorId) {
      alert("Preencha o material, a quantidade e selecione um fornecedor!");
      return;
    }

    onSave({ material, fornecedor_id: fornecedorId, quantidade, unidade });

    setMaterial("");
    setFornecedorId("");
    setQuantidade("");
    setUnidade("Un.");
  };

  return (
    <div className="fixed z-50 flex items-center justify-center w-[380px] sm:w-[500px] p-[10px]">
      <div className="bg-[#ffffff] w-full max-w-[500px] rounded-[16px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              Solicitação Material
            </h2>
            <p className="text-[13px] text-[#71717A] truncate">
              Obra: {nomeObra}
            </p>
          </div>
          <button
            onClick={onClose}
            className="border-none bg-transparent w-[50px] h-[50px] cursor-pointer"
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
              Material
            </label>
            <input
              type="text"
              placeholder="Ex: Cimento, tijolo..."
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border"
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Fornecedor
            </label>
            <select
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
              disabled={carregandoFornecedores}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] box-border cursor-pointer disabled:opacity-50"
            >
              <option value="">
                {carregandoFornecedores
                  ? "Carregando..."
                  : "Selecione um fornecedor"}
              </option>
              {listaFornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-[12px] w-full">
            <div className="flex-[2] flex flex-col gap-[5px]">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Quant.
              </label>
              <input
                type="number"
                placeholder="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              />
            </div>
            <div className="flex-[1] flex flex-col gap-[5px]">
              <label className="text-[12px] font-bold text-[#71717A] uppercase">
                Un.
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none focus:border-[#464C54] cursor-pointer appearance-none"
              >
                {listaUnidades.map((un) => (
                  <option key={un} value={un}>
                    {un}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <ButtonDefault
            onClick={handleConfirmar}
            className="w-full bg-[#464C54] text-black h-[50px] text-[16px] font-bold mt-[10px]"
          >
            Confirmar Solicitação
          </ButtonDefault>
        </div>
      </div>
    </div>
  );
}
