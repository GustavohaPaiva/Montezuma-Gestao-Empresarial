import { pdf } from "@react-pdf/renderer";
import RelatorioObraPDF from "../../../../documents/RelatorioObraPDF";
import RelatorioCronogramaPDF from "../../../../documents/RelatorioCronogramaPDF";
import { formatarDataBR, formatarMoeda } from "./formatters";

/**
 * Todos os geradores devolvem `{ blob, nomePadrao }`.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
 * Nome formal padronizado:
 *   "Montezuma_Relatorio-de-Materiais_Obra-Casa-Joao_2026-05-26.pdf"
 */
function nomeFormalRelatorio(tipo, obra, sufixo) {
  const obraSlug = slugify(
    obra?.local || obra?.cliente || obra?.clientes?.nome || "obra",
  );
  const sufixoSlug = sufixo ? `_${slugify(sufixo)}` : "";
  return `Montezuma_${slugify(tipo)}_Obra-${obraSlug}${sufixoSlug}_${hojeISO()}.pdf`;
}

function obraParaPdf(obra) {
  if (!obra) return undefined;
  const cliente =
    obra?.clientes?.nome || obra?.cliente || obra?.cliente_nome || undefined;
  return {
    cliente,
    local: obra?.local || undefined,
  };
}

function tonePagamento(statusFinanceiro) {
  return (statusFinanceiro || "").toLowerCase() === "pago"
    ? "success"
    : "warning";
}

function rotuloPagamento(statusFinanceiro) {
  return (statusFinanceiro || "").toLowerCase() === "pago"
    ? "Pago"
    : "Pendente";
}

async function blobERetorno(doc, nomePadrao) {
  const blob = await pdf(doc).toBlob();
  return { blob, nomePadrao };
}

/** Chips compactos (mesmo estilo Cliente/Local): itens + valor total. */
function resumoItensETotal(quantidade, valorFormatado, labelTotal = "Total") {
  return [
    { label: "Itens", value: String(quantidade) },
    { label: labelTotal, value: valorFormatado },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Mão de Obra (Geral) — SEM "V. Cobrado" no PDF
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarPdfRelatorioMaoDeObraGeral(
  obra,
  buscaMaoDeObra,
  // eslint-disable-next-line no-unused-vars
  opts = {},
) {
  let lista = [...(obra?.maoDeObra || [])];

  if (buscaMaoDeObra) {
    const term = buscaMaoDeObra.toLowerCase();
    lista = lista.filter(
      (m) =>
        m.tipo?.toLowerCase().includes(term) ||
        m.profissional?.toLowerCase().includes(term),
    );
  }

  const totalOrcado = lista.reduce(
    (acc, m) => acc + (parseFloat(m.valor_orcado) || 0),
    0,
  );

  const colunas = [
    { key: "servico", label: "Serviço", width: "22%" },
    { key: "prof", label: "Profissional", width: "26%" },
    { key: "orcado", label: "V. Orçado", width: "16%" },
    { key: "pago", label: "V. Pago", width: "16%" },
    { key: "saldo", label: "Saldo", width: "12%" },
    { key: "data", label: "Data", width: "8%" },
  ];

  const linhas = lista.map((m) => {
    const orcado = parseFloat(m.valor_orcado) || 0;
    const pago = parseFloat(m.valor_pago) || 0;
    const saldo = orcado - pago;

    let saldoTone = null;
    if (saldo < 0) saldoTone = "danger";
    else if (saldo === 0 && orcado > 0) saldoTone = "success";
    else if (saldo > 0) saldoTone = "warning";

    return [
      m.tipo || "—",
      m.profissional || "—",
      `R$ ${formatarMoeda(orcado)}`,
      `R$ ${formatarMoeda(pago)}`,
      saldoTone
        ? { text: `R$ ${formatarMoeda(saldo)}`, tone: saldoTone }
        : `R$ ${formatarMoeda(saldo)}`,
      formatarDataBR(m.data_solicitacao),
    ];
  });

  const titulo = "Relatório de Mão de Obra";
  const nomePadrao = nomeFormalRelatorio("Relatorio-de-Mao-de-Obra", obra);

  const doc = (
    <RelatorioObraPDF
      titulo={titulo}
      referencia={`MDO · ${hojeISO()}`}
      obra={obraParaPdf(obra)}
      resumo={resumoItensETotal(
        lista.length,
        `R$ ${formatarMoeda(totalOrcado)}`,
        "Total Orçado",
      )}
      colunas={colunas}
      linhas={linhas}
      totalDestaque={{
        label: "Total Orçado",
        value: `R$ ${formatarMoeda(totalOrcado)}`,
      }}
    />
  );

  return blobERetorno(doc, nomePadrao);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mão de Obra (Por Prestador) — SEM "V. Cobrado"
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarPdfRelatorioPorPrestador(
  obra,
  prestador,
  // eslint-disable-next-line no-unused-vars
  opts = {},
) {
  if (!obra || !obra.maoDeObra) return false;
  const filtrados = obra.maoDeObra.filter(
    (m) => m.profissional?.toLowerCase() === prestador.toLowerCase(),
  );
  if (filtrados.length === 0) {
    alert("Nenhum registro encontrado para este prestador.");
    return false;
  }

  const totalOrcado = filtrados.reduce(
    (acc, m) => acc + (parseFloat(m.valor_orcado) || 0),
    0,
  );

  const colunas = [
    { key: "servico", label: "Serviço", width: "30%" },
    { key: "orcado", label: "V. Orçado", width: "20%" },
    { key: "pago", label: "V. Pago", width: "20%" },
    { key: "saldo", label: "Saldo", width: "18%" },
    { key: "data", label: "Data", width: "12%" },
  ];

  const linhas = filtrados.map((m) => {
    const orcado = parseFloat(m.valor_orcado) || 0;
    const pago = parseFloat(m.valor_pago) || 0;
    const saldo = orcado - pago;
    let saldoTone = null;
    if (saldo < 0) saldoTone = "danger";
    else if (saldo === 0 && orcado > 0) saldoTone = "success";
    else if (saldo > 0) saldoTone = "warning";

    return [
      m.tipo || "—",
      `R$ ${formatarMoeda(orcado)}`,
      `R$ ${formatarMoeda(pago)}`,
      saldoTone
        ? { text: `R$ ${formatarMoeda(saldo)}`, tone: saldoTone }
        : `R$ ${formatarMoeda(saldo)}`,
      formatarDataBR(m.data_solicitacao),
    ];
  });

  const titulo = `Mão de Obra · ${prestador}`;
  const nomePadrao = nomeFormalRelatorio(
    "Relatorio-de-Mao-de-Obra",
    obra,
    `Prestador-${prestador}`,
  );

  const doc = (
    <RelatorioObraPDF
      titulo={titulo}
      referencia={`MDO · Prestador · ${hojeISO()}`}
      obra={obraParaPdf(obra)}
      info={[{ label: "Prestador", value: prestador }]}
      resumo={resumoItensETotal(
        filtrados.length,
        `R$ ${formatarMoeda(totalOrcado)}`,
        "Total Orçado",
      )}
      colunas={colunas}
      linhas={linhas}
      totalDestaque={{
        label: "Total Orçado",
        value: `R$ ${formatarMoeda(totalOrcado)}`,
      }}
    />
  );

  return blobERetorno(doc, nomePadrao);
}

// ─────────────────────────────────────────────────────────────────────────────
// Materiais — A4 portrait
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarPdfRelatorioMateriais(
  obra,
  buscaMateriais,
  // eslint-disable-next-line no-unused-vars
  opts = {},
) {
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

  const totalGeral = lista.reduce(
    (acc, m) => acc + (parseFloat(m.valor) || 0),
    0,
  );
  const colunas = [
    { key: "material", label: "Material", width: "28%" },
    { key: "qtd", label: "Qtd.", width: "9%" },
    { key: "total", label: "V. Total", width: "16%" },
    { key: "forn", label: "Fornecedor", width: "22%" },
    { key: "data", label: "Data", width: "11%" },
    { key: "pgto", label: "Pagamento", width: "14%" },
  ];

  const linhas = lista.map((m) => {
    const valorTotal = parseFloat(m.valor) || 0;
    const fornecedor = m.fornecedores?.nome || m.fornecedor || "—";
    const pago = (m.status_financeiro || "").toLowerCase() === "pago";
    return [
      m.material || "—",
      String(m.quantidade ?? "—"),
      pago
        ? { text: `R$ ${formatarMoeda(valorTotal)}`, tone: "success" }
        : `R$ ${formatarMoeda(valorTotal)}`,
      fornecedor,
      formatarDataBR(m.data_solicitacao),
      {
        kind: "pill",
        tone: tonePagamento(m.status_financeiro),
        text: rotuloPagamento(m.status_financeiro),
      },
    ];
  });

  const titulo = "Relatório de Materiais";
  const nomePadrao = nomeFormalRelatorio("Relatorio-de-Materiais", obra);

  const doc = (
    <RelatorioObraPDF
      titulo={titulo}
      referencia={`MAT · ${hojeISO()}`}
      obra={obraParaPdf(obra)}
      resumo={resumoItensETotal(
        lista.length,
        `R$ ${formatarMoeda(totalGeral)}`,
        "Total Lançado",
      )}
      colunas={colunas}
      linhas={linhas}
      totalDestaque={{
        label: "Total Lançado",
        value: `R$ ${formatarMoeda(totalGeral)}`,
      }}
    />
  );

  return blobERetorno(doc, nomePadrao);
}

// ─────────────────────────────────────────────────────────────────────────────
// Locações — A4 portrait
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarPdfRelatorioLocacoes(
  obra,
  buscaLocacoes,
  // eslint-disable-next-line no-unused-vars
  opts = {},
) {
  if (!obra || !Array.isArray(obra.locacoes)) return;

  let lista = [...obra.locacoes];
  if (buscaLocacoes) {
    const termo = String(buscaLocacoes).toLowerCase();
    lista = lista.filter(
      (l) =>
        l.equipamento?.toLowerCase().includes(termo) ||
        l.solicitante?.toLowerCase().includes(termo) ||
        l.tipo_periodo?.toLowerCase().includes(termo) ||
        l.fornecedor?.toLowerCase().includes(termo),
    );
  }

  if (lista.length === 0) {
    alert("Nenhuma locação encontrada para o relatório.");
    return;
  }

  const totalGeral = lista.reduce(
    (acc, l) => acc + (parseFloat(l.valor) || 0),
    0,
  );
  const colunas = [
    { key: "equip", label: "Equipamento", width: "26%" },
    { key: "qtd", label: "Qtd.", width: "8%" },
    { key: "periodo", label: "Período", width: "12%" },
    { key: "total", label: "V. Total", width: "16%" },
    { key: "coleta", label: "Coleta", width: "12%" },
    { key: "devolucao", label: "Devolução", width: "12%" },
    { key: "pgto", label: "Pagamento", width: "14%" },
  ];

  const linhas = lista.map((l) => {
    const valorTotal = parseFloat(l.valor) || 0;
    const periodoLabel = `${l.periodo || 0} ${l.tipo_periodo || "—"}`;
    const pago = (l.status_financeiro || "").toLowerCase() === "pago";
    return [
      l.equipamento || "—",
      String(l.quantidade ?? "—"),
      periodoLabel,
      pago
        ? { text: `R$ ${formatarMoeda(valorTotal)}`, tone: "success" }
        : `R$ ${formatarMoeda(valorTotal)}`,
      formatarDataBR(l.data_coleta),
      formatarDataBR(l.data_vencimento),
      {
        kind: "pill",
        tone: tonePagamento(l.status_financeiro),
        text: rotuloPagamento(l.status_financeiro),
      },
    ];
  });

  const titulo = "Relatório de Locações";
  const nomePadrao = nomeFormalRelatorio("Relatorio-de-Locacoes", obra);

  const doc = (
    <RelatorioObraPDF
      titulo={titulo}
      referencia={`LOC · ${hojeISO()}`}
      obra={obraParaPdf(obra)}
      resumo={resumoItensETotal(
        lista.length,
        `R$ ${formatarMoeda(totalGeral)}`,
        "Total Lançado",
      )}
      colunas={colunas}
      linhas={linhas}
      totalDestaque={{
        label: "Total Lançado",
        value: `R$ ${formatarMoeda(totalGeral)}`,
      }}
    />
  );

  return blobERetorno(doc, nomePadrao);
}

// ─────────────────────────────────────────────────────────────────────────────
// Extrato — A4 portrait
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarPdfExtrato(
  obra,
  // eslint-disable-next-line no-unused-vars
  opts = {},
) {
  if (!obra || !obra.relatorioExtrato) return;
  const itens = obra.relatorioExtrato.filter((i) => i.validacao === 1);
  if (itens.length === 0) {
    alert("Nenhum item selecionado para o extrato.");
    return;
  }

  const soma = itens.reduce((acc, i) => acc + (parseFloat(i.valor) || 0), 0);

  const colunas = [
    { key: "desc", label: "Descrição", width: "28%" },
    { key: "tipo", label: "Tipo", width: "14%" },
    { key: "qtd", label: "Qtd.", width: "10%" },
    { key: "data", label: "Data", width: "14%" },
    { key: "valor", label: "Valor", width: "18%" },
    { key: "pgto", label: "Pagamento", width: "16%" },
  ];

  const linhas = itens.map((i) => {
    const pago = (i.status_financeiro || "").toLowerCase() === "pago";
    const qtd =
      i.quantidade != null && i.quantidade !== ""
        ? String(i.quantidade)
        : "—";
    return [
      i.descricao || "—",
      i.tipo || "—",
      qtd,
      formatarDataBR(i.data),
      pago
        ? { text: `R$ ${formatarMoeda(i.valor)}`, tone: "success" }
        : `R$ ${formatarMoeda(i.valor)}`,
      {
        kind: "pill",
        tone: tonePagamento(i.status_financeiro),
        text: rotuloPagamento(i.status_financeiro),
      },
    ];
  });

  const titulo = "Extrato Financeiro";
  const nomePadrao = nomeFormalRelatorio("Extrato-Financeiro", obra);

  const doc = (
    <RelatorioObraPDF
      titulo={titulo}
      referencia={`EXT · ${hojeISO()}`}
      obra={obraParaPdf(obra)}
      resumo={resumoItensETotal(
        itens.length,
        `R$ ${formatarMoeda(soma)}`,
        "Total do Extrato",
      )}
      colunas={colunas}
      linhas={linhas}
      totalDestaque={{
        label: "Total do Extrato",
        value: `R$ ${formatarMoeda(soma)}`,
      }}
    />
  );

  return blobERetorno(doc, nomePadrao);
}

// ─────────────────────────────────────────────────────────────────────────────
// Cronograma da obra
// ─────────────────────────────────────────────────────────────────────────────

export async function gerarPdfRelatorioCronograma(
  obra,
  dadosCronograma,
  // eslint-disable-next-line no-unused-vars
  _opts = {},
) {
  if (!dadosCronograma) {
    throw new Error("Dados do cronograma indisponíveis.");
  }

  const sufixo = dadosCronograma.referenciaSlug || dadosCronograma.referencia;
  const nomePadrao = nomeFormalRelatorio(
    "Relatorio-de-Cronograma",
    obra,
    sufixo,
  );

  const doc = <RelatorioCronogramaPDF dados={dadosCronograma} />;

  return blobERetorno(doc, nomePadrao);
}
