import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../components/TabelaSimples";
import ButtonDefault from "../components/ButtonDefault";
import { gerarPDF } from "../services/pdfService";
import { useEffect, useState, useCallback } from "react";
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

  const formatarDataBR = (dataString) => {
    if (!dataString) return "-";
    const [ano, mes, dia] = dataString.split("T")[0].split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const fetchDados = useCallback(async () => {
    try {
      const dados = await api.getObraById(id);
      setObra(dados);
    } catch (err) {
      console.error("Erro ao buscar dados da obra:", err);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      await fetchDados();
    })();
  }, [id, fetchDados]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSaveMaterial = async (dados) => {
    const dataAtual = new Date().toISOString().split("T")[0];

    try {
      await api.addMaterial({
        obra_id: id,
        material: dados.nome, // Mapeia 'nome' do modal para 'material' da API
        quantidade: dados.quantidade,
        data_solicitacao: dataAtual,
      });

      await fetchDados();
      setModalMateriaisOpen(false);
    } catch (err) {
      console.error("Erro ao salvar material:", err);
      alert("Erro ao salvar material. Verifique o console.");
    }
  };

  const handleSaveMaoDeObra = async (dados) => {
    const dataAtual = new Date().toISOString().split("T")[0];

    try {
      await api.addMaoDeObra({
        obra_id: id,
        funcionario: dados.funcionario,
        servico: dados.servico,
        valor_estimado: parseFloat(dados.valor) || 0, // Garante numérico
        data_servico: dataAtual,
      });

      await fetchDados();
      setModalMaoDeObraOpen(false);
    } catch (err) {
      console.error("Erro ao salvar mão de obra:", err);
      alert("Erro ao salvar mão de obra. Verifique o console.");
    }
  };

  if (!obra)
    return <div className="flex justify-center mt-20">Carregando...</div>;

  // Tabelas Individuais
  const dadosMateriais = (obra.materiais || []).map((m) => [
    m.material,
    m.quantidade,
    formatarDataBR(m.data_solicitacao),
  ]);

  const dadosMaoDeObra = (obra.maoDeObra || []).map((m) => [
    m.funcionario,
    `R$ ${m.valor_estimado}`,
    formatarDataBR(m.data_servico),
  ]);

  // Tabela Unificada (Vem direto do banco agora 'relatorio_cliente')
  const dadosRelatorioCliente = (obra.relatorioCliente || []).map((item) => [
    item.descricao,
    item.tipo,
    item.quantidade,
    formatarDataBR(item.data),
    `R$ ${item.valor}`,
  ]);

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
            <h1 className="text-[20px] font-bold uppercase tracking-[2px]">
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
            colunas={["Material", "Quantidade", "Data"]}
            dados={dadosMateriais}
          />

          <TabelaSimples
            titulo="Relatório de Mão de Obra (Interno)"
            colunas={["Profissional", "Valor", "Data"]}
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
                dadosRelatorioCliente, // Usa os dados do banco para o PDF
                obra.local,
              )
            }
            className="w-full max-w-[450px]"
          >
            Gerar PDF para Cliente
          </ButtonDefault>
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
