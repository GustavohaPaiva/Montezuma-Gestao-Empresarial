import { useState, useEffect } from "react";
import Navbar from "../../components/navbar/Navbar";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ModalFinanceiroEntrada from "../../components/modals/ModalFinanceiroEntrada";
import ModalFinanceiroSaida from "../../components/modals/ModalFinanceiroSaida";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import ModalPortal from "../../components/gerais/ModalPortal";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { ID_MONTEZUMA } from "../../constants/escritorios";
import {
  CalendarRange,
  CalendarClock,
  Check,
  CircleDollarSign,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  TIPOS_FINANCEIRO_ADMIN,
  formatarDataBR,
  formatarMoeda,
  checkIsParcelado,
} from "./financeiroUtils";

export default function Financeiro() {
  const { user } = useAuth();
  const isAdmin = TIPOS_FINANCEIRO_ADMIN.includes(user?.tipo);

  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [modalSaidaAberto, setModalSaidaAberto] = useState(false);

  const escritorioId = ID_MONTEZUMA;

  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [recarregar, setRecarregar] = useState(0);

  const [buscaEntrada, setBuscaEntrada] = useState("");
  const [buscaSaida, setBuscaSaida] = useState("");
  const [limiteMobileEntradas, setLimiteMobileEntradas] = useState(8);
  const [limiteMobileSaidas, setLimiteMobileSaidas] = useState(8);

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
          className:
            "bg-success-primary text-white hover:bg-success-primary-dark shadow-sm",
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
  const [dadosAnuaisResumo, setDadosAnuaisResumo] = useState([]);
  const [totaisAnuais, setTotaisAnuais] = useState({
    validado: 0,
    previsto: 0,
  });

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

        const resultadosResumo = resultadosRaw.map((r, index) => {
          const balVal = r.totalEntVal - r.totalSaiVal;
          const balPrev = r.totalEntPrev - r.totalSaiPrev;
          return {
            mes: nomesMeses[index],
            entradaValidada: r.totalEntVal,
            entradaPrevista: r.totalEntPrev,
            saidaValidada: r.totalSaiVal,
            saidaPrevista: r.totalSaiPrev,
            balancoValidado: balVal,
            balancoPrevisto: balPrev,
          };
        });

        setDadosAnuais(resultadosFormatados);
        setDadosAnuaisResumo(resultadosResumo);
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
        escritorio_id: dadosFormulario.escritorio_id ?? escritorioId,
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
        escritorio_id: dadosFormulario.escritorio_id ?? escritorioId,
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
      await api.deleteFinanceiro(tabela, id, excluirTodas, escritorioId);
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
            className: "bg-gray-100 text-text-primary hover:bg-gray-200",
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
            className: "bg-gray-100 text-text-primary hover:bg-gray-200",
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

      await api.updateFinanceiro(
        tabela,
        item.id,
        {
          data: novaData,
          descricao: novaDescricao,
        },
        escritorioId,
      );
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
          className: "bg-gray-100 text-text-primary hover:bg-gray-200",
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
      await api.updateFinanceiro(tabela, id, payload, escritorioId);
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
                className:
                  "bg-gray-100 text-text-primary hover:bg-gray-200 mt-2",
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
      await api.updateFinanceiro(
        tabela,
        item.id,
        { validacao: novoStatus },
        escritorioId,
      );
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

  const gerarListaFiltrada = (dadosIniciais, termoBusca) => {
    if (!Array.isArray(dadosIniciais)) return [];
    let lista = [...dadosIniciais];
    if (termoBusca) {
      lista = lista.filter((item) =>
        item.descricao?.toLowerCase().includes(termoBusca.toLowerCase()),
      );
    }
    lista.sort((a, b) => (a.validacao || 0) - (b.validacao || 0));
    return lista;
  };

  const entradasFiltradas = gerarListaFiltrada(entradas, buscaEntrada);
  const saidasFiltradas = gerarListaFiltrada(saidas, buscaSaida);
  const entradasMobileVisiveis = entradasFiltradas.slice(0, limiteMobileEntradas);
  const saidasMobileVisiveis = saidasFiltradas.slice(0, limiteMobileSaidas);

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
            className="h-[18px] w-[18px] accent-check-accent cursor-pointer"
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
                className="w-[80px] p-[4px] border border-border-primary rounded-[8px] focus:outline-none text-center"
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
        <ModalPortal>
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
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  {dialogo.titulo}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
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
        </ModalPortal>
      )}

      <ModalFinanceiroEntrada
        isOpen={modalEntradaAberto}
        onClose={() => setModalEntradaAberto(false)}
        onSave={handleSalvarEntrada}
        userTipo={user?.tipo}
        escritorioProprioId={user?.escritorio_id}
        escritorioProprioNome={user?.escritorio}
        visaoEscritorioAtual="Montezuma"
      />
      <ModalFinanceiroSaida
        isOpen={modalSaidaAberto}
        onClose={() => setModalSaidaAberto(false)}
        onSave={handleSalvarSaida}
        userTipo={user?.tipo}
        escritorioProprioId={user?.escritorio_id}
        escritorioProprioNome={user?.escritorio}
        visaoEscritorioAtual="Montezuma"
      />

      <Navbar className="static" />

      <div className="mt-4 flex w-full items-center px-[5%]">
        <div className="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-border-primary/40 bg-white p-3 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
              Filtro de período
            </p>
            <select
              value={mesSelecionado}
              onChange={(e) => {
                setMesSelecionado(e.target.value);
                setLimiteMobileEntradas(8);
                setLimiteMobileSaidas(8);
              }}
              className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-border-primary/45 bg-[#FAFAFA] px-3 text-sm font-semibold text-text-primary shadow-sm transition-all focus:border-accent-primary/40 focus:outline-none focus:ring-2 focus:ring-accent-primary/20 sm:w-auto sm:min-w-[220px]"
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
        </div>
      </div>

      {isAdmin && (
        <div className="mb-4 mt-6 px-[5%]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <article className="rounded-2xl border border-border-primary/40 bg-gradient-to-br from-white to-[#FAFAFA] p-5 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Saldo validado
              </p>
              <p
                className={`mt-1 text-2xl font-medium tracking-tight ${saldoFinal >= 0 ? "text-emerald-700" : "text-rose-700"}`}
              >
                R$ {formatarMoeda(saldoFinal)}
              </p>
            </article>
            <article className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white p-5 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700/80">
                Entradas validadas
              </p>
              <p className="mt-1 text-2xl font-medium tracking-tight text-emerald-800">
                R$ {formatarMoeda(totalEntradasValidadas)}
              </p>
            </article>
            <article className="rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50/70 to-white p-5 shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-700">
                <TrendingDown className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700/80">
                Saídas validadas
              </p>
              <p className="mt-1 text-2xl font-medium tracking-tight text-rose-800">
                R$ {formatarMoeda(totalSaidasValidadas)}
              </p>
            </article>
          </div>
        </div>
      )}

      <div className="px-[5%]">
        {isAdmin && (
          <div className="mb-6 rounded-2xl border border-border-primary/40 bg-white p-5 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-[30px]">
                  Entradas
                </h1>
                <p className="text-sm text-text-muted">
                  Receitas e recebimentos do período selecionado.
                </p>
              </div>
              <div className="flex w-full flex-wrap gap-3 md:w-auto md:justify-end">
                <label className="relative min-w-0 flex-1 md:min-w-[280px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar descrição..."
                    value={buscaEntrada}
                    onChange={(e) => {
                      setBuscaEntrada(e.target.value);
                      setLimiteMobileEntradas(8);
                    }}
                    className="h-11 w-full rounded-xl border border-border-primary/50 bg-[#FAFAFA] pl-9 pr-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                </label>
                <ButtonDefault
                  onClick={() => setModalEntradaAberto(true)}
                  className="!h-11 !w-full !rounded-xl !border !border-emerald-500/30 !bg-emerald-500/12 !px-4 !text-sm !font-semibold !text-emerald-800 hover:!bg-emerald-500/18 md:!w-auto"
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Entrada
                  </span>
                </ButtonDefault>
              </div>
            </div>
            <div className="hidden md:block">
              <TabelaSimples
                variant="financeiro"
                colunas={[
                  "Pago",
                  "Descrição",
                  "Forma Pag.",
                  "Valor",
                  "Data",
                  "",
                ]}
                dados={gerarLinhasTabela(entradas, buscaEntrada, "entradas")}
              />
            </div>
            <div className="space-y-3 md:hidden">
              {entradasFiltradas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border-primary/55 bg-[#FAFAFA] px-4 py-8 text-center">
                  <CircleDollarSign className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                  <p className="text-sm font-semibold text-text-primary">
                    Nenhuma entrada encontrada
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Ajuste os filtros ou adicione um novo lançamento.
                  </p>
                </div>
              ) : (
                entradasMobileVisiveis.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold uppercase text-text-primary">
                          {item.descricao}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
                          {item.forma}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-500/30">
                        {item.validacao === 1 ? "Validado" : "Pendente"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-lg font-medium text-emerald-800">
                        R$ {formatarMoeda(item.valor)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatarDataBR(item.data)}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted">
                        <input
                          type="checkbox"
                          checked={item.validacao === 1}
                          onChange={() =>
                            handleToggleValidacao("entradas", item)
                          }
                          className="h-4 w-4 cursor-pointer accent-check-accent"
                        />
                        Pago
                      </label>
                      <div className="inline-flex items-center gap-1">
                        {editandoItem.tabela === "entradas" &&
                        editandoItem.id === item.id &&
                        editandoItem.campo === "valor" ? (
                          <>
                            <input
                              type="number"
                              value={valorEditado}
                              onChange={(e) => setValorEditado(e.target.value)}
                              className="h-8 w-24 rounded-lg border border-border-primary/50 bg-white px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                salvarEdicao("entradas", item, "valor")
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelarEdicao}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/70 text-slate-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              title="Editar valor"
                              onClick={() =>
                                iniciarEdicao("entradas", item, "valor")
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              title="Passar para o próximo mês"
                              onClick={() => handleAdiarMes("entradas", item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-700"
                            >
                              <CalendarClock className="h-4 w-4" />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                title="Excluir"
                                onClick={() => handleDelete("entradas", item)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
              {entradasFiltradas.length > limiteMobileEntradas && (
                <button
                  type="button"
                  onClick={() => setLimiteMobileEntradas((prev) => prev + 8)}
                  className="w-full rounded-xl border border-border-primary/40 bg-white py-2.5 text-sm font-semibold text-text-primary shadow-sm"
                >
                  Ver mais entradas ({entradasFiltradas.length - limiteMobileEntradas} restantes)
                </button>
              )}
            </div>
            <div className="mt-4 grid w-full gap-3 xl:grid-cols-2">
              <div className="rounded-2xl border border-border-primary/40 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
                <div className="mb-2 mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <Wallet className="h-4 w-4" />
                </div>
                <span className="text-sm text-text-muted uppercase font-semibold">
                  Total Lançado:
                </span>
                <span className="block text-lg font-medium text-text-primary">
                  R$ {formatarMoeda(somaTotalEntradas)}
                </span>
              </div>
              <div className="rounded-2xl border border-emerald-300/45 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-sm">
                <div className="mb-2 mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <span className="text-sm text-success-primary uppercase font-semibold">
                  Total Validado:
                </span>
                <span className="block text-lg font-medium text-success-primary-dark">
                  R$ {formatarMoeda(totalEntradasValidadas)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-[24px] mt-6 rounded-2xl border border-border-primary/40 bg-white p-5 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-[30px]">
                Saídas
              </h1>
              <p className="text-sm text-text-muted">
                Despesas e pagamentos do período selecionado.
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-3 md:w-auto md:justify-end">
              <label className="relative min-w-0 flex-1 md:min-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar descrição..."
                  value={buscaSaida}
                  onChange={(e) => {
                    setBuscaSaida(e.target.value);
                    setLimiteMobileSaidas(8);
                  }}
                  className="h-11 w-full rounded-xl border border-border-primary/50 bg-[#FAFAFA] pl-9 pr-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                />
              </label>
              <ButtonDefault
                className="!h-11 !w-full !rounded-xl !border !border-rose-500/30 !bg-rose-500/12 !px-4 !text-sm !font-semibold !text-rose-800 hover:!bg-rose-500/18 md:!w-auto"
                onClick={() => setModalSaidaAberto(true)}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Saída
                </span>
              </ButtonDefault>
            </div>
          </div>
          <div className="hidden md:block">
            <TabelaSimples
              variant="financeiro"
              colunas={["Pago", "Descrição", "Forma Pag.", "Valor", "Data", ""]}
              dados={gerarLinhasTabela(saidas, buscaSaida, "saida")}
            />
          </div>
          <div className="space-y-3 md:hidden">
            {saidasFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-primary/55 bg-[#FAFAFA] px-4 py-8 text-center">
                <CircleDollarSign className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                <p className="text-sm font-semibold text-text-primary">
                  Nenhuma saída encontrada
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Ajuste os filtros ou adicione um novo lançamento.
                </p>
              </div>
            ) : (
              saidasMobileVisiveis.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold uppercase text-text-primary">
                        {item.descricao}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-text-muted">
                        {item.forma}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-800 ring-1 ring-rose-500/30">
                      {item.validacao === 1 ? "Validado" : "Pendente"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-medium text-rose-800">
                      R$ {formatarMoeda(item.valor)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {formatarDataBR(item.data)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted">
                      <input
                        type="checkbox"
                        checked={item.validacao === 1}
                        onChange={() => handleToggleValidacao("saida", item)}
                        className="h-4 w-4 cursor-pointer accent-check-accent"
                      />
                      Pago
                    </label>
                    <div className="inline-flex items-center gap-1">
                      {editandoItem.tabela === "saida" &&
                      editandoItem.id === item.id &&
                      editandoItem.campo === "valor" ? (
                        <>
                          <input
                            type="number"
                            value={valorEditado}
                            onChange={(e) => setValorEditado(e.target.value)}
                            className="h-8 w-24 rounded-lg border border-border-primary/50 bg-white px-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                          />
                          <button
                            type="button"
                            onClick={() => salvarEdicao("saida", item, "valor")}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelarEdicao}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200/70 text-slate-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            title="Editar valor"
                            onClick={() =>
                              iniciarEdicao("saida", item, "valor")
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            title="Passar para o próximo mês"
                            onClick={() => handleAdiarMes("saida", item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-700"
                          >
                            <CalendarClock className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              type="button"
                              title="Excluir"
                              onClick={() => handleDelete("saida", item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
            {saidasFiltradas.length > limiteMobileSaidas && (
              <button
                type="button"
                onClick={() => setLimiteMobileSaidas((prev) => prev + 8)}
                className="w-full rounded-xl border border-border-primary/40 bg-white py-2.5 text-sm font-semibold text-text-primary shadow-sm"
              >
                Ver mais saídas ({saidasFiltradas.length - limiteMobileSaidas} restantes)
              </button>
            )}
          </div>
          <div className="mt-4 grid w-full gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border border-border-primary/40 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm">
              <div className="mb-2 mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Wallet className="h-4 w-4" />
              </div>
              <span className="text-sm text-text-muted uppercase font-semibold">
                Total Lançado:
              </span>
              <span className="block text-lg font-medium text-text-primary">
                R$ {formatarMoeda(somaTotalSaidas)}
              </span>
            </div>
            <div className="rounded-2xl border border-rose-300/45 bg-gradient-to-br from-rose-50/70 to-white p-4 shadow-sm">
              <div className="mb-2 mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/15 text-rose-700">
                <TrendingDown className="h-4 w-4" />
              </div>
              <span className="text-sm text-danger-primary uppercase font-semibold">
                Total Validado:
              </span>
              <span className="block text-lg font-medium text-danger-primary-dark">
                R$ {formatarMoeda(totalSaidasValidadas)}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-[40px] rounded-2xl border border-border-primary/40 bg-white p-5 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-6">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-[30px]">
                Controle Anual
              </h1>
              <label className="relative w-full sm:w-auto">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="number"
                  value={anoFiltroAnual}
                  onChange={(e) => setAnoFiltroAnual(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border-primary/50 bg-[#FAFAFA] pl-9 pr-3 text-sm font-semibold text-text-primary shadow-sm transition-all focus:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/20 sm:w-[140px]"
                />
              </label>
            </div>
            <div className="hidden md:block">
              <TabelaSimples
                variant="financeiro"
                colunas={["Mês", "Entrada", "Saida", "Balanço"]}
                dados={dadosAnuais}
              />
            </div>
            <div className="space-y-3 md:hidden">
              {dadosAnuaisResumo.map((item) => (
                <article
                  key={item.mes}
                  className="rounded-2xl border border-border-primary/45 bg-[#FAFAFA] p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text-primary">
                      {item.mes}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                        item.balancoValidado >= 0
                          ? "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30"
                          : "bg-rose-500/15 text-rose-800 ring-rose-500/30"
                      }`}
                    >
                      {item.balancoValidado >= 0 ? "Positivo" : "Negativo"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-emerald-50/70 p-2">
                      <p className="font-semibold uppercase text-emerald-700/80">
                        Entrada
                      </p>
                      <p className="mt-1 font-medium text-emerald-800">
                        R$ {formatarMoeda(item.entradaValidada)}
                      </p>
                      <p className="text-[11px] text-emerald-700/70">
                        Total: R$ {formatarMoeda(item.entradaPrevista)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-rose-50/70 p-2">
                      <p className="font-semibold uppercase text-rose-700/80">
                        Saída
                      </p>
                      <p className="mt-1 font-medium text-rose-800">
                        R$ {formatarMoeda(item.saidaValidada)}
                      </p>
                      <p className="text-[11px] text-rose-700/70">
                        Total: R$ {formatarMoeda(item.saidaPrevista)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl border border-border-primary/40 bg-white px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase text-text-muted">
                      Balanço
                    </p>
                    <p
                      className={`text-base font-medium ${
                        item.balancoValidado >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      R$ {formatarMoeda(item.balancoValidado)}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      Previsto: R$ {formatarMoeda(item.balancoPrevisto)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-4 flex flex-col items-center justify-center gap-5 rounded-xl border border-border-primary/40 bg-[#FAFAFA] p-4 lg:flex-row lg:gap-8">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold uppercase text-text-muted">
                  Balanço Validado do Ano:
                </span>
                <span
                  className={`text-[18px] font-medium ${totaisAnuais.validado >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                >
                  R$ {formatarMoeda(totaisAnuais.validado)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold uppercase text-text-muted">
                  Balanço Previsto (Total Lançado):
                </span>
                <span
                  className={`text-[18px] font-medium ${totaisAnuais.previsto >= 0 ? "text-emerald-700/80" : "text-rose-700/80"}`}
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
