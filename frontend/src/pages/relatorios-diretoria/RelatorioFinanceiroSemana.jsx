import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FileDown, Wallet } from "lucide-react";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import { api } from "../../services/api";
import RelatorioDetalheHeader from "./components/RelatorioDetalheHeader";
import RelatorioFinanceiroDetalhes from "./components/RelatorioFinanceiroDetalhes";
import RelatorioFinanceiroGraficos from "./components/RelatorioFinanceiroGraficos";
import RelatorioFinanceiroResumo from "./components/RelatorioFinanceiroResumo";
import RelatorioObservacoesCampo from "./components/RelatorioObservacoesCampo";
import RelatorioSemanaReferenciaCard from "./components/RelatorioSemanaReferenciaCard";
import { useRelatorioFinanceiroGlobal } from "./hooks/useRelatorioFinanceiroObra";
import { financeiroSemanaTemDados } from "./relatorioFinanceiroUtils";
import {
  derivarPeriodoDaSemana,
  isSemanaAtual,
  labelSemanaFromInicio,
  normalizarConteudo,
  periodoAtual,
  rotaListaRelatorios,
  rotaRelatorioFinanceiro,
  rotaRelatorioSemana,
} from "./relatoriosDiretoriaUtils";
import { relatorioNavbarAcaoClass } from "./relatoriosDiretoriaUi";
import { gerarPdfRelatorioDiretoriaFinanceiro } from "./utils/relatoriosDiretoriaPdf";

export default function RelatorioFinanceiroSemana() {
  const { semanaRef: semanaInicioParam } = useParams();
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
  const origem = searchParams.get("origem") === "semana" ? "semana" : "lista";

  const { resumo, loading, erro } = useRelatorioFinanceiroGlobal(semanaInicio);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [observacoes, setObservacoes] = useState("");
  const [salvandoObs, setSalvandoObs] = useState(false);
  const [erroObs, setErroObs] = useState(null);

  const carregarObservacoes = useCallback(async () => {
    if (!semanaInicio) return;
    try {
      const relatorios = await api.getRelatoriosDiretoriaSemana(semanaInicio);
      const fin = (relatorios || []).find((r) => r.modalidade === "financeiro");
      setObservacoes(normalizarConteudo(fin?.conteudo).observacoes || "");
      setErroObs(null);
    } catch (e) {
      console.error("[RelatorioFinanceiroSemana] observações:", e);
      setErroObs(e?.message || "Não foi possível carregar as observações.");
    }
  }, [semanaInicio]);

  useEffect(() => {
    carregarObservacoes();
  }, [carregarObservacoes]);

  const salvarObservacoes = async () => {
    setSalvandoObs(true);
    setErroObs(null);
    try {
      await api.upsertRelatorioDiretoria({
        modalidade: "financeiro",
        ano,
        mes,
        semana_inicio: semanaInicio,
        conteudo: { observacoes: observacoes.trim() },
      });
      await carregarObservacoes();
    } catch (e) {
      console.error("[RelatorioFinanceiroSemana] salvar observações:", e);
      setErroObs(e?.message || "Não foi possível salvar as observações.");
      alert(e?.message || "Não foi possível salvar as observações.");
    } finally {
      setSalvandoObs(false);
    }
  };

  const voltarDestino = () => {
    if (origem === "lista") {
      return rotaListaRelatorios({ ano, mes });
    }
    return rotaRelatorioSemana(semanaInicio, { ano, mes });
  };

  const trocarSemana = (novaSemana) => {
    if (!novaSemana || novaSemana === semanaInicio) return;
    navigate(rotaRelatorioFinanceiro(novaSemana, { ano, mes, origem }));
  };

  const labelSemana = labelSemanaFromInicio(semanaInicio);
  const subtituloBase = isSemanaAtual(semanaInicio)
    ? `Relatório financeiro · ${labelSemana} · Semana atual · Todas as obras`
    : `Relatório financeiro · ${labelSemana} · Todas as obras`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] px-[5%] py-12">
        <LoadingPainel
          titulo="Carregando relatório financeiro"
          descricao="Consolidando lançamentos de todas as obras da semana…"
          icon={<Wallet className="h-7 w-7" strokeWidth={2} />}
        />
      </div>
    );
  }

  const temDados = financeiroSemanaTemDados(resumo);
  const temObservacoes = Boolean(observacoes.trim());

  const handleGerarPdf = () => {
    setPdfPreview({
      titulo: "Relatório Financeiro",
      nomeFallback: "Relatorio_Financeiro.pdf",
      gerador: () =>
        gerarPdfRelatorioDiretoriaFinanceiro({
          semanaInicio,
          resumo,
          observacoes: observacoes.trim(),
        }),
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center overflow-x-hidden bg-[#FAFAFA] pb-10">
      <RelatorioDetalheHeader
        titulo="Relatórios Semanais"
        onVoltar={() => navigate(voltarDestino())}
        subtitulo={subtituloBase}
        acoes={
          temDados || temObservacoes ? (
            <button
              type="button"
              onClick={handleGerarPdf}
              className={relatorioNavbarAcaoClass}
            >
              <FileDown className="h-4 w-4" strokeWidth={2} />
              Gerar PDF
            </button>
          ) : null
        }
      />

      <main className="w-full px-[5%] pt-4">
        {erro ? (
          <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
            {erro}
          </p>
        ) : null}
        {erroObs ? (
          <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
            {erroObs}
          </p>
        ) : null}

        <RelatorioSemanaReferenciaCard
          semanaInicio={semanaInicio}
          ano={ano}
          mes={mes}
          onTrocarSemana={trocarSemana}
        />

        {!temDados ? (
          <p className="mb-6 rounded-xl border border-dashed border-border-primary/40 bg-white px-4 py-10 text-center text-sm text-text-muted">
            Nenhum lançamento financeiro registrado nas obras nesta semana.
          </p>
        ) : (
          <>
            <RelatorioFinanceiroResumo
              totais={resumo.totais}
              porCategoria={resumo.porCategoria}
            />
            <RelatorioFinanceiroGraficos graficos={resumo.graficos} />
            <RelatorioFinanceiroDetalhes
              extratoSemana={resumo.extratoSemana}
              emEsperaSemana={resumo.emEsperaSemana}
            />
          </>
        )}

        <RelatorioObservacoesCampo
          value={observacoes}
          onChange={setObservacoes}
          onSave={salvarObservacoes}
          salvando={salvandoObs}
        />
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
