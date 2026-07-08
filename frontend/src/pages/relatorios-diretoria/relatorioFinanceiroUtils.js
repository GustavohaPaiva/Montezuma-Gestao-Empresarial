import {
  fimSemanaCalendar,
  inicioSemanaCalendar,
  parseISODate,
  toISODate,
} from "./relatoriosDiretoriaUtils";

const PALETA_CORES = ["#860000", "#EE5B11", "#F67D15", "#FBA51B", "#FDC626"];

export const TIPOS_EXTRATO = ["Material", "Mão de Obra", "Locação"];

function parseValor(valor) {
  return parseFloat(valor) || 0;
}

function isPago(statusFinanceiro) {
  return (statusFinanceiro || "").toLowerCase() === "pago";
}

function resumoCategoriaVazio() {
  return { count: 0, aCobrar: 0, pago: 0, aguardando: 0, emEspera: 0, total: 0 };
}

function resumoVazio(semanaInicio = "") {
  return {
    extratoSemana: [],
    emEsperaSemana: [],
    totais: {
      aCobrar: 0,
      pago: 0,
      aguardando: 0,
      emEspera: 0,
      total: 0,
    },
    porCategoria: {},
    graficos: {
      pizza: [],
      barras: [],
    },
    semanaInicio,
    intervalo: { inicio: "", fim: "" },
  };
}

export function intervaloSemana(semanaInicio) {
  const base = parseISODate(semanaInicio) || new Date(`${semanaInicio}T12:00:00`);
  const inicio = inicioSemanaCalendar(base);
  const fim = fimSemanaCalendar(inicio);
  return { inicio: toISODate(inicio), fim: toISODate(fim) };
}

export function dataNoIntervalo(data, inicio, fim) {
  if (!data || !inicio || !fim) return false;
  const d = String(data).slice(0, 10);
  return d >= inicio && d <= fim;
}

export function montarMapaExtrato(extrato = []) {
  const materialIds = new Set();
  const maoDeObraIds = new Set();
  const locacaoIds = new Set();

  extrato.forEach((item) => {
    if (item.material_id != null) materialIds.add(item.material_id);
    if (item.mao_de_obra_id != null) maoDeObraIds.add(item.mao_de_obra_id);
    if (item.locacao_id != null) locacaoIds.add(item.locacao_id);
  });

  return { materialIds, maoDeObraIds, locacaoIds };
}

function montarIndiceExtrato(extrato = []) {
  const porMaterialId = new Map();
  const porMaoDeObraId = new Map();
  const porLocacaoId = new Map();
  const manuais = [];

  extrato.forEach((item) => {
    if (item.material_id != null) {
      porMaterialId.set(item.material_id, item);
    } else if (item.mao_de_obra_id != null) {
      porMaoDeObraId.set(item.mao_de_obra_id, item);
    } else if (item.locacao_id != null) {
      porLocacaoId.set(item.locacao_id, item);
    } else {
      manuais.push(item);
    }
  });

  return { porMaterialId, porMaoDeObraId, porLocacaoId, manuais };
}

function montarItemMaterial(material, extratoLinha) {
  const data = String(material.data_solicitacao || "").slice(0, 10);
  const fornecedor = material.fornecedores?.nome || null;
  const noExtrato = Boolean(extratoLinha);
  const valorMaterial = parseValor(material.valor);
  const valor = noExtrato ? parseValor(extratoLinha.valor) : valorMaterial;

  return {
    id: material.id,
    origem: "material",
    tipo: "Material",
    material: material.material || "—",
    fornecedor,
    quantidade: material.quantidade ?? null,
    data_vencimento: material.data_vencimento
      ? String(material.data_vencimento).slice(0, 10)
      : null,
    descricao: fornecedor
      ? `${material.material} (${fornecedor})`
      : material.material || "Material",
    data,
    valor,
    valor_orcado: valorMaterial,
    valor_cobrado: valor,
    valor_pago: noExtrato && isPago(extratoLinha.status_financeiro) ? valor : 0,
    saldo: noExtrato ? 0 : valorMaterial,
    status: noExtrato
      ? extratoLinha.status_financeiro || "Aguardando pagamento"
      : "Em espera",
    classificacao: noExtrato ? "a_cobrar" : "em_espera",
    extrato_id: extratoLinha?.id ?? null,
  };
}

function montarItemMaoDeObra(item, extratoLinha) {
  const data = String(item.data_solicitacao || "").slice(0, 10);
  const valorOrcado = parseValor(item.valor_orcado);
  const valorCobrado = parseValor(item.valor_cobrado);
  const valorPago = parseValor(item.valor_pago);
  const saldo =
    item.saldo != null ? parseValor(item.saldo) : valorOrcado - valorPago;
  const noExtrato = Boolean(extratoLinha);
  const valor = noExtrato
    ? parseValor(extratoLinha.valor)
    : valorCobrado || valorOrcado;

  return {
    id: item.id,
    origem: "mao_de_obra",
    tipo: "Mão de Obra",
    servico: item.tipo || "Serviço",
    profissional: item.profissional || "—",
    descricao: `${item.tipo || "Serviço"} — ${item.profissional || "—"}`,
    data,
    valor,
    valor_orcado: valorOrcado,
    valor_cobrado: valorCobrado,
    valor_pago: valorPago,
    saldo,
    status: noExtrato
      ? extratoLinha.status_financeiro || "Aguardando pagamento"
      : "Em espera",
    classificacao: noExtrato ? "a_cobrar" : "em_espera",
    extrato_id: extratoLinha?.id ?? null,
    validacao: item.validacao,
  };
}

function montarItemLocacao(item, extratoLinha) {
  const data = String(item.data_coleta || "").slice(0, 10);
  const noExtrato = Boolean(extratoLinha);
  const valorLocacao = parseValor(item.valor);
  const valor = noExtrato ? parseValor(extratoLinha.valor) : valorLocacao;

  return {
    id: item.id,
    origem: "locacao",
    tipo: "Locação",
    equipamento: item.equipamento || "Locação",
    data_vencimento: item.data_vencimento
      ? String(item.data_vencimento).slice(0, 10)
      : null,
    descricao: item.equipamento || "Locação",
    data,
    valor,
    valor_orcado: valorLocacao,
    valor_cobrado: valor,
    valor_pago: noExtrato && isPago(extratoLinha.status_financeiro) ? valor : 0,
    saldo: noExtrato ? 0 : valorLocacao,
    status: noExtrato
      ? extratoLinha.status_financeiro || "Aguardando pagamento"
      : "Em espera",
    classificacao: noExtrato ? "a_cobrar" : "em_espera",
    extrato_id: extratoLinha?.id ?? null,
    validacao: item.validacao,
  };
}

function montarItemExtratoManual(item) {
  return {
    id: item.id,
    origem: "extrato_manual",
    tipo: item.tipo || "Outros",
    descricao: item.descricao || "—",
    data: String(item.data).slice(0, 10),
    valor: parseValor(item.valor),
    valor_orcado: parseValor(item.valor),
    valor_cobrado: parseValor(item.valor),
    valor_pago: isPago(item.status_financeiro) ? parseValor(item.valor) : 0,
    saldo: 0,
    status: item.status_financeiro || "Aguardando pagamento",
    classificacao: "a_cobrar",
    extrato_id: item.id,
  };
}

function montarDadosGraficos(extratoSemana) {
  const porTipo = {};
  TIPOS_EXTRATO.forEach((tipo) => {
    porTipo[tipo] = { total: 0, pago: 0, aguardando: 0 };
  });

  extratoSemana.forEach((item) => {
    const tipo = TIPOS_EXTRATO.includes(item.tipo) ? item.tipo : "Outros";
    if (!porTipo[tipo]) {
      porTipo[tipo] = { total: 0, pago: 0, aguardando: 0 };
    }
    porTipo[tipo].total += item.valor;
    if (isPago(item.status)) {
      porTipo[tipo].pago += item.valor;
    } else {
      porTipo[tipo].aguardando += item.valor;
    }
  });

  const entradasPizza = Object.entries(porTipo)
    .filter(([, v]) => v.total > 0)
    .map(([name, v]) => ({ name, value: v.total }))
    .sort((a, b) => b.value - a.value);

  const totalPizza = entradasPizza.reduce((acc, d) => acc + d.value, 0);
  const pizza = entradasPizza.map((d, index) => ({
    ...d,
    percentual: totalPizza > 0 ? ((d.value / totalPizza) * 100).toFixed(0) : 0,
    color: PALETA_CORES[index] || PALETA_CORES[PALETA_CORES.length - 1],
  }));

  const barras = Object.entries(porTipo)
    .filter(([, v]) => v.total > 0)
    .map(([name, v]) => ({
      name,
      pago: v.pago,
      aguardando: v.aguardando,
    }));

  return { pizza, barras };
}

function calcularTotais(extratoSemana, emEsperaSemana) {
  let aCobrar = 0;
  let pago = 0;
  let aguardando = 0;
  let emEspera = 0;

  extratoSemana.forEach((item) => {
    aCobrar += item.valor;
    if (isPago(item.status)) pago += item.valor;
    else aguardando += item.valor;
  });

  emEsperaSemana.forEach((item) => {
    emEspera += item.valor;
  });

  return {
    aCobrar,
    pago,
    aguardando,
    emEspera,
    total: aCobrar + emEspera,
  };
}

function calcularPorCategoria(extratoSemana, emEsperaSemana) {
  const categorias = {};
  TIPOS_EXTRATO.forEach((tipo) => {
    categorias[tipo] = resumoCategoriaVazio();
  });

  const registrar = (item, emEspera) => {
    const tipo = TIPOS_EXTRATO.includes(item.tipo) ? item.tipo : "Outros";
    if (!categorias[tipo]) {
      categorias[tipo] = resumoCategoriaVazio();
    }
    const cat = categorias[tipo];
    cat.count += 1;
    cat.total += item.valor;
    if (emEspera) {
      cat.emEspera += item.valor;
      return;
    }
    cat.aCobrar += item.valor;
    if (isPago(item.status)) cat.pago += item.valor;
    else cat.aguardando += item.valor;
  };

  extratoSemana.forEach((item) => registrar(item, false));
  emEsperaSemana.forEach((item) => registrar(item, true));

  return Object.fromEntries(
    Object.entries(categorias).filter(([, v]) => v.count > 0),
  );
}

export function classificarLancamentosObra(obra, semanaInicio) {
  if (!obra || !semanaInicio) return resumoVazio(semanaInicio);

  const { inicio, fim } = intervaloSemana(semanaInicio);
  const extratoAll = obra.relatorioExtrato || [];
  const indice = montarIndiceExtrato(extratoAll);

  const extratoSemana = [];
  const emEsperaSemana = [];

  const classificar = (item) => {
    if (item.classificacao === "a_cobrar") extratoSemana.push(item);
    else emEsperaSemana.push(item);
  };

  (obra.materiais || []).forEach((material) => {
    const data = String(material.data_solicitacao || "").slice(0, 10);
    if (!dataNoIntervalo(data, inicio, fim)) return;
    classificar(montarItemMaterial(material, indice.porMaterialId.get(material.id)));
  });

  (obra.maoDeObra || []).forEach((item) => {
    const data = String(item.data_solicitacao || "").slice(0, 10);
    if (!dataNoIntervalo(data, inicio, fim)) return;
    classificar(montarItemMaoDeObra(item, indice.porMaoDeObraId.get(item.id)));
  });

  (obra.locacoes || []).forEach((item) => {
    const data = String(item.data_coleta || "").slice(0, 10);
    if (!dataNoIntervalo(data, inicio, fim)) return;
    classificar(montarItemLocacao(item, indice.porLocacaoId.get(item.id)));
  });

  indice.manuais
    .filter((item) => dataNoIntervalo(item.data, inicio, fim))
    .forEach((item) => {
      extratoSemana.push(montarItemExtratoManual(item));
    });

  const ordenarPorData = (a, b) => String(a.data).localeCompare(String(b.data));
  extratoSemana.sort(ordenarPorData);
  emEsperaSemana.sort(ordenarPorData);

  const totais = calcularTotais(extratoSemana, emEsperaSemana);
  const porCategoria = calcularPorCategoria(extratoSemana, emEsperaSemana);
  const graficos = montarDadosGraficos(extratoSemana);

  return {
    extratoSemana,
    emEsperaSemana,
    totais,
    porCategoria,
    graficos,
    semanaInicio,
    intervalo: { inicio, fim },
  };
}

export function financeiroSemanaTemDados(resumo) {
  if (!resumo) return false;
  return (
    (resumo.extratoSemana?.length || 0) +
      (resumo.emEsperaSemana?.length || 0) >
    0
  );
}

export function montarResumoFinanceiroConsolidado(resumo) {
  if (!financeiroSemanaTemDados(resumo)) return null;
  return {
    totais: resumo.totais,
    extratoCount: resumo.extratoSemana.length,
    emEsperaCount: resumo.emEsperaSemana.length,
    porCategoria: resumo.porCategoria,
    graficos: resumo.graficos,
  };
}

export function calcularResumosFinanceirosPorSemana(obra, semanas = []) {
  const mapa = {};
  semanas.forEach((semana) => {
    const resumo = classificarLancamentosObra(obra, semana.inicio);
    if (financeiroSemanaTemDados(resumo)) {
      mapa[semana.inicio] = resumo;
    }
  });
  return mapa;
}

export function contarSemanasComFinanceiro(obra, semanas = []) {
  return semanas.filter((semana) =>
    financeiroSemanaTemDados(
      classificarLancamentosObra(obra, semana.inicio),
    ),
  ).length;
}
