import { pdf } from "@react-pdf/renderer";
import OrcamentoVogelKopPDF from "../documents/OrcamentoVogelKopPDF";
import {
  formatarCodigoPropostaVK,
  slugifyOrcamentoNome,
} from "./orcamentoPropostaUtils";

/**
 * @param {object} orcamento
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfOrcamentoVogelKop(orcamento) {
  if (!orcamento?.id && !orcamento?.nome) {
    throw new Error("Dados do orçamento inválidos para gerar PDF.");
  }
  const blob = await pdf(
    <OrcamentoVogelKopPDF orcamento={orcamento} />,
  ).toBlob();
  const capa = formatarCodigoPropostaVK(
    orcamento.numero_proposta,
    orcamento.data || orcamento.created_at,
  );
  const dataHoje = new Date().toISOString().slice(0, 10);
  const nomePadrao = `VogelKop_PROPOSTA_VK-${capa}_${slugifyOrcamentoNome(orcamento.nome)}_${dataHoje}.pdf`;
  return { blob, nomePadrao };
}
