import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import { useCallback, useState } from "react";
import { api } from "../../services/api";
import ModalMateriais from "../../components/modals/ModalMateriais";
import ModalMaoDeObra from "../../components/modals/ModalMaoDeObra";
import ModalEtapas from "../../components/modals/ModalEtapas";
import Etapas from "../../components/gerais/ObraEtapas";
import ListaEtapas from "../../components/obras/ListaEtapas";
import { useIsMobile } from "./detalhe/hooks/useIsMobile";
import { useObraById } from "./detalhe/hooks/useObraById";
import { useObraFinancialSummary } from "./detalhe/hooks/useObraFinancialSummary";
import { useObrasDetalheTableData } from "./detalhe/hooks/useObrasDetalheTableData";
import ObraDetalheHeader from "./detalhe/components/ObraDetalheHeader";
import ObraDetalheResumoFinanceiro from "./detalhe/components/ObraDetalheResumoFinanceiro";
import ModalRelatorioPrestador from "./detalhe/components/ModalRelatorioPrestador";
import { formatarMoeda } from "./detalhe/utils/formatters";
import {
  gerarPdfExtrato,
  gerarPdfRelatorioMaoDeObraGeral,
  gerarPdfRelatorioPorPrestador,
} from "./detalhe/utils/obraDetalhePdf";

export default function ObrasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obra, setObra, fetchDados } = useObraById(id);
  const isMobile = useIsMobile();
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);

  const [modalEtapasisOpen, setModalEtapasisOpen] = useState(false);
  const [modalMateriaisOpen, setModalMateriaisOpen] = useState(false);
  const [modalMaoDeObraOpen, setModalMaoDeObraOpen] = useState(false);
  const [modalRelatorioPrestadorOpen, setModalRelatorioPrestadorOpen] =
    useState(false);

  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");

  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [buscaExtrato, setBuscaExtrato] = useState("");
  const [sortField, setSortField] = useState("status_financeiro");
  const [sortDirection, setSortDirection] = useState("asc");

  const [sortConfig, setSortConfig] = useState({ campo: null, direcao: "asc" });
  const [sortConfigMdo, setSortConfigMdo] = useState({
    campo: null,
    direcao: "asc",
  });

  const [editandoId, setEditandoId] = useState(null);
  const [editandoMaterial, setEditandoMaterial] = useState({
    id: null,
    campo: null,
  });
  const [editandoMaoDeObra, setEditandoMaoDeObra] = useState({
    id: null,
    campo: null,
  });

  const { totais, dataGrafico, prestadoresUnicos } =
    useObraFinancialSummary(obra);

  const toggleCategoria = (nome) => {
    setCategoriaAtiva((prev) => (prev === nome ? null : nome));
  };

  // Checagem se o projeto é de reforma (para injetar "Demolição")
  const isReforma =
    obra?.clientes?.tipo?.toLowerCase() === "reforma" ||
    obra?.cliente?.tipo?.toLowerCase() === "reforma";

  const handleSortMateriais = (campo) => {
    setSortConfig((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const handleDeleteMaterial = useCallback(
    async (materialId) => {
      if (window.confirm("Tem certeza que deseja excluir este material?")) {
        try {
          await api.deleteMaterial(materialId);
          await fetchDados();
        } catch (err) {
          console.error("Erro ao excluir material:", err);
          alert("Erro ao excluir.");
        }
      }
    },
    [fetchDados],
  );

  const handleStatusChange = useCallback(
    async (materialId, novoStatus) => {
      setObra((prev) => ({
        ...prev,
        materiais: prev.materiais.map((m) =>
          m.id === materialId ? { ...m, status: novoStatus } : m,
        ),
      }));
      try {
        await api.updateMaterialStatus(materialId, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro status material:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const handleSaveEtapas = async (etapasFormatadas) => {
    try {
      await api.updateEtapasObra(obra.id, etapasFormatadas);
      setObra((prev) => ({ ...prev, etapas_selecionadas: etapasFormatadas }));
      setModalEtapasisOpen(false);
    } catch (error) {
      console.error("Erro ao guardar etapas:", error);
      alert("Erro ao guardar as etapas na base de dados.");
    }
  };

  const handleSaveMaterial = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      try {
        await api.addMaterial({
          obra_id: id,
          material: dados.material,
          fornecedor_id: dados.fornecedor_id,
          valor: 0,
          quantidade: `${dados.quantidade} ${dados.unidade || "Un."}`,
          data_solicitacao: dataAtual,
          status_financeiro: "Aguardando pagamento",
        });
        await fetchDados();
        setModalMateriaisOpen(false);
      } catch (err) {
        console.error("Erro ao salvar material:", err);
        alert("Erro ao salvar material.");
      }
    },
    [id, fetchDados],
  );

  const salvarValorMaterial = useCallback(
    async (materialId, novoValor) => {
      const valorFloat = parseFloat(novoValor) || 0;
      setObra((prev) => ({
        ...prev,
        materiais: prev.materiais.map((m) =>
          m.id === materialId ? { ...m, valor: valorFloat } : m,
        ),
      }));
      setEditandoMaterial({ id: null, campo: null });
      try {
        await api.updateMaterialValor(materialId, valorFloat);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar valor material:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const salvarFornecedorMaterial = useCallback(
    async (materialId, novoFornecedorId) => {
      setEditandoMaterial({ id: null, campo: null });
      try {
        await api.updateMaterialFornecedor(materialId, novoFornecedorId);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar fornecedor:", err);
        fetchDados();
      }
    },
    [fetchDados],
  );

  const handleSortMdo = (campo) => {
    setSortConfigMdo((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const handleSortExtrato = useCallback(
    (campo) => {
      if (sortField === campo) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        return;
      }
      setSortField(campo);
      setSortDirection("asc");
    },
    [sortField, sortDirection],
  );

  const handleDeleteMaoDeObra = useCallback(
    async (mdoId) => {
      if (window.confirm("Tem certeza que deseja excluir este registro?")) {
        try {
          await api.deleteMaoDeObra(mdoId);
          await fetchDados();
        } catch (err) {
          console.error("Erro ao excluir mão de obra:", err);
          alert("Erro ao excluir item.");
        }
      }
    },
    [fetchDados],
  );

  const handleSaveMaoDeObra = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      const valorInput = parseFloat(dados.valor) || 0;
      try {
        await api.addMaoDeObra({
          obra_id: id,
          tipo: dados.tipo,
          profissional: dados.profissional,
          prestador_id: dados.prestador_id,
          classe_id: dados.classe_id,
          data_solicitacao: dataAtual,
          valor_cobrado: valorInput,
          valor_orcado: valorInput,
          valor_pago: 0,
        });
        await fetchDados();
        setModalMaoDeObraOpen(false);
      } catch (err) {
        console.error("Erro ao salvar mão de obra:", err);
        alert("Erro ao salvar mão de obra.");
      }
    },
    [id, fetchDados],
  );

  const handleValidarMaoDeObra = useCallback(
    async (item) => {
      if (item.validacao === 1) return;
      setObra((prev) => ({
        ...prev,
        maoDeObra: prev.maoDeObra.map((m) =>
          m.id === item.id ? { ...m, validacao: 1 } : m,
        ),
      }));
      try {
        await api.validarMaoDeObra(item.id, item);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar mão de obra:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const salvarEdicaoMaoDeObra = useCallback(
    async (item, novoValorStr) => {
      const novoValor = parseFloat(novoValorStr) || 0;
      const campoEditado = editandoMaoDeObra.campo;
      const valorOrcadoFinal =
        campoEditado === "orcado" ? novoValor : item.valor_orcado || 0;
      const valorPagoFinal =
        campoEditado === "pago" ? novoValor : item.valor_pago || 0;
      const valorCobradoFinal =
        campoEditado === "cobrado" ? novoValor : item.valor_cobrado || 0;

      setObra((prev) => ({
        ...prev,
        maoDeObra: prev.maoDeObra.map((m) =>
          m.id === item.id
            ? {
                ...m,
                valor_orcado: valorOrcadoFinal,
                valor_pago: valorPagoFinal,
                valor_cobrado: valorCobradoFinal,
                saldo: valorOrcadoFinal - valorPagoFinal,
              }
            : m,
        ),
      }));
      setEditandoMaoDeObra({ id: null, campo: null });

      try {
        await api.updateMaoDeObraFinanceiro(item.id, {
          valor_orcado: valorOrcadoFinal,
          valor_pago: valorPagoFinal,
          valor_cobrado: valorCobradoFinal,
        });
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar financeiro da mão de obra:", err);
        fetchDados();
      }
    },
    [editandoMaoDeObra, fetchDados, setObra],
  );

  const salvarEdicaoMaoDeObraProfissional = useCallback(
    async (mdoId, novoDadoPrestador) => {
      setObra((prev) => ({
        ...prev,
        maoDeObra: prev.maoDeObra.map((m) =>
          m.id === mdoId
            ? {
                ...m,
                profissional: novoDadoPrestador.profissional,
                prestador_id: novoDadoPrestador.prestador_id,
                classe_id: novoDadoPrestador.classe_id,
              }
            : m,
        ),
      }));
      setEditandoMaoDeObra({ id: null, campo: null });
      try {
        await api.updateMaoDeObraPrestador(mdoId, novoDadoPrestador);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar prestador:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const handleGerarRelatorioPorPrestador = (prestador) => {
    if (gerarPdfRelatorioPorPrestador(obra, prestador)) {
      setModalRelatorioPrestadorOpen(false);
    }
  };

  const handleStatusFinanceiroChange = useCallback(
    async (extratoId, novoStatus) => {
      setObra((prev) => ({
        ...prev,
        relatorioExtrato: prev.relatorioExtrato.map((i) =>
          i.id === extratoId ? { ...i, status_financeiro: novoStatus } : i,
        ),
      }));
      try {
        await api.updateExtratoStatusFinanceiro(extratoId, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao mudar status financeiro do extrato:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const salvarValorExtrato = useCallback(
    async (itemId, novoValorStr) => {
      const valorFloat = parseFloat(novoValorStr) || 0;
      setObra((prev) => ({
        ...prev,
        relatorioExtrato: prev.relatorioExtrato.map((i) =>
          i.id === itemId ? { ...i, valor: valorFloat } : i,
        ),
      }));
      setEditandoId(null);
      try {
        await api.updateValorRelatorioExtrato(itemId, valorFloat);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar valor no extrato:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const handleCheckExtrato = useCallback(
    async (item) => {
      const novoStatus = item.validacao === 1 ? 0 : 1;
      setObra((prev) => ({
        ...prev,
        relatorioExtrato: prev.relatorioExtrato.map((i) =>
          i.id === item.id ? { ...i, validacao: novoStatus } : i,
        ),
      }));
      try {
        await api.updateExtratoValidacao(item.id, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar extrato:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const handleCheckAllExtrato = useCallback(
    async (isChecked) => {
      const novoStatus = isChecked ? 1 : 0;
      setObra((prev) => ({
        ...prev,
        relatorioExtrato: prev.relatorioExtrato.map((i) => ({
          ...i,
          validacao: novoStatus,
        })),
      }));
      try {
        await api.updateExtratoValidacaoAll(id, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar todos no extrato:", err);
        fetchDados();
      }
    },
    [id, fetchDados, setObra],
  );

  const handleGerarPDFExtrato = () => {
    gerarPdfExtrato(obra);
  };

  const {
    dadosMateriais,
    dadosMaoDeObra,
    dadosRelatorioExtrato,
    headerExtrato,
  } = useObrasDetalheTableData({
    obra,
    buscaMateriais,
    sortConfig,
    editandoMaterial,
    setEditandoMaterial,
    handleStatusChange,
    salvarValorMaterial,
    salvarFornecedorMaterial,
    handleDeleteMaterial,
    buscaMaoDeObra,
    sortConfigMdo,
    editandoMaoDeObra,
    setEditandoMaoDeObra,
    handleValidarMaoDeObra,
    salvarEdicaoMaoDeObra,
    salvarEdicaoMaoDeObraProfissional,
    handleDeleteMaoDeObra,
    buscaExtrato,
    filtroExtrato,
    sortField,
    sortDirection,
    editandoId,
    setEditandoId,
    salvarValorExtrato,
    handleCheckExtrato,
    handleStatusFinanceiroChange,
    handleCheckAllExtrato,
    handleSortExtrato,
  });

  if (!obra)
    return (
      <div className="flex justify-center mt-20 font-bold text-[#71717A]">
        Carregando Obra...
      </div>
    );

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0] pb-[40px]">
      <ObraDetalheHeader
        navigate={navigate}
        obra={obra}
        isReforma={isReforma}
        isMobile={isMobile}
        onOpenEtapas={() => setModalEtapasisOpen(true)}
        onOpenMateriais={() => setModalMateriaisOpen(true)}
        onOpenMaoDeObra={() => setModalMaoDeObraOpen(true)}
      />
      <main className="w-[90%] mt-[24px]">
        {isMobile && (
          <div className="flex flex-col gap-[12px] mb-[24px]">
            <ButtonDefault onClick={() => setModalEtapasisOpen(true)}>
              + Etapas
            </ButtonDefault>
            <ButtonDefault onClick={() => setModalMateriaisOpen(true)}>
              + Materiais
            </ButtonDefault>
            <ButtonDefault onClick={() => setModalMaoDeObraOpen(true)}>
              + Mão de Obra
            </ButtonDefault>
          </div>
        )}
        <div>
          <ObraDetalheResumoFinanceiro
            totais={totais}
            dataGrafico={dataGrafico}
            categoriaAtiva={categoriaAtiva}
            setCategoriaAtiva={setCategoriaAtiva}
            toggleCategoria={toggleCategoria}
          />

          <div>
            <Etapas
              etapas={obra?.etapas_selecionadas || []}
              isReforma={isReforma}
            />
          </div>

          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1 className="text-[35px] font-bold">Relatório de Materiais</h1>
              <input
                type="text"
                placeholder="Buscar por material ou fornecedor..."
                value={buscaMateriais}
                onChange={(e) => setBuscaMateriais(e.target.value)}
                className={`h-[40px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54] px-[8px] ${isMobile ? "w-full" : "w-[300px]"}`}
              />
            </div>
            <TabelaSimples
              colunas={[
                "Material",
                "Quantidade",
                "Valor Un.",
                "Valor",
                <span
                  key="col-status"
                  className="cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSortMateriais("status")}
                >
                  Status ↕
                </span>,
                <span
                  key="col-forn"
                  className="cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSortMateriais("fornecedor")}
                >
                  Fornecedor ↕
                </span>,
                <span
                  key="col-data"
                  className="cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSortMateriais("data")}
                >
                  Data ↕
                </span>,
                "",
              ]}
              dados={dadosMateriais}
            />
            <div
              className={`flex ${isMobile ? "flex-col h-auto gap-4" : "flex-row h-[42px]"} justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <ButtonDefault
                onClick={() => {}}
                className="w-[90%] max-w-[450px]"
              >
                Relatório Materiais
              </ButtonDefault>
              <div className="w-[90%] h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total Lançado:{" "}
                <span> R$ {formatarMoeda(totais.materiais)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1 className="text-[35px] font-bold">
                Relatório de Mão de Obra
              </h1>
              <input
                type="text"
                placeholder="Buscar serviço ou prestador..."
                value={buscaMaoDeObra}
                onChange={(e) => setBuscaMaoDeObra(e.target.value)}
                className={`h-[40px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54] px-[8px] ${isMobile ? "w-full" : "w-[250px]"}`}
              />
            </div>
            <TabelaSimples
              colunas={[
                "Validação",
                "Serviço",
                <span
                  key="col-prest"
                  className="cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSortMdo("profissional")}
                >
                  Prestador ↕
                </span>,
                "Valor Cobrado",
                "Valor Orçado",
                "Valor Pago",
                "Saldo",
                "Data",
                "",
              ]}
              dados={dadosMaoDeObra}
            />

            <div
              className={`flex ${isMobile ? "flex-col h-auto gap-4" : "flex-row h-auto flex-wrap"} justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <div className="flex gap-2 w-full max-w-[450px] justify-center">
                <ButtonDefault
                  onClick={() =>
                    gerarPdfRelatorioMaoDeObraGeral(obra, buscaMaoDeObra)
                  }
                  className="w-full"
                >
                  Relatório Geral
                </ButtonDefault>
                <ButtonDefault
                  onClick={() => setModalRelatorioPrestadorOpen(true)}
                  className="w-full"
                >
                  Por Prestador
                </ButtonDefault>
              </div>
              <div className="w-full h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total Lançado:{" "}
                <span> R$ {formatarMoeda(totais.maoDeObra)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
            <div
              className={`w-full flex ${isMobile ? "flex-col gap-4" : "flex-row justify-between items-center"}`}
            >
              <h1 className="text-[35px] font-bold">Extrato</h1>
              <div
                className={`flex ${isMobile ? "flex-col gap-[8px] w-full" : "flex-row gap-[8px] items-center"}`}
              >
                <input
                  type="text"
                  placeholder="Buscar no extrato..."
                  value={buscaExtrato}
                  onChange={(e) => setBuscaExtrato(e.target.value)}
                  className={`h-[40px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54] px-[8px] ${isMobile ? "w-full" : "w-[250px]"}`}
                />
                <select
                  value={filtroExtrato}
                  onChange={(e) => setFiltroExtrato(e.target.value)}
                  className={`p-[6px] border border-[#DBDADE] rounded-[8px] h-[40px] text-[#464C54] focus:outline-none text-[14px] cursor-pointer bg-white ${isMobile ? "w-full" : ""}`}
                >
                  <option value="Tudo">Tudo</option>
                  <option value="Materiais">Materiais</option>
                  <option value="Mão de Obra">Mão de Obra</option>
                </select>
              </div>
            </div>
            <TabelaSimples
              colunas={headerExtrato}
              dados={dadosRelatorioExtrato}
            />
            <div
              className={`flex ${isMobile ? "flex-col h-auto gap-4" : "flex-row h-[42px]"} justify-between px-[5%] gap-[20px] text-center w-full box-border items-center`}
            >
              <ButtonDefault
                onClick={handleGerarPDFExtrato}
                className="w-full max-w-[450px]"
              >
                Gerar pedido
              </ButtonDefault>
              <div className="w-full h-[40px] max-w-[450px] border border-[#C4C4C9] rounded-[6px] text-[18px] items-center flex justify-center gap-[4px] p-2">
                Total no Extrato:{" "}
                <span> R$ {formatarMoeda(totais.totalExtrato)}</span>
              </div>
            </div>
          </div>

          <ListaEtapas
            etapas={obra.etapas_selecionadas}
            isReforma={isReforma}
            onUpdateEtapas={async (novasEtapas) => {
              try {
                await api.updateEtapasObra(obra.id, novasEtapas);
                setObra((prev) => ({
                  ...prev,
                  etapas_selecionadas: novasEtapas,
                }));
              } catch (error) {
                console.error(error);
                alert("Erro ao atualizar a etapa");
              }
            }}
          />
        </div>
      </main>

      <ModalEtapas
        isOpen={modalEtapasisOpen}
        onClose={() => setModalEtapasisOpen(false)}
        nomeObra={obra.local}
        onSave={handleSaveEtapas}
        etapasSalvas={obra.etapas_selecionadas || []}
      />
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
      <ModalRelatorioPrestador
        isOpen={modalRelatorioPrestadorOpen}
        onClose={() => setModalRelatorioPrestadorOpen(false)}
        onGenerate={handleGerarRelatorioPorPrestador}
        prestadoresDisponiveis={prestadoresUnicos}
      />
    </div>
  );
}
