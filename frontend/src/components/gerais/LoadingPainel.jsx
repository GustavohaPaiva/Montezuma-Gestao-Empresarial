import { Loader2, Package } from "lucide-react";

/**
 * Painel de carregamento padrão do sistema (Obras, Processos, etc.).
 */
export default function LoadingPainel({
  titulo = "Carregando informações",
  descricao = "Aguarde um instante enquanto buscamos os dados.",
  icon = <Package className="h-7 w-7" strokeWidth={2} />,
  className = "",
  variant = "default",
}) {
  const isEscritorio = variant === "escritorio";

  if (isEscritorio) {
    return (
      <div
        className={`flex min-h-[42vh] w-full items-center justify-center px-4 py-16 ${className}`.trim()}
      >
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-esc-card/40 px-8 py-10 text-center backdrop-blur-md">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-esc-destaque/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-esc-destaque/5"
            aria-hidden
          />
          <div className="relative">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-esc-destaque/25 bg-esc-destaque/10 text-esc-destaque">
              {icon}
            </div>
            <Loader2
              className="mx-auto mb-5 h-10 w-10 animate-spin text-esc-destaque"
              strokeWidth={2.25}
              aria-hidden
            />
            <h3 className="text-lg font-bold tracking-tight text-esc-text sm:text-xl">
              {titulo}
            </h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-esc-muted">
              {descricao}
            </p>
            <div
              className="mx-auto mt-7 flex justify-center gap-1.5"
              role="presentation"
              aria-hidden
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-esc-destaque/75"
                  style={{ animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[42vh] w-full items-center justify-center px-4 py-16 ${className}`.trim()}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-primary/35 bg-white px-8 py-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-primary/[0.06]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-accent-primary/[0.04]"
          aria-hidden
        />
        <div className="relative">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-inner ring-1 ring-accent-primary/15">
            {icon}
          </div>
          <Loader2
            className="mx-auto mb-5 h-10 w-10 animate-spin text-accent-primary"
            strokeWidth={2.25}
            aria-hidden
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
            Montezuma
          </p>
          <h3 className="mt-1.5 text-lg font-bold tracking-tight text-text-primary sm:text-xl">
            {titulo}
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
            {descricao}
          </p>
          <div
            className="mx-auto mt-7 flex justify-center gap-1.5"
            role="presentation"
            aria-hidden
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-bounce rounded-full bg-accent-primary/75"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
