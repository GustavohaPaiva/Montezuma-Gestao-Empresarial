import { useEffect, useState, useMemo } from "react";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

// --- Funções Auxiliares de Formatação ---
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

  const [obra, setObra] = useState(null);
  const [processo, setProcesso] = useState(null); // Usado quando é somente processo
  const [carregando, setCarregando] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const isSomenteProcessos = user?.isSomenteProcesso === true;

  // --- Filtros de Visualização Relatórios ---
  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [buscaExtrato, setBuscaExtrato] = useState("");
  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");

  // --- Busca de Dados ---
  useEffect(() => {
    if (!id) return;

    const carregarDados = async () => {
      setCarregando(true);
      try {
        if (isSomenteProcessos) {
          // Busca direto na tabela de clientes
          const dadosCliente = await api.getClienteById(id);
          if (dadosCliente) {
            setProcesso(dadosCliente);
          }
        } else {
          // Busca a obra completa
          const dadosObra = await api.getObraById(id);
          if (dadosObra) {
            setObra(dadosObra);
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
  }, [id, isSomenteProcessos]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ==========================================================
  // BLOCO 1: DADOS PARA A TELA "SOMENTE PROCESSOS" (LEITURA)
  // ==========================================================
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

  // ==========================================================
  // BLOCO 2: DADOS PARA A TELA "OBRAS" (RELATÓRIOS)
  // ==========================================================
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

  // ==========================================================
  // RENDERIZAÇÃO
  // ==========================================================
  if (carregando) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#EEEDF0]">
        <span className="font-bold text-[#71717A]">Carregando dados...</span>
      </div>
    );
  }

  // Se for Somente Processo mas não achou o processo
  if (isSomenteProcessos && !processo) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#EEEDF0]">
        <span className="font-bold text-[#71717A]">
          Processo não encontrado.
        </span>
      </div>
    );
  }

  // Se for Obra mas não achou a obra
  if (!isSomenteProcessos && !obra) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#EEEDF0]">
        <span className="font-bold text-[#71717A]">Obra não encontrada.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0]">
      {/* RENDERIZAÇÃO 1: CLIENTE DE PROCESSO VÊ AS 3 TABELAS (Prefeitura, Caixa, Finalizados) */}
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

      {/* RENDERIZAÇÃO 2: CLIENTE DE OBRA VÊ OS RELATÓRIOS (Materiais, MDO, Extrato) */}
      {!isSomenteProcessos && (
        <main
          id="relatorios"
          className="w-[90%] mt-[24px] flex flex-col gap-[24px] mb-[100px] md:mb-6"
        >
          {/* TABELA MATERIAIS */}
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

          {/* TABELA MÃO DE OBRA */}
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
              colunas={["Validação", "Tipo", "Profissional", "Valor", "Data"]}
              dados={dadosMaoDeObra}
            />
          </div>

          {/* TABELA EXTRATO */}
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
        </main>
      )}
    </div>
  );
}
