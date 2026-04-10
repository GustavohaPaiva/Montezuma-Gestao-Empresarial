import { gerarPDF } from "../../../../services/pdfService";
import { formatarDataBR, formatarMoeda } from "./formatters";

export function gerarPdfRelatorioMaoDeObraGeral(obra, buscaMaoDeObra) {
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

  gerarPDF(
    "Relatório Mão de Obra Geral",
    ["Serviço", "Profissional", "V. Cobrado", "V. Orçado", "V. Pago", "Saldo"],
    dadosPDF,
    obra.local,
    infoRodape,
  );
}

export function gerarPdfRelatorioPorPrestador(obra, prestador) {
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

  gerarPDF(
    `Relatório - ${prestador.toUpperCase()}`,
    ["Serviço", "Prestador", "V. Cobrado", "V. Pago", "Saldo", "Data"],
    dadosPDF,
    obra.local,
    infoRodape,
  );
  return true;
}

export function gerarPdfExtrato(obra) {
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
  gerarPDF(
    "Extrato",
    ["Descrição", "Tipo", "Qtd", "Data", "Valor"],
    pdfData,
    obra.local,
    formatado,
  );
}
