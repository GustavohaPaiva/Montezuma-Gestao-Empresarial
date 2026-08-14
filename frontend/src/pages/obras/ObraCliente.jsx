import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { ESCRITORIOS_ARQUITETURA } from "../../constants/escritorios";
import { useAuth } from "../../contexts/AuthContext";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import BaseSelect from "../../components/gerais/BaseSelect";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import {
  filtrarMaoDeObraLista,
  filtrarMateriaisLista,
} from "./detalhe/utils/relatorioFiltrosUtils";
import {
  labelsExtratoFinanceiro,
  loteEstaAberto,
  totalLotesAPagar,
} from "./detalhe/utils/lotesPagamentoUtils";
import { gerarPdfExtrato } from "./detalhe/utils/obraDetalhePdf";
import ObraDetalheLotesPagamento from "./detalhe/components/ObraDetalheLotesPagamento";
import ObraClienteSidebar from "./components/ObraClienteSidebar";
import ObraClienteProfileModal from "./components/ObraClienteProfileModal";
import logo from "../../assets/logos/logo sem fundo.png";
import Etapas from "../../components/gerais/ObraEtapas";
import CronogramaObra from "../../components/obras/CronogramaObra";
import HomeBackground from "../home/components/HomeBackground";
import {
  Building,
  MapPin,
  ClipboardList,
  CalendarDays,
  UserRound,
  Handshake,
  Wallet,
  Loader2,
  HardHat,
} from "lucide-react";

const cardShellClass =
  "w-full overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]";

const infoTileClass =
  "rounded-xl border border-border-primary/30 bg-gradient-to-br from-white to-accent-primary/[0.03] p-3 shadow-sm ring-1 ring-slate-900/5";

const inputPremiumClass =
  "box-border min-h-11 h-11 w-full min-w-0 shrink-0 rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-muted focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const totalBarClass =
  "flex min-h-[44px] w-full flex-wrap items-center justify-center gap-1 rounded-xl border border-border-primary/40 bg-[#FAFAFA] px-4 py-3 text-center text-sm font-semibold text-text-primary shadow-inner ring-1 ring-black/[0.04]";

const sectionLabelClass =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted";

const fadeClass = (visible) =>
  `transition-all duration-500 ease-out transform ${
    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
  }`;

const formatarDataBR = (dataString) => {
  if (!dataString) return "-";
  const [ano, mes, dia] = dataString.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
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

const formatarMoeda = (valor) => {
  const valorNumerico = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorNumerico);
};

function normalizarModalidade(raw) {
  const s = String(raw || "empreitada")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return s === "gestao" ? "gestao" : "empreitada";
}

function rotuloModalidade(raw) {
  return normalizarModalidade(raw) === "gestao" ? "Gestão" : "Empreitada";
}

const getCorStatus = (status) => {
  switch (status) {
    case "Prefeitura":
      return "bg-[#E3F2FD] text-[#1565C0]";
    case "Codau":
      return "bg-[#E0F7FA] text-[#006064]";
    case "Paralizado":
      return "bg-[#FFEBEE] text-[#C62828]";
    case "Engenharia":
      return "bg-[#FFF3E0] text-[#E65100]";
    case "Assinatura":
      return "bg-[#E8F5E9] text-[#2E7D32]";
    case "Conformidade":
      return "bg-[#F3E5F5] text-[#7B1FA2]";
    case "ITBI":
      return "bg-[#FFFDE7] text-[#F57F17]";
    case "Cartório":
      return "bg-[#EFEBE9] text-[#4E342E]";
    case "Acompanhamento":
      return "bg-[#E3F2FD] text-[#1565C0]";
    case "Gestão":
      return "bg-[#F3E5F5] text-[#7B1FA2]";
    case "Finalizado":
      return "bg-[#E8F5E9] text-[#2E7D32]";
    case "Futuros":
      return "bg-[#ECEFF1] text-[#455A64]";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function ObraCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [cliente, setCliente] = useState(null);
  const [obra, setObra] = useState(null);
  const [processo, setProcesso] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [refProcessos, animProcessosVisible] = useScrollFadeIn();
  const [refProcPref, animProcPrefVisible] = useScrollFadeIn();
  const [refProcCaixa, animProcCaixaVisible] = useScrollFadeIn();
  const [refProcFin, animProcFinVisible] = useScrollFadeIn();

  const [refInfo, animInfoVisible] = useScrollFadeIn();
  const [refEtapas, animEtapasVisible] = useScrollFadeIn();

  const [refMat, animMatVisible] = useScrollFadeIn();
  const [refMao, animMaoVisible] = useScrollFadeIn();
  const [refExt, animExtVisible] = useScrollFadeIn();

  const isSomenteProcessos = user?.isSomenteProcesso === true;
  const modalidadeSlug = normalizarModalidade(obra?.modalidade);
  const exibirRelatorios = modalidadeSlug === "gestao";

  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [filtroFornecedorId, setFiltroFornecedorId] = useState("");
  const [filtroPrestadorId, setFiltroPrestadorId] = useState("");
  const [listaFornecedores, setListaFornecedores] = useState([]);
  const [listaPrestadores, setListaPrestadores] = useState([]);
  const [carregandoFornecedores, setCarregandoFornecedores] = useState(false);
  const [carregandoPrestadores, setCarregandoPrestadores] = useState(false);
  const [buscaExtrato, setBuscaExtrato] = useState("");
  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");
  const [secaoCliente, setSecaoCliente] = useState("resumo");
  const [subRelatorioCliente, setSubRelatorioCliente] = useState("materiais");
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [salvandoModalidade, setSalvandoModalidade] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);

  useEffect(() => {
    if (!id) return;

    const carregarDados = async () => {
      setCarregando(true);
      try {
        if (isSomenteProcessos) {
          const dadosCliente = await api.getClienteById(id);
          if (dadosCliente) {
            setProcesso(dadosCliente);
            setCliente(dadosCliente);
          }
        } else {
          const dadosObra = await api.getObraById(id);
          if (dadosObra) {
            setObra(dadosObra);

            if (user?.tipo === "cliente") {
              const dadosCliente = await api.getClienteById(user.id);
              setCliente(dadosCliente);
            } else if (dadosObra.cliente) {
              try {
                const todosClientes = await api.getClientesPorEscritorios(
                  ESCRITORIOS_ARQUITETURA,
                );
                const donoDaObra = todosClientes.find(
                  (c) =>
                    c.nome?.toLowerCase() === dadosObra.cliente?.toLowerCase(),
                );
                if (donoDaObra) setCliente(donoDaObra);
              } catch (e) {
                console.warn(e);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [id, isSomenteProcessos, user]);

  useEffect(() => {
    const carregarListasFiltro = async () => {
      setCarregandoFornecedores(true);
      setCarregandoPrestadores(true);
      try {
        const [fornecedores, prestadores] = await Promise.all([
          api.getFornecedoresSimples(),
          api.getPrestadoresSimples(),
        ]);
        setListaFornecedores(fornecedores || []);
        setListaPrestadores(prestadores || []);
      } catch (error) {
        console.error("Erro ao carregar listas de filtro:", error);
      } finally {
        setCarregandoFornecedores(false);
        setCarregandoPrestadores(false);
      }
    };
    carregarListasFiltro();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!exibirRelatorios && secaoCliente === "relatorios") {
      setSecaoCliente("resumo");
    }
  }, [exibirRelatorios, secaoCliente]);

  const salvarModalidadeObra = async (valor) => {
    if (!obra?.id) return;
    if (
      !user?.tipo ||
      !["diretoria", "secretaria", "suporte_ti"].includes(user.tipo)
    ) {
      return;
    }
    const slug = valor === "gestao" ? "gestao" : "empreitada";
    try {
      setSalvandoModalidade(true);
      await api.updateObra(obra.id, { modalidade: slug });
      setObra((prev) => (prev ? { ...prev, modalidade: slug } : prev));
    } catch (err) {
      console.error(err);
      alert("Não foi possível atualizar a modalidade.");
    } finally {
      setSalvandoModalidade(false);
    }
  };

  const handleAbrirModal = () => {
    setIsModalOpen(true);
  };

  const handleFecharModal = () => {
    if (uploadingFoto) return;
    setIsModalOpen(false);
  };

  const handleUploadFoto = async (file) => {
    const idParaSalvar =
      cliente?.id || (user?.tipo === "cliente" ? user.id : null);
    if (!idParaSalvar) {
      throw new Error("ID do cliente não encontrado.");
    }

    setUploadingFoto(true);
    try {
      const response = await api.uploadFotoCliente(
        idParaSalvar,
        file,
        cliente?.escritorio_id,
      );
      setCliente((prev) => ({
        ...prev,
        foto: response.fotoUrl,
        id: idParaSalvar,
      }));
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const dadosPrefeitura = useMemo(() => {
    if (!processo) return [];
    return [
      [
        <span key="tipo-pmu" className="uppercase font-bold text-text-primary">
          {processo.tipo || "-"}
        </span>,
        <div
          key="status-pmu"
          className={`w-fit text-[14px] font-bold px-3 py-1 text-center rounded-[20px] ${getCorStatus(processo.status_pmu || "Prefeitura")}`}
        >
          {processo.status_pmu || "Prefeitura"}
        </div>,
        <span key="prot-pmu" className="font-semibold text-text-primary">
          {processo.protocolo_pmu || "-"}
        </span>,
        <span key="obs-pmu" className="font-semibold text-text-primary">
          {processo.observacao_pmu || "-"}
        </span>,
      ],
    ];
  }, [processo]);

  const dadosCaixa = useMemo(() => {
    if (!processo) return [];
    return [
      [
        <div
          key="status-caixa"
          className={`w-fit text-[14px] font-bold px-3 py-1 text-center rounded-[20px] ${getCorStatus(processo.status_caixa || "Engenharia")}`}
        >
          {processo.status_caixa || "Engenharia"}
        </div>,
        <span key="eng" className="font-semibold text-text-primary">
          {processo.engenheiro || "-"}
        </span>,
        <span key="prot-caixa" className="font-semibold text-text-primary">
          {processo.protocolo_caixa || "-"}
        </span>,
        <span key="data-caixa" className="font-semibold text-text-primary">
          {processo.data_ass_caixa
            ? formatarDataBR(processo.data_ass_caixa)
            : "-"}
        </span>,
      ],
    ];
  }, [processo]);

  const dadosFinalizados = useMemo(() => {
    if (!processo) return [];
    return [
      [
        <span key="tipo-fin" className="uppercase font-bold text-text-primary">
          {processo.tipo || "-"}
        </span>,
        <div
          key="status-fin"
          className={`w-fit text-[14px] font-bold px-3 py-1 text-center rounded-[20px] ${getCorStatus(processo.status_fin || "Acompanhamento")}`}
        >
          {processo.status_fin || "Acompanhamento"}
        </div>,
        <span key="alvara" className="font-semibold text-text-primary">
          {processo.n_alvara || "-"}
        </span>,
        <span key="contrato" className="font-semibold text-text-primary">
          {processo.n_contrato || "-"}
        </span>,
        <span key="data-fin" className="font-semibold text-text-primary">
          {processo.data_ass_fin ? formatarDataBR(processo.data_ass_fin) : "-"}
        </span>,
      ],
    ];
  }, [processo]);

  const listaMateriaisFiltrada = useMemo(() => {
    if (!obra?.materiais) return [];
    return filtrarMateriaisLista(obra.materiais, {
      busca: buscaMateriais,
      fornecedorId: filtroFornecedorId,
    });
  }, [obra?.materiais, buscaMateriais, filtroFornecedorId]);

  const dadosMateriais = useMemo(() => {
    if (!obra || !obra.materiais) return [];
    let lista = [...listaMateriaisFiltrada];
    const ordemStatus = {
      Solicitado: 1,
      "Em cotação": 2,
      Aprovado: 3,
      "Aguardando entrega": 4,
      Entregue: 5,
    };
    lista.sort((a, b) => {
      const pesoA = ordemStatus[a.status || "Solicitado"] || 99;
      const pesoB = ordemStatus[b.status || "Solicitado"] || 99;
      if (pesoA !== pesoB) return pesoA - pesoB;
      return new Date(a.data_solicitacao) - new Date(b.data_solicitacao);
    });
    return lista.map((m) => {
      const qtdNumerica = parseFloat(m.quantidade) || 0;
      const valorUnitario = qtdNumerica > 0 ? m.valor / qtdNumerica : 0;
      return [
        <div key={`mat-${m.id}`} className="uppercase text-center font-medium">
          {m.material}
        </div>,
        m.quantidade,
        `R$ ${formatarMoeda(valorUnitario)}`,
        `R$ ${formatarMoeda(m.valor || 0)}`,
        <div
          key={`status-${m.id}`}
          className={`text-[12px] font-bold px-3 py-1 rounded-[20px] inline-block ${m.status === "Entregue" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}
        >
          {m.status || "Solicitado"}
        </div>,
        <div key={`forn-${m.id}`} className="uppercase text-center">
          {m.fornecedor || "-"}
        </div>,
        formatarDataBR(m.data_solicitacao),
      ];
    });
  }, [obra, listaMateriaisFiltrada]);

  const listaMaoDeObraFiltrada = useMemo(() => {
    if (!obra?.maoDeObra) return [];
    return filtrarMaoDeObraLista(obra.maoDeObra, {
      busca: buscaMaoDeObra,
      prestadorId: filtroPrestadorId,
    });
  }, [obra?.maoDeObra, buscaMaoDeObra, filtroPrestadorId]);

  const dadosMaoDeObra = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];
    let lista = [...listaMaoDeObraFiltrada];
    lista.sort(
      (a, b) => (a.validacao === 1 ? 1 : 0) - (b.validacao === 1 ? 1 : 0),
    );
    return lista.map((m) => [
      <div key={`val-${m.id}`} className="flex justify-center items-center">
        <input
          type="checkbox"
          checked={m.validacao === 1}
          readOnly
          onClick={(e) => e.preventDefault()}
          className={`h-[18px] w-[18px] cursor-default ${m.validacao === 1 ? "accent-[#00C853]" : ""}`}
        />
      </div>,
      <div key={`tipo-${m.id}`} className="uppercase text-center">
        {m.tipo}
      </div>,
      <div key={`prof-${m.id}`} className="uppercase text-center">
        {m.profissional}
      </div>,
      `R$ ${formatarMoeda(m.valor_cobrado || 0)}`,
      formatarDataBR(m.data_solicitacao),
    ]);
  }, [obra, listaMaoDeObraFiltrada]);

  const dadosExtrato = useMemo(() => {
    if (!obra || !obra.relatorioExtrato) return [];
    let lista = obra.relatorioExtrato;
    if (buscaExtrato) {
      lista = lista.filter((item) =>
        item.descricao?.toLowerCase().includes(buscaExtrato.toLowerCase()),
      );
    }
    if (filtroExtrato !== "Tudo") {
      lista = lista.filter(
        (item) =>
          item.tipo ===
          (filtroExtrato === "Materiais" ? "Material" : "Mão de Obra"),
      );
    }
    lista.sort((a, b) => {
      const isPagoA = a.status_financeiro === "Pago";
      const isPagoB = b.status_financeiro === "Pago";
      if (isPagoA !== isPagoB) return isPagoA ? 1 : -1;
      return new Date(a.data) - new Date(b.data);
    });
    return lista.map((item) => [
      <div key={`desc-${item.id}`} className="uppercase text-center">
        {item.descricao}
      </div>,
      <div key={`tipo-${item.id}`} className="uppercase text-center">
        {item.tipo}
      </div>,
      item.quantidade,
      `R$ ${formatarMoeda(item.valor)}`,
      <div
        key={`stat-${item.id}`}
        className={`text-[12px] font-bold px-3 py-1 rounded-[20px] inline-block ${item.status_financeiro === "Pago" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}
      >
        {item.status_financeiro || "Aguardando"}
      </div>,
      formatarDataBR(item.data),
    ]);
  }, [obra, buscaExtrato, filtroExtrato]);

  const totais = useMemo(() => {
    if (!obra) return { materiais: 0, maoDeObra: 0, extrato: 0, aPagar: 0 };
    return {
      materiais: listaMateriaisFiltrada.reduce(
        (acc, m) => acc + (parseFloat(m.valor) || 0),
        0,
      ),
      maoDeObra: listaMaoDeObraFiltrada.reduce(
        (acc, m) => acc + (parseFloat(m.valor_cobrado) || 0),
        0,
      ),
      extrato: (obra.relatorioExtrato || []).reduce(
        (acc, item) => acc + (parseFloat(item.valor) || 0),
        0,
      ),
      aPagar: totalLotesAPagar(obra.lotesPagamento),
    };
  }, [obra, listaMateriaisFiltrada, listaMaoDeObraFiltrada]);

  const lotesOrdenados = useMemo(() => {
    const lotes = [...(obra?.lotesPagamento || [])];
    lotes.sort((a, b) => {
      const abertoA = loteEstaAberto(a.status) ? 0 : 1;
      const abertoB = loteEstaAberto(b.status) ? 0 : 1;
      if (abertoA !== abertoB) return abertoA - abertoB;
      return (b.numero || 0) - (a.numero || 0);
    });
    return lotes;
  }, [obra?.lotesPagamento]);

  const handleGerarPdfLote = useCallback(
    (lote) => {
      const extratoIds = (lote?.itens || [])
        .map((item) => item.extrato_id)
        .filter(Boolean);
      if (!extratoIds.length) return;
      setPdfPreview({
        titulo: labelsExtratoFinanceiro.numero(lote.numero),
        gerador: () =>
          gerarPdfExtrato(obra, { extratoIds, retornarBlob: true }),
        nomeFallback: labelsExtratoFinanceiro.nomePdf(lote.numero),
      });
    },
    [obra],
  );

  const carregarHistorico = useCallback(async () => {
    if (!id) return;
    setLoadingHistorico(true);
    try {
      const rows = await api.getObraHistorico(id, {
        isClienteView: user?.tipo === "cliente",
      });
      setHistorico(rows);
    } catch (error) {
      console.error(error);
      setHistorico([]);
    } finally {
      setLoadingHistorico(false);
    }
  }, [id, user?.tipo]);

  useEffect(() => {
    if (isSomenteProcessos || !id) return;
    void carregarHistorico();
  }, [isSomenteProcessos, id, user?.tipo, carregarHistorico]);

  if (carregando) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#FAFAFA] px-[5%] py-12 font-montserrat">
        <HomeBackground />
        <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border-primary/35 bg-white px-8 py-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-primary/[0.07]"
            aria-hidden
          />
          <div className="relative">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
              <HardHat className="h-6 w-6" strokeWidth={2} />
            </div>
            <Loader2
              className="mx-auto mb-4 h-9 w-9 animate-spin text-accent-primary"
              strokeWidth={2.25}
              aria-hidden
            />
            <p className={sectionLabelClass}>Acompanhamento</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              Carregando sua obra
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-text-muted">
              Sincronizando etapas, histórico e informações do projeto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSomenteProcessos && !processo) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#FAFAFA] px-[5%] font-montserrat">
        <HomeBackground />
        <p className="relative z-10 text-sm font-semibold text-text-muted">
          Processo não encontrado.
        </p>
      </div>
    );
  }

  if (!isSomenteProcessos && !obra) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#FAFAFA] px-[5%] font-montserrat">
        <HomeBackground />
        <p className="relative z-10 text-sm font-semibold text-text-muted">
          Obra não encontrada.
        </p>
      </div>
    );
  }

  const isReforma =
    cliente?.tipo?.toLowerCase() === "reforma" ||
    obra?.clientes?.tipo?.toLowerCase() === "reforma";
  const isConstrucao =
    cliente?.tipo?.toLowerCase() === "construção" ||
    cliente?.tipo?.toLowerCase() === "construcao" ||
    obra?.clientes?.tipo?.toLowerCase() === "construção" ||
    obra?.clientes?.tipo?.toLowerCase() === "construcao";

  const podeEditarModalidade =
    !!obra &&
    !!user?.tipo &&
    ["diretoria", "secretaria", "suporte_ti"].includes(user.tipo);

  return (
    <div className="relative flex h-svh w-full flex-col overflow-hidden bg-[#FAFAFA] font-montserrat text-text-primary">
      <HomeBackground />

      <ObraClienteProfileModal
        open={isModalOpen}
        onClose={handleFecharModal}
        displayName={obra?.cliente || cliente?.nome || "Cliente"}
        email={cliente?.email || user?.email}
        roleLabel="Cliente"
        avatarUrl={cliente?.foto}
        uploading={uploadingFoto}
        onUploadPhoto={handleUploadFoto}
        onSignOut={handleLogout}
      />

      {isSomenteProcessos && (
        <div
          ref={refProcessos}
          className={`relative z-10 mb-6 mt-6 w-full px-[5%] md:mb-8 ${fadeClass(animProcessosVisible)}`}
        >
          <div className={`${cardShellClass} p-5 sm:p-7`}>
            <p className={sectionLabelClass}>Acompanhamento</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Processos
            </h2>
            <div className="mt-1.5 h-0.5 w-12 rounded-full bg-gradient-to-r from-accent-primary/90 to-accent-primary/25" />

            <div className="mt-6 flex flex-col gap-6 overflow-x-auto">
              <div
                ref={refProcPref}
                className={`flex flex-col items-center gap-4 ${fadeClass(animProcPrefVisible)}`}
              >
                <h3 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                  Prefeitura
                </h3>
                <TabelaSimples
                  colunas={["Tipo", "Status", "Protocolo", "OBS."]}
                  dados={dadosPrefeitura}
                />
              </div>

              <div className="h-px w-full bg-border-primary/40" />

              <div
                ref={refProcCaixa}
                className={`flex flex-col items-center gap-4 ${fadeClass(animProcCaixaVisible)}`}
              >
                <h3 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                  Caixa
                </h3>
                <TabelaSimples
                  colunas={[
                    "Status",
                    "Engenheiro",
                    "Protocolo",
                    "Data Assinatura",
                  ]}
                  dados={dadosCaixa}
                />
              </div>

              <div className="h-px w-full bg-border-primary/40" />

              <div
                ref={refProcFin}
                className={`flex flex-col items-center gap-4 ${fadeClass(animProcFinVisible)}`}
              >
                <h3 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                  Finalizados
                </h3>
                <TabelaSimples
                  colunas={[
                    "Tipo",
                    "Status",
                    "Nº Alvara",
                    "Nº Contrato",
                    "Data Assinatura",
                  ]}
                  dados={dadosFinalizados}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {!isSomenteProcessos && (
        <ObraClienteSidebar
          secaoAtiva={secaoCliente}
          onChangeSecao={setSecaoCliente}
          exibirRelatorios={exibirRelatorios}
          nomeCliente={obra?.cliente}
          fotoCliente={cliente?.foto}
          onOpenProfile={handleAbrirModal}
        >
          <main className="w-full px-[5%] py-4 lg:py-6">
            {secaoCliente === "resumo" ? (
              <>
                <div
                  ref={refInfo}
                  className={`relative mb-6 ${cardShellClass} p-4 sm:p-6 md:p-7 ${fadeClass(animInfoVisible)} ${
                    isConstrucao ? "gap-6" : "gap-8"
                  } flex flex-col md:flex-row md:items-stretch`}
                >
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-primary/80 via-accent-primary/50 to-accent-primary/20"
                    aria-hidden
                  />
                  <div className="w-full xl:w-[62%] md:w-[58%]">
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={logo}
                        alt="Logo Montezuma"
                        className="hidden h-14 w-auto rounded-xl border border-border-primary/25 bg-white p-1 shadow-sm xl:block"
                      />
                      <div>
                        <p className={sectionLabelClass}>Obra</p>
                        <h2 className="text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                          {obra?.cliente || "Cliente não informado"}
                        </h2>
                      </div>
                    </div>

                    <div className="mb-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-border-primary/40 bg-white px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
                        {cliente?.tipo || obra?.clientes?.tipo || "Sem tipo"}
                      </span>
                      <span className="rounded-full border border-accent-primary/20 bg-accent-primary/10 px-3 py-1 text-xs font-semibold text-accent-primary shadow-sm">
                        {cliente?.status ||
                          obra?.status ||
                          "Status não disponível"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className={infoTileClass}>
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          <Building className="h-3.5 w-3.5 text-accent-primary" />
                          Nome do cliente
                        </p>
                        <p className="mt-1 text-sm font-semibold uppercase text-text-primary">
                          {obra?.cliente || "Não informado"}
                        </p>
                      </div>
                      <div className={infoTileClass}>
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          <MapPin className="h-3.5 w-3.5 text-accent-primary" />
                          Endereço da obra
                        </p>
                        <p className="mt-1 text-sm font-semibold uppercase text-text-primary">
                          {obra?.local || "Não informado"}
                        </p>
                      </div>
                      <div className={infoTileClass}>
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          <CalendarDays className="h-3.5 w-3.5 text-accent-primary" />
                          Data de início
                        </p>
                        <p className="mt-1 text-sm font-semibold text-text-primary">
                          {formatarDataBR(obra?.data)}
                        </p>
                      </div>
                      <div className={infoTileClass}>
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          <ClipboardList className="h-3.5 w-3.5 text-accent-primary" />
                          Total de etapas
                        </p>
                        <p className="mt-1 text-sm font-semibold text-text-primary">
                          {(obra?.etapas_selecionadas || []).length} etapa(s)
                        </p>
                      </div>
                      <div className={`${infoTileClass} md:col-span-2`}>
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          <Handshake className="h-3.5 w-3.5 text-accent-primary" />
                          Modalidade do projeto
                        </p>
                        {podeEditarModalidade ? (
                          <div className="mt-2">
                            <BaseSelect
                              searchable={false}
                              aria-label="Modalidade do projeto"
                              value={modalidadeSlug}
                              disabled={salvandoModalidade}
                              onChange={(e) =>
                                salvarModalidadeObra(e.target.value)
                              }
                              className="w-full max-w-sm"
                              options={[
                                { value: "empreitada", label: "Empreitada" },
                                { value: "gestao", label: "Gestão" },
                              ]}
                            />
                            <p className="mt-1.5 text-[11px] leading-snug text-text-muted">
                              Em Gestão, relatórios ficam disponíveis nesta
                              tela.
                            </p>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm font-semibold text-text-primary">
                            {rotuloModalidade(obra?.modalidade)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="h-px w-full shrink-0 bg-gradient-to-r from-transparent via-accent-primary/35 to-transparent md:h-auto md:w-px md:bg-gradient-to-b"
                    aria-hidden
                  />

                  <div className="mb-2 flex w-full flex-col items-center justify-center md:mb-0 md:w-[30%]">
                    <div className="relative">
                      {cliente?.foto ? (
                        <img
                          src={cliente.foto}
                          alt="Cliente"
                          className="h-[150px] w-[150px] rounded-full border-[3px] border-accent-primary object-cover shadow-sm"
                        />
                      ) : (
                        <div className="flex h-[150px] w-[150px] items-center justify-center rounded-full border-[3px] border-accent-primary bg-avatar-bg">
                          <UserRound className="h-[80px] w-[80px] text-accent-primary" />
                        </div>
                      )}
                    </div>
                    <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-text-primary">
                      {obra?.cliente || "Cliente não informado"}
                      {isReforma ? " · Reforma" : ""}
                    </h2>
                    <p className="text-center text-sm text-text-muted">
                      {obra?.local || "Local não informado"}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-border-primary/40 bg-white px-3 py-1 text-xs font-semibold text-text-primary shadow-sm">
                      <ClipboardList className="h-3.5 w-3.5 text-accent-primary" />
                      Status:{" "}
                      {cliente?.status || obra?.status || "Não definido"}
                    </div>
                  </div>
                </div>

                <div className={`mb-6 ${cardShellClass} p-4 sm:p-6`}>
                  <p className={sectionLabelClass}>Atualizações</p>
                  <h3 className="mt-1 text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                    Histórico da obra
                  </h3>
                  <div className="mt-1.5 h-0.5 w-12 rounded-full bg-gradient-to-r from-accent-primary/90 to-accent-primary/25" />

                  {loadingHistorico ? (
                    <p className="mt-5 text-sm text-text-muted">
                      Carregando histórico...
                    </p>
                  ) : historico.length === 0 ? (
                    <p className="mt-5 rounded-xl border border-dashed border-border-primary/40 bg-[#FAFAFA] px-4 py-8 text-center text-sm text-text-muted">
                      Nenhuma atualização registrada.
                    </p>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {historico.map((item) => (
                        <article
                          key={item.id}
                          className="relative overflow-hidden rounded-xl border border-border-primary/30 bg-gradient-to-r from-white to-accent-primary/[0.03] p-4 shadow-sm ring-1 ring-slate-900/5"
                        >
                          <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent-primary/70 to-accent-primary/25" />
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                              {item.author_nome || "Equipe Montezuma"}
                            </p>
                            <p className="text-xs text-text-muted">
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
              </>
            ) : null}

            {secaoCliente === "etapas" ? (
              <div
                id="#etapas"
                ref={refEtapas}
                className={`mb-6 ${cardShellClass} p-3 sm:p-4 ${fadeClass(animEtapasVisible)}`}
              >
                <Etapas
                  etapas={obra?.etapas_selecionadas || []}
                  isCliente={user?.tipo === "cliente"}
                  isReforma={isReforma}
                />
              </div>
            ) : null}

            {secaoCliente === "cronograma" ? (
              <div id="#cronograma" className="mb-6">
                <CronogramaObra
                  etapas={obra?.etapas_selecionadas || []}
                  obraId={id}
                  showLancarButton={false}
                  nomeObra={
                    obra?.clientes?.nome || obra?.cliente || obra?.local || ""
                  }
                />
              </div>
            ) : null}

            {exibirRelatorios && secaoCliente === "relatorios" ? (
              <div
                id="#relatorios"
                className="mb-6 flex w-full flex-col gap-4"
              >
                <div className="mb-1 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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
                      id: "extrato",
                      label: "Lotes de pagamento",
                      sub: "O que você deve pagar",
                    },
                  ].map((opt) => {
                    const on = subRelatorioCliente === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSubRelatorioCliente(opt.id)}
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

                {subRelatorioCliente === "materiais" ? (
                  <div
                    ref={refMat}
                    className={`${cardShellClass} flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 ${fadeClass(animMatVisible)}`}
                  >
                    <div
                      className={`flex ${isMobile ? "flex-col gap-3" : "items-center justify-between gap-4"}`}
                    >
                      <div>
                        <p className={sectionLabelClass}>Relatório</p>
                        <h2 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                          Materiais
                        </h2>
                      </div>
                      <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
                        <input
                          type="text"
                          placeholder="Buscar material..."
                          value={buscaMateriais}
                          onChange={(e) => setBuscaMateriais(e.target.value)}
                          className={`${inputPremiumClass} md:w-[250px]`}
                        />
                        <BaseSelect
                          searchable
                          loading={carregandoFornecedores}
                          value={filtroFornecedorId}
                          onChange={(e) => setFiltroFornecedorId(e.target.value)}
                          wrapperClassName="w-full md:w-[220px]"
                          className="h-11 w-full"
                          options={[
                            {
                              value: "",
                              label: carregandoFornecedores
                                ? "Carregando..."
                                : "Todos os fornecedores",
                            },
                            ...listaFornecedores.map((f) => ({
                              value: String(f.id),
                              label: f.nome,
                            })),
                          ]}
                        />
                        <div className={totalBarClass}>
                          Total Lançado:{" "}
                          <span className="font-bold text-emerald-700">
                            R$ {formatarMoeda(totais.materiais)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <TabelaSimples
                      colunas={[
                        "Material",
                        "Qtd",
                        "Valor Un.",
                        "Total",
                        "Status",
                        "Fornecedor",
                        "Data",
                      ]}
                      dados={dadosMateriais}
                    />
                  </div>
                ) : null}

                {subRelatorioCliente === "mao" ? (
                  <div
                    ref={refMao}
                    className={`${cardShellClass} flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6 ${fadeClass(animMaoVisible)}`}
                  >
                    <div
                      className={`flex ${isMobile ? "flex-col gap-3" : "items-center justify-between gap-4"}`}
                    >
                      <div>
                        <p className={sectionLabelClass}>Relatório</p>
                        <h2 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                          Mão de Obra
                        </h2>
                      </div>
                      <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
                        <input
                          type="text"
                          placeholder="Buscar serviço..."
                          value={buscaMaoDeObra}
                          onChange={(e) => setBuscaMaoDeObra(e.target.value)}
                          className={`${inputPremiumClass} md:w-[250px]`}
                        />
                        <BaseSelect
                          searchable
                          loading={carregandoPrestadores}
                          value={filtroPrestadorId}
                          onChange={(e) => setFiltroPrestadorId(e.target.value)}
                          wrapperClassName="w-full md:w-[220px]"
                          className="h-11 w-full"
                          options={[
                            {
                              value: "",
                              label: carregandoPrestadores
                                ? "Carregando..."
                                : "Todos os prestadores",
                            },
                            ...listaPrestadores.map((p) => ({
                              value: String(p.id),
                              label: p.nome,
                            })),
                          ]}
                        />
                        <div className={totalBarClass}>
                          Total Lançado:{" "}
                          <span className="font-bold text-emerald-700">
                            R$ {formatarMoeda(totais.maoDeObra)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <TabelaSimples
                      colunas={[
                        "Validação",
                        "Tipo",
                        "Profissional",
                        "Valor",
                        "Data",
                      ]}
                      dados={dadosMaoDeObra}
                    />
                  </div>
                ) : null}

                {subRelatorioCliente === "extrato" ? (
                  <div
                    ref={refExt}
                    className={`flex flex-col gap-5 ${fadeClass(animExtVisible)}`}
                  >
                    <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 via-white to-white p-5 shadow-[0_5px_20px_rgba(0,0,0,0.06)] ring-1 ring-amber-500/10 sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/15">
                            <Wallet className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                              O que você deve pagar
                            </h2>
                            <p className="mt-0.5 text-sm text-text-muted">
                              Lotes gerados pela obra para cobrança. Pendentes e
                              parciais aparecem primeiro.
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-amber-300/50 bg-white px-4 py-3 text-sm shadow-sm sm:min-w-[200px]">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-text-muted">
                            Total a pagar
                          </span>
                          <span className="mt-0.5 block text-lg font-bold text-amber-900">
                            R$ {formatarMoeda(totais.aPagar)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`${cardShellClass} p-5 sm:p-6`}>
                      <p className={`mb-3 ${sectionLabelClass}`}>
                        {labelsExtratoFinanceiro.extratosDePagamento}
                      </p>
                      <ObraDetalheLotesPagamento
                        lotes={lotesOrdenados}
                        relatorioExtrato={obra?.relatorioExtrato || []}
                        somenteLeitura
                        onGerarPdf={handleGerarPdfLote}
                      />
                    </div>

                    <div className={`${cardShellClass} p-5 sm:p-6`}>
                      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className={sectionLabelClass}>Extrato</p>
                          <h3 className="text-lg font-bold tracking-tight text-text-primary">
                            Detalhamento do extrato
                          </h3>
                        </div>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                          <BaseSelect
                            searchable={false}
                            value={filtroExtrato}
                            onChange={(e) => setFiltroExtrato(e.target.value)}
                            className="h-11 w-full lg:w-auto"
                            options={[
                              { value: "Tudo", label: "Todos" },
                              { value: "Materiais", label: "Materiais" },
                              { value: "Mão de Obra", label: "Mão de Obra" },
                            ]}
                          />
                          <input
                            type="text"
                            placeholder="Buscar no extrato..."
                            value={buscaExtrato}
                            onChange={(e) => setBuscaExtrato(e.target.value)}
                            className={`${inputPremiumClass} lg:w-[250px]`}
                          />
                          <div className={totalBarClass}>
                            Total:{" "}
                            <span className="font-bold text-emerald-700">
                              R$ {formatarMoeda(totais.extrato)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <TabelaSimples
                        colunas={[
                          "Descrição",
                          "Tipo",
                          "Qtd",
                          "Valor",
                          "Status Fin.",
                          "Data",
                        ]}
                        dados={dadosExtrato}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </main>
        </ObraClienteSidebar>
      )}

      <PdfPreviewModal
        isOpen={Boolean(pdfPreview)}
        onClose={() => setPdfPreview(null)}
        titulo={pdfPreview?.titulo}
        gerador={pdfPreview?.gerador}
        nomeFallback={pdfPreview?.nomeFallback}
      />
    </div>
  );
}

