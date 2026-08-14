import { formatarMoeda } from "./formatters";

export const TIPOS_MOVIMENTACAO_OBRA = {
  entrada: "entrada",
  transferencia_entrada: "transferencia_entrada",
  transferencia_saida: "transferencia_saida",
  saida_pagamento: "saida_pagamento",
};

export const LABEL_TIPO_MOVIMENTACAO = {
  entrada: "Entrada",
  transferencia_entrada: "Recebeu emprestado",
  transferencia_saida: "Emprestou",
  saida_pagamento: "Pagamento",
};

export function valorAssinadoMovimentacao(mov) {
  const valor = parseFloat(mov?.valor) || 0;
  if (
    mov?.tipo === TIPOS_MOVIMENTACAO_OBRA.transferencia_saida ||
    mov?.tipo === TIPOS_MOVIMENTACAO_OBRA.saida_pagamento
  ) {
    return -valor;
  }
  return valor;
}

export function calcularSaldoObra(movimentacoes = []) {
  return (movimentacoes || []).reduce(
    (acc, mov) => acc + valorAssinadoMovimentacao(mov),
    0,
  );
}

export function resumirCaixaObra(movimentacoes = []) {
  const lista = movimentacoes || [];
  let totalEntradas = 0;
  let totalTransferenciasRecebidas = 0;
  let totalTransferenciasEnviadas = 0;
  let totalSaidasPagamento = 0;

  for (const mov of lista) {
    const valor = parseFloat(mov?.valor) || 0;
    if (mov.tipo === TIPOS_MOVIMENTACAO_OBRA.entrada) {
      totalEntradas += valor;
    } else if (mov.tipo === TIPOS_MOVIMENTACAO_OBRA.transferencia_entrada) {
      totalTransferenciasRecebidas += valor;
    } else if (mov.tipo === TIPOS_MOVIMENTACAO_OBRA.transferencia_saida) {
      totalTransferenciasEnviadas += valor;
    } else if (mov.tipo === TIPOS_MOVIMENTACAO_OBRA.saida_pagamento) {
      totalSaidasPagamento += valor;
    }
  }

  const saldo =
    totalEntradas +
    totalTransferenciasRecebidas -
    totalTransferenciasEnviadas -
    totalSaidasPagamento;

  return {
    saldo,
    totalEntradas,
    totalTransferenciasRecebidas,
    totalTransferenciasEnviadas,
    totalSaidasPagamento,
  };
}

export function formatarValorMovimentacao(mov) {
  const assinado = valorAssinadoMovimentacao(mov);
  const prefixo = assinado >= 0 ? "+" : "−";
  return `${prefixo} R$ ${formatarMoeda(Math.abs(assinado))}`;
}

export function labelObraResumo(obra) {
  if (!obra) return "—";
  const cliente = obra.clientes?.nome || obra.cliente || "Obra";
  const local = obra.local ? ` · ${obra.local}` : "";
  return `${cliente}${local}`;
}

/**
 * Agrupa transferências por contraparte (obra, escritório ou pessoa).
 * líquido > 0 => a contraparte te deve (você emprestou mais)
 * líquido < 0 => você deve a ela (pegou emprestado mais)
 */
export function agregarEmprestimosPorContra(movimentacoes = []) {
  const map = new Map();

  for (const mov of movimentacoes || []) {
    if (
      mov.tipo !== TIPOS_MOVIMENTACAO_OBRA.transferencia_saida &&
      mov.tipo !== TIPOS_MOVIMENTACAO_OBRA.transferencia_entrada
    ) {
      continue;
    }

    const pessoa = String(mov.pessoa_contra || "").trim();
    const escritorioContraId = mov.escritorio_contra_id ?? null;
    const obraContraId = mov.obra_contra_id ?? mov.obra_contra?.id;

    let key;
    let rowBase;
    if (escritorioContraId) {
      key = `escritorio:${escritorioContraId}`;
      rowBase = {
        kind: "escritorio",
        id: escritorioContraId,
        label: pessoa || "Escritório",
        obra: null,
      };
    } else if (pessoa) {
      key = `pessoa:${pessoa.toLowerCase()}`;
      rowBase = {
        kind: "pessoa",
        id: pessoa,
        label: pessoa,
        obra: null,
      };
    } else if (obraContraId != null) {
      key = `obra:${obraContraId}`;
      rowBase = {
        kind: "obra",
        id: obraContraId,
        label: labelObraResumo(mov.obra_contra || { id: obraContraId }),
        obra: mov.obra_contra || { id: obraContraId },
      };
    } else {
      continue;
    }

    if (!map.has(key)) {
      map.set(key, {
        ...rowBase,
        key,
        emprestou: 0,
        pegouEmprestado: 0,
      });
    }
    const row = map.get(key);
    const valor = parseFloat(mov.valor) || 0;
    if (mov.tipo === TIPOS_MOVIMENTACAO_OBRA.transferencia_saida) {
      row.emprestou += valor;
    } else {
      row.pegouEmprestado += valor;
    }
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      liquido: row.emprestou - row.pegouEmprestado,
    }))
    .sort((a, b) => Math.abs(b.liquido) - Math.abs(a.liquido));
}

/** @deprecated Use agregarEmprestimosPorContra */
export function agregarEmprestimosPorObra(movimentacoes = []) {
  return agregarEmprestimosPorContra(movimentacoes)
    .filter((row) => row.kind === "obra")
    .map((row) => ({
      obraId: row.id,
      obra: row.obra,
      emprestou: row.emprestou,
      pegouEmprestado: row.pegouEmprestado,
      liquido: row.liquido,
      label: row.label,
    }));
}

export function tituloMovimentacao(mov) {
  const pessoa = String(mov?.pessoa_contra || "").trim();
  const obraLabel = mov.obra_contra ? labelObraResumo(mov.obra_contra) : null;
  const contraLabel = pessoa || obraLabel;

  switch (mov?.tipo) {
    case TIPOS_MOVIMENTACAO_OBRA.entrada:
      return mov.descricao?.trim() || "Entrada na conta";
    case TIPOS_MOVIMENTACAO_OBRA.saida_pagamento:
      return mov.descricao?.trim() || "Pagamento de extrato";
    case TIPOS_MOVIMENTACAO_OBRA.transferencia_saida:
      if (contraLabel) return `Emprestou para ${contraLabel}`;
      return "Emprestou para outra obra";
    case TIPOS_MOVIMENTACAO_OBRA.transferencia_entrada:
      if (contraLabel) return `Pegou emprestado de ${contraLabel}`;
      return "Recebeu emprestado de outra obra";
    default:
      return LABEL_TIPO_MOVIMENTACAO[mov?.tipo] || "Movimentação";
  }
}
