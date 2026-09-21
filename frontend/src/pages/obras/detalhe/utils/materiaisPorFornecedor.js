/** Sentinel for materials without fornecedor_id in the obra report hub. */
export const SEM_FORNECEDOR_ID = "__none__";

function isExtratoPago(statusFinanceiro) {
  return String(statusFinanceiro || "")
    .trim()
    .toLowerCase() === "pago";
}

/**
 * Materiais na obra (relação Cliente → Montezuma) contam como pagos quando
 * existe extrato vinculado e todos os lançamentos estão "Pago".
 */
export function montarMapaExtratosPorMaterialId(extrato = []) {
  const mapa = new Map();
  for (const e of extrato || []) {
    if (e?.material_id == null) continue;
    const chave = String(e.material_id);
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(e);
  }
  return mapa;
}

export function materialPagoNoExtrato(mapaExtratos, materialId) {
  const extratos = mapaExtratos.get(String(materialId));
  if (!extratos?.length) return false;
  return extratos.every((e) => isExtratoPago(e?.status_financeiro));
}

export function statusPagamentoClienteDoMaterial(mapaExtratos, materialId) {
  return materialPagoNoExtrato(mapaExtratos, materialId)
    ? "Pago"
    : "Aguardando pagamento";
}

function somarTotais(materiais, mapaExtratos) {
  let comprado = 0;
  let pago = 0;
  for (const m of materiais || []) {
    const val = parseFloat(m.valor) || 0;
    comprado += val;
    if (materialPagoNoExtrato(mapaExtratos, m.id)) {
      pago += val;
    }
  }
  return {
    comprado,
    pago,
    pendente: comprado - pago,
    qtdItens: (materiais || []).length,
  };
}

/**
 * Groups obra materials by supplier and returns summary cards + obra totals.
 * "Pago" é validado pelo extrato financeiro (relatorio_extrato) — relação
 * Cliente → Montezuma — e não pela conta a pagar do fornecedor.
 */
export function agregarMateriaisPorFornecedor(materiais = [], extrato = []) {
  const mapaExtratos = montarMapaExtratosPorMaterialId(extrato);
  const porId = new Map();

  for (const m of materiais || []) {
    const id = m.fornecedor_id ? String(m.fornecedor_id) : SEM_FORNECEDOR_ID;
    if (!porId.has(id)) {
      porId.set(id, {
        id,
        nome:
          id === SEM_FORNECEDOR_ID
            ? "Sem fornecedor"
            : m.fornecedores?.nome || m.fornecedor || "Fornecedor",
        materiais: [],
      });
    }
    const grupo = porId.get(id);
    grupo.materiais.push(m);
    if (id !== SEM_FORNECEDOR_ID) {
      const nomeAtual = m.fornecedores?.nome || m.fornecedor;
      if (nomeAtual) grupo.nome = nomeAtual;
    }
  }

  const fornecedores = Array.from(porId.values()).map((g) => {
    const totais = somarTotais(g.materiais, mapaExtratos);
    return {
      id: g.id,
      nome: g.nome,
      ...totais,
    };
  });

  fornecedores.sort((a, b) => {
    if (a.id === SEM_FORNECEDOR_ID) return 1;
    if (b.id === SEM_FORNECEDOR_ID) return -1;
    if (a.pendente > 0 && b.pendente <= 0) return -1;
    if (b.pendente > 0 && a.pendente <= 0) return 1;
    return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
  });

  const totaisObra = somarTotais(materiais, mapaExtratos);

  return {
    fornecedores,
    totaisObra,
    qtdFornecedores: fornecedores.length,
  };
}

export function encontrarFornecedorIdDoMaterial(materiais, materialId) {
  if (!materialId || !materiais?.length) return null;
  const m = materiais.find((item) => String(item.id) === String(materialId));
  if (!m) return null;
  return m.fornecedor_id ? String(m.fornecedor_id) : SEM_FORNECEDOR_ID;
}
