import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../components/TabelaSimples";
import ButtonDefault from "../components/ButtonDefault";
import { gerarPDF } from "../services/pdfService";
import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../services/api";
import ModalMateriais from "../components/ModalMateriais";
import ModalMaoDeObra from "../components/ModalMaoDeObra";

export default function ObrasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [modalMateriaisOpen, setModalMateriaisOpen] = useState(false);
  const [modalMaoDeObraOpen, setModalMaoDeObraOpen] = useState(false);

  // --- Formatações ---
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

  // --- Buscas ---
  const fetchDados = useCallback(async () => {
    try {
      const dados = await api.getObraById(id);
      setObra(dados);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  }, [id]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const dados = await api.getObraById(id);
        setObra(dados);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      }
    };
    carregarDados();
  }, [id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Ações ---

  // Lógica SIMPLIFICADA para mudar status
  const handleStatusChange = useCallback(
    async (materialId, novoStatus) => {
      // 1. Atualiza visualmente na hora (sem esperar o banco)
      setObra((prev) => ({
        ...prev,
        materiais: prev.materiais.map((m) =>
          m.id === materialId ? { ...m, status: novoStatus } : m,
        ),
      }));

      // 2. Envia para o banco
      try {
        await api.updateMaterialStatus(materialId, novoStatus);
      } catch (err) {
        console.error("Erro ao salvar status:", err);
        // Se der erro, recarrega os dados reais para desfazer a mudança visual
        const dados = await api.getObraById(id);
        setObra(dados);
        alert("Erro de conexão. O status não foi salvo.");
      }
    },
    [id],
  );

  const handleSaveMaterial = async (dados) => {
    const dataAtual = new Date().toISOString().split("T")[0];
    try {
      setModalMateriaisOpen(false);

      await api.addMaterial({
        obra_id: id,
        material: dados.material,
        quantidade: `${dados.quantidade} ${dados.unidade || "Un."}`,

        data_solicitacao: dataAtual,
      });

      // Atualiza a lista
      await fetchDados();
    } catch (err) {
      console.error("Erro ao salvar material:", err);
      alert("Erro ao salvar material. Tente novamente.");
    }
  };

  const handleSaveMaoDeObra = async (dados) => {
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
      console.error("Erro ao salvar mão de obra:", err);
      alert("Erro ao salvar mão de obra.");
    }
  };

  // --- Tabelas Memoizadas (Para performance, mas com lógica simples) ---
  const dadosMateriais = useMemo(() => {
    if (!obra?.materiais) return [];
    return obra.materiais.map((m) => [
      m.material,
      m.quantidade,
      <select
        key={m.id} // Key importante para o React não se perder
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
    if (!obra?.maoDeObra) return [];
    return obra.maoDeObra.map((m) => [
      m.tipo,
      m.profissional,
      `R$ ${formatarMoeda(m.valor)}`,
      formatarDataBR(m.data_solicitacao),
    ]);
  }, [obra]);

  const dadosRelatorioCliente = useMemo(() => {
    if (!obra?.relatorioCliente) return [];
    return obra.relatorioCliente.map((item) => [
      item.descricao,
      item.tipo,
      item.quantidade,
      formatarDataBR(item.data),
      `R$ ${formatarMoeda(item.valor)}`,
    ]);
  }, [obra]);

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

        <div className="flex flex-col gap-10">
          <TabelaSimples
            titulo="Relatório de Materiais (Interno)"
            colunas={["Material", "Quantidade", "Status", "Data"]}
            dados={dadosMateriais}
          />

          <TabelaSimples
            titulo="Relatório de Mão de Obra (Interno)"
            colunas={["Serviço", "Profissional", "Valor", "Data"]}
            dados={dadosMaoDeObra}
          />
        </div>

        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
          <TabelaSimples
            titulo="Relatório Consolidado (Cliente)"
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
      </main>

      {/* VERIFIQUE SE OS ARQUIVOS ESTÃO NOMEADOS CORRETAMENTE NA PASTA COMPONENTS */}
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
