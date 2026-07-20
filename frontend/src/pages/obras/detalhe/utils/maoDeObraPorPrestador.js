/** Sentinel for MDO lines without prestador_id in the obra report hub. */
export const SEM_PRESTADOR_ID = "__none__";

function isExtratoPago(statusFinanceiro) {
  return (statusFinanceiro || "").toLowerCase().trim() === "pago";
}

function valorContratado(linha) {
  const orcado = parseFloat(linha?.valor_orcado) || 0;
  const cobrado = parseFloat(linha?.valor_cobrado) || 0;
  const pago = parseFloat(linha?.valor_pago) || 0;
  const base = orcado || cobrado;
  return base > 0 ? base : pago;
}

/**
 * MdO conta como pago quando existe extrato vinculado e todos os lançamentos
 * de extrato ligados a ela estão "Pago" (mesma regra do módulo de prestadores).
 */
function montarMapaExtratosPorMdoId(extrato = []) {
  const mapa = new Map();
  for (const e of extrato || []) {
    if (e?.mao_de_obra_id == null) continue;
    const chave = String(e.mao_de_obra_id);
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave).push(e);
  }
  return mapa;
}

function mdoPagaNoExtrato(mapaExtratos, mdoId) {
  const extratos = mapaExtratos.get(String(mdoId));
  if (!extratos?.length) return false;
  return extratos.every((e) => isExtratoPago(e?.status_financeiro));
}

function somarTotais(lancamentos, mapaExtratos) {
  let contratado = 0;
  let pago = 0;
  for (const m of lancamentos || []) {
    const val = valorContratado(m);
    contratado += val;
    if (mdoPagaNoExtrato(mapaExtratos, m.id)) {
      pago += val;
    }
  }
  return {
    contratado,
    pago,
    pendente: contratado - pago,
    qtdItens: (lancamentos || []).length,
  };
}

/**
 * Groups obra mão de obra by prestador and returns summary cards + obra totals.
 * Only prestadores with at least one lançamento on this obra are included.
 * "Pago" é validado pelo extrato financeiro (relatorio_extrato), não pelo
 * valor_pago da linha.
 */
export function agregarMaoDeObraPorPrestador(maoDeObra = [], extrato = []) {
  const mapaExtratos = montarMapaExtratosPorMdoId(extrato);
  const porId = new Map();

  for (const m of maoDeObra || []) {
    const id = m.prestador_id ? String(m.prestador_id) : SEM_PRESTADOR_ID;
    if (!porId.has(id)) {
      porId.set(id, {
        id,
        nome:
          id === SEM_PRESTADOR_ID
            ? "Sem prestador"
            : m.prestadores?.nome || m.profissional || "Prestador",
        lancamentos: [],
      });
    }
    const grupo = porId.get(id);
    grupo.lancamentos.push(m);
    if (id !== SEM_PRESTADOR_ID) {
      const nomeAtual = m.prestadores?.nome || m.profissional;
      if (nomeAtual) grupo.nome = nomeAtual;
    }
  }

  const prestadores = Array.from(porId.values()).map((g) => {
    const totais = somarTotais(g.lancamentos, mapaExtratos);
    return {
      id: g.id,
      nome: g.nome,
      ...totais,
    };
  });

  prestadores.sort((a, b) => {
    if (a.id === SEM_PRESTADOR_ID) return 1;
    if (b.id === SEM_PRESTADOR_ID) return -1;
    if (a.pendente > 0 && b.pendente <= 0) return -1;
    if (b.pendente > 0 && a.pendente <= 0) return 1;
    return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
  });

  const totaisObra = somarTotais(maoDeObra, mapaExtratos);

  return {
    prestadores,
    totaisObra,
    qtdPrestadores: prestadores.length,
  };
}

export function encontrarPrestadorIdDoLancamento(maoDeObra, itemId) {
  if (!itemId || !maoDeObra?.length) return null;
  const m = maoDeObra.find((item) => String(item.id) === String(itemId));
  if (!m) return null;
  return m.prestador_id ? String(m.prestador_id) : SEM_PRESTADOR_ID;
}
