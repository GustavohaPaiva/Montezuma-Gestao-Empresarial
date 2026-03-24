import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ModalFinanceiroEntrada from "../../components/modals/ModalFinanceiroEntrada";
import ModalFinanceiroSaida from "../../components/modals/ModalFinanceiroSaida";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import { api } from "../../services/api";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

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

const checkIsParcelado = (item) => {
  if (!item) return false;
  return Boolean(
    item.grupo_id ||
    (item.forma && String(item.forma).toLowerCase().includes("parcelado")) ||
    (item.descricao && /\(\d+\/\d+\)/.test(item.descricao)),
  );
};

export default function Financeiro() {
  const { user } = useAuth();
  const isAdmin = user?.tipo === "adm";

  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [modalSaidaAberto, setModalSaidaAberto] = useState(false);

  const [escritorioId, setEscritorioId] = useState(null);

  // SE FOR ADM, INICIA NO ESCRITÓRIO. SE FOR SECRETARIA, CRAVA NO MONTEZUMA.
  const [selectedProject, setSelectedProject] = useState(
    isAdmin ? "Escritório" : "Montezuma",
  );

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

  const [dialogo, setDialogo] = useState({
    aberto: false,
    titulo: "",
    mensagem: "",
    botoes: [],
  });

  const fecharDialogo = () =>
    setDialogo({ aberto: false, titulo: "", mensagem: "", botoes: [] });

  const mostrarAlerta = (titulo, mensagem) => {
    setDialogo({
      aberto: true,
      titulo,
      mensagem,
      botoes: [
        {
          texto: "Entendido",
          className: "bg-[#2E7D32] text-white hover:bg-[#1B5E20] shadow-sm",
          onClick: fecharDialogo,
        },
      ],
    });
  };

  const dataAtual = new Date();
  const [mesSelecionado, setMesSelecionado] = useState(
    String(dataAtual.getMonth() + 1).padStart(2, "0"),
  );
  const anoAtual = dataAtual.getFullYear();

  const [anoFiltroAnual, setAnoFiltroAnual] = useState(
    new Date().getFullYear(),
  );
  const [dadosAnuais, setDadosAnuais] = useState([]);
  const [totaisAnuais, setTotaisAnuais] = useState({
    validado: 0,
    previsto: 0,
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (selectedProject === "Montezuma") {
        setEscritorioId("Montezuma");
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
        if (isAdmin) {
          const dadosEntradas = await api.getFinanceiro(
            "entradas",
            escritorioId,
            mesSelecionado,
            anoAtual,
          );
          setEntradas(Array.isArray(dadosEntradas) ? dadosEntradas : []);
        }

        const dadosSaidas = await api.getFinanceiro(
          "saida",
          escritorioId,
          mesSelecionado,
          anoAtual,
        );
        setSaidas(Array.isArray(dadosSaidas) ? dadosSaidas : []);
      } catch (erro) {
        console.error("Erro ao buscar financeiro:", erro);
      }
    };
    carregarDados();
  }, [escritorioId, mesSelecionado, anoAtual, recarregar, isAdmin]);

  useEffect(() => {
    if (!escritorioId || !isAdmin) return;
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
        const promessas = meses.map(async (mes) => {
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
          const totalEntPrev = ent.reduce(
            (acc, c) => acc + (parseFloat(c.valor) || 0),
            0,
          );
          const totalSaiVal = sai
            .filter((i) => i.validacao === 1)
            .reduce((acc, c) => acc + (parseFloat(c.valor) || 0), 0);
          const totalSaiPrev = sai.reduce(
            (acc, c) => acc + (parseFloat(c.valor) || 0),
            0,
          );

          return { totalEntVal, totalEntPrev, totalSaiVal, totalSaiPrev };
        });

        const resultadosRaw = await Promise.all(promessas);
        let sumVal = 0;
        let sumPrev = 0;

        const resultadosFormatados = resultadosRaw.map((r, index) => {
          const balVal = r.totalEntVal - r.totalSaiVal;
          const balPrev = r.totalEntPrev - r.totalSaiPrev;
          sumVal += balVal;
          sumPrev += balPrev;

          return [
            nomesMeses[index],
            <div key={`ent-${index}`} className="flex flex-col">
              <span className="font-bold">
                R$ {formatarMoeda(r.totalEntVal)}
              </span>
              <span className="text-xs text-gray-500">
                Total: R$ {formatarMoeda(r.totalEntPrev)}
              </span>
            </div>,
            <div key={`sai-${index}`} className="flex flex-col">
              <span className="font-bold">
                R$ {formatarMoeda(r.totalSaiVal)}
              </span>
              <span className="text-xs text-gray-500">
                Total: R$ {formatarMoeda(r.totalSaiPrev)}
              </span>
            </div>,
            <div key={`bal-${index}`} className="flex flex-col">
              <span
                className={
                  balVal >= 0
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                R$ {formatarMoeda(balVal)}
              </span>
              <span
                className={`text-xs ${balPrev >= 0 ? "text-green-600/70" : "text-red-600/70"}`}
              >
                Prev: R$ {formatarMoeda(balPrev)}
              </span>
            </div>,
          ];
        });

        setDadosAnuais(resultadosFormatados);
        setTotaisAnuais({ validado: sumVal, previsto: sumPrev });
      } catch (erro) {
        console.error("Erro no resumo anual:", erro);
      }
    };
    carregarResumoAnual();
  }, [escritorioId, anoFiltroAnual, recarregar, isAdmin]);

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
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro", "Erro ao salvar entrada.");
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
      mostrarAlerta("Erro", "Erro ao salvar saída.");
    }
  };

  const executarExclusao = async (tabela, id, excluirTodas) => {
    try {
      await api.deleteFinanceiro(tabela, id, excluirTodas);
      setRecarregar((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro", "Erro ao excluir item.");
    }
  };

  const handleDelete = (tabela, item) => {
    const isParcelado = checkIsParcelado(item);

    if (isParcelado) {
      setDialogo({
        aberto: true,
        titulo: "Excluir Parcela",
        mensagem:
          "Este lançamento faz parte de um parcelamento em andamento. Como você prefere excluir?",
        botoes: [
          {
            texto: "Apenas Esta Parcela",
            className:
              "bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100",
            onClick: () => {
              executarExclusao(tabela, item.id, false);
              fecharDialogo();
            },
          },
          {
            texto: "Excluir Todas as Parcelas",
            className: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
            onClick: () => {
              executarExclusao(tabela, item.id, true);
              fecharDialogo();
            },
          },
          {
            texto: "Cancelar",
            className: "bg-gray-100 text-[#464C54] hover:bg-gray-200",
            onClick: fecharDialogo,
          },
        ],
      });
    } else {
      setDialogo({
        aberto: true,
        titulo: "Excluir Registro",
        mensagem:
          "Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita.",
        botoes: [
          {
            texto: "Cancelar",
            className: "bg-gray-100 text-[#464C54] hover:bg-gray-200",
            onClick: fecharDialogo,
          },
          {
            texto: "Excluir",
            className: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
            onClick: () => {
              executarExclusao(tabela, item.id, false);
              fecharDialogo();
            },
          },
        ],
      });
    }
  };

  const executarAdiar = async (tabela, item) => {
    try {
      const isParcelado = checkIsParcelado(item);
      let novaDescricao = item.descricao;

      if (isParcelado && !item.descricao.includes("(Mês Anterior)")) {
        novaDescricao += " (Mês Anterior)";
      }

      const dataObj = new Date(item.data + "T12:00:00Z");
      dataObj.setMonth(dataObj.getMonth() + 1);
      const novaData = dataObj.toISOString().split("T")[0];

      await api.updateFinanceiro(tabela, item.id, {
        data: novaData,
        descricao: novaDescricao,
      });
      setRecarregar((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro", "Erro ao adiar item.");
    }
  };

  const handleAdiarMes = (tabela, item) => {
    setDialogo({
      aberto: true,
      titulo: "Adiar Lançamento",
      mensagem:
        "Deseja mover este lançamento para o próximo mês mantendo o mesmo dia de vencimento?",
      botoes: [
        {
          texto: "Cancelar",
          className: "bg-gray-100 text-[#464C54] hover:bg-gray-200",
          onClick: fecharDialogo,
        },
        {
          texto: "Adiar",
          className: "bg-blue-500 text-white hover:bg-blue-600 shadow-sm",
          onClick: () => {
            executarAdiar(tabela, item);
            fecharDialogo();
          },
        },
      ],
    });
  };

  const iniciarEdicao = (tabela, item, campo) => {
    setEditandoItem({ tabela, id: item.id, campo });
    setValorEditado(item[campo]);
  };

  const cancelarEdicao = () => {
    setEditandoItem({ tabela: null, id: null, campo: null });
    setValorEditado("");
  };

  const executarSalvarEdicao = async (tabela, id, payload) => {
    try {
      await api.updateFinanceiro(tabela, id, payload);
      setRecarregar((prev) => prev + 1);
      cancelarEdicao();
    } catch (err) {
      console.error(err);
      mostrarAlerta("Erro", "Erro ao salvar edição.");
    }
  };

  const salvarEdicao = (tabela, itemOriginal, campo) => {
    let valorFinal = valorEditado;

    if (campo === "valor") {
      valorFinal = parseFloat(valorEditado) || 0;
      const valorAntigo = parseFloat(itemOriginal.valor) || 0;

      if (valorFinal !== valorAntigo) {
        const isParcelado = checkIsParcelado(itemOriginal);

        if (isParcelado) {
          const diferenca = valorAntigo - valorFinal;
          const textoAcao = diferenca > 0 ? "Abater" : "Acrescer";

          setDialogo({
            aberto: true,
            titulo: "Reajuste de Parcela",
            mensagem: `Você alterou o valor desta parcela. A diferença gerada foi de R$ ${Math.abs(diferenca).toFixed(2)}. Como o sistema deve lidar com o restante do parcelamento?`,
            botoes: [
              {
                texto: "Aplicar valor fixo nas restantes",
                className:
                  "bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100",
                onClick: () => {
                  executarSalvarEdicao(tabela, itemOriginal.id, {
                    [campo]: valorFinal,
                    alterar_todas_parcelas: true,
                  });
                  fecharDialogo();
                },
              },
              {
                texto: `${textoAcao} valor na próxima parcela`,
                className:
                  "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100",
                onClick: () => {
                  executarSalvarEdicao(tabela, itemOriginal.id, {
                    [campo]: valorFinal,
                    diferenca_proxima_parcela: diferenca,
                  });
                  fecharDialogo();
                },
              },
              {
                texto: `Ratear diferença nas restantes`,
                className:
                  "bg-green-50 border border-green-200 text-green-700 hover:bg-green-100",
                onClick: () => {
                  executarSalvarEdicao(tabela, itemOriginal.id, {
                    [campo]: valorFinal,
                    ratear_diferenca_todas: diferenca,
                  });
                  fecharDialogo();
                },
              },
              {
                texto: "Alterar apenas esta parcela",
                className:
                  "bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100",
                onClick: () => {
                  executarSalvarEdicao(tabela, itemOriginal.id, {
                    [campo]: valorFinal,
                  });
                  fecharDialogo();
                },
              },
              {
                texto: "Cancelar Alteração",
                className: "bg-gray-100 text-[#464C54] hover:bg-gray-200 mt-2",
                onClick: () => {
                  cancelarEdicao();
                  fecharDialogo();
                },
              },
            ],
          });
          return;
        }
      }
    }
    executarSalvarEdicao(tabela, itemOriginal.id, { [campo]: valorFinal });
  };

  const handleToggleValidacao = async (tabela, item) => {
    const novoStatus = item.validacao === 1 ? 0 : 1;
    const atualizarLista = (lista) =>
      lista.map((i) =>
        i.id === item.id ? { ...i, validacao: novoStatus } : i,
      );

    if (tabela === "entradas") setEntradas((prev) => atualizarLista(prev));
    else setSaidas((prev) => atualizarLista(prev));

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
                onClick={() => salvarEdicao(nomeTabela, item, "valor")}
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
        <div
          className="flex justify-center gap-2 group"
          key={`actions-${item.id}`}
        >
          <button
            title="Jogar para o próximo mês"
            onClick={() => handleAdiarMes(nomeTabela, item)}
            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-blue-50 rounded-full border-none bg-transparent cursor-pointer"
          >
            <img
              width="18"
              src="https://img.icons8.com/material-outlined/24/228BE6/forward.png"
              alt="adiar"
            />
          </button>
          {isAdmin && (
            <button
              title="Excluir"
              onClick={() => handleDelete(nomeTabela, item)}
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-full border-none bg-transparent cursor-pointer"
            >
              <img
                width="18"
                src="https://img.icons8.com/material-outlined/24/FA5252/trash.png"
                alt="excluir"
              />
            </button>
          )}
        </div>,
      ];
    });
  };

  return (
    <div className="relative">
      {dialogo.aberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-white rounded-[16px] p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-center transform transition-transform scale-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
              <svg
                className="h-7 w-7 text-orange-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#464C54] mb-2">
                {dialogo.titulo}
              </h3>
              <p className="text-[#71717A] text-sm leading-relaxed">
                {dialogo.mensagem}
              </p>
            </div>
            <div
              className={`mt-2 flex ${dialogo.botoes.length > 2 ? "flex-col gap-2" : "flex-row justify-center gap-3 w-full"}`}
            >
              {dialogo.botoes.map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.onClick}
                  className={`px-4 py-2.5 rounded-[8px] font-semibold text-sm transition-all duration-200 ${btn.className} ${dialogo.botoes.length > 2 ? "w-full" : "flex-1"}`}
                >
                  {btn.texto}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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

      <div className="md:absolute w-full mt-4 md:w-auto top-0 right-0 flex items-center z-[60] px-[5%] pointer-events-none">
        <select
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(e.target.value)}
          className="pointer-events-auto h-[40px] w-full md:w-auto text-[14px] font-bold px-3 border border-[#C4C4C9] rounded-[8px] bg-white shadow-sm"
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

      {/* SÓ MOSTRA A SELEÇÃO DO ESCRITÓRIO/MONTEZUMA SE FOR ADM */}
      {isAdmin && (
        <div className="md:absolute top-0 mt-4 w-full md:w-auto right-[150px] flex items-center z-[60] px-[5%] pointer-events-none">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="pointer-events-auto h-[40px] w-full md:w-auto text-[14px] font-bold px-3 border border-[#C4C4C9] rounded-[8px] bg-white shadow-sm"
          >
            <option value="Escritório">Escritório</option>
            <option value="Montezuma">Montezuma</option>
          </select>
        </div>
      )}

      {isAdmin && (
        <div className="px-[5%] mb-4">
          <div className="text-black rounded-[12px] border border-[#DBDADE] p-6 shadow-md mt-6 flex flex-col md:flex-row justify-between items-center bg-white gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-medium">
                Extrato de {mesSelecionado}/{anoAtual} ({selectedProject})
              </h2>
              <p className="text-sm opacity-80">
                Apenas itens validados entram no cálculo principal
              </p>
            </div>
            <h1
              className={`text-2xl md:text-4xl font-bold ${saldoFinal >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              R$ {formatarMoeda(saldoFinal)}
            </h1>
          </div>
        </div>
      )}

      <div className="px-[5%]">
        {isAdmin && (
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm mb-[24px]">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h1 className="text-[30px] font-bold text-[#464C54]">Entradas</h1>
              <div className="flex w-full md:w-[375px] flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={buscaEntrada}
                  onChange={(e) => setBuscaEntrada(e.target.value)}
                  className="h-[40px] w-full border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none"
                />
                <ButtonDefault
                  onClick={() => setModalEntradaAberto(true)}
                  className="w-full"
                >
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
                  Total Lançado:
                </span>
                <span className="text-sm md:text-[18px] font-bold text-[#464C54]">
                  R$ {formatarMoeda(somaTotalEntradas)}
                </span>
              </div>
              <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#E8F5E9] gap-2">
                <span className="text-sm text-[#2E7D32] uppercase font-semibold">
                  Total Validado:
                </span>
                <span className="text-sm md:text-[18px] font-bold text-[#1B5E20]">
                  R$ {formatarMoeda(totalEntradasValidadas)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm mb-[24px] mt-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-[30px] font-bold text-[#464C54]">Saídas</h1>
            <div className="flex flex-col md:flex-row w-full md:w-[375px] gap-4">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={buscaSaida}
                onChange={(e) => setBuscaSaida(e.target.value)}
                className="h-[40px] w-full border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none"
              />
              {isAdmin && (
                <ButtonDefault
                  className="w-full"
                  onClick={() => setModalSaidaAberto(true)}
                >
                  + Nova Saída
                </ButtonDefault>
              )}
            </div>
          </div>
          <TabelaSimples
            colunas={["Pago", "Descrição", "Forma Pag.", "Valor", "Data", ""]}
            dados={gerarLinhasTabela(saidas, buscaSaida, "saida")}
          />
          <div className="grid xl:grid-cols-2 gap-[10px] w-full mt-4">
            <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#F8F9FA] gap-2">
              <span className="text-sm text-[#71717A] uppercase font-semibold">
                Total Lançado:
              </span>
              <span className="text-sm md:text-[18px] font-bold text-[#464C54]">
                R$ {formatarMoeda(somaTotalSaidas)}
              </span>
            </div>
            <div className="flex justify-center items-center border border-[#DBDADE] rounded-[8px] p-2 bg-[#FFEBEE] gap-2">
              <span className="text-sm text-[#C62828] uppercase font-semibold">
                Total Validado:
              </span>
              <span className="text-sm md:text-[18px] font-bold text-[#B71C1C]">
                R$ {formatarMoeda(totalSaidasValidadas)}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] p-[24px] shadow-sm mb-[40px]">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
              <h1 className="text-[30px] font-bold text-[#464C54]">
                Controle Anual
              </h1>
              <input
                type="number"
                value={anoFiltroAnual}
                onChange={(e) => setAnoFiltroAnual(e.target.value)}
                className="h-[40px] w-full sm:w-auto border border-[#DBDADE] rounded-[8px] px-3 focus:outline-none"
              />
            </div>
            <TabelaSimples
              colunas={["Mês", "Entrada", "Saida", "Balanço"]}
              dados={dadosAnuais}
            />
            <div className="flex flex-col lg:flex-row justify-center items-center border border-[#DBDADE] rounded-[8px] p-4 bg-[#F8F9FA] gap-8 mt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[#71717A] uppercase font-semibold">
                  Balanço Validado do Ano:
                </span>
                <span
                  className={`text-[18px] font-bold ${totaisAnuais.validado >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  R$ {formatarMoeda(totaisAnuais.validado)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#71717A] uppercase font-semibold">
                  Balanço Previsto (Total Lançado):
                </span>
                <span
                  className={`text-[18px] font-bold ${totaisAnuais.previsto >= 0 ? "text-green-600/70" : "text-red-600/70"}`}
                >
                  R$ {formatarMoeda(totaisAnuais.previsto)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
