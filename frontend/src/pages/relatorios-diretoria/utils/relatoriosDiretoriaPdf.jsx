import { pdf } from "@react-pdf/renderer";
import RelatorioDiretoriaFinanceiroPDF from "../../../documents/RelatorioDiretoriaFinanceiroPDF";
import RelatorioDiretoriaObraPDF from "../../../documents/RelatorioDiretoriaObraPDF";
import RelatorioDiretoriaSemanalPDF from "../../../documents/RelatorioDiretoriaSemanalPDF";
import {
  labelSemanaFromInicio,
  montarBlocosRelatorioCorrico,
  serializarConteudoObra,
} from "../relatoriosDiretoriaUtils";

function slugify(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Gera PDF do relatório semanal de obra no formato detalhado da tela.
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfRelatorioDiretoriaObra({
  semanaInicio,
  resumoHtml,
} = {}) {
  const semanaLabel = labelSemanaFromInicio(semanaInicio);
  const html = serializarConteudoObra(resumoHtml).resumo_geral;
  const semanaSlug = slugify(semanaInicio || semanaLabel);
  const nomePadrao = `Montezuma_Relatorio-Obra_Semana-${semanaSlug}_${hojeISO()}.pdf`;

  const doc = (
    <RelatorioDiretoriaObraPDF
      titulo="Relatório de Obra"
      subtitulo="Relatórios da Diretoria · Montezuma Gestão Empresarial"
      referencia="Acompanhamento semanal geral"
      semanaLabel={semanaLabel}
      resumoHtml={html}
    />
  );

  const blob = await pdf(doc).toBlob();
  return { blob, nomePadrao };
}

function montarBlocosPdfSemanal(consolidado) {
  const blocos = montarBlocosRelatorioCorrico(consolidado);
  return blocos.map((bloco) => {
    if (bloco.tipo === "obra_html") {
      return {
        tipo: "obra_html",
        id: bloco.id,
        titulo: bloco.titulo,
        html: bloco.html,
      };
    }
    return bloco;
  });
}

/**
 * Gera PDF do relatório financeiro semanal (agregado de todas as obras).
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfRelatorioDiretoriaFinanceiro({
  semanaInicio,
  resumo,
  observacoes = "",
} = {}) {
  const semanaLabel = labelSemanaFromInicio(semanaInicio);
  const semanaSlug = slugify(semanaInicio || semanaLabel);
  const nomePadrao = `Montezuma_Relatorio-Financeiro_Semana-${semanaSlug}_${hojeISO()}.pdf`;

  const doc = (
    <RelatorioDiretoriaFinanceiroPDF
      semanaLabel={semanaLabel}
      resumo={resumo}
      observacoes={observacoes}
    />
  );

  const blob = await pdf(doc).toBlob();
  return { blob, nomePadrao };
}

/**
 * Gera PDF do relatório semanal consolidado (geral).
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfRelatorioDiretoriaSemanal({
  semanaInicio,
  consolidado,
  ultimaAtualizacao,
} = {}) {
  const semanaLabel = labelSemanaFromInicio(semanaInicio);
  const blocos = montarBlocosPdfSemanal(consolidado);
  const semanaSlug = slugify(semanaInicio || semanaLabel);
  const nomePadrao = `Montezuma_Relatorio-Semanal_Semana-${semanaSlug}_${hojeISO()}.pdf`;

  const doc = (
    <RelatorioDiretoriaSemanalPDF
      semanaLabel={semanaLabel}
      blocos={blocos}
      ultimaAtualizacao={ultimaAtualizacao}
      completo={consolidado?.completo}
    />
  );

  const blob = await pdf(doc).toBlob();
  return { blob, nomePadrao };
}
