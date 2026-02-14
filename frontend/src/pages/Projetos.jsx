import { useState, useEffect } from "react"; // Removemos useCallback
import { api } from "../services/api";
import TabelaSimples from "../components/TabelaSimples";
import Navbar from "../components/Navbar";
import ButtonDefault from "../components/ButtonDefault";
import ModalOrcamento from "../components/ModalOrcamento";

export default function Projetos() {
  const [orcamentos, setOrcamentos] = useState([]);
  const [filtroData, setFiltroData] = useState({ inicio: "", fim: "" });
  const [buscaOrcamento, setBuscaOrcamento] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  // ESTADO GATILHO: Serve apenas para forçar o useEffect a rodar novamente
  const [recarregar, setRecarregar] = useState(0);

  // Solução Definitiva: A função fica dentro do useEffect
  useEffect(() => {
    async function fetchDados() {
      try {
        const dados = await api.getOrcamentos();
        setOrcamentos(dados || []);
      } catch (error) {
        console.error("Erro ao carregar orçamentos:", error);
      }
    }

    fetchDados();
  }, [recarregar]); // O array de dependências "assiste" o número mudar

  async function handleSalvarOrcamento(novoItem) {
    try {
      const orcamentoParaSalvar = {
        nome: novoItem.nome,
        valor: novoItem.valor,
        data: new Date().toISOString(),
        status: "Pendente",
      };

      await api.createOrcamento(orcamentoParaSalvar);

      setModalAberto(false);

      // AQUI ESTÁ O TRUQUE:
      // Ao invés de chamar a função de carga, mudamos o estado do gatilho.
      // Isso faz o useEffect rodar novamente automaticamente.
      setRecarregar((prev) => prev + 1);
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      alert("Erro ao salvar. Verifique o console.");
    }
  }

  const orcamentosFiltrados = orcamentos.filter((item) => {
    let dentroDoPrazo = true;
    if (filtroData.inicio && filtroData.fim) {
      const dataString = item.data || item.created_at;
      const dataItem = new Date(dataString).getTime();
      const dataInicio = new Date(filtroData.inicio).getTime();
      const dataFim = new Date(filtroData.fim).getTime();
      dentroDoPrazo = dataItem >= dataInicio && dataItem <= dataFim;
    }

    let correspondeBusca = true;
    if (buscaOrcamento) {
      const termo = buscaOrcamento.toLowerCase();
      const nome = item.nome ? item.nome.toLowerCase() : "";
      const status = item.status ? item.status.toLowerCase() : "";
      correspondeBusca = nome.includes(termo) || status.includes(termo);
    }

    return dentroDoPrazo && correspondeBusca;
  });

  const dadosTabela = orcamentosFiltrados.map((o) => [
    o.nome,
    `R$ ${parseFloat(o.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    new Date(o.data || o.created_at).toLocaleDateString("pt-BR"),
    o.status,
  ]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-center">
      <Navbar />

      <ModalOrcamento
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSave={handleSalvarOrcamento}
      />

      <div className="w-full px-[5%] box-border">
        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px] pb-[24px]">
          <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-[30px] md:text-[40px] font-bold text-[#464C54]">
                Orçamentos
              </h1>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-[8px]">
              <div className="w-[180px]">
                <ButtonDefault
                  className="w-full text-[22px] font-semibold"
                  label="+ Novo Orçamento"
                  onClick={() => setModalAberto(true)}
                >
                  + Solicitação
                </ButtonDefault>
              </div>
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
                  className="outline-none text-[15px] uppercase text-[#71717A] bg-transparent border border-[1.5px] border-[#DBDADE] text-center rounded-[8px] h-[40px] px-2"
                  onChange={(e) =>
                    setFiltroData({ ...filtroData, inicio: e.target.value })
                  }
                />
                <span className="text-[#00000] text-[25px] font-semibold">
                  {" "}
                  Até{" "}
                </span>
                <input
                  type="date"
                  className="outline-none text-[15px] uppercase text-[#71717A] bg-transparent border border-[1.5px] border-[#DBDADE] text-center rounded-[8px] h-[40px] px-2"
                  onChange={(e) =>
                    setFiltroData({ ...filtroData, fim: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {orcamentos.length > 0 ? (
            <TabelaSimples
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
