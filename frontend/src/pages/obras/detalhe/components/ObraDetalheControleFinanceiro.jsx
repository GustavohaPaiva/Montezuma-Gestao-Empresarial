import { useMemo } from "react";
import { ArrowLeftRight, Plus } from "lucide-react";
import TabelaSimples from "../../../../components/gerais/TabelaSimples";
import BaseButton from "../../../../components/gerais/BaseButton";
import {
  formatarDataBR,
  formatarMoeda,
} from "../utils/formatters";
import {
  LABEL_TIPO_MOVIMENTACAO,
  TIPOS_MOVIMENTACAO_OBRA,
  formatarValorMovimentacao,
  labelObraResumo,
  resumirCaixaObra,
} from "../utils/obraCaixa";

export default function ObraDetalheControleFinanceiro({
  movimentacoes = [],
  onNovaEntrada,
  onTransferir,
}) {
  const resumo = useMemo(
    () => resumirCaixaObra(movimentacoes),
    [movimentacoes],
  );

  const colunas = [
    "Data",
    "Tipo",
    "Descrição",
    "Obra relacionada",
    "Valor",
  ];

  const linhas = useMemo(
    () =>
      (movimentacoes || []).map((mov) => {
        const isSaida =
          mov.tipo === TIPOS_MOVIMENTACAO_OBRA.transferencia_saida;
        const valorCls = isSaida
          ? "font-semibold tabular-nums text-rose-700"
          : "font-semibold tabular-nums text-emerald-700";
        return [
          formatarDataBR(mov.data),
          LABEL_TIPO_MOVIMENTACAO[mov.tipo] || mov.tipo,
          mov.descricao?.trim() || "—",
          mov.obra_contra ? labelObraResumo(mov.obra_contra) : "—",
          <span key={`v-${mov.id}`} className={valorCls}>
            {formatarValorMovimentacao(mov)}
          </span>,
        ];
      }),
    [movimentacoes],
  );

  const cards = [
    {
      id: "saldo",
      label: "Saldo disponível",
      valor: resumo.saldo,
      className:
        resumo.saldo >= 0 ? "text-emerald-700" : "text-rose-700",
    },
    {
      id: "entradas",
      label: "Total de entradas",
      valor: resumo.totalEntradas,
      className: "text-text-primary",
    },
    {
      id: "recv",
      label: "Transferências recebidas",
      valor: resumo.totalTransferenciasRecebidas,
      className: "text-text-primary",
    },
    {
      id: "env",
      label: "Transferências enviadas",
      valor: resumo.totalTransferenciasEnviadas,
      className: "text-text-primary",
    },
  ];

  return (
    <div className="mb-6 w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
            Controle financeiro
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Caixa interno da obra: entradas e transferências entre obras.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <BaseButton
            type="button"
            onClick={onNovaEntrada}
            className="inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Nova entrada
          </BaseButton>
          <BaseButton
            type="button"
            variant="secondary"
            onClick={onTransferir}
            className="inline-flex items-center justify-center gap-1.5"
          >
            <ArrowLeftRight className="h-4 w-4" strokeWidth={2.25} />
            Transferir saldo
          </BaseButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-2xl border border-border-primary/35 bg-white p-4 shadow-[0_5px_20px_rgba(0,0,0,0.06)] sm:p-5"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
              {card.label}
            </p>
            <p
              className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${card.className}`}
            >
              R$ {formatarMoeda(card.valor)}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Histórico de movimentações
        </h3>
        {linhas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-primary/40 bg-white px-5 py-10 text-center text-sm text-text-muted">
            Nenhuma movimentação ainda. Lance uma entrada para iniciar o caixa
            desta obra.
          </div>
        ) : (
          <TabelaSimples
            variant="obraDetalhe"
            dense
            colunas={colunas}
            dados={linhas}
          />
        )}
      </div>
    </div>
  );
}
