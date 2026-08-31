import { useEffect } from "react";
import { Loader2, ReceiptText, X } from "lucide-react";
import ModalPortal from "../gerais/ModalPortal";
import { formatarDataBR, formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { homeDictionary } from "../../constants/dictionaries";
import { somarLancamentos } from "../../pages/financeiro/historicoLancamentos";

const hub = homeDictionary.financeiroHub;

const STATUS_CLASS = {
  pago: "border-emerald-200 bg-emerald-50 text-emerald-800",
  aberto: "border-amber-200 bg-amber-50 text-amber-900",
  vencido: "border-rose-200 bg-rose-50 text-rose-800",
};

function valorClass(item) {
  if (item?.sentido === "entrada") return "text-emerald-700";
  if (item?.sentido === "saida") return "text-rose-700";
  return "text-text-primary";
}

function prefixoValor(item) {
  if (item?.sentido === "entrada") return "+ ";
  if (item?.sentido === "saida") return "− ";
  return "";
}

export default function ModalHistoricoLancamentos({
  isOpen,
  onClose,
  titulo = "Histórico",
  subtitulo = "",
  itens = [],
  loading = false,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lista = Array.isArray(itens) ? itens : [];
  const total = somarLancamentos(lista);

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="historico-lancamentos-titulo"
          className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border-primary/35 px-5 py-4">
            <div className="min-w-0">
              <h2
                id="historico-lancamentos-titulo"
                className="truncate text-base font-bold tracking-tight text-text-primary sm:text-lg"
              >
                {titulo}
              </h2>
              {subtitulo ? (
                <p className="mt-0.5 text-sm tabular-nums text-text-muted">
                  {subtitulo}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] text-text-muted transition hover:bg-white hover:text-text-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-text-muted">
                <Loader2 className="h-6 w-6 animate-spin text-accent-primary" />
                <p className="text-sm">Carregando lançamentos…</p>
              </div>
            ) : lista.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                <ReceiptText
                  className="mb-3 h-8 w-8 text-text-muted/60"
                  aria-hidden
                />
                <p className="text-sm font-medium text-text-primary">
                  {hub.historicoVazio}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border-primary/25">
                {lista.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p
                        className="truncate text-sm font-semibold text-text-primary"
                        title={item.titulo}
                      >
                        {item.titulo}
                      </p>
                      {item.detalhe ? (
                        <p
                          className="mt-0.5 truncate text-xs text-text-muted"
                          title={item.detalhe}
                        >
                          {item.detalhe}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {item.status ? (
                          <span
                            className={`inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${
                              STATUS_CLASS[item.statusTom] ||
                              "border-slate-200 bg-slate-50 text-slate-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        ) : null}
                        {item.data ? (
                          <span className="text-[11px] tabular-nums text-text-muted">
                            {formatarDataBR(item.data)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold tabular-nums ${valorClass(item)}`}
                    >
                      {prefixoValor(item)}R$ {formatarMoeda(item.valor)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!loading ? (
            <div className="flex items-center justify-between gap-3 border-t border-border-primary/35 bg-[#FAFAFA] px-5 py-3">
              <span className="text-xs font-medium text-text-muted">
                {hub.historicoLancamentos(lista.length)}
              </span>
              <span className="text-sm font-bold tabular-nums text-text-primary">
                {hub.historicoTotal}: R$ {formatarMoeda(total)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </ModalPortal>
  );
}
