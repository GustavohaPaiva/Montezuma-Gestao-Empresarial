import {
  isPago,
  isVencido,
  parseDataLocal,
} from "../../fornecedores/fornecedorFinanceiro";

export const BUCKET_IDS = {
  vencidos: "vencidos",
  proximaSemana: "proxima_semana",
  ateUmMes: "ate_um_mes",
  maisDeUmMes: "mais_de_um_mes",
};

export const BUCKET_ORDER = [
  BUCKET_IDS.vencidos,
  BUCKET_IDS.proximaSemana,
  BUCKET_IDS.ateUmMes,
  BUCKET_IDS.maisDeUmMes,
];

export const BUCKET_META = {
  [BUCKET_IDS.vencidos]: {
    id: BUCKET_IDS.vencidos,
    titulo: "Vencidos",
    descricao: "Pagamentos em atraso",
  },
  [BUCKET_IDS.proximaSemana]: {
    id: BUCKET_IDS.proximaSemana,
    titulo: "Próxima semana",
    descricao: "Vencem nos próximos 7 dias",
  },
  [BUCKET_IDS.ateUmMes]: {
    id: BUCKET_IDS.ateUmMes,
    titulo: "Até 1 mês",
    descricao: "Vencem entre 8 e 30 dias",
  },
  [BUCKET_IDS.maisDeUmMes]: {
    id: BUCKET_IDS.maisDeUmMes,
    titulo: "+1 mês",
    descricao: "Vencem em mais de 30 dias",
  },
};

function inicioDoDia(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function diasAteVencimento(item, hoje = new Date()) {
  const vencimento = parseDataLocal(item?.data_vencimento);
  if (!vencimento) return null;
  const ms = vencimento.getTime() - inicioDoDia(hoje).getTime();
  return Math.round(ms / 86_400_000);
}

/** Bucket de prioridade de um item em aberto. Null se pago ou sem vencimento. */
export function getBucketPrioridade(item, hoje = new Date()) {
  if (!item || isPago(item.status_financeiro)) return null;
  const dias = diasAteVencimento(item, hoje);
  if (dias == null) return null;
  if (dias < 0) return BUCKET_IDS.vencidos;
  if (dias <= 7) return BUCKET_IDS.proximaSemana;
  if (dias <= 30) return BUCKET_IDS.ateUmMes;
  return BUCKET_IDS.maisDeUmMes;
}

export function rankBucket(bucketId) {
  const idx = BUCKET_ORDER.indexOf(bucketId);
  return idx < 0 ? Number.POSITIVE_INFINITY : idx;
}

export function labelObraCliente(obra) {
  if (!obra) return "Obra desconhecida";
  const cliente = obra.cliente || "Cliente";
  const local = obra.local ? ` · ${obra.local}` : "";
  return `${cliente}${local}`;
}

/**
 * Agrupa materiais em aberto por fornecedor e posiciona cada card
 * no bucket do item mais urgente (menor data de vencimento).
 */
export function agregarFornecedoresKanban(materiais = [], hoje = new Date()) {
  const porFornecedor = new Map();

  for (const item of materiais || []) {
    if (isPago(item?.status_financeiro)) continue;
    const bucket = getBucketPrioridade(item, hoje);
    if (!bucket) continue;

    const fornecedorId = item.fornecedor_id ?? item.fornecedores?.id;
    if (fornecedorId == null) continue;

    const key = String(fornecedorId);
    if (!porFornecedor.has(key)) {
      porFornecedor.set(key, {
        id: fornecedorId,
        nome: item.fornecedores?.nome || "Fornecedor",
        itens: [],
        aPagar: 0,
        vencido: 0,
        proximaSemana: 0,
        bucketMaisUrgente: bucket,
        vencimentoMaisProximo: parseDataLocal(item.data_vencimento),
      });
    }

    const row = porFornecedor.get(key);
    const valor = parseFloat(item.valor) || 0;
    row.itens.push(item);
    row.aPagar += valor;

    if (bucket === BUCKET_IDS.vencidos) row.vencido += valor;
    if (bucket === BUCKET_IDS.proximaSemana) row.proximaSemana += valor;

    const venc = parseDataLocal(item.data_vencimento);
    if (
      venc &&
      (!row.vencimentoMaisProximo ||
        venc.getTime() < row.vencimentoMaisProximo.getTime())
    ) {
      row.vencimentoMaisProximo = venc;
      row.bucketMaisUrgente = bucket;
    } else if (rankBucket(bucket) < rankBucket(row.bucketMaisUrgente)) {
      row.bucketMaisUrgente = bucket;
    }
  }

  const colunas = Object.fromEntries(
    BUCKET_ORDER.map((id) => [id, []]),
  );

  for (const fornecedor of porFornecedor.values()) {
    fornecedor.qtdItens = fornecedor.itens.length;
    const col = fornecedor.bucketMaisUrgente;
    if (colunas[col]) colunas[col].push(fornecedor);
  }

  for (const id of BUCKET_ORDER) {
    colunas[id].sort((a, b) => {
      const ta = a.vencimentoMaisProximo?.getTime() ?? Number.POSITIVE_INFINITY;
      const tb = b.vencimentoMaisProximo?.getTime() ?? Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });
  }

  return colunas;
}

export function resumirKpisMateriais(materiais = [], hoje = new Date()) {
  const fornecedores = new Set();
  let aPagar = 0;
  let vencidosValor = 0;
  let vencidosQtd = 0;
  let proximaSemanaValor = 0;
  let proximaSemanaQtd = 0;

  for (const item of materiais || []) {
    if (isPago(item?.status_financeiro)) continue;
    const bucket = getBucketPrioridade(item, hoje);
    if (!bucket) continue;

    const fornecedorId = item.fornecedor_id ?? item.fornecedores?.id;
    if (fornecedorId != null) fornecedores.add(String(fornecedorId));

    const valor = parseFloat(item.valor) || 0;
    aPagar += valor;

    if (bucket === BUCKET_IDS.vencidos) {
      vencidosValor += valor;
      vencidosQtd += 1;
    } else if (bucket === BUCKET_IDS.proximaSemana) {
      proximaSemanaValor += valor;
      proximaSemanaQtd += 1;
    }
  }

  return {
    fornecedoresDebito: fornecedores.size,
    aPagar,
    vencidosValor,
    vencidosQtd,
    proximaSemanaValor,
    proximaSemanaQtd,
  };
}

export function ordenarItensPorPrioridade(materiais = [], hoje = new Date()) {
  return [...(materiais || [])]
    .filter((item) => {
      if (isPago(item?.status_financeiro)) return false;
      return getBucketPrioridade(item, hoje) != null;
    })
    .sort((a, b) => {
      const ba = getBucketPrioridade(a, hoje);
      const bb = getBucketPrioridade(b, hoje);
      const rankDiff = rankBucket(ba) - rankBucket(bb);
      if (rankDiff !== 0) return rankDiff;
      const ta =
        parseDataLocal(a.data_vencimento)?.getTime() ??
        Number.POSITIVE_INFINITY;
      const tb =
        parseDataLocal(b.data_vencimento)?.getTime() ??
        Number.POSITIVE_INFINITY;
      if (ta !== tb) return ta - tb;
      return String(a.id).localeCompare(String(b.id));
    });
}

export { isPago, isVencido, parseDataLocal };
