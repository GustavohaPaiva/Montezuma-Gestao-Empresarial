import { gerarPDF } from "../../../../services/pdfService";
import { formatarDataBR, formatarMoeda } from "./formatters";

/**
 * Quando `opts.retornarBlob === true` as funções devolvem
 * `{ blob, nomePadrao }` e NÃO disparam o download.
 */
export function gerarPdfRelatorioMaoDeObraGeral(obra, buscaMaoDeObra, opts = {}) {
  let listaParaPDF = [...obra.maoDeObra];

  if (buscaMaoDeObra) {
    const term = buscaMaoDeObra.toLowerCase();
    listaParaPDF = listaParaPDF.filter(
      (m) =>
        m.tipo?.toLowerCase().includes(term) ||
        m.profissional?.toLowerCase().includes(term),
    );
  }

  const dadosPDF = listaParaPDF.map((m) => {
    const cobrado = parseFloat(m.valor_cobrado) || 0;
    const orcado = parseFloat(m.valor_orcado) || 0;
    const pago = parseFloat(m.valor_pago) || 0;
    const saldo = orcado - pago;

    return [
      m.tipo?.toUpperCase() || "-",
      m.profissional?.toUpperCase() || "-",
      `R$ ${formatarMoeda(cobrado)}`,
      `R$ ${formatarMoeda(orcado)}`,
      `R$ ${formatarMoeda(pago)}`,
      `R$ ${formatarMoeda(saldo)}`,
    ];
  });

  const totalCobrado = listaParaPDF.reduce(
    (acc, m) => acc + (parseFloat(m.valor_cobrado) || 0),
    0,
  );
  const totalPago = listaParaPDF.reduce(
    (acc, m) => acc + (parseFloat(m.valor_pago) || 0),
    0,
  );
  const totalSaldo = listaParaPDF.reduce(
    (acc, m) =>
      acc +
      ((parseFloat(m.valor_orcado) || 0) - (parseFloat(m.valor_pago) || 0)),
    0,
  );
  const infoRodape = `Total Cobrado: R$ ${formatarMoeda(totalCobrado)} | Total Pago: R$ ${formatarMoeda(totalPago)} | Saldo: R$ ${formatarMoeda(totalSaldo)}`;

  return gerarPDF(
    "Relatório Mão de Obra Geral",
    ["Serviço", "Profissional", "V. Cobrado", "V. Orçado", "V. Pago", "Saldo"],
    dadosPDF,
    obra.local,
    infoRodape,
    opts,
  );
}

export function gerarPdfRelatorioPorPrestador(obra, prestador, opts = {}) {
  if (!obra || !obra.maoDeObra) return false;
  const filtrados = obra.maoDeObra.filter(
    (m) => m.profissional?.toLowerCase() === prestador.toLowerCase(),
  );

  if (filtrados.length === 0) {
    alert("Nenhum registro encontrado para este prestador.");
    return false;
  }

  const totalCobrado = filtrados.reduce(
    (acc, m) => acc + (parseFloat(m.valor_cobrado) || 0),
    0,
  );
  const totalPago = filtrados.reduce(
    (acc, m) => acc + (parseFloat(m.valor_pago) || 0),
    0,
  );
  const totalSaldo = filtrados.reduce(
    (acc, m) =>
      acc +
      ((parseFloat(m.valor_orcado) || 0) - (parseFloat(m.valor_pago) || 0)),
    0,
  );

  const dadosPDF = filtrados.map((m) => [
    m.tipo?.toUpperCase(),
    m.profissional?.toUpperCase(),
    `R$ ${formatarMoeda(m.valor_cobrado || 0)}`,
    `R$ ${formatarMoeda(m.valor_pago || 0)}`,
    `R$ ${formatarMoeda((m.valor_orcado || 0) - (m.valor_pago || 0))}`,
    formatarDataBR(m.data_solicitacao),
  ]);

  const infoRodape = `Total Cobrado: R$ ${formatarMoeda(totalCobrado)} | Total Pago: R$ ${formatarMoeda(totalPago)} | Saldo Geral: R$ ${formatarMoeda(totalSaldo)}`;

  const result = gerarPDF(
    `Relatório - ${prestador.toUpperCase()}`,
    ["Serviço", "Prestador", "V. Cobrado", "V. Pago", "Saldo", "Data"],
    dadosPDF,
    obra.local,
    infoRodape,
    opts,
  );
  return opts?.retornarBlob ? result : true;
}

export function gerarPdfRelatorioMateriais(obra, buscaMateriais, opts = {}) {
  if (!obra || !Array.isArray(obra.materiais)) return;

  let lista = [...obra.materiais];
  if (buscaMateriais) {
    const termo = String(buscaMateriais).toLowerCase();
    lista = lista.filter(
      (m) =>
        m.material?.toLowerCase().includes(termo) ||
        m.fornecedores?.nome?.toLowerCase().includes(termo) ||
        m.fornecedor?.toLowerCase().includes(termo),
    );
  }

  if (lista.length === 0) {
    alert("Nenhum material encontrado para o relatório.");
    return;
  }

  const dadosPDF = lista.map((m) => {
    const qtd = parseFloat(m.quantidade) || 0;
    const valorTotal = parseFloat(m.valor) || 0;
    const valorUnit = qtd > 0 ? valorTotal / qtd : 0;
    const fornecedor = m.fornecedores?.nome || m.fornecedor || "-";
    return [
      m.material?.toUpperCase() || "-",
      String(m.quantidade ?? "-"),
      `R$ ${formatarMoeda(valorUnit)}`,
      `R$ ${formatarMoeda(valorTotal)}`,
      fornecedor,
      m.status || "-",
      formatarDataBR(m.data_solicitacao),
    ];
  });

  const totalGeral = lista.reduce(
    (acc, m) => acc + (parseFloat(m.valor) || 0),
    0,
  );
  const infoRodape = `Total Materiais: R$ ${formatarMoeda(totalGeral)}`;

  return gerarPDF(
    "Relatório de Materiais",
    ["Material", "Qtd", "V. Unit.", "V. Total", "Fornecedor", "Status", "Data"],
    dadosPDF,
    obra.local,
    infoRodape,
    opts,
  );
}

export function gerarPdfExtrato(obra, opts = {}) {
  if (!obra || !obra.relatorioExtrato) return;
  const itens = obra.relatorioExtrato.filter((i) => i.validacao === 1);
  if (itens.length === 0)
    return alert("Nenhum item selecionado para o extrato.");
  const soma = itens.reduce((acc, i) => acc + (parseFloat(i.valor) || 0), 0);
  const formatado = `R$ ${formatarMoeda(soma)}`;
  const pdfData = itens.map((i) => [
    i.descricao,
    i.tipo,
    i.quantidade,
    formatarDataBR(i.data),
    `R$ ${formatarMoeda(i.valor)}`,
  ]);
  return gerarPDF(
    "Extrato",
    ["Descrição", "Tipo", "Qtd", "Data", "Valor"],
    pdfData,
    obra.local,
    formatado,
    opts,
  );
}
