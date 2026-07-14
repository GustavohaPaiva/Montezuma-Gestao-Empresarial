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
export async function gerarPdfRelatorioDiretoriaObra({
  semanaInicio,
  topicos,
} = {}) {
  const semanaLabel = labelSemanaFromInicio(semanaInicio);
  const topicosPdf = montarTopicosPdf(topicos);
  const semanaSlug = slugify(semanaInicio || semanaLabel);
  const nomePadrao = `Montezuma_Relatorio-Obra_Semana-${semanaSlug}_${hojeISO()}.pdf`;

  const doc = (
    <RelatorioDiretoriaObraPDF
      titulo="Relatório de Obra"
      subtitulo="Relatórios da Diretoria · Montezuma Gestão Empresarial"
      referencia="Acompanhamento semanal geral"
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
