import { CheckCircle2, Clock, FileText } from "lucide-react";
import { OS_STATUS_LABEL } from "../../constants/ordemServico";
import { formatarDataListaOS } from "./ordensServicoUtils";

export default function OrdemServicoCard({ os, onClick, variant = "montezuma" }) {
  const isVk = variant === "vogelkop";
  const concluida = os.status === "concluida";
  const responsavelNome =
    os.responsavel?.nome || (os.responsavel_id ? "Designado" : "Somente PDF");

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isVk
          ? "group w-full cursor-pointer rounded-xl border border-white/10 bg-esc-card/60 p-4 text-left shadow-sm backdrop-blur-md transition hover:-translate-y-0.5 hover:border-esc-destaque/40 hover:shadow-[0_0_32px_-8px_var(--color-esc-destaque)]"
          : "group w-full cursor-pointer rounded-xl border border-border-primary/30 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent-primary/40 hover:shadow-md"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={
              isVk
                ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-esc-destaque/25 bg-esc-destaque/10 text-esc-destaque"
                : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-soft text-accent-primary"
            }
          >
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p
              className={
                isVk
                  ? "truncate text-sm font-semibold text-esc-text"
                  : "truncate text-sm font-semibold text-text-primary"
              }
            >
              OS Nº {os.numero}
              {os.cliente_nome ? ` · ${os.cliente_nome}` : ""}
            </p>
            <p
              className={
                isVk
                  ? "mt-0.5 text-xs text-esc-muted"
                  : "mt-0.5 text-xs text-text-muted"
              }
            >
              Responsável: {responsavelNome}
            </p>
            <p
              className={
                isVk
                  ? "mt-1 text-[11px] text-esc-muted"
                  : "mt-1 text-[11px] text-text-muted"
              }
            >
              Emissão: {formatarDataListaOS(os.data_emissao)}
              {os.data_entrega_prevista
                ? ` · Entrega: ${formatarDataListaOS(os.data_entrega_prevista)}`
                : ""}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            concluida
              ? isVk
                ? "border border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : isVk
                ? "border border-amber-400/30 bg-amber-400/15 text-amber-300"
                : "border border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {concluida ? (
            <CheckCircle2 className="h-3 w-3" aria-hidden />
          ) : (
            <Clock className="h-3 w-3" aria-hidden />
          )}
          {OS_STATUS_LABEL[os.status] || os.status}
        </span>
      </div>
    </button>
  );
}
