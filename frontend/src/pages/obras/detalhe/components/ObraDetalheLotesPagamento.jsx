import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Trash2,
  Wallet,
} from "lucide-react";
import ButtonDefault from "../../../../components/gerais/ButtonDefault";
import { formatarDataBR, formatarMoeda } from "../utils/formatters";
import {
  classesStatusLote,
  isExtratoPago,
  labelStatusLote,
  labelsExtratoFinanceiro,
  loteEstaAberto,
} from "../utils/lotesPagamentoUtils";

export default function ObraDetalheLotesPagamento({
  lotes = [],
  relatorioExtrato = [],
  somenteLeitura = false,
  onMarcarPago,
  onReabrir,
  onGerarPdf,
  onStatusItemChange,
  onRemoverItem,
  processandoId = null,
  processandoItemId = null,
}) {
  const [expandidos, setExpandidos] = useState(() => new Set());

  const extratoPorId = useMemo(() => {
    const map = new Map();
    (relatorioExtrato || []).forEach((item) => map.set(item.id, item));
    return map;
  }, [relatorioExtrato]);

  const toggleExpandido = (loteId) => {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(loteId)) next.delete(loteId);
      else next.add(loteId);
      return next;
    });
  };

  if (!lotes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border-primary/55 bg-[#FAFAFA] px-4 py-8 text-center">
        <Wallet className="mx-auto mb-2 h-8 w-8 text-text-muted" />
        <p className="text-sm font-semibold text-text-primary">
          {labelsExtratoFinanceiro.nenhumExtratoPagamento}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {labelsExtratoFinanceiro.hintGerarExtrato}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {lotes.map((lote) => {
        const aberto = loteEstaAberto(lote.status);
        const expandido = expandidos.has(lote.id);
        const itens = lote.itens || [];
        const processando = processandoId === lote.id;

        return (
          <article
            key={lote.id}
            className="rounded-2xl border border-border-primary/45 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">
                    {labelsExtratoFinanceiro.numero(lote.numero)}
                  </h3>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${classesStatusLote(lote.status)}`}
                  >
                    {labelStatusLote(lote.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {formatarDataBR(lote.data_criacao)} · {itens.length} item
                  {itens.length === 1 ? "" : "s"} · R${" "}
                  {formatarMoeda(lote.total)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleExpandido(lote.id)}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-border-primary/45 bg-[#FAFAFA] px-3 text-xs font-semibold text-text-primary"
                >
                  {expandido ? (
                    <>
                      Ocultar <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Ver itens <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
                <ButtonDefault
                  type="button"
                  onClick={() => onGerarPdf?.(lote)}
                  className="!h-9 !rounded-xl !border !border-border-primary/45 !bg-white !px-3 !text-xs !font-semibold !text-text-primary hover:!bg-[#FAFAFA]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    PDF
                  </span>
                </ButtonDefault>
                {!somenteLeitura && aberto ? (
                  <ButtonDefault
                    type="button"
                    disabled={processando}
                    onClick={() => onMarcarPago?.(lote)}
                    className="!h-9 !rounded-xl !border !border-emerald-500/30 !bg-emerald-500/12 !px-3 !text-xs !font-semibold !text-emerald-800 hover:!bg-emerald-500/18"
                  >
                    {labelsExtratoFinanceiro.marcarExtratoComoPago}
                  </ButtonDefault>
                ) : null}
                {!somenteLeitura && lote.status === "pago" ? (
                  <ButtonDefault
                    type="button"
                    disabled={processando}
                    onClick={() => onReabrir?.(lote)}
                    className="!h-9 !rounded-xl !border !border-amber-500/30 !bg-amber-500/10 !px-3 !text-xs !font-semibold !text-amber-900 hover:!bg-amber-500/16"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <RotateCcw className="h-4 w-4" />
                      {labelsExtratoFinanceiro.reabrirExtrato}
                    </span>
                  </ButtonDefault>
                ) : null}
              </div>
            </div>

            {expandido ? (
              <ul className="mt-3 space-y-2 border-t border-border-primary/30 pt-3">
                {itens.map((item) => {
                  const extrato = extratoPorId.get(item.extrato_id);
                  const statusFinanceiro =
                    extrato?.status_financeiro || "Aguardando pagamento";
                  const itemProcessando = processandoItemId === item.id;

                  return (
                    <li
                      key={item.id}
                      className="flex flex-col gap-2 rounded-xl bg-[#FAFAFA] px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1 uppercase text-text-primary">
                        {extrato?.descricao || "Item removido do extrato"}
                        <span className="mt-0.5 block normal-case text-text-muted">
                          {extrato?.tipo || "—"} · R${" "}
                          {formatarMoeda(item.valor)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {somenteLeitura ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                              isExtratoPago(statusFinanceiro)
                                ? "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30"
                                : "bg-amber-500/15 text-amber-900 ring-amber-400/35"
                            }`}
                          >
                            {statusFinanceiro}
                          </span>
                        ) : (
                          <label
                            className="inline-flex items-center gap-1.5 text-text-muted"
                            title={
                              isExtratoPago(statusFinanceiro)
                                ? "Marcar como pendente"
                                : "Marcar como pago"
                            }
                          >
                            <input
                              type="checkbox"
                              checked={isExtratoPago(statusFinanceiro)}
                              disabled={itemProcessando}
                              onChange={() =>
                                onStatusItemChange?.(
                                  lote,
                                  item,
                                  isExtratoPago(statusFinanceiro)
                                    ? "Aguardando pagamento"
                                    : "Pago",
                                )
                              }
                              className="h-[18px] w-[18px] cursor-pointer accent-check-accent disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <span className="text-[11px] font-semibold">
                              Pago
                            </span>
                          </label>
                        )}

                        {!somenteLeitura && aberto ? (
                          <button
                            type="button"
                            title={
                              labelsExtratoFinanceiro.removerDoExtratoSemAlterarStatus
                            }
                            disabled={itemProcessando || processando}
                            onClick={() => onRemoverItem?.(lote, item)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200/70 bg-rose-50 text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
