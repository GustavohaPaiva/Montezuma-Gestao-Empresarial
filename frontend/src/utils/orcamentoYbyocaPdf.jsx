import { pdf } from "@react-pdf/renderer";
import OrcamentoYbyocaPDF from "../documents/OrcamentoYbyocaPDF";
import {
  formatarCodigoPropostaYB,
  slugifyOrcamentoNome,
} from "./orcamentoPropostaUtils";

/**
 * @param {object} orcamento
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfOrcamentoYbyoca(orcamento) {
  if (!orcamento?.id && !orcamento?.nome) {
    throw new Error("Dados do orçamento inválidos para gerar PDF.");
  }
  const blob = await pdf(
    <OrcamentoYbyocaPDF orcamento={orcamento} />,
  ).toBlob();
  const capa = formatarCodigoPropostaYB(
    orcamento.numero_proposta,
    orcamento.data || orcamento.created_at,
  );
  const dataHoje = new Date().toISOString().slice(0, 10);
  const nomePadrao = `Ybyoca_PROPOSTA_${capa}_${slugifyOrcamentoNome(orcamento.nome)}_${dataHoje}.pdf`;
  return { blob, nomePadrao };
}
