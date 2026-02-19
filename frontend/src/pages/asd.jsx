import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import TabelaSimples from "../components/TabelaSimples";
import ModalFinanceiroEntrada from "../components/ModalFinanceiroEntrada";
import ModalFinanceiroSaida from "../components/ModalFinanceiroSaida";
import ButtonDefault from "../components/ButtonDefault";
import { api } from "../services/api";
import { supabase } from "../services/supabase";

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

export default function Financeiro() {
  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [modalSaidaAberto, setModalSaidaAberto] = useState(false);
  const [escritorioId, setEscritorioId] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [recarregar, setRecarregar] = useState(0);
  const [buscaEntrada, setBuscaEntrada] = useState("");
  const [buscaSaida, setBuscaSaida] = useState("");

  // Estados para o Controle Anual
  const [anoFiltroAnual, setAnoFiltroAnual] = useState(
    new Date().getFullYear(),
  );
  const [dadosAnuais, setDadosAnuais] = useState([]);

  const [editandoItem, setEditandoItem] = useState({
    tabela: null,
    id: null,
    campo: null,
  });
  const [valorEditado, setValorEditado] = useState("");

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(
    String(dataAtual.getMonth() + 1).padStart(2, "0"),
  );
  const anoAtual = dataAtual.getFullYear();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setEscritorioId(user.id);
    };
    fetchUser();
  }, []);

  // UseEffect para dados Mensais
  useEffect(() => {
    if (!escritorioId) return;
    const carregarDadosMensais = async () => {
      try {
        const dadosEntradas = await api.getFinanceiro(
          "entradas",
          escritorioId,
          mesSelecionado,
          anoAtual,
        );
        const dadosSaidas = await api.getFinanceiro(
          "saida",
          escritorioId,
          mesSelecionado,
          anoAtual,
        );
        setEntradas(Array.isArray(dadosEntradas) ? dadosEntradas : []);
        setSaidas(Array.isArray(dadosSaidas) ? dadosSaidas : []);
      } catch (error) {
        console.error("Erro ao buscar mensal:", error);
      }
    };
    carregarDadosMensais();
  }, [escritorioId, mesSelecionado, anoAtual, recarregar]);

  // LOGICA DO CONTROLE ANUAL (BACKEND)
  useEffect(() => {
    if (!escritorioId) return;
    const carregarResumoAnual = async () => {
      const meses = [
        "01",
        "02",
        "03",
        "04",
        "05",
        "06",
        "07",
        "08",
        "09",
        "10",
        "11",
        "12",
      ];
      const nomesMeses = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];

      try {
        const promessas = meses.map(async (mes, index) => {
          const ent = await api.getFinanceiro(
            "entradas",
            escritorioId,
            mes,
            anoFiltroAnual,
          );
          const sai = await api.getFinanceiro(
            "saida",
            escritorioId,
            mes,
            anoFiltroAnual,
          );

          const totalEnt = ent.reduce(
            (acc, c) => acc + (parseFloat(c.valor) || 0),
            0,
          );
          const totalSai = sai.reduce(
            (acc, c) => acc + (parseFloat(c.valor) || 0),
            0,
          );

          return [
            nomesMeses[index],
            `R$ ${formatarMoeda(totalEnt)}`,
            `R$ ${formatarMoeda(totalSai)}`,
            <span
              className={
                totalEnt - totalSai >= 0
                  ? "text-green-600 font-bold"
                  : "text-red-600 font-bold"
              }
            >
              R$ {formatarMoeda(totalEnt - totalSai)}
            </span>,
          ];
        });

        const resultados = await Promise.all(promessas);
        setDadosAnuais(resultados);
      } catch (error) {
        console.error("Erro no resumo anual:", error);
      }
    };
    carregarResumoAnual();
  }, [escritorioId, anoFiltroAnual, recarregar]);

  const handleSalvarEntrada = async (dadosFormulario) => {
    try {
      const dataFinal =
        dadosFormulario.data || new Date().toISOString().split("T")[0];
      await api.createFinanceiro("entradas", {
        ...dadosFormulario,
        data: dataFinal,
        escritorio_id: escritorioId,
      });
      setModalEntradaAberto(false);
      setRecarregar((prev) => prev + 1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSalvarSaida = async (dadosFormulario) => {
    try {
      const dataFinal =
        dadosFormulario.data || new Date().toISOString().split("T")[0];
      await api.createFinanceiro("saida", {
        ...dadosFormulario,
        data: dataFinal,
        escritorio_id: escritorioId,
      });
      setModalSaidaAberto(false);
      setRecarregar((prev) => prev + 1);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (tabela, id) => {
    if (
      window.confirm(
        "Atenção: Se este item for um parcelamento, TODAS as parcelas vinculadas serão excluídas. Confirmar?",
      )
    ) {
      try {
        await api.deleteFinanceiro(tabela, id);
        setRecarregar((prev) => prev + 1);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const iniciarEdicao = (tabela, item, campo) => {
    setEditandoItem({ tabela, id: item.id, campo });
    setValorEditado(item[campo]);
  };

  const salvarEdicao = async (tabela, id, campo) => {
    try {
      let valorFinal = valorEditado;
      if (campo === "valor") valorFinal = parseFloat(valorEditado) || 0;
      await api.updateFinanceiro(tabela, id, { [campo]: valorFinal });
      setRecarregar((prev) => prev + 1);
      setEditandoItem({ tabela: null, id: null, campo: null });
    } catch (error) {
      console.error(error);
    }
  };

  const totalEntradas = entradas.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0,
  );
  const totalSaidas = saidas.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0,
  );
  const saldoFinal = totalEntradas - totalSaidas;

  const gerarLinhasTabela = (dadosIniciais, termoBusca, nomeTabela) => {
    if (!Array.isArray(dadosIniciais)) return [];
    return dadosIniciais
      .filter((item) =>
        item.descricao?.toLowerCase().includes(termoBusca.toLowerCase()),
      )
      .map((item) => {
        const isEditingValor =
          editandoItem.tabela === nomeTabela &&
          editandoItem.id === item.id &&
          editandoItem.campo === "valor";
        const isEditingData =
          editandoItem.tabela === nomeTabela &&
          editandoItem.id === item.id &&
          editandoItem.campo === "data";

        return [
          <div className="uppercase">{item.descricao}</div>,
          <div className="uppercase text-xs text-gray-400">{item.forma}</div>,
          <div key={`v-${item.id}`}>
            {isEditingValor ? (
              <input
                type="number"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                onBlur={() => salvarEdicao(nomeTabela, item.id, "valor")}
                className="w-[80px] border rounded"
                autoFocus
              />
            ) : (
              <div
                className="group cursor-pointer"
                onClick={() => iniciarEdicao(nomeTabela, item, "valor")}
              >
                R$ {formatarMoeda(item.valor)}
              </div>
            )}
          </div>,
          <div key={`d-${item.id}`}>
            {isEditingData ? (
              <input
                type="date"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                onBlur={() => salvarEdicao(nomeTabela, item.id, "data")}
                className="border rounded"
                autoFocus
              />
            ) : (
              <div
                className="group cursor-pointer"
                onClick={() => iniciarEdicao(nomeTabela, item, "data")}
              >
                {formatarDataBR(item.data)}
              </div>
            )}
          </div>,
          <button
            onClick={() => handleDelete(nomeTabela, item.id)}
            className="bg-transparent border-none cursor-pointer"
          >
            <img
              width="18"
              src="https://img.icons8.com/material-outlined/24/FA5252/trash.png"
              alt="del"
            />
          </button>,
        ];
      });
  };

  return (
    <div className="relative">
      <div className="fixed top-0 right-0 h-[80px] flex items-center z-[60] px-[5%] pointer-events-none">
        <select
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
          className="pointer-events-auto h-[40px] text-[14px] font-bold px-3 border border-[#C4C4C9] rounded-[8px] bg-white focus:outline-none cursor-pointer text-[#464C54] shadow-sm"
        >
          {[
            "01",
            "02",
            "03",
            "04",
            "05",
            "06",
            "07",
            "08",
            "09",
            "10",
            "11",
            "12",
          ].map((m, i) => (
            <option key={m} value={m}>
              {
                [
                  "Janeiro",
                  "Fevereiro",
                  "Março",
                  "Abril",
                  "Maio",
                  "Junho",
                  "Julho",
                  "Agosto",
                  "Setembro",
                  "Outubro",
                  "Novembro",
                  "Dezembro",
                ][i]
              }
            </option>
          ))}
        </select>
      </div>

      <Navbar />

      {/* EXTRATO MENSAL */}
      <div className="px-[5%] mb-4">
        <div className="text-black rounded-[12px] border border-[#DBDADE] p-6 shadow-md mt-6 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-medium">
              Extrato de {mesSelecionado}/{anoAtual}
            </h2>
            <h1
              className={`text-4xl font-bold ${saldoFinal >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              R$ {formatarMoeda(saldoFinal)}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-[5%] space-y-8">
        {/* TABELA ENTRADAS */}
        <div className="bg-white border border-[#DBDADE] rounded-[12px] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#464C54]">Entradas</h1>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar..."
                value={buscaEntrada}
                onChange={(e) => setBuscaEntrada(e.target.value)}
                className="border rounded p-2"
              />
              <ButtonDefault onClick={() => setModalEntradaAberto(true)}>
                + Nova Entrada
              </ButtonDefault>
            </div>
          </div>
          <TabelaSimples
            colunas={["Descrição", "Forma", "Valor", "Data", ""]}
            dados={gerarLinhasTabela(entradas, buscaEntrada, "entradas")}
          />
        </div>

        {/* TABELA SAIDAS */}
        <div className="bg-white border border-[#DBDADE] rounded-[12px] p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#464C54]">Saídas</h1>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar..."
                value={buscaSaida}
                onChange={(e) => setBuscaSaida(e.target.value)}
                className="border rounded p-2"
              />
              <ButtonDefault onClick={() => setModalSaidaAberto(true)}>
                + Nova Saída
              </ButtonDefault>
            </div>
          </div>
          <TabelaSimples
            colunas={["Descrição", "Forma", "Valor", "Data", ""]}
            dados={gerarLinhasTabela(saidas, buscaSaida, "saida")}
          />
        </div>

        {/* CONTROLE ANUAL */}
        <div className="bg-white border border-[#DBDADE] rounded-[12px] p-6 shadow-sm mb-20">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#464C54]">
              Controle Anual
            </h1>
            <input
              type="number"
              value={anoFiltroAnual}
              onChange={(e) => setAnoFiltroAnual(e.target.value)}
              className="h-[40px] w-[100px] border border-[#DBDADE] rounded-[8px] p-2 text-center font-bold"
            />
          </div>
          <TabelaSimples
            colunas={["Mês", "Entrada", "Saida", "Balanço"]}
            dados={dadosAnuais}
          />
        </div>
      </div>

      <ModalFinanceiroEntrada
        isOpen={modalEntradaAberto}
        onClose={() => setModalEntradaAberto(false)}
        onSave={handleSalvarEntrada}
      />
      <ModalFinanceiroSaida
        isOpen={modalSaidaAberto}
        onClose={() => setModalSaidaAberto(false)}
        onSave={handleSalvarSaida}
      />
    </div>
  );
}
