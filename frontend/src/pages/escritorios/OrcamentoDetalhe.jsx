import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  FileSpreadsheet,
  HardHat,
  Image,
  Layers,
  Loader2,
  MapPin,
  Phone,
  Save,
  ScrollText,
  Sparkles,
  Wallet,
  Wrench,
} from "lucide-react";
import { api } from "../../services/api";
import {
  ID_VOGELKOP,
  ID_YBYOCA,
  pathEscritorio,
} from "../../constants/escritorios";
import { useEscritorioIdFromPath } from "../../hooks/useEscritorioIdFromPath";
import OrcamentoSecaoPainel from "../../components/escritorios/OrcamentoSecaoPainel";
import DescricaoAssistenteModal from "../../components/escritorios/DescricaoAssistenteModal";
import StatusSelectBadge from "../../components/gerais/StatusSelectBadge";
import { STATUS_ORCAMENTO_OPCOES } from "../../components/gerais/statusSelectOptions";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import {
  CHAVES_VALORES,
  CHAVES_VALORES_YB,
  MAX_CARACTERES_COMPLEMENTARES_OUTROS,
  MAX_CARACTERES_CONTATO_YB,
  MAX_CARACTERES_ENDERECO_YB,
  MAX_LINHAS_DESCRICAO,
  SECOES_PROPOSTA,
  SECOES_PROPOSTA_YBYOCA,
  calcularTotalProjetosYbyoca,
  calcularTotalValoresProposta,
  calcularTotalValoresPropostaYbyoca,
  contarLinhasDescricao,
  formatarCodigoPropostaVK,
  formatarCodigoPropostaYB,
  formatarDataPropostaBR,
  formatarMoedaBRL,
  limitarLinhasDescricao,
  normalizarPropostaDados,
  normalizarPropostaDadosYbyoca,
  toggleOpcaoLista,
} from "../../utils/orcamentoPropostaUtils";
import { gerarPdfOrcamentoVogelKop } from "../../utils/orcamentoVogelkopPdf";
import { gerarPdfOrcamentoYbyoca } from "../../utils/orcamentoYbyocaPdf";
import {
  orcCheckboxCardClass,
  orcCheckboxInputClass,
  orcGridCheckboxesClass,
  orcGridValoresClass,
  orcInputClass,
  orcLabelCampoClass,
  orcTextareaClass,
  orcTotalBarClass,
} from "./orcamentosUi";

export default function OrcamentoDetalhe() {
  const { orcamentoId } = useParams();
  const navigate = useNavigate();
  const escritorioId = useEscritorioIdFromPath();
  const isVogelkop = escritorioId === ID_VOGELKOP;
  const isYbyoca = escritorioId === ID_YBYOCA;
  const temProposta = isVogelkop || isYbyoca;
  const temaClasse = isVogelkop ? "theme-vogelkop" : "theme-ybyoca";
  const baseOrcamentos =
    pathEscritorio(escritorioId) || "/escritorio/ybyoca";
  const listaOrcamentosPath = `${baseOrcamentos}/orcamentos`;

  const [orcamento, setOrcamento] = useState(null);
  const [proposta, setProposta] = useState(() =>
    isYbyoca ? normalizarPropostaDadosYbyoca({}) : normalizarPropostaDados({}),
  );
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [salvoMsg, setSalvoMsg] = useState("");
  const [pdfPreview, setPdfPreview] = useState(false);
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const saveTimerRef = useRef(null);
  const propostaRef = useRef(proposta);

  useEffect(() => {
    propostaRef.current = proposta;
  }, [proposta]);

  useEffect(() => {
    if (escritorioId && !temProposta) {
      navigate(listaOrcamentosPath, { replace: true });
    }
  }, [escritorioId, temProposta, listaOrcamentosPath, navigate]);

  const carregar = useCallback(async () => {
    if (!orcamentoId || !escritorioId || !temProposta) return;
    setLoading(true);
    setErro(null);
    try {
      let row = await api.getOrcamentoById(orcamentoId, escritorioId);
      if (!row) {
        setErro("Orçamento não encontrado.");
        setOrcamento(null);
        return;
      }
      if (!row.numero_proposta) {
        row = await api.ensureNumeroPropostaOrcamento(orcamentoId, escritorioId);
      }
      setOrcamento(row);
      setProposta(
        isYbyoca
          ? normalizarPropostaDadosYbyoca(row.proposta_dados)
          : normalizarPropostaDados(row.proposta_dados),
      );
    } catch (e) {
      console.error("[OrcamentoDetalhe] carregar:", e);
      setErro(e?.message || "Erro ao carregar o orçamento.");
      setOrcamento(null);
    } finally {
      setLoading(false);
    }
  }, [orcamentoId, escritorioId, temProposta, isYbyoca]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const secoesProposta = isYbyoca ? SECOES_PROPOSTA_YBYOCA : SECOES_PROPOSTA;
  const chavesValores = isYbyoca ? CHAVES_VALORES_YB : CHAVES_VALORES;

  const totalValores = useMemo(
    () =>
      isYbyoca
        ? calcularTotalValoresPropostaYbyoca(proposta.valores)
        : calcularTotalValoresProposta(proposta.valores),
    [isYbyoca, proposta.valores],
  );
  const totalProjetosYbyoca = useMemo(
    () => (isYbyoca ? calcularTotalProjetosYbyoca(proposta.valores) : 0),
    [isYbyoca, proposta.valores],
  );

  const numeroCapa = useMemo(() => {
    const dataRef = orcamento?.data || orcamento?.created_at;
    if (isYbyoca) {
      return formatarCodigoPropostaYB(orcamento?.numero_proposta, dataRef);
    }
    return formatarCodigoPropostaVK(orcamento?.numero_proposta, dataRef);
  }, [orcamento, isYbyoca]);

  const persistir = useCallback(
    async (dadosProposta) => {
      if (!orcamentoId || !escritorioId) return;
      setSalvando(true);
      setSalvoMsg("");
      try {
        const atualizado = isYbyoca
          ? await api.updatePropostaOrcamentoYbyoca(
              orcamentoId,
              dadosProposta,
              escritorioId,
            )
          : await api.updatePropostaOrcamento(
              orcamentoId,
              dadosProposta,
              escritorioId,
            );
        setOrcamento(atualizado);
        setProposta(
          isYbyoca
            ? normalizarPropostaDadosYbyoca(atualizado.proposta_dados)
            : normalizarPropostaDados(atualizado.proposta_dados),
        );
        setSalvoMsg("Salvo");
        setTimeout(() => setSalvoMsg(""), 2000);
      } catch (e) {
        console.error("[OrcamentoDetalhe] salvar:", e);
        alert(e?.message || "Não foi possível salvar a proposta.");
        throw e;
      } finally {
        setSalvando(false);
      }
    },
    [orcamentoId, escritorioId, isYbyoca],
  );

  const agendarSalvar = useCallback(
    (nextProposta) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        void persistir(nextProposta);
      }, 900);
    },
    [persistir],
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const atualizarProposta = (patch) => {
    setProposta((prev) => {
      const next = isYbyoca
        ? normalizarPropostaDadosYbyoca({ ...prev, ...patch })
        : normalizarPropostaDados({ ...prev, ...patch });
      agendarSalvar(next);
      return next;
    });
  };

  const normalizarAtual = (dados) =>
    isYbyoca
      ? normalizarPropostaDadosYbyoca(dados)
      : normalizarPropostaDados(dados);

  const toggleCheckbox = (secaoId, opcao) => {
    setProposta((prev) => {
      const novaLista = toggleOpcaoLista(prev[secaoId], opcao);
      const patch = { [secaoId]: novaLista };
      if (
        secaoId === "complementares" &&
        opcao === "Outros" &&
        !novaLista.includes("Outros")
      ) {
        patch.complementares_outros = "";
      }
      const next = normalizarAtual({ ...prev, ...patch });
      agendarSalvar(next);
      return next;
    });
  };

  const atualizarValor = (key, raw) => {
    const n = raw === "" ? null : parseFloat(raw);
    const valor = Number.isFinite(n) && n >= 0 ? n : null;
    setProposta((prev) => {
      const next = normalizarAtual({
        ...prev,
        valores: { ...prev.valores, [key]: valor },
      });
      agendarSalvar(next);
      return next;
    });
  };

  const salvarManual = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    void persistir(propostaRef.current);
  };

  const mudarStatus = async (novoStatus) => {
    if (!orcamento?.id) return;
    try {
      const atualizado = await api.updateOrcamento(
        orcamento.id,
        { status: novoStatus },
        escritorioId,
      );
      setOrcamento(atualizado);
    } catch (e) {
      console.error(e);
      alert("Não foi possível atualizar o status.");
    }
  };

  if (!temProposta) return null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-esc-destaque" />
        <p className="text-sm text-esc-muted">Carregando proposta…</p>
      </div>
    );
  }

  if (erro || !orcamento) {
    return (
      <div className="w-full pb-12">
        <button
          type="button"
          onClick={() => navigate(listaOrcamentosPath)}
          className="mb-4 flex items-center gap-2 text-sm text-esc-muted hover:text-esc-destaque"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-6 text-sm text-rose-200">
          {erro}
        </p>
      </div>
    );
  }

  const rotuloProposta = isYbyoca ? "Proposta Ybyoca" : "Proposta VogelKop";
  const codigoLabel = isYbyoca
    ? `PROPOSTA ${numeroCapa}`
    : `PROPOSTA VK - ${numeroCapa}`;

  return (
    <div className="w-full pb-16">
      <div className="mb-4 mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(listaOrcamentosPath)}
          className="inline-flex items-center gap-2 text-sm text-esc-muted transition hover:text-esc-destaque"
        >
          <ArrowLeft className="h-4 w-4" />
          Orçamentos
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {salvoMsg ? (
            <span className="text-xs font-semibold text-emerald-700">{salvoMsg}</span>
          ) : null}
          {salvando ? (
            <span className="inline-flex items-center gap-1 text-xs text-esc-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Salvando…
            </span>
          ) : null}
          <button
            type="button"
            onClick={salvarManual}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-xl border border-esc-border bg-esc-bg px-3 py-2 text-xs font-semibold text-esc-muted transition hover:border-esc-destaque/40 hover:text-esc-destaque disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Salvar
          </button>
          <button
            type="button"
            onClick={async () => {
              if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
              try {
                await persistir(propostaRef.current);
                setPdfPreview(true);
              } catch {
                /* persistir já alerta */
              }
            }}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 px-3 py-2 text-xs font-bold text-esc-destaque transition hover:bg-esc-destaque/30 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Gerar PDF
          </button>
        </div>
      </div>

      <header className="mb-6 rounded-xl border border-esc-border bg-esc-card p-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-esc-muted">
              {rotuloProposta}
            </p>
            <h1 className="mt-1 truncate text-xl font-bold text-esc-text sm:text-2xl">
              {orcamento.nome || "—"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-esc-muted">
              <span className="inline-flex items-center gap-1.5 font-semibold text-esc-destaque">
                <FileSpreadsheet className="h-4 w-4" />
                {codigoLabel}
              </span>
              <span>
                {formatarDataPropostaBR(orcamento.data || orcamento.created_at)}
              </span>
            </div>
          </div>
          <StatusSelectBadge
            value={orcamento.status || "Em andamento"}
            options={STATUS_ORCAMENTO_OPCOES}
            variant="orcamento"
            selectVariant="escritorio"
            onChange={mudarStatus}
          />
        </div>

        {isYbyoca ? (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-esc-border pt-5 sm:grid-cols-2">
            <div>
              <label className={orcLabelCampoClass}>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  Contato (capa)
                </span>
              </label>
              <input
                type="text"
                value={proposta.contato || ""}
                maxLength={MAX_CARACTERES_CONTATO_YB}
                onChange={(e) =>
                  atualizarProposta({ contato: e.target.value })
                }
                placeholder="Ex.: 34 99999-9999"
                className={orcInputClass}
              />
            </div>
            <div>
              <label className={orcLabelCampoClass}>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Endereço (capa)
                </span>
              </label>
              <input
                type="text"
                value={proposta.endereco || ""}
                maxLength={MAX_CARACTERES_ENDERECO_YB}
                onChange={(e) =>
                  atualizarProposta({ endereco: e.target.value })
                }
                placeholder="Ex.: Uberaba - MG"
                className={orcInputClass}
              />
            </div>
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-6">
          {secoesProposta.map((sec) => {
            const iconMap = {
              tecnico: <Layers className="h-4 w-4" />,
              arquitetonico: <Layers className="h-4 w-4" />,
              tramites: <ClipboardList className="h-4 w-4" />,
              complementares: <Wrench className="h-4 w-4" />,
              renderizacoes: <Image className="h-4 w-4" />,
              gestao: <HardHat className="h-4 w-4" />,
            };
            return (
              <OrcamentoSecaoPainel
                key={sec.id}
                titulo={sec.titulo}
                descricao="Marque os itens incluídos nesta proposta"
                icon={iconMap[sec.id]}
              >
                <div className={orcGridCheckboxesClass}>
                  {sec.opcoes.map((opcao) => {
                    const marcado = (proposta[sec.id] || []).includes(opcao);
                    return (
                      <label key={opcao} className={orcCheckboxCardClass}>
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => toggleCheckbox(sec.id, opcao)}
                          className={orcCheckboxInputClass}
                        />
                        <span className="text-sm text-esc-text">{opcao}</span>
                      </label>
                    );
                  })}
                </div>
                {sec.id === "complementares" &&
                (proposta.complementares || []).includes("Outros") ? (
                  <div className="mt-4">
                    <label className={orcLabelCampoClass}>
                      Especifique o complementar (Outros)
                    </label>
                    <input
                      type="text"
                      value={proposta.complementares_outros || ""}
                      maxLength={MAX_CARACTERES_COMPLEMENTARES_OUTROS}
                      onChange={(e) =>
                        atualizarProposta({
                          complementares_outros: e.target.value,
                        })
                      }
                      placeholder="Ex.: Projeto de paisagismo, acústica…"
                      className={orcInputClass}
                    />
                    <p className="mt-1 text-[11px] text-esc-muted">
                      Este texto aparece no escopo e no orçamento do PDF.
                    </p>
                  </div>
                ) : null}
              </OrcamentoSecaoPainel>
            );
          })}

          <OrcamentoSecaoPainel
            titulo="Valores"
            descricao="Informe os valores de cada pacote (R$)"
            icon={<Wallet className="h-4 w-4" />}
          >
            <div className={orcGridValoresClass}>
              {chavesValores.map(({ key, label }) => (
                <div key={key}>
                  <label className={orcLabelCampoClass}>
                    {key === "gestao" ? `${label} (mês)` : label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposta.valores?.[key] ?? ""}
                    onChange={(e) => atualizarValor(key, e.target.value)}
                    placeholder="0,00"
                    className={orcInputClass}
                  />
                </div>
              ))}
            </div>
            <div className={`${orcTotalBarClass} mt-4`}>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-esc-text">
                  {isYbyoca
                    ? "Total (projetos e trâmites)"
                    : "Total da proposta"}
                </span>
                {isYbyoca && (proposta.valores?.gestao || 0) > 0 ? (
                  <span className="text-[11px] text-esc-muted">
                    Gestão de obras:{" "}
                    {formatarMoedaBRL(proposta.valores.gestao)} / mês
                  </span>
                ) : null}
              </div>
              <span className="text-lg font-bold tabular-nums text-esc-destaque">
                {formatarMoedaBRL(isYbyoca ? totalProjetosYbyoca : totalValores)}
              </span>
            </div>
          </OrcamentoSecaoPainel>

          <OrcamentoSecaoPainel
            titulo="Descrição"
            descricao={`Resumo da proposta (até ${MAX_LINHAS_DESCRICAO} linhas)`}
            icon={<ScrollText className="h-4 w-4" />}
            acoes={
              <button
                type="button"
                onClick={() => setAssistenteAberto(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-esc-destaque/40 bg-esc-destaque/15 px-2.5 py-1.5 text-[11px] font-semibold text-esc-destaque transition hover:bg-esc-destaque/25"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Assistente
              </button>
            }
          >
            <textarea
              rows={MAX_LINHAS_DESCRICAO}
              value={proposta.descricao || ""}
              onChange={(e) =>
                atualizarProposta({
                  descricao: limitarLinhasDescricao(e.target.value),
                })
              }
              placeholder="Descreva o escopo e condições da proposta…"
              className={orcTextareaClass}
            />
            <p className="mt-1.5 text-[11px] text-esc-muted">
              {contarLinhasDescricao(proposta.descricao)}/{MAX_LINHAS_DESCRICAO}{" "}
              linhas
            </p>
          </OrcamentoSecaoPainel>
        </div>

      <DescricaoAssistenteModal
        isOpen={assistenteAberto}
        textoInicial={proposta.descricao}
        onClose={() => setAssistenteAberto(false)}
        onAplicar={(texto) => atualizarProposta({ descricao: texto })}
        temaClasse={temaClasse}
      />

      <PdfPreviewModal
        isOpen={pdfPreview}
        onClose={() => setPdfPreview(false)}
        titulo={rotuloProposta}
        nomeFallback={
          isYbyoca ? "proposta_ybyoca.pdf" : "proposta_vogelkop.pdf"
        }
        temaClasse={temaClasse}
        gerador={() =>
          isYbyoca
            ? gerarPdfOrcamentoYbyoca({
                ...orcamento,
                proposta_dados: proposta,
              })
            : gerarPdfOrcamentoVogelKop({
                ...orcamento,
                proposta_dados: proposta,
                valor: totalValores,
              })
        }
      />
    </div>
  );
}
