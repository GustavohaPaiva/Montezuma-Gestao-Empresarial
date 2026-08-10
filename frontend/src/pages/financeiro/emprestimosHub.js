import { TIPOS_MOVIMENTACAO_OBRA, labelObraResumo } from "../obras/detalhe/utils/obraCaixa";

/**
 * Resume empréstimos globais a partir de transferencia_saida
 * (evita double-count das entradas espelhadas).
 */
export function agregarEmprestimosHub(movimentacoes = []) {
  const map = new Map();
  let totalEmprestado = 0;
  let qtdMovimentacoes = 0;

  for (const mov of movimentacoes || []) {
    if (mov?.tipo !== TIPOS_MOVIMENTACAO_OBRA.transferencia_saida) continue;

    const valor = parseFloat(mov.valor) || 0;
    totalEmprestado += valor;
    qtdMovimentacoes += 1;

    const origemLabel = labelObraResumo(mov.obra || { id: mov.obra_id });
    const pessoa = String(mov.pessoa_contra || "").trim();
    const destinoLabel = pessoa
      ? pessoa
      : labelObraResumo(mov.obra_contra || { id: mov.obra_contra_id });
    const destinoKind = pessoa ? "pessoa" : "obra";
    const destinoKey = pessoa
      ? `pessoa:${pessoa.toLowerCase()}`
      : `obra:${mov.obra_contra_id ?? "—"}`;
    const key = `obra:${mov.obra_id}->${destinoKey}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        origemLabel,
        destinoLabel,
        destinoKind,
        valor: 0,
        qtd: 0,
        ultimaData: mov.data || null,
      });
    }

    const row = map.get(key);
    row.valor += valor;
    row.qtd += 1;
    if (mov.data && (!row.ultimaData || mov.data > row.ultimaData)) {
      row.ultimaData = mov.data;
    }
  }

  const itens = Array.from(map.values()).sort((a, b) => b.valor - a.valor);

  return {
    totalEmprestado,
    qtdRelacoes: itens.length,
    qtdMovimentacoes,
    itens,
  };
}
