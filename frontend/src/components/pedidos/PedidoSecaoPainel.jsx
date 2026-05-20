import {
  pedidoLeadingIconClass,
  pedidoSecaoCabecalhoClass,
  pedidoSecaoClass,
  pedidoSecaoCorpoClass,
  pedidoSecaoDescricaoClass,
  pedidoSecaoIconClass,
  pedidoSecaoTituloClass,
} from "./pedidosUi";

/**
 * Secção visual padrão do módulo de pedidos.
 * @param {{
 *   titulo: string,
 *   descricao?: string,
 *   icon?: import('react').ReactNode,
 *   iconTheme?: string,
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export default function PedidoSecaoPainel({
  titulo,
  descricao,
  icon,
  iconTheme = "primary",
  children,
  className = "",
}) {
  return (
    <section className={`${pedidoSecaoClass} ${className}`.trim()}>
      <div className={pedidoSecaoCabecalhoClass}>
        <div className="flex items-start gap-3">
          {icon ? (
            <span
              className={`${pedidoSecaoIconClass} ${pedidoLeadingIconClass(iconTheme)}`}
            >
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h3 className={pedidoSecaoTituloClass}>{titulo}</h3>
            {descricao ? (
              <p className={pedidoSecaoDescricaoClass}>{descricao}</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className={pedidoSecaoCorpoClass}>{children}</div>
    </section>
  );
}
