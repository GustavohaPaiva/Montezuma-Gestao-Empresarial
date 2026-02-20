import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ModalFinanceiroEntrada from "../../components/modals/ModalFinanceiroEntrada";
import ModalFinanceiroSaida from "../../components/modals/ModalFinanceiroSaida";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import { api } from "../../services/api";
import { supabase } from "../../services/supabase";

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
  const [selectedProject, setSelectedProject] = useState("Montezuma");

  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [recarregar, setRecarregar] = useState(0);

  const [buscaEntrada, setBuscaEntrada] = useState("");
  const [buscaSaida, setBuscaSaida] = useState("");

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

  const [anoFiltroAnual, setAnoFiltroAnual] = useState(
    new Date().getFullYear(),
  );
  const [dadosAnuais, setDadosAnuais] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      if (selectedProject === "Montezuma") {
        setEscritorioId("Montezuma"); // Passamos a string que a API agora entende como gatilho
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setEscritorioId(user.id);
      }
    };
    fetchUser();
  }, [selectedProject]);

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
      } catch (erro) {
        console.error("Erro ao buscar financeiro:", erro);
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

          const totalEntVal = ent
            .filter((i) => i.validacao === 1)
            .reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);
          const totalSaiVal = sai
            .filter((i) => i.validacao === 1)
            .reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);

          return [
            nomesMeses[index],
            `R$ ${formatarMoeda(totalEntVal)}`,
            `R$ ${formatarMoeda(totalSaiVal)}`,
            <span
              key={index}
              className={
                totalEntVal - totalSaiVal >= 0
                  ? "text-green-600 font-bold"
                  : "text-red-600 font-bold"
              }
            >
              R$ {formatarMoeda(totalEntVal - totalSaiVal)}
            </span>,
          ];
        });

        const resultados = await Promise.all(promessas);
        setDadosAnuais(resultados);
      } catch (erro) {
        console.error("Erro no resumo anual:", erro);
      }
    };
    carregarResumoAnual();
  }, [escritorioId, anoFiltroAnual, recarregar]);

  const handleSalvarEntrada = async (dadosFormulario) => {
    try {
      const dataFinal =
        dadosFormulario.data || new Date().toISOString().split("T")[0];
      // O lançamento usa o escritorioId atual (Seja "Montezuma" ou o ID do user)
      await api.createFinanceiro("entradas", {
        ...dadosFormulario,
        data: dataFinal,
        escritorio_id: escritorioId,
      });
      setModalEntradaAberto(false);
      setRecarregar((prev) => prev + 1);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar saída.");
    }
  };

  const handleDelete = async (tabela, id) => {
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        await api.deleteFinanceiro(tabela, id);
        setRecarregar((prev) => prev + 1);
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir item.");
      }
    }
  };

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
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar edição.");
    }
  };

  const handleToggleValidacao = async (tabela, item) => {
    const novoStatus = item.validacao === 1 ? 0 : 1;
    const atualizarLista = (lista) =>
      lista.map((i) =>
        i.id === item.id ? { ...i, validacao: novoStatus } : i,
      );

    if (tabela === "entradas") {
      setEntradas((prev) => atualizarLista(prev));
    } else {
      setSaidas((prev) => atualizarLista(prev));
    }

    try {
      await api.updateFinanceiro(tabela, item.id, { validacao: novoStatus });
    } catch (err) {
      console.error("Erro ao validar:", err);
      setRecarregar((prev) => prev + 1);
    }
  };

  const totalEntradasValidadas = entradas
    .filter((i) => i.validacao === 1)
    .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
  const totalSaidasValidadas = saidas
    .filter((i) => i.validacao === 1)
    .reduce((acc, curr) => acc + (parseFloat(curr.valor) || 0), 0);
  const saldoFinal = totalEntradasValidadas - totalSaidasValidadas;

  const somaTotalEntradas = entradas.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0,
  );
  const somaTotalSaidas = saidas.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0,
  );

  const somaBalançoAnual = dadosAnuais.reduce((acc, curr) => {
    const valorStr = curr[3].props ? curr[3].props.children[1] : 0;
    const valorLimpo =
      typeof valorStr === "string"
        ? parseFloat(valorStr.replace(/\./g, "").replace(",", "."))
        : 0;
    return acc + valorLimpo;
  }, 0);

  const gerarLinhasTabela = (dadosIniciais, termoBusca, nomeTabela) => {
    if (!Array.isArray(dadosIniciais)) return [];
    let lista = [...dadosIniciais];
    if (termoBusca) {
      lista = lista.filter((item) =>
        item.descricao?.toLowerCase().includes(termoBusca.toLowerCase()),
      );
    }
    lista.sort((a, b) => (a.validacao || 0) - (b.validacao || 0));

    return lista.map((item) => {
      const isEditingValor =
        editandoItem.tabela === nomeTabela &&
        editandoItem.id === item.id &&
        editandoItem.campo === "valor";
      const isValidado = item.validacao === 1;

      return [
        <div className="flex items-center justify-center" key={`cb-${item.id}`}>
          <input
            type="checkbox"
            checked={isValidado}
            onChange={() => handleToggleValidacao(nomeTabela, item)}
            className="h-[18px] w-[18px] accent-[#1c8701] cursor-pointer"
          />
        </div>,
        <div key={`desc-${item.id}`} className="uppercase">
          {item.descricao}
        </div>,
        <div key={`forma-${item.id}`} className="uppercase">
          {item.forma}
        </div>,
        <div
          className="flex items-center justify-center gap-2"
          key={`val-${item.id}`}
        >
          {isEditingValor ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={valorEditado}
                onChange={(e) => setValorEditado(e.target.value)}
                className="w-[80px] p-[4px] border border-[#DBDADE] rounded-[8px] focus:outline-none text-center"
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
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                alt="editar"
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2"
          key={`dat-${item.id}`}
        >
          <span>{formatarDataBR(item.data)}</span>
        </div>,
        <div className="flex justify-center group" key={`del-${item.id}`}>
          <button
            onClick={() => handleDelete(nomeTabela, item.id)}
            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-full border-none bg-transparent cursor-pointer"
          >
            <img
              width="18"
              src="https://img.icons8.com/material-outlined/24/FA5252/trash.png"
              alt="excluir"
            />
          </button>
        </div>,
      ];
    });
  };

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 h-[80px] flex items-center z-[60] px-[5%] pointer-events-none">
        <select
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
          className="pointer-events-auto h-[40px] text-[14px] font-bold px-3 border border-[#C4C4C9] rounded-[8px] bg-white shadow-sm"
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
          ].map((m) => (
            <option key={m} value={m}>
              {new Date(2000, parseInt(m) - 1).toLocaleString("pt-BR", {
                month: "long",
              })}
            </option>
          ))}
        </select>
      </div>
      <div className="absolute top-0 right-[150px] h-[80px] flex items-center z-[60] px-[5%] pointer-events-none">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="pointer-events-auto h-[40px] text-[14px] font-bold px-3 border border-[#C4C4C9] rounded-[8px] bg-white shadow-sm"
        >
          <option value="Montezuma">Montezuma</option>
          <option value="Escritório">Escritório</option>
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

      <div className="px-[5%] mb-4">
        <div className="text-black rounded-[12px] border border-[#DBDADE] p-6 shadow-md mt-6 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-medium">
              Extrato de {mesSelecionado}/{anoAtual} ({selectedProject})
            </h2>
            <p className="text-sm opacity-80">
              Apenas itens validados entram no cálculo
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
        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm mb-[24px]">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-[30px] font-bold text-[#464C54]">Entradas</h1>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={buscaEntrada}
                onChange={(e) => setBuscaEntrada(e.target.value)}
                className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none"
              />
              <ButtonDefault onClick={() => setModalEntradaAberto(true)}>
                + Nova Entrada
              </ButtonDefault>
            </div>
          </div>
          <TabelaSimples
            colunas={["Pago", "Descrição", "Forma Pag.", "Valor", "Data", ""]}
            dados={gerarLinhasTabela(entradas, buscaEntrada, "entradas")}
          />
          <div className="grid xl:grid-cols-2 gap-[10px] w-full mt-4">
            <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#F8F9FA] gap-2">
              <span className="text-sm text-[#71717A] uppercase font-semibold">
                Total Orçado:
              </span>
              <span className="text-[18px] font-bold text-[#464C54]">
                R$ {formatarMoeda(somaTotalEntradas)}
              </span>
            </div>
            <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#E8F5E9] gap-2">
              <span className="text-sm text-[#2E7D32] uppercase font-semibold">
                Total Fechado:
              </span>
              <span className="text-[18px] font-bold text-[#1B5E20]">
                R$ {formatarMoeda(totalEntradasValidadas)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm mb-[24px]">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-[30px] font-bold text-[#464C54]">Saídas</h1>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={buscaSaida}
                onChange={(e) => setBuscaSaida(e.target.value)}
                className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none"
              />
              <ButtonDefault onClick={() => setModalSaidaAberto(true)}>
                + Nova Saída
              </ButtonDefault>
            </div>
          </div>
          <TabelaSimples
            colunas={["Pago", "Descrição", "Forma Pag.", "Valor", "Data", ""]}
            dados={gerarLinhasTabela(saidas, buscaSaida, "saida")}
          />
          <div className="grid xl:grid-cols-2 gap-[10px] w-full mt-4">
            <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#F8F9FA] gap-2">
              <span className="text-sm text-[#71717A] uppercase font-semibold">
                Total Orçado:
              </span>
              <span className="text-[18px] font-bold text-[#464C54]">
                R$ {formatarMoeda(somaTotalSaidas)}
              </span>
            </div>
            <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#FFEBEE] gap-2">
              <span className="text-sm text-[#C62828] uppercase font-semibold">
                Total Fechado:
              </span>
              <span className="text-[18px] font-bold text-[#B71C1C]">
                R$ {formatarMoeda(totalSaidasValidadas)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm mb-[40px]">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-[30px] font-bold text-[#464C54]">
              Controle Anual
            </h1>
            <input
              type="number"
              value={anoFiltroAnual}
              onChange={(e) => setAnoFiltroAnual(e.target.value)}
              className="h-[40px] border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none"
            />
          </div>
          <TabelaSimples
            colunas={["Mês", "Entrada", "Saida", "Balanço"]}
            dados={dadosAnuais}
          />
          <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#F8F9FA] gap-2 mt-4">
            <span className="text-sm text-[#71717A] uppercase font-semibold">
              Balanço Total do Ano:
            </span>
            <span
              className={`text-[18px] font-bold ${somaBalançoAnual >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              R$ {formatarMoeda(somaBalançoAnual)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
