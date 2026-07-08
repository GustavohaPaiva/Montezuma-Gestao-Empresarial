import { pdf } from "@react-pdf/renderer";
import RelatorioDiretoriaFinanceiroPDF from "../../../documents/RelatorioDiretoriaFinanceiroPDF";
import RelatorioDiretoriaObraPDF from "../../../documents/RelatorioDiretoriaObraPDF";
import RelatorioDiretoriaSemanalPDF from "../../../documents/RelatorioDiretoriaSemanalPDF";
import {
  formatarPrazoObra,
  labelSemanaFromInicio,
  montarBlocosRelatorioCorrico,
  TOPICOS_RELATORIO_OBRA,
  ordenarItensObra,
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

function obraParaPdf(obra) {
  if (!obra) return undefined;
  return {
    cliente:
      obra?.clientes?.nome || obra?.cliente || obra?.cliente_nome || undefined,
    local: obra?.local || undefined,
  };
}

function montarTopicosPdf(topicosState) {
  const serializado = serializarConteudoObra(topicosState);
  return TOPICOS_RELATORIO_OBRA.map((topico) => {
    const itens = ordenarItensObra(serializado.topicos[topico.id] || []);
    return {
      id: topico.id,
      label: topico.label,
      itens: itens.map((item) => ({
        id: item.id,
        texto: item.texto,
        prazoLabel: formatarPrazoObra(item.prazo),
      })),
    };
  });
}

/**
 * Gera PDF do relatório semanal de obra no formato detalhado da tela.
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfRelatorioDiretoriaObra(
  obra,
  { semanaInicio, topicos } = {},
) {
  const obraPdf = obraParaPdf(obra);
  const semanaLabel = labelSemanaFromInicio(semanaInicio);
  const topicosPdf = montarTopicosPdf(topicos);
  const obraSlug = slugify(obraPdf?.local || obraPdf?.cliente || "obra");
  const semanaSlug = slugify(semanaInicio || semanaLabel);
  const nomePadrao = `Montezuma_Relatorio-Obra_Semana-${semanaSlug}_Obra-${obraSlug}_${hojeISO()}.pdf`;

  const doc = (
    <RelatorioDiretoriaObraPDF
      titulo="Relatório de Obra"
      subtitulo="Relatórios da Diretoria · Montezuma Gestão de Obras"
      referencia="Acompanhamento semanal da execução"
      obra={obraPdf}
      semanaLabel={semanaLabel}
      topicos={topicosPdf}
    />
  );

  const blob = await pdf(doc).toBlob();
  return { blob, nomePadrao };
}

function montarBlocosPdfSemanal(consolidado) {
  const blocos = montarBlocosRelatorioCorrico(consolidado);
  const obraBlocos = blocos.filter((b) => b.tipo === "itens");
  const demais = blocos.filter((b) => b.tipo !== "itens");
  const resultado = [];

  if (obraBlocos.length > 0) {
    resultado.push({
      tipo: "obra",
      id: "obra",
      titulo: "Obra",
      topicos: obraBlocos.map((bloco) => ({
        id: bloco.id,
        label: bloco.titulo,
        itens: bloco.itens.map((item) => ({
          id: item.id,
          texto: item.texto,
          prazoLabel: formatarPrazoObra(item.prazo),
        })),
      })),
    });
  }

  return [...resultado, ...demais];
}

/**
 * Gera PDF do relatório financeiro semanal.
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfRelatorioDiretoriaFinanceiro(
  obra,
  { semanaInicio, resumo } = {},
) {
  const obraPdf = obraParaPdf(obra);
  const semanaLabel = labelSemanaFromInicio(semanaInicio);
  const obraSlug = slugify(obraPdf?.local || obraPdf?.cliente || "obra");
  const semanaSlug = slugify(semanaInicio || semanaLabel);
  const nomePadrao = `Montezuma_Relatorio-Financeiro_Semana-${semanaSlug}_Obra-${obraSlug}_${hojeISO()}.pdf`;

  const doc = (
    <RelatorioDiretoriaFinanceiroPDF
      obra={obraPdf}
      semanaLabel={semanaLabel}
      resumo={resumo}
    />
  );

  const blob = await pdf(doc).toBlob();
  return { blob, nomePadrao };
}

/**
 * Gera PDF do relatório semanal consolidado (geral).
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfRelatorioDiretoriaSemanal(
  obra,
  { semanaInicio, consolidado, ultimaAtualizacao } = {},
) {
  const obraPdf = obraParaPdf(obra);
  const semanaLabel = labelSemanaFromInicio(semanaInicio);
  const blocos = montarBlocosPdfSemanal(consolidado);
  const obraSlug = slugify(obraPdf?.local || obraPdf?.cliente || "obra");
  const semanaSlug = slugify(semanaInicio || semanaLabel);
  const nomePadrao = `Montezuma_Relatorio-Semanal_Semana-${semanaSlug}_Obra-${obraSlug}_${hojeISO()}.pdf`;

  const doc = (
    <RelatorioDiretoriaSemanalPDF
      obra={obraPdf}
      semanaLabel={semanaLabel}
      blocos={blocos}
      ultimaAtualizacao={ultimaAtualizacao}
      completo={consolidado?.completo}
    />
  );

  const blob = await pdf(doc).toBlob();
  return { blob, nomePadrao };
}
