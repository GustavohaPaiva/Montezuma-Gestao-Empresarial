const NOME_MUROS = "Muros";

/** Pesos do catálogo completo (somam 100% com todas as etapas, exceto Demolição). */
export const PESOS_ETAPAS = {
  Demolição: 0,
  Infraestrutura: 8.68,
  Supraestrutura: 12.4,
  "Paredes e Painéis": 8.27,
  Muros: 7,
  Cobertura: 7.03,
  "Revestimentos externos": 7.86,
  "Revestimentos internos": 10.16,
  Hidráulica: 7.85,
  "Estrutura Elétrica": 2.32,
  "Primeira etapa de pintura": 2.32,
  "Assentamento de piso": 8.27,
  Esquadrias: 6.83,
  Pedras: 1.24,
  "Louças e metais": 4.5,
  "Final Elétrica": 1.6,
  "Final Pintura": 2.22,
  "Detalhes e limpeza final": 1.45,
};

function nomeEtapa(etapa) {
  return etapa?.nome || etapa?.titulo || "";
}

function progressoEtapa(etapa) {
  if (!etapa) return 0;
  if (String(etapa.status || "").toLowerCase() === "concluído") return 100;
  const valor = Number(etapa.progresso);
  if (!Number.isFinite(valor)) return 0;
  return Math.min(100, Math.max(0, valor));
}

function pesoDaEtapa(etapa) {
  const nome = nomeEtapa(etapa);
  if (Object.prototype.hasOwnProperty.call(PESOS_ETAPAS, nome)) {
    return PESOS_ETAPAS[nome];
  }
  return Number(etapa?.peso) || 0;
}

/**
 * Progresso da obra (0–100) ponderado pelos pesos das etapas que ela realmente tem.
 * Se faltar alguma etapa do catálogo, os pesos das restantes são redistribuídos
 * proporcionalmente para somar 100%.
 */
export function calcularProgressoPonderado(etapas) {
  if (!Array.isArray(etapas) || etapas.length === 0) return 0;

  const itens = etapas.map((etapa) => ({
    peso: pesoDaEtapa(etapa),
    progresso: progressoEtapa(etapa),
  }));

  const somaPesos = itens.reduce((acc, item) => acc + item.peso, 0);
  if (somaPesos <= 0) {
    const media =
      itens.reduce((acc, item) => acc + item.progresso, 0) / itens.length;
    return Math.min(100, Math.round(media));
  }

  const percentual = itens.reduce(
    (acc, item) => acc + (item.peso / somaPesos) * item.progresso,
    0,
  );
  return Math.min(100, Math.round(percentual));
}

function etapaConcluida(etapa) {
  if (!etapa) return false;
  const status = String(etapa.status || "").toLowerCase();
  return status === "concluído" || Number(etapa.progresso) === 100;
}

function etapaIniciada(etapa) {
  if (!etapa) return false;
  const status = String(etapa.status || "").toLowerCase();
  return (
    etapaConcluida(etapa) ||
    status === "em andamento" ||
    Number(etapa.progresso) > 0
  );
}

/** Insere "Muros" entre Paredes e Painéis e Cobertura, se ainda não existir. */
export function inserirEtapaMurosSeFaltar(etapas) {
  if (!Array.isArray(etapas) || etapas.length === 0) return etapas;
  if (etapas.some((e) => e?.nome === NOME_MUROS)) return etapas;

  const temVizinha = etapas.some(
    (e) => e?.nome === "Paredes e Painéis" || e?.nome === "Cobertura",
  );
  if (!temVizinha) return etapas;

  const paredes = etapas.find((e) => e?.nome === "Paredes e Painéis");
  const cobertura = etapas.find((e) => e?.nome === "Cobertura");
  const jaPassouDosMuros =
    etapaConcluida(paredes) && etapaIniciada(cobertura);

  const muro = {
    nome: NOME_MUROS,
    progresso: jaPassouDosMuros ? 100 : 0,
    status: jaPassouDosMuros ? "concluído" : "pendente",
    data_inicio: null,
    data_conclusao: jaPassouDosMuros
      ? paredes?.data_conclusao || null
      : null,
  };

  const idxParedes = etapas.findIndex((e) => e?.nome === "Paredes e Painéis");
  if (idxParedes !== -1) {
    return [
      ...etapas.slice(0, idxParedes + 1),
      muro,
      ...etapas.slice(idxParedes + 1),
    ];
  }

  const idxCobertura = etapas.findIndex((e) => e?.nome === "Cobertura");
  return [
    ...etapas.slice(0, idxCobertura),
    muro,
    ...etapas.slice(idxCobertura),
  ];
}
