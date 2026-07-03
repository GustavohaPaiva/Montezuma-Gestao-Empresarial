import {
  osSecaoCabecalhoClass,
  osSecaoCabecalhoVkClass,
  osSecaoClass,
  osSecaoCorpoClass,
  osSecaoIconClass,
  osSecaoIconVkClass,
  osSecaoTituloClass,
  osSecaoTituloVkClass,
  osSecaoVkClass,
} from "../../pages/ordens-servico/ordensServicoUi";

export default function OrdemServicoSecaoPainel({
  titulo,
  descricao,
  icon,
  children,
  className = "",
  acoes = null,
  variant = "montezuma",
}) {
  const isVk = variant === "vogelkop";

  return (
    <section
      className={`${isVk ? osSecaoVkClass : osSecaoClass} ${className}`.trim()}
    >
      <div className={isVk ? osSecaoCabecalhoVkClass : osSecaoCabecalhoClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {icon ? (
              <span
                className={isVk ? osSecaoIconVkClass : osSecaoIconClass}
                aria-hidden
              >
                {icon}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3
                className={isVk ? osSecaoTituloVkClass : osSecaoTituloClass}
              >
                {titulo}
              </h3>
              {descricao ? (
                <p
                  className={
                    isVk
                      ? "mt-1 text-xs text-esc-muted sm:text-sm"
                      : "mt-1 text-xs text-text-muted sm:text-sm"
                  }
                >
                  {descricao}
                </p>
              ) : null}
            </div>
          </div>
          {acoes ? <div className="shrink-0">{acoes}</div> : null}
        </div>
      </div>
      <div className={osSecaoCorpoClass}>{children}</div>
    </section>
  );
}
