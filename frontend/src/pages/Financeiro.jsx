import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import TabelaSimples from "../components/TabelaSimples";
import ModalFinanceiroEntrada from "../components/ModalFinanceiroEntrada";
import ModalFinanceiroSaida from "../components/ModalFinanceiroSaida";
import ButtonDefault from "../components/ButtonDefault";
import { api } from "../services/api";
import { supabase } from "../services/supabase";

// Funções de formatação herdadas do seu padrão
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
  // Modais
  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [modalSaidaAberto, setModalSaidaAberto] = useState(false);

  // Dados e Usuário
  const [escritorioId, setEscritorioId] = useState(null);
  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [recarregar, setRecarregar] = useState(0);

  // Buscas
  const [buscaEntrada, setBuscaEntrada] = useState("");
  const [buscaSaida, setBuscaSaida] = useState("");

  // Edição Inline
  const [editandoItem, setEditandoItem] = useState({
    tabela: null,
    id: null,
    campo: null,
  });
  const [valorEditado, setValorEditado] = useState("");

  // Data e Mês
  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(
    String(dataAtual.getMonth() + 1).padStart(2, "0"),
  );
  const anoAtual = dataAtual.getFullYear();

  const [anoFiltroAnual, setAnoFiltroAnual] = useState(
    new Date().getFullYear(),
  );
  const [dadosAnuais, setDadosAnuais] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setEscritorioId(user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!escritorioId) return;
    const carregarDados = async () => {
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
        console.error("Erro ao buscar financeiro:", error);
      }
    };
    carregarDados();
  }, [escritorioId, mesSelecionado, anoAtual, recarregar]);

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

  // Funções de Salvar (Modais)
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
      alert("Erro ao salvar entrada.");
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
      alert("Erro ao salvar saída.");
    }
  };

  // Funções de Deletar
  const handleDelete = async (tabela, id) => {
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        await api.deleteFinanceiro(tabela, id);
        setRecarregar((prev) => prev + 1);
      } catch (error) {
        console.error("Erro ao excluir:", error);
        alert("Erro ao excluir item.");
      }
    }
  };

  // Funções de Edição Inline
  const iniciarEdicao = (tabela, item, campo) => {
    setEditandoItem({ tabela, id: item.id, campo });
    setValorEditado(item[campo]);
  };

  const cancelarEdicao = () => {
    setEditandoItem({ tabela: null, id: null, campo: null });
    setValorEditado("");
  };

  const salvarEdicao = async (tabela, id, campo) => {
    try {
      let valorFinal = valorEditado;
      if (campo === "valor") valorFinal = parseFloat(valorEditado) || 0;

      await api.updateFinanceiro(tabela, id, { [campo]: valorFinal });
      setRecarregar((prev) => prev + 1);
      cancelarEdicao();
    } catch (error) {
      console.error(`Erro ao atualizar ${campo}:`, error);
      alert("Erro ao salvar edição.");
    }
  };

  // Cálculos do Extrato
  const totalEntradas = entradas.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0,
  );
  const totalSaidas = saidas.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0,
  );
  const saldoFinal = totalEntradas - totalSaidas;

  // Renderizador Dinâmico de Tabelas (Entradas e Saídas)
  const gerarLinhasTabela = (dadosIniciais, termoBusca, nomeTabela) => {
    if (!Array.isArray(dadosIniciais)) return [];

    let lista = dadosIniciais;
    if (termoBusca) {
      lista = lista.filter((item) =>
        item.descricao?.toLowerCase().includes(termoBusca.toLowerCase()),
      );
    }

    return lista.map((item) => {
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
        <div className="uppercase">{item.forma}</div>,

        // CÉLULA DE VALOR
        <div
          className="flex items-center justify-center gap-2"
          key={`val-${item.id}`}
        >
          {isEditingValor ? (
            <div className="flex items-center gap-1">
              <span>R$</span>
              <input
                type="number"
                step="0.01"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                className="w-[80px] p-[4px] border border-[#DBDADE] ml-[10px] rounded-[8px] focus:outline-none text-center"
                autoFocus
              />
              <button
                onClick={() => salvarEdicao(nomeTabela, item.id, "valor")}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={cancelarEdicao}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
                  alt="cancelar"
                />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => iniciarEdicao(nomeTabela, item, "valor")}
            >
              <span className="font-bold">R$ {formatarMoeda(item.valor)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,

        // CÉLULA DE DATA
        <div
          className="flex items-center justify-center gap-2"
          key={`dat-${item.id}`}
        >
          {isEditingData ? (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                className="w-auto p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => salvarEdicao(nomeTabela, item.id, "data")}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/2E7D32/checkmark--v1.png"
                  alt="salvar"
                />
              </button>
              <button
                onClick={cancelarEdicao}
                className="cursor-pointer border-none bg-transparent"
              >
                <img
                  width="15"
                  src="https://img.icons8.com/ios-glyphs/30/c62828/multiply.png"
                  alt="cancelar"
                />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => iniciarEdicao(nomeTabela, item, "data")}
            >
              <span>{formatarDataBR(item.data)}</span>
              <img
                width="15"
                src="https://img.icons8.com/ios/50/edit--v1.png"
                alt="edit"
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-[8px]"
              />
            </div>
          )}
        </div>,

        // BOTÃO DELETAR
        <div className="flex justify-center group" key={`del-${item.id}`}>
          <button
            onClick={() => handleDelete(nomeTabela, item.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-full cursor-pointer border-none bg-transparent"
          >
            <img
              width="18"
              height="18"
              src="https://img.icons8.com/material-outlined/24/FA5252/trash.png"
              alt="delete"
            />
          </button>
        </div>,
      ];
    });
  };

  return (
    <div className="relative">
      {/* SELECT POSICIONADO FIXO SOBRE A NAVBAR */}
      <div className="absolute top-0 right-0 h-[80px] flex items-center z-[60] px-[5%] pointer-events-none">
        <select
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
          className="pointer-events-auto h-[40px] text-[14px] font-bold px-3 border border-[#C4C4C9] rounded-[8px] bg-white focus:outline-none cursor-pointer text-[#464C54] shadow-sm"
        >
          <option value="01">Janeiro</option>
          <option value="02">Fevereiro</option>
          <option value="03">Março</option>
          <option value="04">Abril</option>
          <option value="05">Maio</option>
          <option value="06">Junho</option>
          <option value="07">Julho</option>
          <option value="08">Agosto</option>
          <option value="09">Setembro</option>
          <option value="10">Outubro</option>
          <option value="11">Novembro</option>
          <option value="12">Dezembro</option>
        </select>
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

      <Navbar className="static" />

      {/* EXTRATO DO MÊS */}
      <div className="px-[5%] mb-4">
        <div className="text-black rounded-[12px] border border-[1px] border-[#DBDADE] p-6 shadow-md mt-6 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-medium">
              Extrato de {mesSelecionado}/{anoAtual}
            </h2>
            <p className="text-sm opacity-80">
              Cálculo de Entradas menos Saídas
            </p>
          </div>
          <h1
            className={`text-4xl font-bold ${saldoFinal >= 0 ? "text-green-500" : "text-red-500"}`}
          >
            R$ {formatarMoeda(saldoFinal)}
          </h1>
        </div>
      </div>

      <div className="px-[5%]">
        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mb-[24px] pt-[24px] pb-[24px]">
          <div className="flex flex-col w-full justify-between px-2 xl:flex-row items-center gap-[8px]">
            <h1 className="text-[30px] md:text-[40px] font-bold text-[#464C54]">
              Entradas
            </h1>
            <div className="w-full flex flex-col gap-4 md:flex-row xl:justify-end md:items-center">
              <input
                type="text"
                placeholder="Buscar Entrada..."
                value={buscaEntrada}
                onChange={(e) => setBuscaEntrada(e.target.value)}
                className="h-[40px] w-full xl:w-[250px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54]"
              />
              <ButtonDefault
                className="w-full xl:w-[200px] text-[20px] font-semibold"
                onClick={() => setModalEntradaAberto(true)}
              >
                + Nova Entrada
              </ButtonDefault>
            </div>
          </div>
          <TabelaSimples
            colunas={["Descrição", "Forma Pag.", "Valor", "Data", ""]}
            dados={gerarLinhasTabela(entradas, buscaEntrada, "entradas")}
          />
        </div>

        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] pb-[24px] pt-[24px] mb-[40px]">
          <div className="flex flex-col w-full justify-between px-2 xl:flex-row items-center gap-[8px]">
            <h1 className="text-[30px] md:text-[40px] font-bold text-[#464C54]">
              Saídas
            </h1>
            <div className="w-full flex flex-col gap-4 md:flex-row xl:justify-end md:items-center">
              <input
                type="text"
                placeholder="Buscar Saída..."
                value={buscaSaida}
                onChange={(e) => setBuscaSaida(e.target.value)}
                className="h-[40px] w-full xl:w-[250px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54]"
              />
              <ButtonDefault
                className="w-full xl:w-[200px] text-[20px] font-semibold"
                onClick={() => setModalSaidaAberto(true)}
              >
                + Nova Saída
              </ButtonDefault>
            </div>
          </div>
          <TabelaSimples
            colunas={["Descrição", "Forma Pag.", "Valor", "Data", ""]}
            dados={gerarLinhasTabela(saidas, buscaSaida, "saida")}
          />
        </div>

        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] pb-[24px] pt-[24px] mb-[40px]">
          <div className="flex flex-col w-full justify-between px-2 xl:flex-row items-center gap-[8px]">
            <h1 className="text-[30px] md:text-[40px] font-bold text-[#464C54]">
              Controle Anual
            </h1>
            <input
              type="number"
              placeholder="2026"
              value={anoFiltroAnual}
              onChange={(e) => setAnoFiltroAnual(e.target.value)}
              className="h-[40px] w-full xl:w-[250px] box-border border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none text-[#464C54]"
            />
          </div>
          <TabelaSimples
            colunas={["Mês", "Entrada", "Saida", "Balanço"]}
            dados={dadosAnuais}
          />
        </div>
      </div>
    </div>
  );
}
