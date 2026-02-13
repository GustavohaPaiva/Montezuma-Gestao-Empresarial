import { useState, useEffect } from "react";
import { api } from "../services/api";
import TabelaSimples from "../components/TabelaSimples";
import Navbar from "../components/Navbar";
import { Calendar, Search } from "lucide-react"; // Adicionei o ícone Search

export default function Projetos() {
  // 1. TODOS os estados devem ficar no topo do componente
  const [orcamentos, setOrcamentos] = useState([]);
  const [filtroData, setFiltroData] = useState({ inicio: "", fim: "" });
  const [buscaOrcamento, setBuscaOrcamento] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        const dados = await api.getOrcamentos();
        setOrcamentos(dados || []);
      } catch (error) {
        console.error("Erro ao carregar orçamentos:", error);
      }
    }
    carregarDados();
  }, []);

  // 2. Lógica de Filtro (Data + Busca por Texto)
  const orcamentosFiltrados = orcamentos.filter((item) => {
    // --- Filtro de Data ---
    let dentroDoPrazo = true;
    if (filtroData.inicio && filtroData.fim) {
      const dataItem = new Date(item.data).getTime();
      const dataInicio = new Date(filtroData.inicio).getTime();
      const dataFim = new Date(filtroData.fim).getTime();
      dentroDoPrazo = dataItem >= dataInicio && dataItem <= dataFim;
    }

    // --- Filtro de Busca (Texto) ---
    let correspondeBusca = true;
    if (buscaOrcamento) {
      const termo = buscaOrcamento.toLowerCase();
      // Verifica se o termo existe no Nome do Cliente ou no Status
      const nome = item.nome ? item.nome.toLowerCase() : "";
      const status = item.status ? item.status.toLowerCase() : "";

      correspondeBusca = nome.includes(termo) || status.includes(termo);
    }

    // Retorna verdadeiro apenas se passar nos dois filtros
    return dentroDoPrazo && correspondeBusca;
  });

  // Mapeamento dos dados para a tabela
  const dadosTabela = orcamentosFiltrados.map((o) => [
    o.nome,
    `R$ ${parseFloat(o.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    new Date(o.data).toLocaleDateString("pt-BR"),
    o.status,
  ]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-center">
      <Navbar />
      <div className="w-full px-[5%] box-border">
        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
          <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
            <h1 className="text-[30px] md:text-[40px] font-bold text-[#464C54]">
              Orçamentos
            </h1>

            <div className="flex flex-col md:flex-row items-center gap-[12px] bg-white p-2 rounded-lg shadow-sm px-4 py-2 border border-[#F0F0F2]">
              {/* Ícone de Lupa para indicar busca */}
              <Search size={18} className="text-[#71717A]" />

              <div className="flex flex-col md:flex-row items-center gap-[8px]">
                <input
                  type="text"
                  placeholder="Buscar cliente ou status..."
                  value={buscaOrcamento}
                  onChange={(e) => setBuscaOrcamento(e.target.value)}
                  className="h-[40px] w-full md:w-[250px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54] px-[8px]"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="outline-none text-[15px] text-[#71717A] bg-transparent border border-[1.5px] text-center rounded-[8px] h-[35px] px-2"
                    onChange={(e) =>
                      setFiltroData({ ...filtroData, inicio: e.target.value })
                    }
                  />
                  <span className="text-[#71717A] text-xs"> até </span>
                  <input
                    type="date"
                    className="outline-none text-[15px] text-[#71717A] bg-transparent border border-[1.5px] text-center rounded-[8px] h-[35px] px-2"
                    onChange={(e) =>
                      setFiltroData({ ...filtroData, fim: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {orcamentos.length > 0 ? (
            <TabelaSimples
              // Ajustei as colunas para bater com os dados que você está enviando no map acima
              colunas={["Cliente", "Valor", "Data", "Status"]}
              dados={dadosTabela}
            />
          ) : (
            <div className="text-center py-10 text-gray-500">
              Nenhum orçamento encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
