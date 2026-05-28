import {
  projecaoLeadingIconClass,
  projecaoSecaoCabecalhoClass,
  projecaoSecaoClass,
  projecaoSecaoCorpoClass,
  projecaoSecaoIconClass,
  projecaoSecaoTituloClass,
} from "../../pages/projecoes/projecoesUi";

/**
 * Painel de seção do módulo Projeções (não usar PedidoSecaoPainel).
 */
export default function ProjecaoSecaoPainel({
  titulo,
  icon,
  iconTheme = "primary",
  children,
  className = "",
  acoes = null,
}) {
  return (
    <section className={`${projecaoSecaoClass} ${className}`.trim()}>
      <div className={projecaoSecaoCabecalhoClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {icon ? (
              <span
                className={`${projecaoSecaoIconClass} ${projecaoLeadingIconClass(iconTheme)}`}
              >
                {icon}
              </span>
            ) : null}
            <div className="min-w-0  flex-1">
              <h3 className={projecaoSecaoTituloClass}>{titulo}</h3>
            </div>
          </div>
          {acoes ? <div className="shrink-0">{acoes}</div> : null}
        </div>
      </div>
      <div className={projecaoSecaoCorpoClass}>{children}</div>
    </section>
  );
}
