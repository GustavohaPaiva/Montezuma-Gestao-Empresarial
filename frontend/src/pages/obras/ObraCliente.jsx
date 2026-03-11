import { useEffect, useState, useMemo } from "react";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import { useParams } from "react-router-dom";
import { api } from "../../services/api";
import CardProcessos from "../../components/cards/CardProcessos";
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

export default function ObraCliente() {
  const { id } = useParams();

  const [obra, setObra] = useState(null);
  const [, setCliente] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // --- Filtros de Visualização ---
  const [buscaMateriais, setBuscaMateriais] = useState("");
  const [buscaMaoDeObra, setBuscaMaoDeObra] = useState("");
  const [buscaExtrato, setBuscaExtrato] = useState("");
  const [filtroExtrato, setFiltroExtrato] = useState("Tudo");

  // --- Busca de Dados ---
  useEffect(() => {
    if (!id) return;

    const carregarDados = async () => {
      try {
        const dadosObra = await api.getObraById(id);

        if (dadosObra) {
          setObra(dadosObra);

          if (dadosObra.cliente) {
            const dadosCliente = await api.getClienteById(dadosObra.cliente);
            setCliente(dadosCliente);
          }
        }
      } catch (err) {
        console.error("ERRO AO BUSCAR DADOS DA OBRA/CLIENTE:", err);
      }
    };

    carregarDados();
  }, [id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- PREPARAÇÃO DOS DADOS: PROCESSOS (SOMENTE LEITURA) ---
  const processosProcessados = useMemo(() => {
    if (!obra || !obra.processos) return [];
    return obra.processos;
  }, [obra]);

  // --- PREPARAÇÃO DOS DADOS: MATERIAIS ---
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
      const statusA = a.status || "Solicitado";
      const statusB = b.status || "Solicitado";
      const pesoA = ordemStatus[statusA] || 99;
      const pesoB = ordemStatus[statusB] || 99;

      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }
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
          className={`text-[12px] font-bold px-3 py-1 rounded-[20px] inline-block ${
            m.status === "Entregue"
              ? "bg-[#E8F5E9] text-[#2E7D32]"
              : "bg-[#FFF3E0] text-[#E65100]"
          }`}
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

  // --- PREPARAÇÃO DOS DADOS: MÃO DE OBRA ---
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

    lista.sort((a, b) => {
      const valA = a.validacao === 1 ? 1 : 0;
      const valB = b.validacao === 1 ? 1 : 0;
      return valA - valB;
    });

    return lista.map((m) => [
      <div key={`val-${m.id}`} className="flex justify-center items-center">
        <input
          type="checkbox"
          checked={m.validacao === 1}
          readOnly
          onClick={(e) => e.preventDefault()}
          className={`h-[18px] w-[18px] cursor-default ${
            m.validacao === 1 ? "accent-[#00C853]" : ""
          }`}
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

  // --- PREPARAÇÃO DOS DADOS: EXTRATO ---
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

      if (isPagoA !== isPagoB) {
        return isPagoA ? 1 : -1;
      }
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
        className={`text-[12px] font-bold px-3 py-1 rounded-[20px] inline-block ${
          item.status_financeiro === "Pago"
            ? "bg-[#E8F5E9] text-[#2E7D32]"
            : "bg-[#FFF3E0] text-[#E65100]"
        }`}
      >
        {item.status_financeiro || "Aguardando"}
      </div>,
      formatarDataBR(item.data),
    ]);
  }, [obra, buscaExtrato, filtroExtrato]);

  // --- CÁLCULO DE TOTAIS ---
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

  if (!obra) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#EEEDF0]">
        <span className="font-bold text-[#71717A]">
          Carregando dados da obra...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0]">
      {/* PROCESSOS - APENAS LEITURA */}
      <div className="w-[90%] bg-white h-auto mt-[24px] rounded-[12px] p-[24px] shadow-sm">
        <h2 className="text-[24px] font-bold text-[#464C54]">Processos</h2>
        <main className="w-[full] mt-[40px] flex flex-col gap-6">
          {processosProcessados.length > 0 ? (
            <div className="grid w-full md:grid-cols-[repeat(auto-fit,minmax(0,380px))] gap-[30px] justify-center md:justify-start">
              {processosProcessados.map((item) => (
                <CardProcessos
                  key={item.id}
                  id={item.id}
                  client={item.nome}
                  tipo={item.tipo}
                  status={item.status}
                />
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center w-full h-[100px] text-gray-500 font-medium">
              Nenhum processo vinculado à obra até o momento.
            </div>
          )}
        </main>
      </div>

      {/* MAIN CONTENT RELATÓRIOS */}
      <main
        id="relatorios"
        className="w-[90%] mt-[24px] flex flex-col gap-[24px] mb-[100px] md:mb-6"
      >
        {/* --- TABELA MATERIAIS --- */}
        <div className="bg-white border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm flex flex-col gap-[20px]">
          <div
            className={`flex ${isMobile ? "flex-col gap-3" : "justify-between items-center"}`}
          >
            <h2 className="text-[24px] font-bold text-[#464C54]">Materiais</h2>
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

        {/* --- TABELA MÃO DE OBRA --- */}
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

        {/* --- TABELA EXTRATO --- */}
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
    </div>
  );
}
