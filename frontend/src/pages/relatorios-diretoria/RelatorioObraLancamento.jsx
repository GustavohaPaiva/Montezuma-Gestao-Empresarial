import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FileDown, Hammer } from "lucide-react";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import { api } from "../../services/api";
import RelatorioDetalheHeader from "./components/RelatorioDetalheHeader";
import RelatorioObraTopicoSection from "./components/RelatorioObraTopicoSection";
import RelatorioSemanaReferenciaCard from "./components/RelatorioSemanaReferenciaCard";
import {
  TOPICOS_RELATORIO_OBRA,
  buildSemanaSearchParams,
  derivarPeriodoDaSemana,
  isSemanaAtual,
  labelSemanaFromInicio,
  normalizarConteudoObra,
  periodoAtual,
  rotaLancamentoObra,
  serializarConteudoObra,
} from "./relatoriosDiretoriaUtils";
import { relatorioNavbarAcaoClass } from "./relatoriosDiretoriaUi";
import { gerarPdfRelatorioDiretoriaObra } from "./utils/relatoriosDiretoriaPdf";

const AUTO_SAVE_MS = 900;

function snapshotTopicos(topicos) {
  return JSON.stringify(serializarConteudoObra(topicos));
}

export default function RelatorioObraLancamento() {
  const { obraId, semanaRef: semanaInicioParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const atual = periodoAtual();

  const semanaInicio = String(semanaInicioParam || "").slice(0, 10);
  const ano =
    Number(searchParams.get("ano")) ||
    derivarPeriodoDaSemana(semanaInicio).ano ||
    atual.ano;
  const mes =
    Number(searchParams.get("mes")) ||
    derivarPeriodoDaSemana(semanaInicio).mes ||
    atual.mes;
  const origem = searchParams.get("origem") === "obra" ? "obra" : "semana";

  const [obra, setObra] = useState(null);
  const [topicos, setTopicos] = useState(
    () => normalizarConteudoObra(null).topicos,
  );
  const [loading, setLoading] = useState(true);
  const [statusSalvamento, setStatusSalvamento] = useState("idle");
  const [erro, setErro] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const snapshotInicial = useRef("");
  const saveTimerRef = useRef(null);
  const salvandoRef = useRef(false);
  const topicosRef = useRef(topicos);

  useEffect(() => {
    topicosRef.current = topicos;
  }, [topicos]);

  const carregar = useCallback(async () => {
    if (!obraId || !semanaInicio) return;
    setLoading(true);
    try {
      const [obraData, relatorios] = await Promise.all([
        api.getObraResumoParaRelatorio(obraId),
        api.getRelatoriosDiretoriaSemana(obraId, semanaInicio),
      ]);
      const lancamentoObra = (relatorios || []).find(
        (l) => l.modalidade === "obra",
      );
      const normalizado = normalizarConteudoObra(lancamentoObra?.conteudo);
      setObra(obraData);
      setTopicos(normalizado.topicos);
      snapshotInicial.current = snapshotTopicos(normalizado.topicos);
      setStatusSalvamento("idle");
      setErro(null);
    } catch (e) {
      console.error("[RelatorioObraLancamento] carregar:", e);
      setErro(e?.message || "Não foi possível carregar o relatório de obra.");
    } finally {
      setLoading(false);
    }
  }, [obraId, semanaInicio]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvarTopicos = useCallback(
    async (topicosParaSalvar) => {
      const snapshotAtual = snapshotTopicos(topicosParaSalvar);
      if (snapshotAtual === snapshotInicial.current || salvandoRef.current) {
        return true;
      }

      salvandoRef.current = true;
      setStatusSalvamento("saving");
      try {
        await api.upsertRelatorioDiretoria({
          obra_id: obraId,
          modalidade: "obra",
          ano,
          mes,
          semana_inicio: semanaInicio,
          conteudo: serializarConteudoObra(topicosParaSalvar),
        });
        snapshotInicial.current = snapshotAtual;
        setStatusSalvamento("saved");
        return true;
      } catch (e) {
        console.error("[RelatorioObraLancamento] auto-save:", e);
        setStatusSalvamento("error");
        return false;
      } finally {
        salvandoRef.current = false;
      }
    },
    [ano, mes, obraId, semanaInicio],
  );

  const flushSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    return salvarTopicos(topicosRef.current);
  }, [salvarTopicos]);

  const dirty = useMemo(
    () => snapshotTopicos(topicos) !== snapshotInicial.current,
    [topicos],
  );

  useEffect(() => {
    if (loading || !dirty) return undefined;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      salvarTopicos(topicosRef.current);
    }, AUTO_SAVE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [topicos, loading, dirty, salvarTopicos]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  const voltarDestino = () => {
    if (origem === "obra") {
      return `/relatorios-diretoria/${obraId}${buildSemanaSearchParams(ano, mes)}`;
    }
    return `/relatorios-diretoria/${obraId}/semana/${semanaInicio}${buildSemanaSearchParams(ano, mes)}`;
  };

  const tentarVoltar = async () => {
    await flushSave();
    navigate(voltarDestino());
  };

  const trocarSemana = async (novaSemana) => {
    if (!novaSemana || novaSemana === semanaInicio) return;
    await flushSave();
    navigate(`${rotaLancamentoObra(obraId, novaSemana, { ano, mes, origem })}`);
  };

  const handleGerarPdf = async () => {
    await flushSave();
    setPdfPreview({
      titulo: "Relatório de Obra",
      nomeFallback: "Relatorio_Obra.pdf",
      gerador: () =>
        gerarPdfRelatorioDiretoriaObra(obra, {
          semanaInicio,
          topicos: topicosRef.current,
        }),
    });
  };

  const labelSemana = labelSemanaFromInicio(semanaInicio);
  const subtituloBase = isSemanaAtual(semanaInicio)
    ? `Relatório de obra · ${labelSemana} · Semana atual`
    : `Relatório de obra · ${labelSemana}`;

  const subtituloSalvamento =
    statusSalvamento === "saving"
      ? "Salvando alterações…"
      : statusSalvamento === "error"
        ? "Erro ao salvar — verifique a conexão"
        : statusSalvamento === "saved" && !dirty
          ? "Alterações salvas"
          : null;

  const subtitulo = subtituloSalvamento
    ? `${subtituloBase} · ${subtituloSalvamento}`
    : subtituloBase;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-[5%] py-12">
        <LoadingPainel
          titulo="Carregando relatório de obra"
          descricao="Preparando os tópicos da semana…"
          icon={<Hammer className="h-7 w-7" strokeWidth={2} />}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center overflow-x-hidden bg-[#FAFAFA] pb-10">
      <RelatorioDetalheHeader
        obra={obra}
        onVoltar={tentarVoltar}
        subtitulo={subtitulo}
        acoes={
          <button
            type="button"
            onClick={handleGerarPdf}
            className={relatorioNavbarAcaoClass}
          >
            <FileDown className="h-4 w-4" strokeWidth={2} />
            Gerar PDF
          </button>
        }
      />

      <main className="w-full px-[5%] pt-4">
        {erro ? (
          <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
            {erro}
          </p>
        ) : null}

        <RelatorioSemanaReferenciaCard
          semanaInicio={semanaInicio}
          ano={ano}
          mes={mes}
          onTrocarSemana={trocarSemana}
        />

        <div className="space-y-8">
          {TOPICOS_RELATORIO_OBRA.map((topico) => (
            <RelatorioObraTopicoSection
              key={topico.id}
              topico={topico}
              itens={topicos[topico.id] || []}
              onChange={(itens) =>
                setTopicos((prev) => ({ ...prev, [topico.id]: itens }))
              }
            />
          ))}
        </div>
      </main>

      <PdfPreviewModal
        isOpen={Boolean(pdfPreview)}
        onClose={() => setPdfPreview(null)}
        titulo={pdfPreview?.titulo}
        gerador={pdfPreview?.gerador}
        nomeFallback={pdfPreview?.nomeFallback}
      />
    </div>
  );
}
