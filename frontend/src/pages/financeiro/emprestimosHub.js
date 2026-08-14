import { TIPOS_MOVIMENTACAO_OBRA, labelObraResumo } from "../obras/detalhe/utils/obraCaixa";
import { enriquecerEmprestimo } from "./emprestimoLabels";

/**
 * Resume empréstimos globais a partir de transferencia_saida
 * (evita double-count das entradas espelhadas).
 * @deprecated Hub passa a usar agregarEmprestimosLedger
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
    const escritorioContraId = mov.escritorio_contra_id ?? null;
    const destinoLabel = pessoa
      ? pessoa
      : labelObraResumo(mov.obra_contra || { id: mov.obra_contra_id });
    const destinoKind = escritorioContraId
      ? "escritorio"
      : pessoa
        ? "pessoa"
        : "obra";
    const destinoKey = escritorioContraId
      ? `escritorio:${escritorioContraId}`
      : pessoa
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

export function agregarEmprestimosLedger(emprestimos = []) {
  const itens = (emprestimos || [])
    .map((row) => enriquecerEmprestimo(row))
    .filter((row) => (parseFloat(row.saldo_aberto) || 0) > 1e-9)
    .map((row) => ({
      key: row.id,
      origemLabel: row.origemLabel,
      destinoLabel: row.destinoLabel,
      destinoKind: row.destino_tipo,
      valor: parseFloat(row.saldo_aberto) || 0,
      original: parseFloat(row.valor_original) || 0,
      qtd: 1,
      ultimaData: row.data || null,
    }))
    .sort((a, b) => b.valor - a.valor);

  return {
    totalEmprestado: itens.reduce((acc, i) => acc + i.valor, 0),
    qtdRelacoes: itens.length,
    qtdMovimentacoes: itens.length,
    itens,
  };
}
