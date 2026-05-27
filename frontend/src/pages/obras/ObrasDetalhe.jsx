import { useLocation, useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import ModalMateriais from "../../components/modals/ModalMateriais";
import ModalMaoDeObra from "../../components/modals/ModalMaoDeObra";
import ModalLocacoes from "../../components/modals/ModalLocacoes";
import ModalEtapas from "../../components/modals/ModalEtapas";
import Etapas from "../../components/gerais/ObraEtapas";
import ListaEtapas from "../../components/obras/ListaEtapas";
import DiarioObras from "../../components/obras/DiarioObras";
import ObraDetalhePedidos from "./detalhe/components/ObraDetalhePedidos";
import CronogramaObra from "../../components/obras/CronogramaObra";
import { useObraById } from "./detalhe/hooks/useObraById";
import { useObraFinancialSummary } from "./detalhe/hooks/useObraFinancialSummary";
import { useIsMobile } from "./detalhe/hooks/useIsMobile";
import {
  filtrarExtratoLista,
  useObrasDetalheTableData,
} from "./detalhe/hooks/useObrasDetalheTableData";
import ObraDetalheHeader from "./detalhe/components/ObraDetalheHeader";
import ObraDetalheResumoFinanceiro from "./detalhe/components/ObraDetalheResumoFinanceiro";
import ModalRelatorioPrestador from "./detalhe/components/ModalRelatorioPrestador";
import {
  calcularDataDevolucao,
  formatarMoeda,
} from "./detalhe/utils/formatters";
import {
  gerarPdfExtrato,
  gerarPdfRelatorioLocacoes,
  gerarPdfRelatorioMaoDeObraGeral,
  gerarPdfRelatorioMateriais,
  gerarPdfRelatorioPorPrestador,
} from "./detalhe/utils/obraDetalhePdf.jsx";
import FeedbackModal from "../../components/gerais/FeedbackModal";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import BaseModal from "../../components/gerais/BaseModal";
import BaseButton from "../../components/gerais/BaseButton";
import { useAuth } from "../../contexts/AuthContext";
import { Hammer, Loader2, MessageSquareText, Send } from "lucide-react";

export default function ObrasDetalhe() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile(768);
  const { obra, setObra, fetchDados } = useObraById(id);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [secaoObra, setSecaoObra] = useState("diario_historico");
  const [subRelatorio, setSubRelatorio] = useState("materiais");
  const [subDiarioHistorico, setSubDiarioHistorico] = useState("diario");

  const [modalEtapasisOpen, setModalEtapasisOpen] = useState(false);
  const [modalMateriaisOpen, setModalMateriaisOpen] = useState(false);
  const [modalLocacoesOpen, setModalLocacoesOpen] = useState(false);
  const [modalMaoDeObraOpen, setModalMaoDeObraOpen] = useState(false);
  const [modalRelatorioPrestadorOpen, setModalRelatorioPrestadorOpen] =
    useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    variant: "error",
  });
  const showFeedback = useCallback((message, variant = "error") => {
    setFeedback({ open: true, message, variant });
  }, []);

  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");
  const [historicoObra, setHistoricoObra] = useState([]);
  const [loadingHistoricoObra, setLoadingHistoricoObra] = useState(false);
  const [showNovoHistorico, setShowNovoHistorico] = useState(false);
  const [novaMensagemHistorico, setNovaMensagemHistorico] = useState("");
  const [savingHistoricoObra, setSavingHistoricoObra] = useState(false);

  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [buscaLocacoes, setBuscaLocacoes] = useState("");
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
  const [editandoLocacao, setEditandoLocacao] = useState({
    id: null,
    campo: null,
  });
  const [locacaoParaExcluir, setLocacaoParaExcluir] = useState(null);
  const [materialParaExcluir, setMaterialParaExcluir] = useState(null);
  const [maoDeObraParaExcluir, setMaoDeObraParaExcluir] = useState(null);

  const { totais, dataGrafico, prestadoresUnicos } =
    useObraFinancialSummary(obra);

  const toggleCategoria = (nome) => {
    setCategoriaAtiva((prev) => (prev === nome ? null : nome));
  };

  const isEncarregado = user?.tipo === "encarregado";
  const secoesPermitidas = useMemo(
    () =>
      isEncarregado
        ? [
            { id: "diario_historico", label: "Diário e histórico" },
            { id: "pedidos", label: "Pedidos" },
            { id: "relatorios", label: "Relatórios" },
            { id: "cronograma", label: "Cronograma" },
          ]
        : [
            { id: "diario_historico", label: "Diário e histórico" },
            { id: "pedidos", label: "Pedidos" },
            { id: "relatorios", label: "Relatórios" },
            { id: "resumo", label: "Resumo" },
            { id: "cronograma", label: "Cronograma" },
            { id: "etapas", label: "Etapas" },
          ],
    [isEncarregado],
  );

  // Checagem se o projeto é de reforma (para injetar "Demolição")
  const isReforma =
    obra?.clientes?.tipo?.toLowerCase() === "reforma" ||
    obra?.cliente?.tipo?.toLowerCase() === "reforma";

  useEffect(() => {
    const secaoPadrao = "diario_historico";
    const permitida = secoesPermitidas.some((aba) => aba.id === secaoObra);
    if (!permitida) setSecaoObra(secaoPadrao);
  }, [isEncarregado, secaoObra, secoesPermitidas]);

  useEffect(() => {
    if (location.state?.secao === "pedidos") {
      setSecaoObra("pedidos");
    }
  }, [location.state?.secao]);

  useEffect(() => {
    if (isEncarregado) {
      setSubRelatorio("mao");
    }
  }, [isEncarregado]);

  const handleSortMateriais = (campo) => {
    setSortConfig((prev) => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === "asc" ? "desc" : "asc",
    }));
  };

  const handleDeleteMaterial = useCallback(
    (materialId) => {
      const idStr = String(materialId);
      const alvo = (obra?.materiais || []).find(
        (m) => String(m.id) === idStr,
      );
      setMaterialParaExcluir(alvo ?? { id: materialId, nome: "" });
    },
    [obra],
  );

  const handleConfirmarExclusaoMaterial = async () => {
    if (!materialParaExcluir?.id) return;
    try {
      await api.deleteMaterial(materialParaExcluir.id);
      setMaterialParaExcluir(null);
      await fetchDados();
    } catch (err) {
      console.error("Erro ao excluir material:", err);
      showFeedback("Erro ao excluir.");
      await fetchDados();
    }
  };

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
      showFeedback("Erro ao guardar as etapas na base de dados.");
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
          data_vencimento: dados.data_vencimento || null,
          status_financeiro: "Aguardando pagamento",
        });
        await fetchDados();
        setModalMateriaisOpen(false);
      } catch (err) {
        console.error("Erro ao salvar material:", err);
        showFeedback("Erro ao salvar material.");
      }
    },
    [id, fetchDados, showFeedback],
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

  const salvarDataVencimentoMaterial = useCallback(
    async (materialId, novaDataVencimento) => {
      setObra((prev) => ({
        ...prev,
        materiais: prev.materiais.map((m) =>
          m.id === materialId
            ? { ...m, data_vencimento: novaDataVencimento }
            : m,
        ),
      }));
      setEditandoMaterial({ id: null, campo: null });
      try {
        await api.updateMaterialDataVencimento(materialId, novaDataVencimento);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar data de vencimento:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const salvarDataSolicitacaoMaterial = useCallback(
    async (materialId, novaDataSolicitacao) => {
      if (!novaDataSolicitacao) {
        showFeedback("Informe uma data válida.");
        return;
      }
      setObra((prev) => ({
        ...prev,
        materiais: prev.materiais.map((m) =>
          m.id === materialId
            ? { ...m, data_solicitacao: novaDataSolicitacao }
            : m,
        ),
      }));
      setEditandoMaterial({ id: null, campo: null });
      try {
        await api.updateMaterialDataSolicitacao(
          materialId,
          novaDataSolicitacao,
        );
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar data de lançamento:", err);
        showFeedback("Erro ao atualizar a data de lançamento.");
        fetchDados();
      }
    },
    [fetchDados, setObra, showFeedback],
  );

  const handleSaveLocacao = useCallback(
    async (dados) => {
      const dataAtual = new Date().toISOString().split("T")[0];
      try {
        await api.addLocacao({
          obra_id: id,
          equipamento: dados.equipamento,
          quantidade: dados.quantidade,
          tipo_periodo: dados.tipo_periodo,
          periodo: dados.periodo,
          solicitante: dados.solicitante,
          data_solicitacao: dataAtual,
          data_vencimento: dados.data_vencimento || null,
          valor: 0,
        });
        await fetchDados();
        setModalLocacoesOpen(false);
      } catch (err) {
        console.error("Erro ao salvar locação:", err);
        showFeedback(err?.message || "Erro ao salvar locação.");
        throw err;
      }
    },
    [id, fetchDados, showFeedback],
  );

  const handleStatusChangeLocacao = useCallback(
    async (locacaoId, novoStatus) => {
      setObra((prev) => ({
        ...prev,
        locacoes: (prev.locacoes || []).map((l) =>
          l.id === locacaoId ? { ...l, status: novoStatus } : l,
        ),
      }));
      try {
        await api.updateLocacaoStatus(locacaoId, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro status locação:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const salvarValorLocacao = useCallback(
    async (locacaoId, novoValor) => {
      const valorFloat = parseFloat(novoValor) || 0;
      setObra((prev) => ({
        ...prev,
        locacoes: (prev.locacoes || []).map((l) =>
          l.id === locacaoId ? { ...l, valor: valorFloat } : l,
        ),
      }));
      setEditandoLocacao({ id: null, campo: null });
      try {
        await api.updateLocacaoValor(locacaoId, valorFloat);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar valor locação:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const salvarSolicitanteLocacao = useCallback(
    async (locacaoId, novoSolicitante) => {
      const solicitante = String(novoSolicitante ?? "").trim();
      if (!solicitante) {
        setEditandoLocacao({ id: null, campo: null });
        return;
      }
      setObra((prev) => ({
        ...prev,
        locacoes: (prev.locacoes || []).map((l) =>
          l.id === locacaoId ? { ...l, solicitante } : l,
        ),
      }));
      setEditandoLocacao({ id: null, campo: null });
      try {
        await api.updateLocacaoSolicitante(locacaoId, solicitante);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar solicitante da locação:", err);
        fetchDados();
      }
    },
    [fetchDados, setObra],
  );

  const salvarDataColetaLocacao = useCallback(
    async (locacaoId, novaDataColeta) => {
      const locacaoAtual = (obra?.locacoes || []).find(
        (l) => l.id === locacaoId,
      );
      const novaDataVencimento = locacaoAtual
        ? calcularDataDevolucao(
            novaDataColeta,
            locacaoAtual.periodo,
            locacaoAtual.tipo_periodo,
          )
        : null;

      setObra((prev) => ({
        ...prev,
        locacoes: (prev.locacoes || []).map((l) =>
          l.id === locacaoId
            ? {
                ...l,
                data_coleta: novaDataColeta,
                data_vencimento: novaDataVencimento ?? l.data_vencimento,
              }
            : l,
        ),
      }));
      setEditandoLocacao({ id: null, campo: null });
      try {
        await api.updateLocacaoDataColeta(
          locacaoId,
          novaDataColeta,
          novaDataVencimento,
        );
        await fetchDados();
      } catch (err) {
        console.error("Erro ao atualizar data de coleta da locação:", err);
        fetchDados();
      }
    },
    [obra, fetchDados, setObra],
  );

  const handleDeleteLocacao = useCallback(
    (locacaoId) => {
      const idStr = String(locacaoId);
      const alvo = (obra?.locacoes || []).find(
        (l) => String(l.id) === idStr,
      );
      setLocacaoParaExcluir(
        alvo ?? { id: locacaoId, equipamento: "" },
      );
    },
    [obra],
  );

  const handleConfirmarExclusaoLocacao = async () => {
    if (!locacaoParaExcluir?.id) return;
    try {
      await api.deleteLocacao(locacaoParaExcluir.id);
      setLocacaoParaExcluir(null);
      await fetchDados();
    } catch (err) {
      console.error("Erro ao excluir locação:", err);
      showFeedback("Erro ao excluir locação.");
      await fetchDados();
    }
  };

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
    (mdoId) => {
      const idStr = String(mdoId);
      const alvo = (obra?.maoDeObra || []).find(
        (m) => String(m.id) === idStr,
      );
      setMaoDeObraParaExcluir(
        alvo ?? { id: mdoId, profissional: "", tipo: "" },
      );
    },
    [obra],
  );

  const handleConfirmarExclusaoMaoDeObra = async () => {
    if (!maoDeObraParaExcluir?.id) return;
    try {
      await api.deleteMaoDeObra(maoDeObraParaExcluir.id);
      setMaoDeObraParaExcluir(null);
      await fetchDados();
    } catch (err) {
      console.error("Erro ao excluir mão de obra:", err);
      showFeedback("Erro ao excluir item.");
      await fetchDados();
    }
  };

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
        showFeedback("Erro ao salvar mão de obra.");
      }
    },
    [id, fetchDados, showFeedback],
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

  const handleValidarLocacao = useCallback(
    async (item) => {
      if (item.validacao === 1) return;
      setObra((prev) => ({
        ...prev,
        locacoes: (prev.locacoes || []).map((l) =>
          l.id === item.id ? { ...l, validacao: 1 } : l,
        ),
      }));
      try {
        await api.validarLocacao(item.id, item);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar locação:", err);
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

  const abrirPdfPreview = useCallback(
    ({ titulo, gerador, nomeFallback = "documento.pdf" }) => {
      setPdfPreview({ titulo, gerador, nomeFallback });
    },
    [],
  );

  const handleGerarRelatorioPorPrestador = (prestador) => {
    const lista = obra?.maoDeObra?.filter(
      (m) => m.profissional?.toLowerCase() === prestador.toLowerCase(),
    );
    if (!lista || lista.length === 0) {
      showFeedback("Nenhum registro encontrado para este prestador.", "info");
      return;
    }
    setModalRelatorioPrestadorOpen(false);
    abrirPdfPreview({
      titulo: `Mão de Obra · ${prestador}`,
      gerador: () =>
        gerarPdfRelatorioPorPrestador(obra, prestador, { retornarBlob: true }),
      nomeFallback: `Relatorio_${prestador}.pdf`,
    });
  };

  const handleGerarRelatorioMaoDeObraGeral = () => {
    abrirPdfPreview({
      titulo: "Relatório de Mão de Obra",
      gerador: () =>
        gerarPdfRelatorioMaoDeObraGeral(obra, buscaMaoDeObra, {
          retornarBlob: true,
        }),
      nomeFallback: "Relatorio_Mao_De_Obra_Geral.pdf",
    });
  };

  const handleGerarRelatorioMateriais = () => {
    const lista = obra?.materiais || [];
    if (lista.length === 0) {
      showFeedback("Nenhum material lançado nesta obra.", "info");
      return;
    }
    abrirPdfPreview({
      titulo: "Relatório de Materiais",
      gerador: () =>
        gerarPdfRelatorioMateriais(obra, buscaMateriais, {
          retornarBlob: true,
        }),
      nomeFallback: "Relatorio_Materiais.pdf",
    });
  };

  const handleGerarRelatorioLocacoes = () => {
    const lista = obra?.locacoes || [];
    if (lista.length === 0) {
      showFeedback("Nenhuma locação lançada nesta obra.", "info");
      return;
    }
    abrirPdfPreview({
      titulo: "Relatório de Locações",
      gerador: () =>
        gerarPdfRelatorioLocacoes(obra, buscaLocacoes, {
          retornarBlob: true,
        }),
      nomeFallback: "Relatorio_Locacoes.pdf",
    });
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
      const lista = filtrarExtratoLista(
        obra?.relatorioExtrato,
        buscaExtrato,
        filtroExtrato,
      );
      const ids = lista.map((i) => i.id);
      if (ids.length === 0) return;

      setObra((prev) => ({
        ...prev,
        relatorioExtrato: (prev.relatorioExtrato || []).map((i) =>
          ids.includes(i.id) ? { ...i, validacao: novoStatus } : i,
        ),
      }));
      try {
        await api.updateExtratoValidacaoInIds(ids, novoStatus);
        await fetchDados();
      } catch (err) {
        console.error("Erro ao validar todos no extrato:", err);
        fetchDados();
      }
    },
    [obra?.relatorioExtrato, buscaExtrato, filtroExtrato, fetchDados, setObra],
  );

  const handleGerarPDFExtrato = () => {
    const itens =
      obra?.relatorioExtrato?.filter((i) => i.validacao === 1) || [];
    if (itens.length === 0) {
      showFeedback("Nenhum item selecionado para o extrato.", "info");
      return;
    }
    abrirPdfPreview({
      titulo: "Extrato Financeiro",
      gerador: () => gerarPdfExtrato(obra, { retornarBlob: true }),
      nomeFallback: "Extrato.pdf",
    });
  };

  const formatarDataHoraBR = (dataString) => {
    if (!dataString) return "-";
    const data = new Date(dataString);
    if (Number.isNaN(data.getTime())) return "-";
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const carregarHistoricoObra = useCallback(async () => {
    if (!obra?.id) return;
    setLoadingHistoricoObra(true);
    try {
      const rows = await api.getObraHistorico(obra.id, {
        isClienteView: false,
      });
      setHistoricoObra(rows || []);
    } catch (error) {
      console.error(error);
      setHistoricoObra([]);
    } finally {
      setLoadingHistoricoObra(false);
    }
  }, [obra?.id]);

  useEffect(() => {
    if (!obra?.id) return;
    void carregarHistoricoObra();
  }, [obra?.id, carregarHistoricoObra]);

  const handleAdicionarHistorico = async () => {
    const mensagem = novaMensagemHistorico.trim();
    if (!mensagem || !obra?.id || !user?.id) return;
    setSavingHistoricoObra(true);
    try {
      await api.addObraHistorico({
        obra_id: obra.id,
        author_id: user.id,
        author_nome: user.nome || "Equipe Montezuma",
        mensagem,
      });
      setNovaMensagemHistorico("");
      setShowNovoHistorico(false);
      await carregarHistoricoObra();
    } catch (error) {
      console.error(error);
      showFeedback("Erro ao adicionar histórico.");
    } finally {
      setSavingHistoricoObra(false);
    }
  };

  const {
    dadosMateriais,
    dadosLocacoes,
    dadosMaoDeObra,
    dadosRelatorioExtrato,
    headerExtrato,
    totaisExtratoSelecionados,
  } = useObrasDetalheTableData({
    obra,
    buscaMateriais,
    sortConfig,
    editandoMaterial,
    setEditandoMaterial,
    handleStatusChange,
    salvarValorMaterial,
    salvarFornecedorMaterial,
    salvarDataVencimentoMaterial,
    salvarDataSolicitacaoMaterial,
    handleDeleteMaterial,
    buscaLocacoes,
    editandoLocacao,
    setEditandoLocacao,
    handleStatusChangeLocacao,
    salvarValorLocacao,
    salvarSolicitanteLocacao,
    salvarDataColetaLocacao,
    handleDeleteLocacao,
    handleValidarLocacao,
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
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-[5%] py-12">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-primary/35 bg-white px-8 py-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-primary/[0.07]"
            aria-hidden
          />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
              <Hammer className="h-6 w-6" strokeWidth={2} />
            </div>
            <Loader2
              className="mx-auto mb-4 h-9 w-9 animate-spin text-accent-primary"
              strokeWidth={2.25}
              aria-hidden
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              Obra
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              Carregando detalhes
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-text-muted">
              Sincronizando materiais, etapas e financeiro deste projeto.
            </p>
            <div
              className="mx-auto mt-6 flex justify-center gap-1.5"
              aria-hidden
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-accent-primary/75"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  const inputPremium =
    "box-border min-h-11 h-11 w-full min-w-0 shrink-0 rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-muted focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

  const selectPremium =
    "box-border min-h-11 h-11 w-full min-w-0 shrink-0 cursor-pointer rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

  const btnOutlinePremium =
    "!h-11 !w-full !cursor-pointer !rounded-xl !border !border-border-primary/50 !bg-white !px-4 !text-sm !font-semibold !text-text-primary !shadow-sm transition-all hover:!-translate-y-0.5 hover:!border-accent-primary/35 hover:!shadow-md focus:!outline-none focus:!ring-2 focus:!ring-accent-primary/25 active:!translate-y-0 disabled:!cursor-not-allowed sm:!w-auto";

  const btnAccentPremium =
    "!h-11 !cursor-pointer !rounded-xl !border !border-accent-primary !bg-accent-primary !px-4 !text-sm !font-semibold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!-translate-y-0.5 hover:!bg-accent-primary-dark hover:!shadow-lg focus:!outline-none focus:!ring-2 focus:!ring-accent-primary/35 focus:!ring-offset-2 active:!translate-y-0 disabled:!cursor-not-allowed";

  const reportCardShell =
    "w-full max-w-full overflow-hidden rounded-2xl border border-border-primary/35 bg-white px-4 py-5 shadow-[0_5px_20px_rgba(0,0,0,0.08)] sm:px-6 sm:py-6";

  const totalBarClass =
    "flex min-h-[44px] w-full flex-wrap items-center justify-center gap-1 rounded-xl border border-border-primary/40 bg-[#FAFAFA] px-4 py-3 text-center text-base font-semibold text-text-primary shadow-inner ring-1 ring-black/[0.04]";

  return (
    <div className="flex min-h-screen flex-col items-center overflow-x-hidden bg-[#FAFAFA] pb-10">
      <ObraDetalheHeader
        navigate={navigate}
        obra={obra}
        isReforma={isReforma}
        isMobile={isMobile}
        isEncarregado={isEncarregado}
        onNovoMaterial={() => setModalMateriaisOpen(true)}
        onNovaMaoDeObra={() => setModalMaoDeObraOpen(true)}
      />
      <main className="mt-3 w-full px-[5%] sm:mt-4">
        <nav
          className="mb-4 w-full tracking-tight"
          aria-label="Secções da obra"
        >
          <div
            className={`inline-flex max-w-full rounded-2xl border border-border-primary/30 bg-white p-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.03] ${isMobile ? "flex w-full flex-col gap-1" : "flex flex-wrap gap-1"}`}
          >
            {secoesPermitidas.map((aba) => {
              const ativa = secaoObra === aba.id;
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => {
                    setSecaoObra(aba.id);
                    if (aba.id === "relatorios") {
                      setSubRelatorio(isEncarregado ? "mao" : "materiais");
                    }
                    if (aba.id === "diario_historico") {
                      setSubDiarioHistorico("diario");
                    }
                  }}
                  className={[
                    "min-h-[2.75rem] cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition-all sm:min-h-[2.25rem] sm:text-sm",
                    isMobile ? "w-full" : "",
                    ativa
                      ? "bg-accent-primary text-white shadow-md shadow-accent-primary/25"
                      : "text-text-muted hover:bg-[#FAFAFA] hover:text-text-primary",
                  ].join(" ")}
                >
                  {aba.label}
                </button>
              );
            })}
          </div>
        </nav>

        {secaoObra === "resumo" && !isEncarregado && (
          <div className="mb-6 w-full">
            <div className="mt-0 w-full">
              <ObraDetalheResumoFinanceiro
                totais={totais}
                dataGrafico={dataGrafico}
                categoriaAtiva={categoriaAtiva}
                setCategoriaAtiva={setCategoriaAtiva}
                toggleCategoria={toggleCategoria}
              />
            </div>
            <div className="mt-6 w-full">
              <Etapas
                etapas={obra?.etapas_selecionadas || []}
                isReforma={isReforma}
              />
            </div>
          </div>
        )}

        {secaoObra === "diario_historico" && (
          <div className="mb-6 w-full">
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {[
                {
                  id: "diario",
                  label: "Diário de obra",
                  sub: "Registros diários no canteiro",
                },
                {
                  id: "historico",
                  label: "Histórico para o cliente",
                  sub: "Atualizações visíveis ao cliente",
                },
              ].map((opt) => {
                const on = subDiarioHistorico === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSubDiarioHistorico(opt.id)}
                    className={[
                      "flex w-full cursor-pointer flex-col items-start gap-1 rounded-2xl border p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all sm:p-5",
                      on
                        ? "border-accent-primary/45 bg-white ring-2 ring-accent-primary/20"
                        : "border-border-primary/35 bg-white hover:-translate-y-0.5 hover:border-accent-primary/25 hover:shadow-md",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "text-sm font-bold tracking-tight",
                        on ? "text-accent-primary" : "text-text-primary",
                      ].join(" ")}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs leading-snug tracking-tight text-text-muted">
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {subDiarioHistorico === "diario" && (
              <div className="w-full">
                <DiarioObras obraId={id} />
              </div>
            )}

            {subDiarioHistorico === "historico" && (
              <div className="rounded-2xl border border-border-primary/35 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.08)] sm:p-6">
                <div
                  className={`mb-4 flex gap-4 ${isMobile ? "flex-col" : "flex-row flex-wrap items-center justify-between"}`}
                >
                  <h3 className="text-base font-bold tracking-tight text-text-primary sm:text-lg">
                    Histórico da obra
                  </h3>
                  {!isEncarregado ? (
                    <ButtonDefault
                      type="button"
                      onClick={() => setShowNovoHistorico((prev) => !prev)}
                      className={`${btnOutlinePremium} !min-w-0`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <MessageSquareText className="h-4 w-4 shrink-0" />
                        {showNovoHistorico ? "Fechar" : "Novo lançamento"}
                      </span>
                    </ButtonDefault>
                  ) : null}
                </div>

                {!isEncarregado && showNovoHistorico ? (
                  <div className="mb-4 rounded-2xl border border-border-primary/35 bg-[#FAFAFA] p-4 shadow-inner">
                    <textarea
                      value={novaMensagemHistorico}
                      onChange={(e) => setNovaMensagemHistorico(e.target.value)}
                      rows={5}
                      placeholder="Adicionar atualização para o cliente..."
                      className={`${inputPremium} min-h-[132px] resize-y`}
                    />
                    <div
                      className={`mt-3 flex ${isMobile ? "justify-stretch" : "justify-end"}`}
                    >
                      <ButtonDefault
                        type="button"
                        onClick={handleAdicionarHistorico}
                        disabled={
                          savingHistoricoObra || !novaMensagemHistorico.trim()
                        }
                        className={`${btnAccentPremium} !w-full`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Send className="h-4 w-4 shrink-0" />
                          Publicar
                        </span>
                      </ButtonDefault>
                    </div>
                  </div>
                ) : null}

                {loadingHistoricoObra ? (
                  <p className="text-sm font-medium text-text-muted">
                    Carregando histórico...
                  </p>
                ) : historicoObra.length === 0 ? (
                  <p className="text-sm text-text-muted">
                    Nenhum lançamento de histórico.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {historicoObra.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-border-primary/30 bg-[#FAFAFA] p-4 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                            {item.author_nome || "Equipe Montezuma"}
                          </p>
                          <p className="text-xs font-medium text-text-muted">
                            {formatarDataHoraBR(item.created_at)}
                          </p>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-primary">
                          {item.mensagem}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {secaoObra === "pedidos" && (
          <div className="mb-6 w-full">
            <ObraDetalhePedidos obraId={id} />
          </div>
        )}

        {secaoObra === "cronograma" && (
          <div className="mb-4 w-full">
            <CronogramaObra
              etapas={obra?.etapas_selecionadas || []}
              obraId={id}
              showLancarButton
            />
          </div>
        )}

        {secaoObra === "relatorios" && (
          <div className="mb-4 w-full">
            {!isEncarregado && (
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                {[
                  {
                    id: "materiais",
                    label: "Materiais",
                    sub: "Compras e fornecedores",
                  },
                  {
                    id: "mao",
                    label: "Mão de Obra",
                    sub: "Serviços e prestadores",
                  },
                  {
                    id: "locacoes",
                    label: "Locações",
                    sub: "Equipamentos e ferramentas",
                  },
                  {
                    id: "extrato",
                    label: "Extrato financeiro",
                    sub: "Movimentação consolidada",
                  },
                ].map((opt) => {
                  const on = subRelatorio === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSubRelatorio(opt.id)}
                      className={[
                        "flex w-full cursor-pointer flex-col items-start gap-1 rounded-2xl border p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all sm:p-5",
                        on
                          ? "border-accent-primary/45 bg-white ring-2 ring-accent-primary/20"
                          : "border-border-primary/35 bg-white hover:-translate-y-0.5 hover:border-accent-primary/25 hover:shadow-md",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "text-sm font-bold tracking-tight",
                          on ? "text-accent-primary" : "text-text-primary",
                        ].join(" ")}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs leading-snug tracking-tight text-text-muted">
                        {opt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {subRelatorio === "materiais" && !isEncarregado && (
              <div>
                <div
                  className={`${reportCardShell} flex flex-col items-stretch gap-5 text-left sm:gap-6`}
                >
                  <div
                    className={`flex w-full gap-4 ${isMobile ? "flex-col" : "flex-col lg:flex-row lg:items-start lg:justify-between"}`}
                  >
                    <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl lg:text-3xl">
                      Relatório de Materiais
                    </h1>
                    <div
                      className={`flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end`}
                    >
                      <input
                        type="text"
                        placeholder="Buscar por material ou fornecedor..."
                        value={buscaMateriais}
                        onChange={(e) => setBuscaMateriais(e.target.value)}
                        className={`${inputPremium} lg:max-w-[400px] lg:min-w-0 lg:flex-1`}
                      />
                      <ButtonDefault
                        type="button"
                        onClick={() => setModalMateriaisOpen(true)}
                        className={`${btnAccentPremium} shrink-0 lg:!w-auto`}
                      >
                        Novo material
                      </ButtonDefault>
                    </div>
                  </div>
                  <TabelaSimples
                    variant="obraDetalhe"
                    dense
                    colunas={[
                      "Material",
                      "Quantidade",
                      "Valor Un.",
                      "Valor",
                      <span
                        key="col-status"
                        className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
                        onClick={() => handleSortMateriais("status")}
                      >
                        Status ↕
                      </span>,
                      <span
                        key="col-forn"
                        className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
                        onClick={() => handleSortMateriais("fornecedor")}
                      >
                        Fornecedor ↕
                      </span>,
                      <span
                        key="col-data"
                        className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
                        onClick={() => handleSortMateriais("data")}
                      >
                        Data ↕
                      </span>,
                      "Vencimento",
                      "",
                    ]}
                    dados={dadosMateriais}
                  />
                  <div
                    className={`flex w-full flex-col items-stretch justify-between gap-4 sm:items-center md:flex-row md:flex-wrap md:justify-center`}
                  >
                    <ButtonDefault
                      onClick={handleGerarRelatorioMateriais}
                      className={`${btnAccentPremium} !w-full`}
                    >
                      Relatório Materiais
                    </ButtonDefault>
                    <div className={totalBarClass}>
                      <span className="text-text-muted">Total lançado:</span>
                      <span className="font-bold tabular-nums text-text-primary">
                        R$ {formatarMoeda(totais.materiais)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {subRelatorio === "mao" && (
              <div>
                <div
                  className={`${reportCardShell} mt-3 flex flex-col items-stretch gap-5 text-left sm:mt-4 sm:gap-6`}
                >
                  <div
                    className={`flex w-full gap-4 ${isMobile ? "flex-col" : "flex-col lg:flex-row lg:items-start lg:justify-between"}`}
                  >
                    <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl lg:text-3xl">
                      Relatório de Mão de Obra
                    </h1>
                    <div
                      className={`flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end`}
                    >
                      <input
                        type="text"
                        placeholder="Buscar serviço ou prestador..."
                        value={buscaMaoDeObra}
                        onChange={(e) => setBuscaMaoDeObra(e.target.value)}
                        className={`${inputPremium} lg:max-w-[400px] lg:min-w-0 lg:flex-1`}
                      />
                      <ButtonDefault
                        type="button"
                        onClick={() => setModalMaoDeObraOpen(true)}
                        className={`${btnAccentPremium} shrink-0 lg:!w-auto`}
                      >
                        Nova mão de obra
                      </ButtonDefault>
                    </div>
                  </div>
                  <TabelaSimples
                    variant="obraDetalhe"
                    dense
                    colunas={[
                      "Validação",
                      <span
                        key="col-serv"
                        className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
                        onClick={() => handleSortMdo("tipo")}
                      >
                        Serviço ↕
                      </span>,
                      <span
                        key="col-prest"
                        className="cursor-pointer select-none text-text-muted transition-colors hover:text-accent-primary"
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
                    className={`flex w-full flex-col items-stretch gap-4 md:flex-row md:flex-wrap md:items-center md:justify-center`}
                  >
                    {!isEncarregado && (
                      <div
                        className={`flex w-full flex-col gap-3 sm:flex-row sm:justify-center`}
                      >
                        <ButtonDefault
                          onClick={handleGerarRelatorioMaoDeObraGeral}
                          className={`${btnOutlinePremium} sm:!flex-1`}
                        >
                          Relatório Geral
                        </ButtonDefault>
                        <ButtonDefault
                          onClick={() => setModalRelatorioPrestadorOpen(true)}
                          className={`${btnOutlinePremium} sm:!flex-1`}
                        >
                          Por Prestador
                        </ButtonDefault>
                      </div>
                    )}
                    <div className={totalBarClass}>
                      <span className="text-text-muted">Total lançado:</span>
                      <span className="font-bold tabular-nums text-text-primary">
                        R$ {formatarMoeda(totais.maoDeObra)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {subRelatorio === "locacoes" && (
              <div
                className={`${reportCardShell} mt-3 flex flex-col items-stretch gap-5 text-left sm:mt-4 sm:gap-6`}
              >
                <div
                  className={`flex w-full gap-4 ${isMobile ? "flex-col" : "flex-col lg:flex-row lg:items-start lg:justify-between"}`}
                >
                  <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl lg:text-3xl">
                    Relatório de Locações
                  </h1>
                  <div
                    className={`flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-end`}
                  >
                    <input
                      type="text"
                      placeholder="Buscar equipamento ou locatário..."
                      value={buscaLocacoes}
                      onChange={(e) => setBuscaLocacoes(e.target.value)}
                      className={`${inputPremium} lg:max-w-[400px] lg:min-w-0 lg:flex-1`}
                    />
                    <ButtonDefault
                      type="button"
                      onClick={() => setModalLocacoesOpen(true)}
                      className={`${btnAccentPremium} shrink-0 lg:!w-auto`}
                    >
                      Nova Locação
                    </ButtonDefault>
                  </div>
                </div>
                <TabelaSimples
                  variant="obraDetalhe"
                  dense
                  colunas={[
                    "Validação",
                    "Descrição",
                    "Quantidade",
                    "Período",
                    "Solicitante",
                    "Fornecedor",
                    "Valor Unitário",
                    "Valor Total",
                    "Status",
                    "Data de Coleta",
                    "Data de Devolução",
                    " ",
                  ]}
                  dados={dadosLocacoes}
                />
                <div
                  className={`flex w-full flex-col items-stretch justify-between gap-4 sm:items-center md:flex-row md:flex-wrap md:justify-center`}
                >
                  <ButtonDefault
                    onClick={handleGerarRelatorioLocacoes}
                    className={`${btnAccentPremium} !w-full`}
                  >
                    Relatório Locações
                  </ButtonDefault>
                  <div className={totalBarClass}>
                    <span className="text-text-muted">Total lançado:</span>
                    <span className="font-bold tabular-nums text-text-primary">
                      R$ {formatarMoeda(totais.locacoes)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {subRelatorio === "extrato" && !isEncarregado && (
              <div>
                <div
                  className={`${reportCardShell} mt-3 flex flex-col items-stretch gap-5 text-left sm:mt-4 sm:gap-6`}
                >
                  <div
                    className={`flex w-full gap-4 ${isMobile ? "flex-col" : "flex-col lg:flex-row lg:items-start lg:justify-between"}`}
                  >
                    <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl lg:text-3xl">
                      Extrato
                    </h1>
                    <div
                      className={`flex w-auto min-w-0 flex-col gap-3 lg:flex-row lg:items-center`}
                    >
                      <input
                        type="text"
                        placeholder="Buscar no extrato..."
                        value={buscaExtrato}
                        onChange={(e) => setBuscaExtrato(e.target.value)}
                        className={`${inputPremium} lg:max-w-[400px] lg:min-w-0 lg:flex-1`}
                      />
                      <select
                        value={filtroExtrato}
                        onChange={(e) => setFiltroExtrato(e.target.value)}
                        className={`${selectPremium} w-full lg:w-auto lg:min-w-[200px]`}
                      >
                        <option value="Tudo">Tudo</option>
                        <option value="Materiais">Materiais</option>
                        <option value="Mão de Obra">Mão de Obra</option>
                        <option value="Locações">Locações</option>
                      </select>
                    </div>
                  </div>
                  <TabelaSimples
                    variant="obraDetalhe"
                    dense
                    colunas={headerExtrato}
                    dados={dadosRelatorioExtrato}
                  />
                  <div className="flex w-full flex-col gap-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className={totalBarClass}>
                        <span className="text-text-muted">
                          Total no extrato:
                        </span>
                        <span className="font-bold tabular-nums text-text-primary">
                          R$ {formatarMoeda(totais.totalExtrato)}
                        </span>
                      </div>
                      <div className={totalBarClass}>
                        <span className="text-text-muted">
                          Materiais selecionados:
                        </span>
                        <span className="font-bold tabular-nums text-text-primary">
                          R${" "}
                          {formatarMoeda(totaisExtratoSelecionados.materiais)}
                        </span>
                      </div>
                      <div className={totalBarClass}>
                        <span className="text-text-muted">
                          Mão de obra selecionada:
                        </span>
                        <span className="font-bold tabular-nums text-text-primary">
                          R${" "}
                          {formatarMoeda(totaisExtratoSelecionados.maoDeObra)}
                        </span>
                      </div>
                      <div
                        className={`${totalBarClass} border-accent-primary/25 bg-accent-primary/[0.06] ring-accent-primary/15`}
                      >
                        <span className="text-text-muted">
                          Todos selecionados:
                        </span>
                        <span className="font-bold tabular-nums text-accent-primary">
                          R$ {formatarMoeda(totaisExtratoSelecionados.todos)}
                        </span>
                      </div>
                    </div>
                    <ButtonDefault
                      onClick={handleGerarPDFExtrato}
                      className={`${btnAccentPremium} !w-full`}
                    >
                      Gerar pedido
                    </ButtonDefault>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {secaoObra === "etapas" && !isEncarregado && (
          <div className="w-full">
            <ListaEtapas
              etapas={obra.etapas_selecionadas}
              isReforma={isReforma}
              headerAction={
                <ButtonDefault
                  type="button"
                  onClick={() => setModalEtapasisOpen(true)}
                  className={`${btnAccentPremium} !whitespace-nowrap`}
                >
                  Nova etapa
                </ButtonDefault>
              }
              onUpdateEtapas={async (novasEtapas) => {
                try {
                  await api.updateEtapasObra(obra.id, novasEtapas);
                  setObra((prev) => ({
                    ...prev,
                    etapas_selecionadas: novasEtapas,
                  }));
                } catch (error) {
                  console.error(error);
                  showFeedback("Erro ao atualizar a etapa");
                }
              }}
            />
          </div>
        )}
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
      <ModalLocacoes
        isOpen={modalLocacoesOpen}
        onClose={() => setModalLocacoesOpen(false)}
        nomeObra={obra.local}
        nomeCliente={obra.clientes}
        onSave={handleSaveLocacao}
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
      <PdfPreviewModal
        isOpen={Boolean(pdfPreview)}
        onClose={() => setPdfPreview(null)}
        titulo={pdfPreview?.titulo}
        gerador={pdfPreview?.gerador}
        nomeFallback={pdfPreview?.nomeFallback}
      />
      <FeedbackModal
        isOpen={feedback.open}
        onClose={() => setFeedback((f) => ({ ...f, open: false, message: "" }))}
        message={feedback.message}
        variant={feedback.variant}
      />
      <BaseModal
        isOpen={Boolean(materialParaExcluir)}
        onClose={() => setMaterialParaExcluir(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/70 to-white p-4 shadow-[0_5px_18px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700/80">
            Atenção
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Tem certeza que deseja excluir o material{" "}
            <span className="font-semibold text-text-primary">
              {materialParaExcluir?.material || "selecionado"}
            </span>
            ? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="ghost"
            onClick={() => setMaterialParaExcluir(null)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={handleConfirmarExclusaoMaterial}
            className="w-full sm:w-auto"
          >
            Confirmar Exclusão
          </BaseButton>
        </div>
      </BaseModal>
      <BaseModal
        isOpen={Boolean(maoDeObraParaExcluir)}
        onClose={() => setMaoDeObraParaExcluir(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/70 to-white p-4 shadow-[0_5px_18px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700/80">
            Atenção
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Tem certeza que deseja excluir o registro de mão de obra{" "}
            <span className="font-semibold text-text-primary">
              {maoDeObraParaExcluir?.profissional ||
                maoDeObraParaExcluir?.tipo ||
                "selecionado"}
            </span>
            ? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="ghost"
            onClick={() => setMaoDeObraParaExcluir(null)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={handleConfirmarExclusaoMaoDeObra}
            className="w-full sm:w-auto"
          >
            Confirmar Exclusão
          </BaseButton>
        </div>
      </BaseModal>
      <BaseModal
        isOpen={Boolean(locacaoParaExcluir)}
        onClose={() => setLocacaoParaExcluir(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/70 to-white p-4 shadow-[0_5px_18px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700/80">
            Atenção
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Tem certeza que deseja excluir a locação{" "}
            <span className="font-semibold text-text-primary">
              {locacaoParaExcluir?.equipamento || "selecionada"}
            </span>
            ? Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="ghost"
            onClick={() => setLocacaoParaExcluir(null)}
            className="w-full sm:w-auto"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={handleConfirmarExclusaoLocacao}
            className="w-full sm:w-auto"
          >
            Confirmar Exclusão
          </BaseButton>
        </div>
      </BaseModal>
    </div>
  );
}
