import { useEffect, useMemo, useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";
import ModalPortal from "../gerais/ModalPortal";
import { api } from "../../services/api";

export default function ModalMaoDeObra({ isOpen, onClose, onSave, nomeObra }) {
  const [formData, setFormData] = useState({
    tipo: "",
    classe_id: "",
    prestador_id: "",
    valor: "",
  });
  const [classes, setClasses] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingPrestadores, setLoadingPrestadores] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const carregarClasses = async () => {
      try {
        setLoadingClasses(true);
        const dados = await api.getClassesPrestadores();
        setClasses(dados || []);
      } catch (error) {
        console.error("Erro ao carregar classes:", error);
      } finally {
        setLoadingClasses(false);
      }
    };
    carregarClasses();
  }, [isOpen]);

  useEffect(() => {
    const carregarPrestadores = async () => {
      if (!formData.classe_id) {
        setPrestadores([]);
        return;
      }

      try {
        setLoadingPrestadores(true);
        const dados = await api.getPrestadoresByClasse(formData.classe_id);
        setPrestadores(dados || []);
      } catch (error) {
        console.error("Erro ao carregar prestadores por classe:", error);
        setPrestadores([]);
      } finally {
        setLoadingPrestadores(false);
      }
    };
    carregarPrestadores();
  }, [formData.classe_id]);

  const prestadorSelecionado = useMemo(
    () =>
      prestadores.find((p) => String(p.id) === String(formData.prestador_id)),
    [prestadores, formData.prestador_id],
  );

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.tipo || !formData.classe_id || !formData.prestador_id) {
      alert("Preencha serviço, classe e prestador.");
      return;
    }

    onSave({
      ...formData,
      profissional: prestadorSelecionado?.nome || "",
      classe_id: Number(formData.classe_id),
      prestador_id: Number(formData.prestador_id),
    });

    // Limpa os campos para nova entrada e NÃO fecha o modal
    setFormData({ tipo: "", classe_id: "", prestador_id: "", valor: "" });
    setPrestadores([]);
  };

  return (
    <ModalPortal>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[10px]">
      <div className="bg-[#ffffff] w-[500px] max-w-[95%] rounded-[16px] shadow-2xl flex flex-col overflow-hidden border border-[#C4C4C9]">
        <div className="p-[20px] border-b border-[#DBDADE] bg-[#FFFFFF] flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] font-bold text-[#464C54] uppercase truncate">
              Solicitação Mão de Obra
            </h2>
            <p className="text-[13px] text-[#71717A] truncate">
              Obra: {nomeObra}
            </p>
          </div>

          <button
            onClick={onClose}
            className="border-none bg-transparent w-[50px] h-[50px] cursor-pointer flex justify-center items-center"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="multiply"
            />
          </button>
        </div>

        <div className="p-[20px] flex flex-col gap-[15px] overflow-y-auto max-h-[70vh]">
          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Serviço
            </label>
            <input
              type="text"
              placeholder="Ex: Pintura de fachada"
              value={formData.tipo}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, tipo: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Classe do Serviço
            </label>
            <select
              value={formData.classe_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  classe_id: e.target.value,
                  prestador_id: "",
                })
              }
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
            >
              <option value="">
                {loadingClasses
                  ? "Carregando classes..."
                  : "Selecione uma classe..."}
              </option>
              {classes?.map((classe) => (
                <option key={classe.id} value={classe.id}>
                  {classe.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Prestador
            </label>
            <select
              value={formData.prestador_id}
              onChange={(e) =>
                setFormData({ ...formData, prestador_id: e.target.value })
              }
              disabled={!formData.classe_id || loadingPrestadores}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border disabled:opacity-60"
            >
              <option value="">
                {!formData.classe_id
                  ? "Selecione uma classe primeiro..."
                  : loadingPrestadores
                    ? "Carregando prestadores..."
                    : "Selecione um prestador..."}
              </option>
              {prestadores?.map((opcao) => (
                <option key={opcao.id} value={opcao.id}>
                  {opcao.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[5px]">
            <label className="text-[12px] font-bold text-[#71717A] uppercase">
              Valor Estimado
            </label>
            <input
              type="number"
              placeholder="R$ 0,00"
              value={formData.valor}
              className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border"
              onChange={(e) =>
                setFormData({ ...formData, valor: e.target.value })
              }
            />
          </div>

          <ButtonDefault
            onClick={handleSave}
            className="w-full bg-[#464C54] text-black h-[50px] text-[16px] font-bold mt-[10px]"
          >
            Confirmar Registro
          </ButtonDefault>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
