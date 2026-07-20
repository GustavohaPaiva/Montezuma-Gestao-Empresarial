import { formatarMoeda } from "./formatters";

export const TIPOS_MOVIMENTACAO_OBRA = {
  entrada: "entrada",
  transferencia_entrada: "transferencia_entrada",
  transferencia_saida: "transferencia_saida",
};

export const LABEL_TIPO_MOVIMENTACAO = {
  entrada: "Entrada",
  transferencia_entrada: "Transferência recebida",
  transferencia_saida: "Transferência enviada",
};

export function valorAssinadoMovimentacao(mov) {
  const valor = parseFloat(mov?.valor) || 0;
  if (mov?.tipo === TIPOS_MOVIMENTACAO_OBRA.transferencia_saida) return -valor;
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

  for (const mov of lista) {
    const valor = parseFloat(mov?.valor) || 0;
    if (mov.tipo === TIPOS_MOVIMENTACAO_OBRA.entrada) {
      totalEntradas += valor;
    } else if (mov.tipo === TIPOS_MOVIMENTACAO_OBRA.transferencia_entrada) {
      totalTransferenciasRecebidas += valor;
    } else if (mov.tipo === TIPOS_MOVIMENTACAO_OBRA.transferencia_saida) {
      totalTransferenciasEnviadas += valor;
    }
  }

  const saldo =
    totalEntradas + totalTransferenciasRecebidas - totalTransferenciasEnviadas;

  return {
    saldo,
    totalEntradas,
    totalTransferenciasRecebidas,
    totalTransferenciasEnviadas,
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
