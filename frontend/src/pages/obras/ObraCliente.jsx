import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import logo from "../../assets/logos/logo sem fundo.png";
import Etapas from "../../components/gerais/ObraEtapas";
import ListaEtapas from "../../components/obras/ListaEtapas";
import { Icon } from "lucide-react";
import { stairs } from "@lucide/lab";

import {
  Building,
  MapPin,
  ClipboardList,
  House,
  CircleDollarSign,
  Hourglass,
  ClipboardPlus,
  UserRound,
  Camera,
  X,
} from "lucide-react";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const formatarDataBR = (dataString) => {
  if (!dataString) return "-";
  const [ano, mes, dia] = dataString.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
};

const formatarMoeda = (valor) => {
  const valorNumerico = parseFloat(valor) || 0;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorNumerico);
};

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
  const [categoriaAtiva, setCategoriaAtiva] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef(null);

  const isSomenteProcessos = user?.isSomenteProcesso === true;

  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [buscaExtrato, setBuscaExtrato] = useState("");
  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");

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
                const todosClientes = await api.getClientes();
                const donoDaObra = todosClientes.find(
                  (c) =>
                    c.nome?.toLowerCase() === dadosObra.cliente?.toLowerCase(),
                );
                if (donoDaObra) {
                  setCliente(donoDaObra);
                } else {
                  console.warn(
                    "Cliente não encontrado na base de clientes com o nome:",
                    dadosObra.cliente,
                  );
                }
              } catch (e) {
                console.warn(
                  "Aviso: Falha ao buscar lista de clientes. Usando fallback.",
                  e,
                );
              }
            }
          }
        }
      } catch (err) {
        console.error("ERRO AO BUSCAR DADOS:", err);
        setObra({ materiais: [], maoDeObra: [], relatorioExtrato: [] });
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
    if (!selectedFile) {
      alert(
        "Por favor, escolha uma imagem primeiro antes de clicar em salvar!",
      );
      return;
    }

    const idParaSalvar =
      cliente?.id || (user?.tipo === "cliente" ? user.id : null);

    if (!idParaSalvar) {
      alert(
        "Erro: O sistema não encontrou o ID do cliente para salvar a foto. Verifique a consola.",
      );
      return;
    }

    try {
      setUploadingFoto(true);

      const response = await api.uploadFotoCliente(idParaSalvar, selectedFile);

      setCliente((prev) => ({
        ...prev,
        foto: response.fotoUrl,
        id: idParaSalvar,
      }));
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert(
        "Falha ao salvar a foto. Verifique se a sua api.js está configurada certinho.",
      );
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

  const dataGrafico = useMemo(() => {
    const paletaCores = ["#860000", "#EE5B11", "#F67D15", "#FBA51B", "#FDC626"];
    const totalGeral = totais.materiais + totais.maoDeObra;
    const dados = [
      {
        name: "Materiais",
        value: totais.materiais,
        qtd: obra?.materiais?.length || 0,
      },
      {
        name: "Mão de Obra",
        value: totais.maoDeObra,
        qtd: obra?.maoDeObra?.length || 0,
      },
    ];
    dados.sort((a, b) => b.value - a.value);
    return dados.map((d, index) => {
      const percentual =
        totalGeral > 0 ? ((d.value / totalGeral) * 100).toFixed(0) : 0;
      return {
        ...d,
        percentual,
        color: paletaCores[index] || paletaCores[paletaCores.length - 1],
      };
    });
  }, [totais, obra]);

  const toggleCategoria = (nome) => {
    setCategoriaAtiva((prev) => (prev === nome ? null : nome));
  };

  if (carregando) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#EEEDF0]">
        <span className="font-bold text-[#71717A]">Carregando dados...</span>
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

  const handleScroll = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0]">
      {/* Input oculto para carregar a foto isolado para o modal */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* MODAL DE UPLOAD DE FOTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 flex flex-col items-center shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
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
      )}

      {/* RENDERIZAÇÃO 1: APENAS PROCESSOS */}
      {isSomenteProcessos && (
        <div className="w-[90%] flex flex-col items-center mb-[100px] md:mb-6">
          <div className="w-full bg-white p-9 rounded-[12px] mt-[30px] flex flex-col items-start justify-center">
            <h2 className="text-5xl font-bold text-[#464C54]">Processos</h2>
            <div className="bg-[#ffffff] w-full border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] py-[24px] overflow-x-auto">
              <div className="bg-[#ffffff] w-full rounded-[12px] text-center flex flex-col items-center gap-[24px] overflow-x-auto">
                <h1 className="text-[30px] font-bold text-[#464C54]">
                  Prefeitura
                </h1>
                <TabelaSimples
                  colunas={["Tipo", "Status", "Protocolo", "OBS."]}
                  dados={dadosPrefeitura}
                />
              </div>

              <div className="w-full h-0.5 bg-[#DBDADE]"></div>

              <div className="bg-[#ffffff] w-full rounded-[12px] text-center flex flex-col items-center gap-[24px] overflow-x-auto">
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

              <div className="bg-[#ffffff] w-full rounded-[12px] text-center flex flex-col items-center gap-[24px] overflow-x-auto">
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

      {/* RENDERIZAÇÃO 2: OBRA COMPLETA (RELATÓRIOS E GRÁFICOS) */}
      {!isSomenteProcessos && (
        <div
          id="#home"
          className="w-full flex flex-col gap-[24px] md:mb-6 mt-6 md:mt-0 justify-center items-center"
        >
          {/* HEADER DESKTOP */}
          <header className="hidden md:flex h-[65px] sticky z-50 border-[#DBDADE] justify-center top-0 w-full shadow-md bg-[#EEEDF0]">
            <div className="w-full flex items-center justify-center">
              <ul className="w-full flex justify-around items-center gap-6 list-none m-0 p-0">
                <a href="#home" onClick={(e) => handleScroll(e, "#home")}>
                  <li className="text-2xl hover:text-[#DC3B0B] hover:underline active:text-[#DC3B0B] cursor-pointer">
                    Inicio
                  </li>
                </a>
                <a
                  href="#financeiro"
                  onClick={(e) => handleScroll(e, "#financeiro")}
                >
                  <li className="text-2xl hover:text-[#DC3B0B] hover:underline active:text-[#DC3B0B] cursor-pointer">
                    Financeiro
                  </li>
                </a>

                <a href="#etapas" onClick={(e) => handleScroll(e, "#etapas")}>
                  <li className="text-2xl hover:text-[#DC3B0B] hover:underline active:text-[#DC3B0B] cursor-pointer">
                    Etapas
                  </li>
                </a>

                <a
                  href="#relatorios"
                  onClick={(e) => handleScroll(e, "#relatorios")}
                >
                  <li className="text-2xl hover:text-[#DC3B0B] hover:underline active:text-[#DC3B0B] cursor-pointer">
                    Relatorios
                  </li>
                </a>

                {/* Botão de abrir modal no Desktop */}
                <li
                  className="relative cursor-pointer group"
                  onClick={handleAbrirModal}
                  title="Alterar foto de perfil"
                >
                  {cliente?.foto ? (
                    <img
                      src={cliente.foto}
                      alt="Foto Cliente"
                      className="w-[50px] h-[50px] rounded-[50%] border-2 border-[#DC3B0B] object-cover group-hover:opacity-70 transition-opacity"
                    />
                  ) : (
                    <div className="w-[50px] h-[50px] rounded-[50%] border-2 border-[#DC3B0B] flex items-center justify-center bg-[#f1f1f1] group-hover:opacity-70 transition-opacity">
                      <UserRound className="w-[30px] h-[30px] text-[#DC3B0B]" />
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </header>

          <div className="w-[90%]">
            {/* INFORMAÇÕES DO CLIENTE / OBRA */}
            <div className="w-full rounded-[12px] gap-[50px] mb-[24px] items-center md:p-[24px] p-[10px] flex flex-col md:flex-row h-auto bg-white shadow-sm">
              <div>
                <img
                  src={logo}
                  alt="Logo Montezuma"
                  className="xl:w-[280px] xl:flex hidden mr-[20px]"
                />
              </div>
              <div className="w-full xl:w-[35%] md:w-[50%] md:px-2 px-[8%]">
                <div className="flex flex-col md:items-start items-center">
                  <h2 className="text-5xl text-black mb-[10px] md:mb-0">
                    Montezuma
                  </h2>
                  <div className="w-full">
                    <div className="mt-[25px] flex gap-2">
                      <div className="w-10 h-10 shadow-sm bg-[#f1f1f1] flex items-center justify-center rounded-[8px]">
                        <Building className="w-8 h-8 text-[#DC3B0B]" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[#919191] text-[14px]">Nome:</p>
                        <p className="text-[16px] uppercase font-medium">
                          {obra?.cliente || "Nome não disponível"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-[25px] flex gap-2">
                      <div className="w-10 h-10 shadow-sm bg-[#f1f1f1] flex items-center justify-center rounded-[8px]">
                        <MapPin className="w-8 h-8 text-[#DC3B0B]" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[#919191] text-[14px]">Endereço:</p>
                        <p className="text-[16px] uppercase">
                          {obra?.local || "Endereço não disponível"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-[25px] flex gap-2">
                      <div className="w-10 h-10 shadow-sm bg-[#f1f1f1] flex items-center justify-center rounded-[8px]">
                        <ClipboardList className="w-8 h-8 text-[#DC3B0B]" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-[#919191] text-[14px]">
                          Status do Projeto:
                        </p>
                        <p className="text-[16px] uppercase">
                          {cliente?.status ||
                            "Status do projeto nao disponiveis"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[3px] w-[85%] md:h-[85%] md:w-[3px] bg-[#DC3B0B] "></div>

              <div className="w-full md:w-[30%] flex flex-col items-center justify-center mb-[30px] md:mb-0">
                {/* Card fixo da foto */}
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
                  {obra?.cliente || "Cliente não informado"}
                </h2>
                <p className="text-sm text-[#919191] text-center">
                  {obra?.local || "Local não informada"}
                </p>
              </div>
            </div>

            {/* CONTROLE FINANCEIRO (LAYOUT DINÂMICO GRÁFICO / RESUMO) */}
            <div
              id="#financeiro"
              className="w-full bg-white h-auto rounded-[12px] mb-[24px] p-[24px] shadow-sm relative overflow-hidden"
            >
              <h2 className="text-[24px] font-bold text-[#464C54] mb-[20px]">
                Resumo Financeiro
              </h2>
              <div
                className={`flex flex-col md:flex-row gap-[20px] transition-all duration-700 ease-in-out ${categoriaAtiva ? "md:h-[320px]" : "md:h-[280px] items-center justify-center"}`}
              >
                {/* Lado Esquerdo */}
                <div
                  className={`flex flex-col transition-all duration-700 ease-in-out h-full ${categoriaAtiva ? "w-full md:w-[60%] justify-between" : "w-full md:w-[50%] justify-center items-center"}`}
                >
                  <div
                    className={`w-full transition-all duration-700 ease-in-out overflow-hidden ${categoriaAtiva ? "max-h-[250px] opacity-100 mb-4" : "max-h-0 opacity-0"}`}
                  >
                    {categoriaAtiva &&
                      (() => {
                        const ativo = dataGrafico.find(
                          (d) => d.name === categoriaAtiva,
                        );
                        return (
                          <div className="bg-[#f6f6f6] border border-[#f1f1f1] rounded-[8px] p-5 shadow-sm h-auto">
                            <h3 className="text-xl font-bold text-[#464C54] mb-2 uppercase">
                              Visão: {ativo.name}
                            </h3>
                            <div className="flex flex-col md:flex-row md:items-end gap-3 mb-3">
                              <span
                                className="text-4xl font-bold"
                                style={{ color: ativo.color }}
                              >
                                R$ {formatarMoeda(ativo.value)}
                              </span>
                              <span className="text-sm font-medium text-[#919191] mb-1">
                                ({ativo.percentual}% do custo total da obra)
                              </span>
                            </div>
                            <p className="text-sm text-[#71717A] leading-relaxed">
                              Este painel consolida todos os gastos referentes a{" "}
                              <strong>{ativo.name.toLowerCase()}</strong>. Até o
                              momento, foram registrados{" "}
                              <strong className="text-black">
                                {ativo.qtd}
                              </strong>{" "}
                              lançamentos.
                            </p>
                          </div>
                        );
                      })()}
                  </div>

                  <div
                    className={`transition-all duration-700 ease-in-out ${categoriaAtiva ? "w-[140px] h-[140px] self-start" : "w-full h-[250px] md:h-full flex justify-center"}`}
                  >
                    {totais.materiais > 0 || totais.maoDeObra > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dataGrafico}
                            cx="50%"
                            cy="50%"
                            outerRadius={categoriaAtiva ? 65 : 120}
                            dataKey="value"
                            stroke="none"
                            onClick={(e, index) =>
                              toggleCategoria(dataGrafico[index].name)
                            }
                            className="cursor-pointer outline-none"
                          >
                            {dataGrafico.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                style={{
                                  filter: `drop-shadow(0px 0px ${categoriaAtiva ? "4px" : "8px"} ${entry.color}99)`,
                                  opacity:
                                    categoriaAtiva &&
                                    categoriaAtiva !== entry.name
                                      ? 0.3
                                      : 1,
                                  transition: "opacity 0.4s ease",
                                }}
                              />
                            ))}
                          </Pie>
                          {!categoriaAtiva && (
                            <Tooltip
                              formatter={(value) =>
                                `R$ ${formatarMoeda(value)}`
                              }
                            />
                          )}
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full w-full text-[#919191] italic">
                        Sem dados suficientes para gerar o gráfico.
                      </div>
                    )}
                  </div>
                </div>

                {/* Lado Direito */}
                <div
                  className={`flex flex-col justify-center transition-all duration-700 ease-in-out w-full md:w-[40%]`}
                >
                  <div className="flex flex-col w-full bg-[#fcfcfc] border border-[#f1f1f1] rounded-[8px] shadow-sm z-10 relative">
                    {dataGrafico.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => toggleCategoria(item.name)}
                        className={`flex justify-between items-center py-3 border-b border-[#f1f1f1] last:border-b-0 cursor-pointer transition-all duration-300 rounded-md px-2 ${categoriaAtiva === item.name ? "bg-[#EEEDF0] scale-[1.02] shadow-sm" : "hover:bg-gray-50"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: item.color,
                              boxShadow: `0 0 10px ${item.color}`,
                              opacity:
                                categoriaAtiva && categoriaAtiva !== item.name
                                  ? 0.4
                                  : 1,
                            }}
                          ></div>
                          <span
                            className={`font-medium text-sm transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#a1a1a1]" : "text-[#464C54]"}`}
                          >
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-semibold text-sm transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#a1a1a1]" : "text-[#464C54]"}`}
                          >
                            R$ {formatarMoeda(item.value)}
                          </span>
                          <span
                            className={`text-xs font-medium w-[35px] text-right transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#d1d1d1]" : "text-[#919191]"}`}
                          >
                            {item.percentual}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="bg-[#EEEDF0] border border-[#DBDADE] rounded-[8px] p-[8px] flex justify-between items-center shadow-sm mt-4 w-full cursor-pointer hover:bg-[#e4e3e6] transition-colors"
                    onClick={() => setCategoriaAtiva(null)}
                  >
                    <span className="font-bold text-black uppercase text-sm">
                      Custo Total
                    </span>
                    <span className="font-bold text-[#2E7D32] text-lg">
                      R$ {formatarMoeda(totais.materiais + totais.maoDeObra)}
                    </span>
                  </div>

                  <div
                    className={`text-center mt-3 transition-all duration-500 ${categoriaAtiva ? "opacity-100 max-h-[30px]" : "opacity-0 max-h-0"}`}
                  >
                    <button
                      onClick={() => setCategoriaAtiva(null)}
                      className="text-xs text-[#DC3B0B] underline font-medium cursor-pointer"
                    >
                      Restaurar gráfico completo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Etapas */}

            <div id="#etapas">
              <Etapas etapas={obra?.etapas_selecionadas || []} />
            </div>

            {/* TABELAS INFERIORES */}
            <div
              id="#relatorios"
              className="w-full flex flex-col mb-[24px] gap-[24px]"
            >
              <div className="bg-white border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm flex flex-col gap-[20px]">
                <div
                  className={`flex ${isMobile ? "flex-col gap-3" : "justify-between items-center"}`}
                >
                  <h2 className="text-[24px] font-bold text-[#464C54]">
                    Materiais
                  </h2>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Buscar material..."
                      value={buscaMateriais}
                      onChange={(e) => setBuscaMateriais(e.target.value)}
                      className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none w-full md:w-[250px]"
                    />
                    <div className="h-[40px] px-4 border border-[#C4C4C9] rounded-[6px] flex items-center whitespace-nowrap bg-gray-50">
                      Total:{" "}
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

              <div className="bg-white border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm flex flex-col gap-[20px]">
                <div
                  className={`flex ${isMobile ? "flex-col gap-3" : "justify-between items-center"}`}
                >
                  <h2 className="text-[24px] font-bold text-[#464C54]">
                    Mão de Obra
                  </h2>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      placeholder="Buscar serviço..."
                      value={buscaMaoDeObra}
                      onChange={(e) => setBuscaMaoDeObra(e.target.value)}
                      className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none w-full md:w-[250px]"
                    />
                    <div className="h-[40px] px-4 border border-[#C4C4C9] rounded-[6px] flex items-center whitespace-nowrap bg-gray-50">
                      Total:{" "}
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

              <div className="bg-white border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm flex flex-col gap-[20px]">
                <div
                  className={`flex ${isMobile ? "flex-col gap-3" : "justify-between items-center"}`}
                >
                  <h2 className="text-[24px] font-bold text-[#464C54]">
                    Extrato Geral
                  </h2>
                  <div
                    className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-3 items-center`}
                  >
                    <select
                      value={filtroExtrato}
                      onChange={(e) => setFiltroExtrato(e.target.value)}
                      className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none bg-white cursor-pointer"
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
                      className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none w-full md:w-[250px]"
                    />
                    <div className="h-[40px] px-4 border border-[#C4C4C9] rounded-[6px] flex items-center whitespace-nowrap bg-gray-50">
                      Total:{" "}
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
            </div>

            {/* Lista de Etapas */}

            <ListaEtapas
              etapas={obra.etapas_selecionadas}
              isCliente={user?.tipo === "cliente"}
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

          {/* HEADER MOBILE */}
          <header className="h-[70px] items-center md:hidden shadow-[0_-4px_8px_rgba(0,0,0,0.3)] fixed z-50 border-[#DBDADE] flex justify-center bottom-0 w-full bg-[#EEEDF0]">
            <div className="w-full flex items-center justify-center">
              <ul className="w-full flex justify-around items-center gap-6 list-none m-0 p-0">
                <a href="#home" onClick={(e) => handleScroll(e, "#home")}>
                  <li className="text-2xl hover:text-[#DC3B0B] cursor-pointer">
                    <House />
                  </li>
                </a>
                <a
                  href="#financeiro"
                  onClick={(e) => handleScroll(e, "#financeiro")}
                >
                  <li className="text-2xl hover:text-[#DC3B0B] cursor-pointer">
                    <CircleDollarSign />
                  </li>
                </a>

                <a href="#etapas" onClick={(e) => handleScroll(e, "#etapas")}>
                  <li className="text-2xl hover:text-[#DC3B0B] cursor-pointer">
                    <Icon iconNode={stairs} />
                  </li>
                </a>
                <a
                  href="#relatorios"
                  onClick={(e) => handleScroll(e, "#relatorios")}
                >
                  <li className="text-2xl hover:text-[#DC3B0B] cursor-pointer">
                    <ClipboardPlus />
                  </li>
                </a>

                {/* Botão de abrir modal no Mobile */}
                <li
                  className="relative cursor-pointer group"
                  onClick={handleAbrirModal}
                  title="Alterar foto de perfil"
                >
                  {cliente?.foto ? (
                    <img
                      src={cliente.foto}
                      alt="Foto Cliente"
                      className="w-[32px] h-[32px] rounded-[50%] border-2 border-[#DC3B0B] object-cover group-hover:opacity-70 transition-opacity"
                    />
                  ) : (
                    <div className="w-[32px] h-[32px] rounded-[50%] border-2 border-[#DC3B0B] flex items-center justify-center bg-[#f1f1f1] group-hover:opacity-70 transition-opacity">
                      <UserRound className="w-[20px] h-[20px] text-[#DC3B0B]" />
                    </div>
                  )}
                </li>
              </ul>
            </div>
          </header>
        </div>
      )}
    </div>
  );
}
