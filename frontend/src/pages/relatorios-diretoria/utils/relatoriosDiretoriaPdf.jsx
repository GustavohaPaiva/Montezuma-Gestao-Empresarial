import { pdf } from "@react-pdf/renderer";
import RelatorioDiretoriaObraPDF from "../../../documents/RelatorioDiretoriaObraPDF";
import {
  TOPICOS_RELATORIO_OBRA,
  formatarPrazoObra,
  labelSemanaFromInicio,
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
