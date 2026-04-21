import { Loader2, X } from "lucide-react";
import ModalPortal from "../gerais/ModalPortal";
import { ID_VOGELKOP } from "../../constants/escritorios";

export default function ModalConfirmacaoRecorrencia({
  isOpen,
  escritorioId,
  titulo,
  descricao,
  confirmLabelEvento = "Apenas este",
  confirmLabelFuturos = "Todos os futuros",
  loading = false,
  onClose,
  onConfirmEvento,
  onConfirmFuturos,
}) {
  if (!isOpen) return null;

  const temaClasse =
    escritorioId === ID_VOGELKOP ? "theme-vogelkop" : "theme-ybyoca";

  return (
    <ModalPortal>
      <div
        className={`${temaClasse} fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md`}
      >
        <div className="animate-premium-reveal relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-esc-card shadow-[0_0_40px_-15px_var(--color-esc-destaque)]">
          <div className="pointer-events-none absolute -top-16 -right-16 -z-10 h-52 w-52 rounded-full bg-esc-destaque/20 blur-[70px]" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 -z-10 h-52 w-52 rounded-full bg-esc-destaque/10 blur-[70px]" />

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h3 className="text-base font-bold text-esc-text">{titulo}</h3>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-esc-muted transition hover:bg-white/10 hover:text-esc-text disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4">
            <p className="text-sm text-esc-muted">{descricao}</p>
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-white/10 bg-white/[0.02] px-5 py-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-esc-muted transition hover:bg-white/5 hover:text-esc-text disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirmEvento}
              disabled={loading}
              className="rounded-xl border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-esc-text transition hover:bg-white/10 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processando...
                </span>
              ) : (
                confirmLabelEvento
              )}
            </button>
            <button
              type="button"
              onClick={onConfirmFuturos}
              disabled={loading}
              className="rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 py-2.5 text-sm font-bold text-esc-destaque transition hover:bg-esc-destaque/30 disabled:opacity-50"
            >
              {confirmLabelFuturos}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
