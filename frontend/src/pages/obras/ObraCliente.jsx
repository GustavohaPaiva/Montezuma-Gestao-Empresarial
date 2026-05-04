import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import { ID_VOGELKOP, ID_YBYOCA } from "../../constants/escritorios";
import { useAuth } from "../../contexts/AuthContext";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ModalPortal from "../../components/gerais/ModalPortal";
import logo from "../../assets/logos/logo sem fundo.png";
import Etapas from "../../components/gerais/ObraEtapas";
import CronogramaObra from "../../components/obras/CronogramaObra";
import {
  Building,
  MapPin,
  ClipboardList,
  CalendarDays,
  Hourglass,
  UserRound,
  Camera,
  X,
  Handshake,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function useScrollFadeIn() {
  const [element, setElement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [element]);

  return { ref: setElement, isVisible };
}

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
  const { user } = useAuth();

  const [cliente, setCliente] = useState(null);
  const [obra, setObra] = useState(null);
  const [processo, setProcesso] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef(null);

  const animProcessos = useScrollFadeIn();
  const animProcPref = useScrollFadeIn();
  const animProcCaixa = useScrollFadeIn();
  const animProcFin = useScrollFadeIn();

  const animInfo = useScrollFadeIn();
  const animEtapas = useScrollFadeIn();

  const animMat = useScrollFadeIn();
  const animMao = useScrollFadeIn();
  const animExt = useScrollFadeIn();

  const isSomenteProcessos = user?.isSomenteProcesso === true;
  const modalidadeSlug = normalizarModalidade(obra?.modalidade);
  const exibirRelatorios = modalidadeSlug === "gestao";

  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [buscaExtrato, setBuscaExtrato] = useState("");
  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");
  const [secaoCliente, setSecaoCliente] = useState("resumo");
  const [subRelatorioCliente, setSubRelatorioCliente] = useState("materiais");
  const [historico, setHistorico] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [salvandoModalidade, setSalvandoModalidade] = useState(false);

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
                const todosClientes = await api.getClientesPorEscritorios([
                  ID_VOGELKOP,
                  ID_YBYOCA,
                ]);
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
    setSelectedFile(null);
    setPreviewUrl(cliente?.foto || null);
    setIsModalOpen(true);
  };

  const handleFecharModal = () => {
    if (uploadingFoto) return;
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleConfirmarUpload = async () => {
    if (!selectedFile) return alert("Por favor, escolha uma imagem primeiro!");

    const idParaSalvar =
      cliente?.id || (user?.tipo === "cliente" ? user.id : null);
    if (!idParaSalvar) return alert("Erro: ID do cliente não encontrado.");

    try {
      setUploadingFoto(true);
      const response = await api.uploadFotoCliente(
        idParaSalvar,
        selectedFile,
        cliente?.escritorio_id,
      );
      setCliente((prev) => ({
        ...prev,
        foto: response.fotoUrl,
        id: idParaSalvar,
      }));
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Falha ao salvar a foto.");
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const dadosPrefeitura = useMemo(() => {
    if (!processo) return [];
    return [
      [
        <span key="tipo-pmu" className="uppercase font-bold text-[#464C54]">
          {processo.tipo || "-"}
        </span>,
        <div
          key="status-pmu"
          className={`w-fit text-[14px] font-bold px-3 py-1 text-center rounded-[20px] ${getCorStatus(processo.status_pmu || "Prefeitura")}`}
        >
          {processo.status_pmu || "Prefeitura"}
        </div>,
        <span key="prot-pmu" className="font-semibold text-[#464C54]">
          {processo.protocolo_pmu || "-"}
        </span>,
        <span key="obs-pmu" className="font-semibold text-[#464C54]">
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
        <span key="eng" className="font-semibold text-[#464C54]">
          {processo.engenheiro || "-"}
        </span>,
        <span key="prot-caixa" className="font-semibold text-[#464C54]">
          {processo.protocolo_caixa || "-"}
        </span>,
        <span key="data-caixa" className="font-semibold text-[#464C54]">
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
        <span key="tipo-fin" className="uppercase font-bold text-[#464C54]">
          {processo.tipo || "-"}
        </span>,
        <div
          key="status-fin"
          className={`w-fit text-[14px] font-bold px-3 py-1 text-center rounded-[20px] ${getCorStatus(processo.status_fin || "Acompanhamento")}`}
        >
          {processo.status_fin || "Acompanhamento"}
        </div>,
        <span key="alvara" className="font-semibold text-[#464C54]">
          {processo.n_alvara || "-"}
        </span>,
        <span key="contrato" className="font-semibold text-[#464C54]">
          {processo.n_contrato || "-"}
        </span>,
        <span key="data-fin" className="font-semibold text-[#464C54]">
          {processo.data_ass_fin ? formatarDataBR(processo.data_ass_fin) : "-"}
        </span>,
      ],
    ];
  }, [processo]);

  const dadosMateriais = useMemo(() => {
    if (!obra || !obra.materiais) return [];
    let lista = [...obra.materiais];
    if (buscaMateriais) {
      lista = lista.filter((m) =>
        m.material?.toLowerCase().includes(buscaMateriais.toLowerCase()),
      );
    }
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
  }, [obra, buscaMateriais]);

  const dadosMaoDeObra = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];
    let lista = [...obra.maoDeObra];
    if (buscaMaoDeObra) {
      const term = buscaMaoDeObra.toLowerCase();
      lista = lista.filter(
        (m) =>
          m.tipo?.toLowerCase().includes(term) ||
          m.profissional?.toLowerCase().includes(term),
      );
    }
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
  }, [obra, buscaMaoDeObra]);

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
    if (!obra) return { materiais: 0, maoDeObra: 0, extrato: 0 };
    return {
      materiais: (obra.materiais || []).reduce(
        (acc, m) => acc + (parseFloat(m.valor) || 0),
        0,
      ),
      maoDeObra: (obra.maoDeObra || []).reduce(
        (acc, m) => acc + (parseFloat(m.valor_orcado) || 0),
        0,
      ),
      extrato: (obra.relatorioExtrato || []).reduce(
        (acc, item) => acc + (parseFloat(item.valor) || 0),
        0,
      ),
    };
  }, [obra]);

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
      <div className="flex justify-center items-center h-screen bg-[#EEEDF0]">
        <span className="font-bold text-[#71717A] flex items-center gap-2">
          <Hourglass className="w-5 h-5 animate-spin text-[#DC3B0B]" />
          Carregando dados...
        </span>
      </div>
    );
  }

  if (isSomenteProcessos && !processo) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#EEEDF0]">
        <span className="font-bold text-[#71717A]">
          Processo não encontrado.
        </span>
      </div>
    );
  }

  if (!isSomenteProcessos && !obra) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#EEEDF0]">
        <span className="font-bold text-[#71717A]">Obra não encontrada.</span>
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
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 flex flex-col items-center shadow-xl relative transition-all duration-300 transform scale-100 opacity-100">
              <button
                onClick={handleFecharModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
                disabled={uploadingFoto}
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-bold text-[#464C54] mb-6">
                Foto de Perfil
              </h2>
              <div className="relative w-[150px] h-[150px] rounded-full border-[3px] border-[#DC3B0B] flex items-center justify-center bg-[#f1f1f1] overflow-hidden mb-6 shadow-sm">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserRound className="w-[80px] h-[80px] text-[#DC3B0B]" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="w-full py-3 px-4 bg-[#EEEDF0] text-[#464C54] font-bold rounded-lg border border-[#DBDADE] hover:bg-gray-200 transition-colors mb-6 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                {selectedFile ? "Trocar Imagem" : "Escolher Imagem"}
              </button>
              <div className="w-full flex gap-3">
                <button
                  onClick={handleFecharModal}
                  disabled={uploadingFoto}
                  className="flex-1 py-3 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarUpload}
                  disabled={!selectedFile || uploadingFoto}
                  className={`flex-1 py-3 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 ${!selectedFile || uploadingFoto ? "bg-gray-300 cursor-not-allowed" : "bg-[#DC3B0B] hover:bg-[#b02f08]"}`}
                >
                  {uploadingFoto ? (
                    <Hourglass className="w-5 h-5 animate-spin" />
                  ) : (
                    "Salvar Foto"
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {isSomenteProcessos && (
        <div
          ref={animProcessos.ref}
          className={`w-[90%] flex flex-col items-center mb-[100px] md:mb-6 transition-all duration-500 ease-out transform ${animProcessos.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="w-full bg-white p-9 rounded-[12px] mt-[30px] flex flex-col items-start justify-center">
            <h2 className="text-5xl font-bold text-[#464C54]">Processos</h2>
            <div className="bg-[#ffffff] w-full border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] py-[24px] overflow-x-auto">
              <div
                ref={animProcPref.ref}
                className={`bg-[#ffffff] w-full rounded-[12px] text-center flex flex-col items-center gap-[24px] overflow-x-auto transition-all duration-500 ease-out transform ${animProcPref.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <h1 className="text-[30px] font-bold text-[#464C54]">
                  Prefeitura
                </h1>
                <TabelaSimples
                  colunas={["Tipo", "Status", "Protocolo", "OBS."]}
                  dados={dadosPrefeitura}
                />
              </div>
              <div className="w-full h-0.5 bg-[#DBDADE]"></div>

              <div
                ref={animProcCaixa.ref}
                className={`bg-[#ffffff] w-full rounded-[12px] text-center flex flex-col items-center gap-[24px] overflow-x-auto transition-all duration-500 ease-out transform ${animProcCaixa.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <h1 className="text-[30px] font-bold text-[#464C54]">Caixa</h1>
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
              <div className="w-full h-0.5 bg-[#DBDADE]"></div>

              <div
                ref={animProcFin.ref}
                className={`bg-[#ffffff] w-full rounded-[12px] text-center flex flex-col items-center gap-[24px] overflow-x-auto transition-all duration-500 ease-out transform ${animProcFin.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <h1 className="text-[30px] font-bold text-[#464C54]">
                  Finalizados
                </h1>
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
        <div
          id="#home"
          className=" flex w-full flex-col items-center justify-center gap-6 pb-24 md:mb-6 md:mt-0 md:pb-0"
        >
          <nav className="sticky top-0 z-40 mb-5 flex flex-row px-[5%] w-full rounded-b-2xl border border-slate-200/80 bg-white/95 p-3 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.55)] backdrop-blur">
            <div className="flex flex-col gap-3 w-full flex-row items-center justify-between">
              <div className="hidden items-center gap-2 lg:flex">
                <img
                  src={logo}
                  alt="Logo Montezuma"
                  className="h-10 w-auto rounded-lg border border-slate-200 bg-white p-1"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {obra?.cliente || "Cliente"}
                  </p>
                </div>
              </div>

              <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5">
                {[
                  { id: "resumo", label: "Resumo" },
                  { id: "etapas", label: "Etapas" },
                  { id: "cronograma", label: "Cronograma" },
                  ...(exibirRelatorios
                    ? [{ id: "relatorios", label: "Relatórios" }]
                    : []),
                ].map((aba) => {
                  const ativa = secaoCliente === aba.id;
                  return (
                    <button
                      key={aba.id}
                      type="button"
                      onClick={() => setSecaoCliente(aba.id)}
                      className={[
                        "min-h-[2.25rem] rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm",
                        ativa
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                          : "text-slate-500 hover:bg-white hover:text-slate-800",
                      ].join(" ")}
                    >
                      {aba.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleAbrirModal}
                title="Alterar foto de perfil"
                className="group self-end rounded-full p-0.5 ring-2 ring-slate-200/80 transition hover:ring-[#DC3B0B]/50 lg:self-auto"
              >
                {cliente?.foto ? (
                  <img
                    src={cliente.foto}
                    alt="Foto"
                    className="h-10 w-10 rounded-full object-cover transition group-hover:opacity-90 sm:h-11 sm:w-11"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 sm:h-11 sm:w-11">
                    <UserRound className="h-5 w-5 text-[#DC3B0B]" />
                  </div>
                )}
              </button>
            </div>
          </nav>

          <div className="w-[90%]">
            {secaoCliente === "resumo" ? (
              <>
                <div
                  ref={animInfo.ref}
                  className={`w-full rounded-2xl mb-6 justify-center items-center md:p-7 p-4 flex flex-col md:flex-row h-auto bg-gradient-to-b from-white to-slate-50/40 border border-slate-200/70 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] transition-all duration-500 ease-out transform ${isConstrucao ? "gap-6" : "gap-10"} ${animInfo.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-4xl bg-gradient-to-r from-[#DC3B0B]/75 via-[#EE5B11]/60 to-[#FBA51B]/55" />
                  <div className="w-full xl:w-[62%] md:w-[58%]">
                    <div className="mb-4 flex items-center gap-3">
                      <img
                        src={logo}
                        alt="Logo Montezuma"
                        className="hidden h-14 w-auto rounded-xl bg-white p-1 shadow-sm xl:block"
                      />
                      <div>
                        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
                          {obra?.cliente || "Cliente não informado"}
                        </h2>
                      </div>
                    </div>

                    <div className="mb-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {cliente?.tipo || obra?.clientes?.tipo || "Sem tipo"}
                      </span>
                      <span className="rounded-full border border-[#DC3B0B]/20 bg-[#DC3B0B]/10 px-3 py-1 text-xs font-semibold text-[#B93809] shadow-sm">
                        {cliente?.status ||
                          obra?.status ||
                          "Status não disponível"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <Building className="h-3.5 w-3.5 text-[#DC3B0B]" />
                          Nome do cliente
                        </p>
                        <p className="mt-1 text-sm font-semibold uppercase text-slate-800">
                          {obra?.cliente || "Não informado"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <MapPin className="h-3.5 w-3.5 text-[#DC3B0B]" />
                          Endereço da obra
                        </p>
                        <p className="mt-1 text-sm font-semibold uppercase text-slate-800">
                          {obra?.local || "Não informado"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5 text-[#DC3B0B]" />
                          Data de início
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatarDataBR(obra?.data)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <ClipboardList className="h-3.5 w-3.5 text-[#DC3B0B]" />
                          Total de etapas
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {(obra?.etapas_selecionadas || []).length} etapa(s)
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm md:col-span-2">
                        <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <Handshake className="h-3.5 w-3.5 text-[#DC3B0B]" />
                          Modalidade do projeto
                        </p>
                        {podeEditarModalidade ? (
                          <div className="mt-2">
                            <select
                              aria-label="Modalidade do projeto"
                              value={modalidadeSlug}
                              disabled={salvandoModalidade}
                              onChange={(e) =>
                                salvarModalidadeObra(e.target.value)
                              }
                              className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#DC3B0B]/40 focus:outline-none focus:ring-2 focus:ring-[#DC3B0B]/20 disabled:opacity-60"
                            >
                              <option value="empreitada">Empreitada</option>
                              <option value="gestao">Gestão</option>
                            </select>
                            <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                              Em Gestão, relatórios ficam disponíveis nesta
                              tela.
                            </p>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm font-semibold text-slate-800">
                            {rotuloModalidade(obra?.modalidade)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-[2px] w-[85%] md:h-[85%] md:w-[2px] bg-gradient-to-b from-[#DC3B0B]/20 via-[#DC3B0B]/60 to-[#DC3B0B]/20"></div>
                  <div className="w-full md:w-[30%] flex flex-col items-center justify-center mb-[30px] md:mb-0">
                    <div className="relative rounded-[50%]">
                      {cliente?.foto ? (
                        <img
                          src={cliente.foto}
                          alt="Cliente"
                          className="w-[150px] h-[150px] rounded-[50%] border-[3px] border-[#DC3B0B] object-cover"
                        />
                      ) : (
                        <div className="w-[150px] h-[150px] rounded-[50%] border-[3px] border-[#DC3B0B] flex items-center justify-center bg-[#f1f1f1]">
                          <UserRound className="w-[80px] h-[80px] text-[#DC3B0B]" />
                        </div>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold text-black mt-4 text-center">
                      {obra?.cliente || "Cliente não informado"}{" "}
                      {isReforma && "- Reforma"}
                    </h2>
                    <p className="text-sm text-[#919191] text-center">
                      {obra?.local || "Local não informada"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      <ClipboardList className="h-3.5 w-3.5 text-[#DC3B0B]" />
                      Status:{" "}
                      {cliente?.status || obra?.status || "Não definido"}
                    </div>
                  </div>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.45)]">
                  <h3 className="mb-5 text-[24px] font-bold text-[#464C54]">
                    Histórico da obra
                  </h3>
                  {loadingHistorico ? (
                    <p className="text-sm text-slate-500">
                      Carregando histórico...
                    </p>
                  ) : historico.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Nenhuma atualização registrada.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {historico.map((item) => (
                        <article
                          key={item.id}
                          className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50/90 to-white p-4 shadow-[0_10px_22px_-20px_rgba(15,23,42,0.55)]"
                        >
                          <span className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#DC3B0B]/70 to-[#EE5B11]/40" />
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                              {item.author_nome || "Equipe Montezuma"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatarDataHoraBR(item.created_at)}
                            </p>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-700">
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
                ref={animEtapas.ref}
                className={`rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.45)] transition-all duration-500 ease-out transform ${animEtapas.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              >
                <Etapas
                  etapas={obra?.etapas_selecionadas || []}
                  isCliente={user?.tipo === "cliente"}
                  isReforma={isReforma}
                />
              </div>
            ) : null}

            {secaoCliente === "cronograma" ? (
              <div id="#cronograma" className="mb-[24px]">
                <CronogramaObra
                  etapas={obra?.etapas_selecionadas || []}
                  obraId={id}
                  showLancarButton={false}
                />
              </div>
            ) : null}

            {exibirRelatorios && secaoCliente === "relatorios" ? (
              <div
                id="#relatorios"
                className="w-full flex flex-col mb-[24px] gap-4"
              >
                <div className="mb-1 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
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
                      label: "Extrato financeiro",
                      sub: "Movimentação consolidada",
                    },
                  ].map((opt) => {
                    const on = subRelatorioCliente === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSubRelatorioCliente(opt.id)}
                        className={[
                          "flex flex-col items-start gap-0.5 rounded-2xl border p-3 text-left shadow-sm transition sm:p-4",
                          on
                            ? "border-[#DC3B0B]/35 bg-gradient-to-b from-white to-slate-50 ring-1 ring-[#DC3B0B]/15"
                            : "border-slate-200 bg-white hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "text-sm font-semibold tracking-tight",
                            on ? "text-[#DC3B0B]" : "text-[#464C54]",
                          ].join(" ")}
                        >
                          {opt.label}
                        </span>
                        <span className="text-xs tracking-tight text-[#71717A]">
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {subRelatorioCliente === "materiais" ? (
                  <div
                    ref={animMat.ref}
                    className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.45)] flex flex-col gap-5 transition-all duration-500 ease-out transform ${animMat.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  >
                    <div
                      className={`flex ${isMobile ? "flex-col gap-3" : "justify-between items-center"}`}
                    >
                      <h2 className="text-[24px] font-bold text-[#464C54]">
                        Materiais
                      </h2>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <input
                          type="text"
                          placeholder="Buscar material..."
                          value={buscaMateriais}
                          onChange={(e) => setBuscaMateriais(e.target.value)}
                          className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none w-full md:w-[250px]"
                        />
                        <div className="h-[40px] justify-between px-4 border border-[#C4C4C9] rounded-[6px] flex items-center w-full whitespace-nowrap bg-gray-50">
                          Total Lançado:{" "}
                          <span className="font-bold ml-1 text-green-700">
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
                    ref={animMao.ref}
                    className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.45)] flex flex-col gap-5 transition-all duration-500 ease-out transform ${animMao.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  >
                    <div
                      className={`flex ${isMobile ? "flex-col gap-3" : "justify-between items-center"}`}
                    >
                      <h2 className="text-[24px] font-bold text-[#464C54]">
                        Mão de Obra
                      </h2>
                      <div className="flex flex-col md:flex-row items-center gap-4">
                        <input
                          type="text"
                          placeholder="Buscar serviço..."
                          value={buscaMaoDeObra}
                          onChange={(e) => setBuscaMaoDeObra(e.target.value)}
                          className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none w-full md:w-[250px]"
                        />
                        <div className="h-[40px] w-full justify-between px-4 border border-[#C4C4C9] rounded-[6px] flex items-center whitespace-nowrap bg-gray-50">
                          Total Lançado:{" "}
                          <span className="font-bold ml-1 text-green-700">
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
                    ref={animExt.ref}
                    className={`bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_16px_36px_-30px_rgba(15,23,42,0.45)] flex flex-col gap-5 transition-all duration-500 ease-out transform ${animExt.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  >
                    <div className="flex flex-col lg:flex-row gap-3 lg:justify-between lg:items-center">
                      <h2 className="text-[24px] font-bold text-[#464C54]">
                        Extrato Geral
                      </h2>
                      <div className="flex flex-col lg:flex-row gap-3 items-center">
                        <select
                          value={filtroExtrato}
                          onChange={(e) => setFiltroExtrato(e.target.value)}
                          className="h-[40px] w-full border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="Tudo">Todos</option>
                          <option value="Materiais">Materiais</option>
                          <option value="Mão de Obra">Mão de Obra</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Buscar no extrato..."
                          value={buscaExtrato}
                          onChange={(e) => setBuscaExtrato(e.target.value)}
                          className="h-[40px] w-full border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none lg:w-[250px]"
                        />
                        <div className="h-[40px] w-full px-4 border border-[#C4C4C9] rounded-[6px] flex items-center whitespace-nowrap bg-gray-50">
                          Total Extrato:{" "}
                          <span className="font-bold ml-1 text-green-700">
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
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
