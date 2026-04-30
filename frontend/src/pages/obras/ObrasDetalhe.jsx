import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../services/api";
import ModalMateriais from "../../components/modals/ModalMateriais";
import ModalMaoDeObra from "../../components/modals/ModalMaoDeObra";
import ModalEtapas from "../../components/modals/ModalEtapas";
import Etapas from "../../components/gerais/ObraEtapas";
import ListaEtapas from "../../components/obras/ListaEtapas";
import DiarioObras from "../../components/obras/DiarioObras";
import CronogramaObra from "../../components/obras/CronogramaObra";
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
  gerarPdfRelatorioMateriais,
  gerarPdfRelatorioPorPrestador,
} from "./detalhe/utils/obraDetalhePdf";
import FeedbackModal from "../../components/gerais/FeedbackModal";
import { useAuth } from "../../contexts/AuthContext";
import { MessageSquareText, Send } from "lucide-react";

export default function ObrasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { obra, setObra, fetchDados } = useObraById(id);
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);
  const [secaoObra, setSecaoObra] = useState("resumo");
  const [subRelatorio, setSubRelatorio] = useState("materiais");

  const [modalEtapasisOpen, setModalEtapasisOpen] = useState(false);
  const [modalMateriaisOpen, setModalMateriaisOpen] = useState(false);
  const [modalMaoDeObraOpen, setModalMaoDeObraOpen] = useState(false);
  const [modalRelatorioPrestadorOpen, setModalRelatorioPrestadorOpen] =
    useState(false);

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
          showFeedback("Erro ao excluir.");
        }
      }
    },
    [fetchDados, showFeedback],
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
          m.id === materialId ? { ...m, data_vencimento: novaDataVencimento } : m,
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
          showFeedback("Erro ao excluir item.");
        }
      }
    },
    [fetchDados, showFeedback],
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

  /**
   * Abre o PDF direto no visualizador nativo do browser.
   * `window.open` é chamada de forma síncrona para evitar popup blocker;
   * atualizamos o src assim que o Blob fica pronto.
   */
  const abrirPdfEmNovaAba = async (gerador, fallbackNome) => {
    const novaAba = window.open("", "_blank");
    try {
      const resultado = await gerador();
      const blob = resultado?.blob ?? resultado;
      if (!blob) throw new Error("PDF vazio.");
      const url = URL.createObjectURL(blob);
      if (novaAba && !novaAba.closed) {
        novaAba.location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = resultado?.nomePadrao || fallbackNome || "documento.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error("[ObrasDetalhe] gerar PDF:", e);
      if (novaAba && !novaAba.closed) novaAba.close();
      showFeedback(e?.message || "Não foi possível gerar o PDF.");
    }
  };

  const handleGerarRelatorioPorPrestador = (prestador) => {
    const lista = obra?.maoDeObra?.filter(
      (m) => m.profissional?.toLowerCase() === prestador.toLowerCase(),
    );
    if (!lista || lista.length === 0) {
      showFeedback("Nenhum registro encontrado para este prestador.", "info");
      return;
    }
    setModalRelatorioPrestadorOpen(false);
    abrirPdfEmNovaAba(
      () =>
        gerarPdfRelatorioPorPrestador(obra, prestador, { retornarBlob: true }),
      `Relatorio_${prestador}.pdf`,
    );
  };

  const handleGerarRelatorioMaoDeObraGeral = () => {
    abrirPdfEmNovaAba(
      () =>
        gerarPdfRelatorioMaoDeObraGeral(obra, buscaMaoDeObra, {
          retornarBlob: true,
        }),
      "Relatorio_Mao_De_Obra_Geral.pdf",
    );
  };

  const handleGerarRelatorioMateriais = () => {
    const lista = obra?.materiais || [];
    if (lista.length === 0) {
      showFeedback("Nenhum material lançado nesta obra.", "info");
      return;
    }
    abrirPdfEmNovaAba(
      () =>
        gerarPdfRelatorioMateriais(obra, buscaMateriais, {
          retornarBlob: true,
        }),
      "Relatorio_Materiais.pdf",
    );
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
    const itens =
      obra?.relatorioExtrato?.filter((i) => i.validacao === 1) || [];
    if (itens.length === 0) {
      showFeedback("Nenhum item selecionado para o extrato.", "info");
      return;
    }
    abrirPdfEmNovaAba(
      () => gerarPdfExtrato(obra, { retornarBlob: true }),
      "Extrato.pdf",
    );
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
    if (!obra?.cliente_id) return;
    setLoadingHistoricoObra(true);
    try {
      const rows = await api.getClienteHistorico(obra.cliente_id, {
        isClienteView: false,
      });
      setHistoricoObra(rows || []);
    } catch (error) {
      console.error(error);
      setHistoricoObra([]);
    } finally {
      setLoadingHistoricoObra(false);
    }
  }, [obra?.cliente_id]);

  useEffect(() => {
    if (!obra?.cliente_id) return;
    void carregarHistoricoObra();
  }, [obra?.cliente_id, carregarHistoricoObra]);

  const handleAdicionarHistorico = async () => {
    const mensagem = novaMensagemHistorico.trim();
    if (!mensagem || !obra?.cliente_id || !user?.id) return;
    setSavingHistoricoObra(true);
    try {
      await api.addClienteHistorico({
        cliente_id: obra.cliente_id,
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
    salvarDataVencimentoMaterial,
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
    <div className="flex flex-col items-center min-h-screen bg-bg-primary pb-8">
      <ObraDetalheHeader navigate={navigate} obra={obra} isReforma={isReforma} />
      <main className="w-[90%] mt-2 sm:mt-3">
        <nav
          className="mb-2 w-full tracking-tight"
          aria-label="Secções da obra"
        >
          <div className="inline-flex max-w-full flex-wrap gap-0.5 rounded-2xl bg-surface-alt p-1 ring-1 ring-border-primary/30">
            {[
              { id: "resumo", label: "Resumo" },
              { id: "cronograma", label: "Cronograma" },
              { id: "relatorios", label: "Relatórios" },
              { id: "etapas", label: "Etapas" },
            ].map((aba) => {
              const ativa = secaoObra === aba.id;
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => {
                    setSecaoObra(aba.id);
                    if (aba.id === "relatorios") setSubRelatorio("materiais");
                  }}
                  className={[
                    "min-h-[2.25rem] rounded-xl px-3 py-1.5 text-xs font-medium transition sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm",
                    ativa
                      ? "bg-surface text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-primary",
                  ].join(" ")}
                >
                  {aba.label}
                </button>
              );
            })}
          </div>
        </nav>

        {secaoObra === "resumo" && (
          <div className="mb-6 w-full">
            <DiarioObras obraId={id} />
            <div className="mt-6 rounded-2xl border border-border-primary/80 bg-surface p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-text-primary">
                  Histórico da obra
                </h3>
                <ButtonDefault
                  type="button"
                  onClick={() => setShowNovoHistorico((prev) => !prev)}
                  className="!h-9 !px-3 !text-xs !font-semibold"
                >
                  <span className="inline-flex items-center gap-1">
                    <MessageSquareText className="h-4 w-4" />
                    {showNovoHistorico ? "Fechar" : "Novo lançamento"}
                  </span>
                </ButtonDefault>
              </div>

              {showNovoHistorico ? (
                <div className="mb-4 rounded-xl border border-border-primary/70 bg-surface-alt p-3">
                  <textarea
                    value={novaMensagemHistorico}
                    onChange={(e) => setNovaMensagemHistorico(e.target.value)}
                    rows={3}
                    placeholder="Adicionar atualização para o cliente..."
                    className="w-full resize-none rounded-xl border border-border-primary/70 px-3 py-2 text-sm text-text-primary focus:outline-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <ButtonDefault
                      type="button"
                      onClick={handleAdicionarHistorico}
                      disabled={savingHistoricoObra || !novaMensagemHistorico.trim()}
                      className="!h-9 !px-3 !text-xs !font-semibold"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Send className="h-4 w-4" />
                        Publicar
                      </span>
                    </ButtonDefault>
                  </div>
                </div>
              ) : null}

              {loadingHistoricoObra ? (
                <p className="text-sm text-text-muted">Carregando histórico...</p>
              ) : historicoObra.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Nenhum lançamento de histórico.
                </p>
              ) : (
                <div className="space-y-3">
                  {historicoObra.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-border-primary/70 bg-surface-alt p-3"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                          {item.author_nome || "Equipe Montezuma"}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatarDataHoraBR(item.created_at)}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed text-text-primary">
                        {item.mensagem}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 w-full">
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
            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
              {(
                [
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
                    id: "extrato",
                    label: "Extrato financeiro",
                    sub: "Movimentação consolidada",
                  },
                ]
              ).map((opt) => {
                const on = subRelatorio === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSubRelatorio(opt.id)}
                    className={[
                      "flex flex-col items-start gap-0.5 rounded-2xl border p-3 text-left shadow-sm transition sm:p-4",
                      on
                        ? "border-accent-primary/40 bg-surface ring-1 ring-accent-primary/20"
                        : "border-border-primary/80 bg-surface hover:bg-surface-alt",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "text-sm font-semibold tracking-tight",
                        on ? "text-accent-primary" : "text-text-primary",
                      ].join(" ")}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs tracking-tight text-text-muted">
                      {opt.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {subRelatorio === "materiais" && (
            <div>
            <div className="bg-surface border border-border-primary rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[20px] mt-0 pt-5 pb-5 sm:pt-6 sm:pb-6">
              <div className="flex w-full flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-3">
                <h1 className="text-2xl font-bold text-text-primary sm:text-[35px]">
                  Relatório de Materiais
                </h1>
                <div className="flex w-full max-w-full flex-wrap items-center gap-2 md:max-w-2xl md:justify-end">
                  <input
                    type="text"
                    placeholder="Buscar por material ou fornecedor..."
                    value={buscaMateriais}
                    onChange={(e) => setBuscaMateriais(e.target.value)}
                    className="h-10 w-full min-w-0 flex-1 box-border border border-border-primary rounded-[8px] p-2 px-[8px] text-text-primary focus:outline-none md:w-[300px] md:flex-none"
                  />
                  <ButtonDefault
                    type="button"
                    onClick={() => setModalMateriaisOpen(true)}
                    className="!h-10 !shrink-0 !whitespace-nowrap !px-4 !text-sm"
                  >
                    Novo material
                  </ButtonDefault>
                </div>
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
                  "Vencimento",
                  "",
                ]}
                dados={dadosMateriais}
              />
              <div className="box-border flex h-auto w-full flex-col items-center justify-between gap-4 gap-[20px] px-[5%] text-center md:h-[42px] md:flex-row">
                <ButtonDefault
                  onClick={handleGerarRelatorioMateriais}
                  className="w-[90%] max-w-[450px]"
                >
                  Relatório Materiais
                </ButtonDefault>
                <div className="flex h-[40px] w-[90%] max-w-[450px] items-center justify-center gap-[4px] border border-border-muted rounded-[6px] p-2 text-[18px] text-text-primary">
                  Total Lançado:{" "}
                  <span> R$ {formatarMoeda(totais.materiais)}</span>
                </div>
              </div>
            </div>
            </div>
            )}

            {subRelatorio === "mao" && (
            <div>
            <div className="bg-surface border border-border-primary rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[20px] mt-3 pt-5 pb-5 sm:pt-6 sm:pb-6 sm:mt-4">
              <div className="flex w-full flex-col flex-wrap gap-4 md:flex-row md:items-center md:justify-between md:gap-3">
                <h1 className="text-2xl font-bold text-text-primary sm:text-[35px]">
                  Relatório de Mão de Obra
                </h1>
                <div className="flex w-full max-w-full flex-wrap items-center gap-2 md:max-w-[560px] md:justify-end">
                  <input
                    type="text"
                    placeholder="Buscar serviço ou prestador..."
                    value={buscaMaoDeObra}
                    onChange={(e) => setBuscaMaoDeObra(e.target.value)}
                    className="h-[40px] w-full min-w-0 flex-1 box-border border border-border-primary rounded-[8px] p-2 px-[8px] text-text-primary focus:outline-none md:w-[250px] md:flex-none"
                  />
                  <ButtonDefault
                    type="button"
                    onClick={() => setModalMaoDeObraOpen(true)}
                    className="!h-10 !whitespace-nowrap !px-4 !text-sm !shadow-sm"
                  >
                    Nova mão de obra
                  </ButtonDefault>
                </div>
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

              <div className="box-border flex h-auto w-full flex-col items-center justify-between gap-4 gap-[20px] px-[5%] text-center md:flex-row md:flex-wrap">
                <div className="flex w-full max-w-[450px] justify-center gap-2">
                  <ButtonDefault
                    onClick={handleGerarRelatorioMaoDeObraGeral}
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
                <div className="w-full h-[40px] max-w-[450px] border border-border-muted rounded-[6px] text-[18px] text-text-primary items-center flex justify-center gap-[4px] p-2">
                  Total Lançado:{" "}
                  <span> R$ {formatarMoeda(totais.maoDeObra)}</span>
                </div>
              </div>
            </div>
            </div>
            )}

            {subRelatorio === "extrato" && (
            <div>
            <div className="bg-surface border border-border-primary rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[20px] mt-3 pt-5 pb-5 sm:mt-4 sm:pt-6 sm:pb-6">
              <div className="flex w-full flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-bold text-text-primary sm:text-[35px]">
                  Extrato
                </h1>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-2">
                  <input
                    type="text"
                    placeholder="Buscar no extrato..."
                    value={buscaExtrato}
                    onChange={(e) => setBuscaExtrato(e.target.value)}
                    className="h-[40px] w-full min-w-0 box-border border border-border-primary rounded-[8px] p-2 px-[8px] text-text-primary focus:outline-none md:w-[250px]"
                  />
                  <select
                    value={filtroExtrato}
                    onChange={(e) => setFiltroExtrato(e.target.value)}
                    className="h-[40px] w-full cursor-pointer border border-border-primary rounded-[8px] bg-surface p-[6px] text-[14px] text-text-primary focus:outline-none md:w-auto"
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
              <div className="box-border flex h-auto w-full flex-col items-center justify-between gap-4 gap-[20px] px-[5%] text-center md:h-[42px] md:flex-row">
                <ButtonDefault
                  onClick={handleGerarPDFExtrato}
                  className="w-full max-w-[450px]"
                >
                  Gerar pedido
                </ButtonDefault>
                <div className="flex h-[40px] w-full max-w-[450px] items-center justify-center gap-[4px] border border-border-muted rounded-[6px] p-2 text-[18px] text-text-primary">
                  Total no Extrato:{" "}
                  <span> R$ {formatarMoeda(totais.totalExtrato)}</span>
                </div>
              </div>
            </div>
            </div>
            )}
          </div>
        )}

        {secaoObra === "etapas" && (
          <div className="w-full">
            <ListaEtapas
              etapas={obra.etapas_selecionadas}
              isReforma={isReforma}
              headerAction={
                <ButtonDefault
                  type="button"
                  onClick={() => setModalEtapasisOpen(true)}
                  className="!h-10 !shrink-0 !whitespace-nowrap !px-4 !text-sm"
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
      <FeedbackModal
        isOpen={feedback.open}
        onClose={() =>
          setFeedback((f) => ({ ...f, open: false, message: "" }))
        }
        message={feedback.message}
        variant={feedback.variant}
      />
    </div>
  );
}
