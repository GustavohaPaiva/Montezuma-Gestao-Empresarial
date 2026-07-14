import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { FileDown, Wallet } from "lucide-react";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import PdfPreviewModal from "../../components/gerais/PdfPreviewModal";
import RelatorioDetalheHeader from "./components/RelatorioDetalheHeader";
import RelatorioFinanceiroDetalhes from "./components/RelatorioFinanceiroDetalhes";
import RelatorioFinanceiroGraficos from "./components/RelatorioFinanceiroGraficos";
import RelatorioFinanceiroResumo from "./components/RelatorioFinanceiroResumo";
import RelatorioSemanaReferenciaCard from "./components/RelatorioSemanaReferenciaCard";
import { useRelatorioFinanceiroGlobal } from "./hooks/useRelatorioFinanceiroObra";
import { financeiroSemanaTemDados } from "./relatorioFinanceiroUtils";
import {
  derivarPeriodoDaSemana,
  isSemanaAtual,
  labelSemanaFromInicio,
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

  const handleGerarPdf = () => {
    setPdfPreview({
      titulo: "Relatório Financeiro",
      nomeFallback: "Relatorio_Financeiro.pdf",
      gerador: () =>
        gerarPdfRelatorioDiretoriaFinanceiro({
          semanaInicio,
          resumo,
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
          temDados ? (
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

        <RelatorioSemanaReferenciaCard
          semanaInicio={semanaInicio}
          ano={ano}
          mes={mes}
          onTrocarSemana={trocarSemana}
        />

        {!temDados ? (
          <p className="rounded-xl border border-dashed border-border-primary/40 bg-white px-4 py-10 text-center text-sm text-text-muted">
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
