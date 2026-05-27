import { pdf, Document } from "@react-pdf/renderer";
import { api } from "../services/api";
import { ID_VOGELKOP, ID_YBYOCA } from "../constants/escritorios";
import RequerimentoGeralLayout from "../documents/RequerimentoGeralLayout";
import TermoCienciaLayout from "../documents/TermoCienciaLayout";
import DeclaracaoCUBLayout from "../documents/DeclaracaoCUBLayout";
import DeclaracaoHabiteseLayout from "../documents/DeclaracaoHabiteseLayout";
import DeclaracaoMovimentacaoSoloLayout from "../documents/DeclaracaoMovimentacaoSoloLayout";
import GerenciamentoResiduosLayout from "../documents/GerenciamentoResiduosLayout";
import { formatClienteRecord } from "./clienteFormatters";

function slugifyNomeCliente(nome) {
  return String(nome || "Cliente")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Gera o pacote de documentos para prefeitura (várias páginas em um PDF).
 * @param {string|number} clienteId
 * @returns {Promise<{ blob: Blob, nomePadrao: string, cliente: object }>}
 */
export async function gerarDocumentosPrefeituraPdf(clienteId) {
  const raw = await api.getClienteById(clienteId, {
    allowedEscritorioIds: [ID_VOGELKOP, ID_YBYOCA],
  });
  if (!raw) {
    throw new Error("Cliente não encontrado ou sem permissão de acesso.");
  }

  const cliente = formatClienteRecord(raw);

  const blob = await pdf(
    <Document title={`Documentos — ${cliente.nome || "Cliente"}`}>
      <RequerimentoGeralLayout cliente={cliente} />
      <TermoCienciaLayout cliente={cliente} />
      <DeclaracaoHabiteseLayout cliente={cliente} />
      <DeclaracaoMovimentacaoSoloLayout cliente={cliente} />
      <GerenciamentoResiduosLayout cliente={cliente} />
      <DeclaracaoCUBLayout cliente={cliente} />
    </Document>,
  ).toBlob();

  const dataHoje = new Date().toISOString().slice(0, 10);
  const nomePadrao = `Montezuma_Documentos-Prefeitura_${slugifyNomeCliente(cliente.nome)}_${dataHoje}.pdf`;

  return { blob, nomePadrao, cliente };
}
