import { useState, useEffect } from "react";
import { Check, CalendarClock, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TabelaSimples from "../../components/gerais/TabelaSimples";
import ModalEntradaEscritorio from "../../components/modals/ModalEntradaEscritorio";
import ModalSaidaEscritorio from "../../components/modals/ModalSaidaEscritorio";
import ModalPortal from "../../components/gerais/ModalPortal";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
// IMPORTANTE: Adicionado ID_VOGELKOP e ID_YBYOCA para resgatar o tema no Portal
import {
  ESCRITORIO_NOME_POR_ID,
  ID_VOGELKOP,
} from "../../constants/escritorios";
import {
  TIPOS_FINANCEIRO_ADMIN,
  formatarDataBR,
  formatarMoeda,
  checkIsParcelado,
} from "../financeiro/financeiroUtils";
import { useEscritorioIdFromPath } from "../../hooks/useEscritorioIdFromPath";

export default function FinanceiroEscritorio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = TIPOS_FINANCEIRO_ADMIN.includes(user?.tipo);
  const escritorioId = useEscritorioIdFromPath();

  // INJEÇÃO DO TEMA PARA OS MINI MODAIS (PORTAL)
  const temaClasse =
    escritorioId === ID_VOGELKOP ? "theme-vogelkop" : "theme-ybyoca";

  const [modalEntradaAberto, setModalEntradaAberto] = useState(false);
  const [modalSaidaAberto, setModalSaidaAberto] = useState(false);

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
          className:
            "rounded-xl border border-esc-destaque/40 bg-esc-destaque/15 text-esc-destaque hover:bg-esc-destaque/25 shadow-[0_0_15px_-3px_var(--color-esc-destaque)]",
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
              <span className="font-bold text-status-concluida-text">
                R$ {formatarMoeda(r.totalEntVal)}
              </span>
              <span className="text-xs text-status-concluida-text/70">
                Total: R$ {formatarMoeda(r.totalEntPrev)}
              </span>
            </div>,
            <div key={`sai-${index}`} className="flex flex-col">
              <span className="font-bold text-status-aguardando-text">
                R$ {formatarMoeda(r.totalSaiVal)}
              </span>
              <span className="text-xs text-status-aguardando-text/75">
                Total: R$ {formatarMoeda(r.totalSaiPrev)}
              </span>
            </div>,
            <div key={`bal-${index}`} className="flex flex-col">
              <span
                className={
                  balVal >= 0
                    ? "font-bold text-status-concluida-text"
                    : "font-bold text-status-aguardando-text"
                }
              >
                R$ {formatarMoeda(balVal)}
              </span>
              <span
                className={`text-xs ${balPrev >= 0 ? "text-status-concluida-text/75" : "text-status-aguardando-text/80"}`}
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
              "rounded-xl border border-esc-border bg-black/40 text-esc-text hover:bg-white/5",
            onClick: () => {
              executarExclusao(tabela, item.id, false);
              fecharDialogo();
            },
          },
          {
            texto: "Excluir Todas as Parcelas",
            className:
              "rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 text-esc-destaque hover:bg-esc-destaque/30 shadow-[0_0_15px_-3px_var(--color-esc-destaque)]",
            onClick: () => {
              executarExclusao(tabela, item.id, true);
              fecharDialogo();
            },
          },
          {
            texto: "Cancelar",
            className:
              "rounded-xl border border-white/10 bg-transparent text-esc-muted hover:bg-white/5",
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
            className:
              "rounded-xl border border-white/10 bg-transparent text-esc-text hover:bg-white/5",
            onClick: fecharDialogo,
          },
          {
            texto: "Excluir",
            className:
              "rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 text-esc-destaque hover:bg-esc-destaque/30 shadow-[0_0_15px_-3px_var(--color-esc-destaque)]",
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
          className:
            "rounded-xl border border-white/10 bg-transparent text-esc-text hover:bg-white/5",
          onClick: fecharDialogo,
        },
        {
          texto: "Adiar Lançamento",
          className:
            "rounded-xl border border-esc-destaque/40 bg-esc-destaque/20 text-esc-destaque hover:bg-esc-destaque/30 shadow-[0_0_15px_-3px_var(--color-esc-destaque)]",
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
                  "rounded-xl border border-white/10 bg-black/40 text-esc-text hover:bg-white/5",
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
                  "rounded-xl border border-esc-destaque/30 bg-esc-destaque/10 text-esc-destaque hover:bg-esc-destaque/20 shadow-[0_0_15px_-3px_var(--color-esc-destaque)]",
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
                  "rounded-xl border border-white/10 bg-transparent text-esc-text hover:bg-white/5",
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
                  "rounded-xl border border-white/10 bg-transparent text-esc-muted hover:bg-white/5",
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
                  "rounded-xl border border-esc-border bg-black/60 text-esc-muted hover:bg-white/5",
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

  const gerarLinhasTabela = (dadosIniciais, termoBusca, nomeTabela) => {
    if (!Array.isArray(dadosIniciais)) return [];
    let lista = [...dadosIniciais];
    if (termoBusca) {
      lista = lista.filter((item) =>
        item.descricao?.toLowerCase().includes(termoBusca.toLowerCase()),
      );
    }
    lista.sort((a, b) => (a.validacao || 0) - (b.validacao || 0));

    const classeValorMontante =
      nomeTabela === "entradas"
        ? "font-bold text-status-concluida-text"
        : "font-bold text-status-aguardando-text";

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
            className="h-[18px] w-[18px] cursor-pointer accent-esc-destaque"
          />
        </div>,
        <div key={`desc-${item.id}`} className="uppercase text-esc-text">
          {item.descricao}
        </div>,
        <div key={`forma-${item.id}`} className="uppercase text-esc-muted">
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
                className="w-24 rounded-lg border border-esc-border bg-black/40 px-2 py-1 text-center text-sm text-esc-text focus:outline-none focus:ring-1 focus:ring-esc-destaque"
                autoFocus
              />
              <button
                type="button"
                onClick={() => salvarEdicao(nomeTabela, item, "valor")}
                className="cursor-pointer rounded-lg border border-esc-destaque/30 bg-esc-destaque/10 p-1.5 text-esc-destaque transition hover:bg-esc-destaque/20"
                aria-label="Salvar valor"
              >
                <Check className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <div
              className="group flex cursor-pointer items-center gap-2"
              onClick={() => iniciarEdicao(nomeTabela, item, "valor")}
              onKeyDown={(e) => {
                if (e.key === "Enter") iniciarEdicao(nomeTabela, item, "valor");
              }}
              role="button"
              tabIndex={0}
            >
              <span className={classeValorMontante}>
                R$ {formatarMoeda(item.valor)}
              </span>
              <Pencil
                className="h-4 w-4 text-esc-muted opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </div>
          )}
        </div>,
        <div
          className="flex items-center justify-center gap-2 text-esc-muted"
          key={`dat-${item.id}`}
        >
          <span>{formatarDataBR(item.data)}</span>
        </div>,
        <div
          className="group flex justify-center gap-2"
          key={`actions-${item.id}`}
        >
          <button
            type="button"
            title="Jogar para o próximo mês"
            onClick={() => handleAdiarMes(nomeTabela, item)}
            className="cursor-pointer rounded-full border border-transparent p-2 text-esc-muted opacity-0 transition-all hover:border-esc-border hover:bg-white/5 group-hover:opacity-100"
          >
            <CalendarClock className="h-4 w-4" aria-hidden />
          </button>
          {isAdmin && (
            <button
              type="button"
              title="Excluir"
              onClick={() => handleDelete(nomeTabela, item)}
              className="cursor-pointer rounded-full border border-transparent p-2 text-esc-muted opacity-0 transition-all hover:border-esc-border hover:bg-white/5 hover:text-esc-destaque group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>,
      ];
    });
  };

  const tituloFonte = ESCRITORIO_NOME_POR_ID[escritorioId] ?? "Escritório";

  return (
    <div className="relative w-full pb-12 text-esc-text">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-6 mt-4 flex cursor-pointer items-center gap-2 text-esc-muted transition-colors hover:text-esc-destaque"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Voltar
      </button>

      {/* MINI MODAL: DIÁLOGO PREMIUM GLASSMORPHISM */}
      {dialogo.aberto && (
        <ModalPortal>
          <div
            className={`${temaClasse} fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity`}
          >
            <div className="animate-premium-reveal relative flex w-full max-w-md flex-col gap-5 overflow-hidden rounded-2xl border border-white/20 bg-esc-card p-7 text-center shadow-[0_0_80px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl">
              {/* Glow Físico do Diálogo */}
              <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]"></div>
              <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/10 blur-[70px]"></div>

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-esc-destaque/30 bg-esc-destaque/10 shadow-[0_0_15px_-3px_var(--color-esc-destaque)]">
                <svg
                  className="h-8 w-8 text-esc-destaque"
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
                <h3 className="mb-2 text-xl font-bold text-esc-text">
                  {dialogo.titulo}
                </h3>
                <p className="text-sm leading-relaxed text-esc-muted">
                  {dialogo.mensagem}
                </p>
              </div>

              <div
                className={`mt-4 flex ${dialogo.botoes.length > 2 ? "flex-col gap-3" : "w-full flex-row justify-center gap-3"}`}
              >
                {dialogo.botoes.map((btn, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={btn.onClick}
                    className={`px-4 py-3 text-sm font-semibold transition-all duration-300 ${btn.className} ${dialogo.botoes.length > 2 ? "w-full" : "flex-1"}`}
                  >
                    {btn.texto}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <ModalEntradaEscritorio
        isOpen={modalEntradaAberto}
        onClose={() => setModalEntradaAberto(false)}
        onSave={handleSalvarEntrada}
        escritorioId={escritorioId}
      />
      <ModalSaidaEscritorio
        isOpen={modalSaidaAberto}
        onClose={() => setModalSaidaAberto(false)}
        onSave={handleSalvarSaida}
        escritorioId={escritorioId}
      />

      <header className="mb-6 mt-4 flex w-full flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-esc-text md:text-3xl">
              Financeiro
            </h1>
            <p className="mt-1 text-sm text-esc-muted">
              Lançamentos — {tituloFonte}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(e.target.value)}
              className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm font-semibold text-esc-text shadow-sm sm:w-auto focus:border-esc-destaque focus:ring-1 focus:ring-esc-destaque focus:outline-none"
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
                <option key={m} value={m} className="bg-esc-bg text-esc-text">
                  {new Date(2000, parseInt(m) - 1).toLocaleString("pt-BR", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {isAdmin && (
        <div className="mb-6 w-full">
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-esc-card/90 p-6 shadow-lg backdrop-blur-md md:flex-row md:items-center md:justify-between relative overflow-hidden">
            {/* Glow no card de extrato principal */}
            <div className="pointer-events-none absolute top-1/2 left-0 -z-10 h-32 w-32 -translate-y-1/2 rounded-full bg-esc-destaque/10 blur-[50px]"></div>

            <div className="text-center md:text-left z-10">
              <h2 className="text-lg font-bold text-esc-text md:text-xl">
                Extrato de {mesSelecionado}/{anoAtual} ({tituloFonte})
              </h2>
              <p className="mt-1 text-sm text-esc-muted">
                Apenas itens validados entram no cálculo principal
              </p>
            </div>
            <p
              className={`text-center text-2xl font-bold tabular-nums md:text-4xl z-10 ${saldoFinal >= 0 ? "text-status-concluida-text" : "text-status-aguardando-text"}`}
            >
              R$ {formatarMoeda(saldoFinal)}
            </p>
          </div>
        </div>
      )}

      <div className="w-full">
        {isAdmin && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-esc-card p-6 shadow-lg backdrop-blur-md relative overflow-hidden">
            <div className="pointer-events-none absolute top-0 right-0 -z-10 h-40 w-40 rounded-full bg-esc-destaque/5 blur-[60px]"></div>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-bold text-esc-destaque md:text-3xl">
                Entradas
              </h2>
              <div className="flex w-full flex-col gap-3 md:flex-row md:justify-end">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={buscaEntrada}
                  onChange={(e) => setBuscaEntrada(e.target.value)}
                  className="h-10 w-full md:max-w-120 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-esc-text focus:border-esc-destaque focus:outline-none focus:ring-1 focus:ring-esc-destaque"
                />
                <button
                  type="button"
                  onClick={() => setModalEntradaAberto(true)}
                  className="rounded-xl border w-full md:max-w-50 h-10 border-esc-destaque/50 bg-esc-destaque/20 px-3 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all duration-300 hover:bg-esc-destaque/30 hover:shadow-[0_0_25px_-3px_var(--color-esc-destaque)]"
                >
                  + Nova Entrada
                </button>
              </div>
            </div>
            <TabelaSimples
              variant="escritorio"
              colunas={["Pago", "Descrição", "Forma Pag.", "Valor", "Data", ""]}
              dados={gerarLinhasTabela(entradas, buscaEntrada, "entradas")}
            />
            <div className="mt-4 grid w-full gap-3 xl:grid-cols-2">
              <div className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-black/40 p-3 shadow-inner">
                <span className="text-xs font-semibold uppercase text-esc-muted">
                  Total Lançado:
                </span>
                <span className="text-sm font-bold tabular-nums text-status-concluida-text md:text-lg">
                  R$ {formatarMoeda(somaTotalEntradas)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl border border-status-concluida-text/20 bg-black/40 p-3 shadow-inner">
                <span className="text-xs font-semibold uppercase text-esc-muted">
                  Total Validado:
                </span>
                <span className="text-sm font-bold tabular-nums text-status-concluida-text md:text-lg">
                  R$ {formatarMoeda(totalEntradasValidadas)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 mt-6 rounded-2xl border border-white/10 bg-esc-card p-6 shadow-lg backdrop-blur-md relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 right-0 -z-10 h-40 w-40 rounded-full bg-esc-destaque/5 blur-[60px]"></div>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold text-esc-destaque md:text-3xl">
              Saídas
            </h2>
            <div className="flex w-full flex-col gap-3 md:flex-row md:justify-end">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={buscaSaida}
                onChange={(e) => setBuscaSaida(e.target.value)}
                className="h-10 w-full md:max-w-120 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-esc-text focus:border-esc-destaque focus:outline-none focus:ring-1 focus:ring-esc-destaque"
              />

              <button
                type="button"
                className="rounded-xl border w-full md:max-w-50 h-10 border-esc-destaque/50 bg-esc-destaque/20 px-3 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all duration-300 hover:bg-esc-destaque/30 hover:shadow-[0_0_25px_-3px_var(--color-esc-destaque)]"
                onClick={() => setModalSaidaAberto(true)}
              >
                + Nova Saída
              </button>
            </div>
          </div>
          <TabelaSimples
            variant="escritorio"
            colunas={["Pago", "Descrição", "Forma Pag.", "Valor", "Data", ""]}
            dados={gerarLinhasTabela(saidas, buscaSaida, "saida")}
          />
          <div className="mt-4 grid w-full gap-3 xl:grid-cols-2">
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-black/40 p-3 shadow-inner">
              <span className="text-xs font-semibold uppercase text-esc-muted">
                Total Lançado:
              </span>
              <span className="text-sm font-bold tabular-nums text-status-aguardando-text md:text-lg">
                R$ {formatarMoeda(somaTotalSaidas)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-status-aguardando-text/20 bg-black/40 p-3 shadow-inner">
              <span className="text-xs font-semibold uppercase text-esc-muted">
                Total Validado:
              </span>
              <span className="text-sm font-bold tabular-nums text-status-aguardando-text md:text-lg">
                R$ {formatarMoeda(totalSaidasValidadas)}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mb-10 rounded-2xl border border-white/10 bg-esc-card p-6 shadow-lg backdrop-blur-md">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-esc-destaque md:text-3xl">
                Controle Anual
              </h2>
              <input
                type="number"
                value={anoFiltroAnual}
                onChange={(e) => setAnoFiltroAnual(e.target.value)}
                className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-esc-text focus:border-esc-destaque focus:outline-none focus:ring-1 focus:ring-esc-destaque sm:w-auto"
              />
            </div>
            <TabelaSimples
              variant="escritorio"
              colunas={["Mês", "Entrada", "Saida", "Balanço"]}
              dados={dadosAnuais}
            />
            <div className="mt-4 flex flex-col gap-6 rounded-xl border border-white/5 bg-black/40 p-4 shadow-inner lg:flex-row lg:items-center lg:justify-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold uppercase text-esc-muted">
                  Balanço Validado do Ano:
                </span>
                <span
                  className={`text-lg font-bold tabular-nums ${totaisAnuais.validado >= 0 ? "text-status-concluida-text" : "text-status-aguardando-text"}`}
                >
                  R$ {formatarMoeda(totaisAnuais.validado)}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs font-semibold uppercase text-esc-muted">
                  Balanço Previsto (Total Lançado):
                </span>
                <span
                  className={`text-lg font-bold tabular-nums ${totaisAnuais.previsto >= 0 ? "text-status-concluida-text" : "text-status-aguardando-text"}`}
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
