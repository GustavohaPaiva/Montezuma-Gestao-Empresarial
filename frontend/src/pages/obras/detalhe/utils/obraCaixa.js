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
 * Agrupa transferências por obra relacionada (empréstimos).
 * líquido > 0 => a outra obra te deve (você emprestou mais)
 * líquido < 0 => você deve a ela (pegou emprestado mais)
 */
export function agregarEmprestimosPorObra(movimentacoes = []) {
  const map = new Map();

  for (const mov of movimentacoes || []) {
    if (
      mov.tipo !== TIPOS_MOVIMENTACAO_OBRA.transferencia_saida &&
      mov.tipo !== TIPOS_MOVIMENTACAO_OBRA.transferencia_entrada
    ) {
      continue;
    }
    const contraId = mov.obra_contra_id ?? mov.obra_contra?.id;
    if (contraId == null) continue;

    const key = String(contraId);
    if (!map.has(key)) {
      map.set(key, {
        obraId: contraId,
        obra: mov.obra_contra || { id: contraId },
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
      label: labelObraResumo(row.obra),
    }))
    .sort((a, b) => Math.abs(b.liquido) - Math.abs(a.liquido));
}

export function tituloMovimentacao(mov) {
  const obraLabel = mov.obra_contra ? labelObraResumo(mov.obra_contra) : null;
  switch (mov?.tipo) {
    case TIPOS_MOVIMENTACAO_OBRA.entrada:
      return mov.descricao?.trim() || "Entrada na conta";
    case TIPOS_MOVIMENTACAO_OBRA.saida_pagamento:
      return mov.descricao?.trim() || "Pagamento de extrato";
    case TIPOS_MOVIMENTACAO_OBRA.transferencia_saida:
      return obraLabel ? `Emprestou para ${obraLabel}` : "Emprestou para outra obra";
    case TIPOS_MOVIMENTACAO_OBRA.transferencia_entrada:
      return obraLabel
        ? `Pegou emprestado de ${obraLabel}`
        : "Recebeu emprestado de outra obra";
    default:
      return LABEL_TIPO_MOVIMENTACAO[mov?.tipo] || "Movimentação";
  }
}
