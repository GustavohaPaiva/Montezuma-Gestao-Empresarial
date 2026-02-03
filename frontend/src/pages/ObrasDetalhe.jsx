import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../components/TabelaSimples";
import ButtonDefault from "../components/ButtonDefault";
import { gerarPDF } from "../services/pdfService";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../services/api";
import ModalMateriais from "../components/ModalMateriais";
import ModalMaoDeObra from "../components/ModalMaoDeObra";

// --- Formatações (Fora do componente para performance máxima) ---
const formatarDataBR = (dataString) => {
  if (!dataString) return "-";
  const [ano, mes, dia] = dataString.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
};

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
};

export default function ObrasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [modalMateriaisOpen, setModalMateriaisOpen] = useState(false);
  const [modalMaoDeObraOpen, setModalMaoDeObraOpen] = useState(false);

  // Estados para edição do valor
  const [editandoId, setEditandoId] = useState(null);
  const [valorEditado, setValorEditado] = useState("");

  // --- Buscas ---
  // useCallback garante que esta função não seja recriada a cada render
  const fetchDados = useCallback(async () => {
    if (!id) return;
    try {
      const dados = await api.getObraById(id);
      setObra(dados);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  }, [id]);

  // --- CORREÇÃO DO ERRO PRINCIPAL ---
  useEffect(() => {
    // Envolvemos a chamada numa função async interna para satisfazer o Linter
    const carregar = async () => {
      await fetchDados();
    };
    carregar();
  }, [fetchDados]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Ações (Todas com useCallback para funcionarem no useMemo) ---

  const handleStatusChange = useCallback(
    async (materialId, novoStatus) => {
      // Atualização Otimista
      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          materiais: prev.materiais.map((m) =>
            m.id === materialId ? { ...m, status: novoStatus } : m,
          ),
        };
      });

      try {
        await api.updateMaterialStatus(materialId, novoStatus);
      } catch (err) {
        console.error("Erro status:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const handleSaveMaterial = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      try {
        setModalMateriaisOpen(false);
        await api.addMaterial({
          obra_id: id,
          material: dados.material,
          quantidade: `${dados.quantidade} ${dados.unidade || "Un."}`,
          data_solicitacao: dataAtual,
        });
        await fetchDados();
      } catch (err) {
        console.error("Erro material:", err);
        alert("Erro ao salvar material.");
      }
    },
    [id, fetchDados],
  );

  const handleSaveMaoDeObra = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      try {
        setModalMaoDeObraOpen(false);
        await api.addMaoDeObra({
          obra_id: id,
          tipo: dados.tipo,
          profissional: dados.profissional,
          valor: parseFloat(dados.valor) || 0,
          data_solicitacao: dataAtual,
        });
        await fetchDados();
      } catch (err) {
        console.error("Erro mao de obra:", err);
        alert("Erro ao salvar mão de obra.");
      }
    },
    [id, fetchDados],
  );

  // --- Lógica de Edição ---

  const iniciarEdicao = useCallback((item) => {
    setEditandoId(item.id);
    setValorEditado(item.valor);
  }, []);

  const cancelarEdicao = useCallback(() => {
    setEditandoId(null);
    setValorEditado("");
  }, []);

  const salvarValor = useCallback(
    async (itemId) => {
      const valorFloat = parseFloat(valorEditado) || 0;

      setObra((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          relatorioCliente: prev.relatorioCliente.map((item) =>
            item.id === itemId ? { ...item, valor: valorFloat } : item,
          ),
        };
      });

      setEditandoId(null);

      try {
        await api.updateValorRelatorioCliente(itemId, valorFloat);
      } catch (err) {
        console.error("Erro ao atualizar valor:", err);
        alert("Erro ao salvar valor. Recarregando...");
        fetchDados();
      }
    },
    [valorEditado, fetchDados],
  );

  // --- Tabelas Memoizadas (Dependências Completas para o Linter) ---

  const dadosMateriais = useMemo(() => {
    if (!obra || !obra.materiais) return [];
    return obra.materiais.map((m) => [
      m.material,
      m.quantidade,
      <select
        key={m.id}
        value={m.status || "Solicitado"}
        onChange={(e) => handleStatusChange(m.id, e.target.value)}
        className={`w-fit text-[14px] font-bold px-3 text-center h-[30px] rounded-[20px] focus:outline-none border-none cursor-pointer appearance-none ${
          m.status === "Entregue"
            ? "bg-[#E8F5E9] text-[#2E7D32]"
            : "bg-[#FFF3E0] text-[#E65100]"
        }`}
      >
        <option value="Solicitado">Solicitado</option>
        <option value="Em cotação">Em cotação</option>
        <option value="Aguardando entrega">Aguardando entrega</option>
        <option value="Entregue">Entregue</option>
      </select>,
      formatarDataBR(m.data_solicitacao),
    ]);
  }, [obra, handleStatusChange]);

  const dadosMaoDeObra = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];
    return obra.maoDeObra.map((m) => [
      m.tipo,
      m.profissional,
      `R$ ${formatarMoeda(m.valor)}`,
      formatarDataBR(m.data_solicitacao),
    ]);
  }, [obra]);

  const dadosRelatorioCliente = useMemo(() => {
    if (!obra || !obra.relatorioCliente) return [];

    return obra.relatorioCliente.map((item) => {
      const isEditing = editandoId === item.id;

      return [
        item.descricao,
        item.tipo,
        item.quantidade,
        formatarDataBR(item.data),
        <div className="flex items-center justify-center gap-2" key={item.id}>
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span>R$</span>
              <input
                type=""
                step="0.01"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                className="w-[50px] p-[4px] border border-[#DBDADE] ml-[10px] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarValor(item.id)}
                className="cursor-pointer rounded-[50%] w-[25px] h-[25px] mx-[5px] flex items-center justify-center border-none"
              >
                <img
                  width="15"
                  height="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={cancelarEdicao}
                className="cursor-pointer rounded-[50%] w-[25px] h-[25px] mx-[5px] flex items-center justify-center border-none"
              >
                <img
                  width="15"
                  height="15"
                  src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
                  alt="cancelar"
                />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => iniciarEdicao(item)}
            >
              <span>R$ {formatarMoeda(item.valor)}</span>
              <img
                width="15"
                height="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit--v1"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,
      ];
    });
  }, [
    obra,
    editandoId,
    valorEditado,
    iniciarEdicao,
    salvarValor,
    cancelarEdicao,
  ]);

  if (!obra)
    return (
      <div className="flex justify-center mt-20 font-bold text-[#71717A]">
        Carregando Obra...
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0] pb-[40px]">
      <header className="h-[82px] border-b border-[#DBDADE] flex justify-center sticky top-0 z-10 w-full bg-white">
        <div className="w-[90%] flex items-center justify-between">
          <div className="flex items-center gap-[16px]">
            <button
              onClick={() => navigate(-1)}
              className="border-none bg-transparent cursor-pointer flex items-center"
            >
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/ios/50/back--v1.png"
                alt="voltar"
              />
            </button>
            <h1 className="text-[20px] font-bold uppercase tracking-[2px] text-[#464C54]">
              {obra.local}
            </h1>
          </div>
          {!isMobile && (
            <div className="flex gap-[16px]">
              <ButtonDefault onClick={() => setModalMateriaisOpen(true)}>
                + Materiais
              </ButtonDefault>
              <ButtonDefault onClick={() => setModalMaoDeObraOpen(true)}>
                + Mão de Obra
              </ButtonDefault>
            </div>
          )}
        </div>
      </header>

      <main className="w-[90%] mt-[24px]">
        {isMobile && (
          <div className="flex flex-col gap-[12px] mb-[24px]">
            <ButtonDefault onClick={() => setModalMateriaisOpen(true)}>
              + Materiais
            </ButtonDefault>
            <ButtonDefault onClick={() => setModalMaoDeObraOpen(true)}>
              + Mão de Obra
            </ButtonDefault>
          </div>
        )}

        <div>
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <h1>Relatório de Materiais</h1>
            <TabelaSimples
              colunas={["Material", "Quantidade", "Status", "Data"]}
              dados={dadosMateriais}
            />
            <ButtonDefault
              onClick={() =>
                gerarPDF(
                  "Relatório Semanal",
                  ["Material", "Quantidade", "Status", "Data"],
                  dadosMateriais,
                  obra.local,
                )
              }
              className="w-full max-w-[450px]"
            >
              Gerar PDF para Cliente
            </ButtonDefault>
          </div>
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <h1>Relatório de Mão-de-Obra</h1>
            <TabelaSimples
              colunas={["Serviço", "Profissional", "Valor", "Data"]}
              dados={dadosMaoDeObra}
            />
            <ButtonDefault
              onClick={() =>
                gerarPDF(
                  "Relatório Semanal",
                  ["Serviço", "Profissional", "Valor", "Data"],
                  dadosMaoDeObra,
                  obra.local,
                )
              }
              className="w-full max-w-[450px]"
            >
              Gerar PDF Mão de Obra
            </ButtonDefault>
          </div>

          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <h1>Relatório para cliente</h1>
            <TabelaSimples
              colunas={["Descrição", "Tipo", "Qtd", "Data", "Valor"]}
              dados={dadosRelatorioCliente}
            />

            <ButtonDefault
              onClick={() =>
                gerarPDF(
                  "Relatório Semanal",
                  ["Descrição", "Tipo", "Qtd", "Data", "Valor"],
                  dadosRelatorioCliente,
                  obra.local,
                )
              }
              className="w-full max-w-[450px]"
            >
              Gerar PDF para Cliente
            </ButtonDefault>
          </div>
        </div>
      </main>

      <ModalMateriais
        isOpen={modalMateriaisOpen}
        onClose={() => setModalMateriaisOpen(false)}
        nomeObra={obra.local}
        onSave={handleSaveMaterial}
      />
      <ModalMaoDeObra
        isOpen={modalMaoDeObraOpen}
        onClose={() => setModalMaoDeObraOpen(false)}
        nomeObra={obra.local}
        onSave={handleSaveMaoDeObra}
      />
    </div>
  );
}
