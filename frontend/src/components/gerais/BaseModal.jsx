import ModalPortal from "./ModalPortal";

const sizeToClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  /** Largura máxima padrão para formulários “full width” (viewport menos padding) */
  full: "max-w-[min(100vw-2rem,64rem)]",
};

/**
 * Modal base com respiro e tipografia alinhada ao design system.
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  contentPaddingClass = "p-6 sm:p-8",
}) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className={[
            "w-full rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50",
            sizeToClass[size] || sizeToClass.md,
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 px-6 py-4 sm:px-8 sm:py-5">
            <h2 className="text-left text-lg font-bold uppercase tracking-tight text-slate-800 sm:text-xl">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              aria-label="Fechar"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>
          <div
            className={[
              "text-left text-slate-800 tracking-tight",
              contentPaddingClass,
            ].join(" ")}
          >
            {children}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
