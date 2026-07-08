import { pdf } from "@react-pdf/renderer";
import ProjecaoComercialPDF from "../documents/ProjecaoComercialPDF";
import { slugifyProjecaoNome } from "./projecaoUtils";

/**
 * @param {object} projecao
 * @returns {Promise<{ blob: Blob, nomePadrao: string }>}
 */
export async function gerarPdfProjecao(projecao) {
  if (!projecao?.id && !projecao?.nome) {
    throw new Error("Dados da projeção inválidos para gerar PDF.");
  }
  const blob = await pdf(<ProjecaoComercialPDF projecao={projecao} />).toBlob();
  const dataHoje = new Date().toISOString().slice(0, 10);
  const nomePadrao = `Montezuma_Proposta_${slugifyProjecaoNome(projecao.nome)}_${dataHoje}.pdf`;
  return { blob, nomePadrao };
}
