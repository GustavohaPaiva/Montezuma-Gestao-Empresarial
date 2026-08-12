import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ModuleHub from "../../components/gerais/ModuleHub";
import BaseCard from "../../components/cards/BaseCard";
import ModalFinanceiroLancamento from "../../components/modals/ModalFinanceiroLancamento";
import ButtonDefault from "../../components/gerais/ButtonDefault";
import BaseSelect from "../../components/gerais/BaseSelect";
import ModalPortal from "../../components/gerais/ModalPortal";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { ID_MONTEZUMA } from "../../constants/escritorios";
import { homeDictionary } from "../../constants/dictionaries";
import { getKpiGridClass } from "../home/homeUi";
import {
  AlertCircle,
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

const hub = homeDictionary.financeiroHub;

const MESES_OPCOES = [
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
].map((m) => ({
  value: m,
  label: new Date(2000, parseInt(m, 10) - 1).toLocaleString("pt-BR", {
    month: "long",
  }),
}));

export default function Financeiro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = TIPOS_FINANCEIRO_ADMIN.includes(user?.tipo);

  const [modalLancamentoAberto, setModalLancamentoAberto] = useState(false);

  const escritorioId = ID_MONTEZUMA;

  const [entradas, setEntradas] = useState([]);
  const [saidas, setSaidas] = useState([]);
  const [recarregar, setRecarregar] = useState(0);

  const [buscaEntrada, setBuscaEntrada] = useState("");
  const [buscaSaida, setBuscaSaida] = useState("");
  const [limiteMobileEntradas, setLimiteMobileEntradas] = useState(8);
  const [limiteMobileSaidas, setLimiteMobileSaidas] = useState(8);
  const [loadingMensal, setLoadingMensal] = useState(true);
  const [loadingAnual, setLoadingAnual] = useState(Boolean(isAdmin));
  const [loadingCaixa, setLoadingCaixa] = useState(Boolean(isAdmin));
  const [caixaGeral, setCaixaGeral] = useState({
    entradas: 0,
    saidas: 0,
    saldo: 0,
  });

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
    if (!escritorioId || !isAdmin) {
      setLoadingCaixa(false);
      return;
    }
    const carregarCaixa = async () => {
      setLoadingCaixa(true);
      try {
        const saldo = await api.getFinanceiroCaixaSaldo(escritorioId);
        setCaixaGeral({
          entradas: saldo?.entradas || 0,
          saidas: saldo?.saidas || 0,
          saldo: saldo?.saldo || 0,
        });
      } catch (erro) {
        console.error("Erro ao buscar caixa Montezuma:", erro);
        setCaixaGeral({ entradas: 0, saidas: 0, saldo: 0 });
      } finally {
        setLoadingCaixa(false);
      }
    };
    carregarCaixa();
  }, [escritorioId, recarregar, isAdmin]);

  useEffect(() => {
    if (!escritorioId) return;
    const carregarDados = async () => {
      setLoadingMensal(true);
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
      } finally {
        setLoadingMensal(false);
      }
    };
    carregarDados();
  }, [escritorioId, mesSelecionado, anoAtual, recarregar, isAdmin]);

  useEffect(() => {
    if (!escritorioId || !isAdmin) {
      setLoadingAnual(false);
      return;
    }
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
        setLoadingAnual(true);
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
      } finally {
        setLoadingAnual(false);
      }
    };
    carregarResumoAnual();
  }, [escritorioId, anoFiltroAnual, recarregar, isAdmin]);

  const carregandoFinanceiro =
    loadingMensal ||
    (isAdmin && loadingAnual) ||
    (isAdmin && loadingCaixa);

  const handleSalvarLancamento = async (tipo, dadosFormulario) => {
    try {
      const dataFinal =
        dadosFormulario.data || new Date().toISOString().split("T")[0];
      const tabela = tipo === "entrada" ? "entradas" : "saida";
      await api.createFinanceiro(tabela, {
        ...dadosFormulario,
        data: dataFinal,
        escritorio_id: dadosFormulario.escritorio_id ?? escritorioId,
      });
      setModalLancamentoAberto(false);
      setRecarregar((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      mostrarAlerta(
        "Erro",
        tipo === "entrada" ? "Erro ao salvar entrada." : "Erro ao salvar saída.",
      );
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
  const saldoValidado = totalEntradasValidadas - totalSaidasValidadas;

  const somaTotalEntradas = entradas.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0,
  );
  const somaTotalSaidas = saidas.reduce(
    (acc, curr) => acc + (parseFloat(curr.valor) || 0),
    0,
  );
  const saldoPrevisto = somaTotalEntradas - somaTotalSaidas;

  const pendentesCount =
    (isAdmin
      ? entradas.filter((i) => i.validacao !== 1).length
      : 0) + saidas.filter((i) => i.validacao !== 1).length;

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
  const entradasMobileVisiveis = entradasFiltradas.slice(
    0,
    limiteMobileEntradas,
  );
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
                type="button"
                onClick={() => salvarEdicao(nomeTabela, item, "valor")}
                className="cursor-pointer border-none bg-transparent"
              >
                <Check className="h-4 w-4 text-emerald-700" />
              </button>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => iniciarEdicao(nomeTabela, item, "valor")}
            >
              <span className="font-bold">R$ {formatarMoeda(item.valor)}</span>
              <Pencil className="h-3.5 w-3.5 text-text-muted opacity-70" />
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
            type="button"
            title="Jogar para o próximo mês"
            onClick={() => handleAdiarMes(nomeTabela, item)}
            className="p-2 hover:bg-blue-50 rounded-full border-none bg-transparent cursor-pointer text-blue-600"
          >
            <CalendarClock className="h-4 w-4" />
          </button>
          {isAdmin && (
            <button
              type="button"
              title="Excluir"
              onClick={() => handleDelete(nomeTabela, item)}
              className="p-2 hover:bg-red-50 rounded-full border-none bg-transparent cursor-pointer text-rose-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>,
      ];
    });
  };

  const renderMobileCard = (item, nomeTabela, tom) => {
    const isEmerald = tom === "emerald";
    const borderCls = isEmerald
      ? "border-emerald-200/60 bg-emerald-50/40"
      : "border-rose-200/70 bg-rose-50/40";
    const badgeCls = isEmerald
      ? "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30"
      : "bg-rose-500/15 text-rose-800 ring-rose-500/30";
    const valorCls = isEmerald ? "text-emerald-800" : "text-rose-800";

    return (
      <article
        key={item.id}
        className={`rounded-2xl border p-4 shadow-sm ${borderCls}`}
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
          <span
            className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1 ${badgeCls}`}
          >
            {item.validacao === 1 ? "Validado" : "Pendente"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className={`text-lg font-medium ${valorCls}`}>
            R$ {formatarMoeda(item.valor)}
          </p>
          <p className="text-xs text-text-muted">{formatarDataBR(item.data)}</p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted">
            <input
              type="checkbox"
              checked={item.validacao === 1}
              onChange={() => handleToggleValidacao(nomeTabela, item)}
              className="h-4 w-4 cursor-pointer accent-check-accent"
            />
            Pago
          </label>
          <div className="inline-flex items-center gap-1">
            {editandoItem.tabela === nomeTabela &&
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
                  onClick={() => salvarEdicao(nomeTabela, item, "valor")}
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
                  onClick={() => iniciarEdicao(nomeTabela, item, "valor")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-700 ring-1 ring-slate-200"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Passar para o próximo mês"
                  onClick={() => handleAdiarMes(nomeTabela, item)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-700"
                >
                  <CalendarClock className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    title="Excluir"
                    onClick={() => handleDelete(nomeTabela, item)}
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
    );
  };

  const resumo = isAdmin
    ? [
        {
          id: "saldo-validado",
          label: hub.escritorioMetricSaldoValidado,
          value: `R$ ${formatarMoeda(saldoValidado)}`,
          icon: <Wallet className="h-5 w-5" />,
          theme: saldoValidado >= 0 ? "emerald" : "pink",
        },
        {
          id: "saldo-previsto",
          label: hub.escritorioMetricSaldoPrevisto,
          value: `R$ ${formatarMoeda(saldoPrevisto)}`,
          icon: <CircleDollarSign className="h-5 w-5" />,
          theme: "primary",
        },
        {
          id: "entradas",
          label: hub.escritorioMetricEntradas,
          value: `R$ ${formatarMoeda(totalEntradasValidadas)}`,
          icon: <TrendingUp className="h-5 w-5" />,
          theme: "emerald",
        },
        {
          id: "saidas",
          label: hub.escritorioMetricSaidas,
          value: `R$ ${formatarMoeda(totalSaidasValidadas)}`,
          icon: <TrendingDown className="h-5 w-5" />,
          theme: "pink",
        },
      ]
    : [
        {
          id: "saidas",
          label: hub.escritorioMetricSaidas,
          value: `R$ ${formatarMoeda(totalSaidasValidadas)}`,
          icon: <TrendingDown className="h-5 w-5" />,
          theme: "pink",
        },
        {
          id: "total",
          label: hub.escritorioTotalLancado,
          value: `R$ ${formatarMoeda(somaTotalSaidas)}`,
          icon: <Wallet className="h-5 w-5" />,
          theme: "primary",
        },
        {
          id: "pendentes",
          label: hub.escritorioMetricPendentes,
          value: String(pendentesCount),
          icon: <AlertCircle className="h-5 w-5" />,
          theme: "amber",
        },
      ];

  const colunasTabela = [
    "Pago",
    "Descrição",
    "Forma Pag.",
    "Valor",
    "Data",
    "Adiar/Excluir",
  ];

  return (
    <>
      {dialogo.aberto && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-opacity">
            <div className="bg-white rounded-[16px] p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-center transform transition-transform scale-100">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                <AlertCircle className="h-7 w-7 text-orange-600" />
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
                    type="button"
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

      <ModalFinanceiroLancamento
        isOpen={modalLancamentoAberto}
        onClose={() => setModalLancamentoAberto(false)}
        onSave={handleSalvarLancamento}
        userTipo={user?.tipo}
        escritorioProprioId={user?.escritorio_id}
        escritorioProprioNome={user?.escritorio}
        visaoEscritorioAtual="Montezuma"
        permitirEntrada={isAdmin}
      />

      <ModuleHub
        eyebrow={hub.eyebrow}
        titulo={hub.escritorioPaginaTitulo}
        onVoltar={() => navigate("/financeiro")}
        resumo={[]}
        dense
        acessos={[]}
        loading={carregandoFinanceiro}
        loadingTitulo={hub.escritorioLoadingTitulo}
        loadingDescricao={hub.escritorioLoadingDescricao}
        loadingIcon={<Wallet className="h-7 w-7" strokeWidth={2} />}
      >
        {isAdmin && (
          <section className="mb-5 overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-4 border-b border-border-primary/30 bg-gradient-to-br from-slate-50/90 to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <div className="mb-1 inline-flex items-center gap-2 text-accent-primary">
                  <Wallet className="h-4 w-4" strokeWidth={2.25} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                    {hub.eyebrow}
                  </span>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                  {hub.escritorioCaixaTitulo}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-text-muted">
                  {hub.escritorioCaixaSubtitulo}
                </p>
              </div>
              <div className="rounded-xl border border-border-primary/40 bg-white px-4 py-3 shadow-sm sm:min-w-[200px] sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {hub.escritorioCaixaEmCaixa}
                </p>
                <p
                  className={`mt-1 text-2xl font-bold tracking-tight ${
                    caixaGeral.saldo >= 0
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  R$ {formatarMoeda(caixaGeral.saldo)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:px-5 sm:pb-5">
              <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 px-4 py-3">
                <div className="mb-1 inline-flex items-center gap-2 text-emerald-700">
                  <TrendingUp className="h-4 w-4" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    {hub.escritorioCaixaEntradas}
                  </p>
                </div>
                <p className="text-lg font-semibold text-emerald-800">
                  R$ {formatarMoeda(caixaGeral.entradas)}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 px-4 py-3">
                <div className="mb-1 inline-flex items-center gap-2 text-rose-700">
                  <TrendingDown className="h-4 w-4" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    {hub.escritorioCaixaSaidas}
                  </p>
                </div>
                <p className="text-lg font-semibold text-rose-800">
                  R$ {formatarMoeda(caixaGeral.saidas)}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1 sm:max-w-[240px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
                {hub.escritorioFiltroMes}
              </label>
              <BaseSelect
                searchable={false}
                value={mesSelecionado}
                onChange={(e) => {
                  setMesSelecionado(e.target.value);
                  setLimiteMobileEntradas(8);
                  setLimiteMobileSaidas(8);
                }}
                wrapperClassName="w-full"
                className="h-11 w-full"
                options={MESES_OPCOES}
              />
            </div>
          </div>
          <ButtonDefault
            onClick={() => setModalLancamentoAberto(true)}
            className="!h-11 !w-full !rounded-xl !border !border-accent-primary !bg-accent-primary !px-4 !text-sm !font-semibold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.28)] hover:!bg-accent-primary-dark sm:!w-auto"
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {hub.escritorioNovoLancamento}
            </span>
          </ButtonDefault>
        </div>

        {resumo.length > 0 ? (
          <section
            className={`mb-5 w-full ${getKpiGridClass(resumo.length).replace(
              "gap-4 md:gap-6",
              "gap-3",
            )}`}
          >
            {resumo.map((item) => (
              <BaseCard
                key={item.id}
                variant="metricCompact"
                title={item.label}
                value={
                  loadingMensal ? (
                    <span className="inline-block h-7 w-12 animate-pulse rounded bg-surface-muted" />
                  ) : (
                    String(item.value ?? "—")
                  )
                }
                icon={item.icon}
                colorTheme={item.theme || "primary"}
              />
            ))}
          </section>
        ) : null}

        <div
          className={`mb-6 grid grid-cols-1 gap-5 ${isAdmin ? "lg:grid-cols-2" : ""}`}
        >
          {isAdmin && (
            <section className="rounded-2xl border border-border-primary/40 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-5">
              <div className="mb-4 flex flex-col gap-3">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-text-primary">
                    {hub.escritorioColunaEntradas}
                  </h2>
                  <p className="text-sm text-text-muted">
                    {hub.escritorioColunaEntradasSub}
                  </p>
                </div>
                <label className="relative w-full">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder={hub.escritorioBuscaPlaceholder}
                    value={buscaEntrada}
                    onChange={(e) => {
                      setBuscaEntrada(e.target.value);
                      setLimiteMobileEntradas(8);
                    }}
                    className="h-11 w-full rounded-xl border border-border-primary/50 bg-[#FAFAFA] pl-9 pr-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                  />
                </label>
              </div>

              <div className="hidden md:block">
                <TabelaSimples
                  variant="financeiro"
                  colunas={colunasTabela}
                  dados={gerarLinhasTabela(entradas, buscaEntrada, "entradas")}
                />
              </div>

              <div className="space-y-3 md:hidden">
                {entradasFiltradas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border-primary/55 bg-[#FAFAFA] px-4 py-8 text-center">
                    <CircleDollarSign className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                    <p className="text-sm font-semibold text-text-primary">
                      {hub.escritorioVazioEntradas}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {hub.escritorioVazioHint}
                    </p>
                  </div>
                ) : (
                  entradasMobileVisiveis.map((item) =>
                    renderMobileCard(item, "entradas", "emerald"),
                  )
                )}
                {entradasFiltradas.length > limiteMobileEntradas && (
                  <button
                    type="button"
                    onClick={() =>
                      setLimiteMobileEntradas((prev) => prev + 8)
                    }
                    className="w-full rounded-xl border border-border-primary/40 bg-white py-2.5 text-sm font-semibold text-text-primary shadow-sm"
                  >
                    Ver mais ({entradasFiltradas.length - limiteMobileEntradas}{" "}
                    restantes)
                  </button>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border-primary/40 bg-[#FAFAFA] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {hub.escritorioTotalLancado}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    R$ {formatarMoeda(somaTotalEntradas)}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80">
                    {hub.escritorioTotalValidado}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-emerald-800">
                    R$ {formatarMoeda(totalEntradasValidadas)}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-border-primary/40 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-5">
            <div className="mb-4 flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-text-primary">
                  {hub.escritorioColunaSaidas}
                </h2>
                <p className="text-sm text-text-muted">
                  {hub.escritorioColunaSaidasSub}
                </p>
              </div>
              <label className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder={hub.escritorioBuscaPlaceholder}
                  value={buscaSaida}
                  onChange={(e) => {
                    setBuscaSaida(e.target.value);
                    setLimiteMobileSaidas(8);
                  }}
                  className="h-11 w-full rounded-xl border border-border-primary/50 bg-[#FAFAFA] pl-9 pr-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/20"
                />
              </label>
            </div>

            <div className="hidden md:block">
              <TabelaSimples
                variant="financeiro"
                colunas={colunasTabela}
                dados={gerarLinhasTabela(saidas, buscaSaida, "saida")}
              />
            </div>

            <div className="space-y-3 md:hidden">
              {saidasFiltradas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border-primary/55 bg-[#FAFAFA] px-4 py-8 text-center">
                  <CircleDollarSign className="mx-auto mb-2 h-8 w-8 text-text-muted" />
                  <p className="text-sm font-semibold text-text-primary">
                    {hub.escritorioVazioSaidas}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {hub.escritorioVazioHint}
                  </p>
                </div>
              ) : (
                saidasMobileVisiveis.map((item) =>
                  renderMobileCard(item, "saida", "rose"),
                )
              )}
              {saidasFiltradas.length > limiteMobileSaidas && (
                <button
                  type="button"
                  onClick={() => setLimiteMobileSaidas((prev) => prev + 8)}
                  className="w-full rounded-xl border border-border-primary/40 bg-white py-2.5 text-sm font-semibold text-text-primary shadow-sm"
                >
                  Ver mais ({saidasFiltradas.length - limiteMobileSaidas}{" "}
                  restantes)
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border-primary/40 bg-[#FAFAFA] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {hub.escritorioTotalLancado}
                </p>
                <p className="mt-1 text-sm font-semibold text-text-primary">
                  R$ {formatarMoeda(somaTotalSaidas)}
                </p>
              </div>
              <div className="rounded-xl border border-rose-200/60 bg-rose-50/50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700/80">
                  {hub.escritorioTotalValidado}
                </p>
                <p className="mt-1 text-sm font-semibold text-rose-800">
                  R$ {formatarMoeda(totalSaidasValidadas)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {isAdmin && (
          <section className="mb-8 rounded-2xl border border-border-primary/40 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-5">
            <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="mb-1 inline-flex items-center gap-2 text-text-muted">
                  <CalendarRange className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
                    {hub.eyebrow}
                  </span>
                </div>
                <h2 className="text-lg font-bold tracking-tight text-text-primary">
                  {hub.escritorioControleAnual}
                </h2>
              </div>
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
                      className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ring-1 ${
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

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border-primary/40 bg-[#FAFAFA] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {hub.escritorioBalancoValidadoAno}
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${totaisAnuais.validado >= 0 ? "text-emerald-700" : "text-rose-700"}`}
                >
                  R$ {formatarMoeda(totaisAnuais.validado)}
                </p>
              </div>
              <div className="rounded-xl border border-border-primary/40 bg-[#FAFAFA] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  {hub.escritorioBalancoPrevistoAno}
                </p>
                <p
                  className={`mt-1 text-lg font-semibold ${totaisAnuais.previsto >= 0 ? "text-emerald-700/80" : "text-rose-700/80"}`}
                >
                  R$ {formatarMoeda(totaisAnuais.previsto)}
                </p>
              </div>
            </div>
          </section>
        )}
      </ModuleHub>
    </>
  );
}
