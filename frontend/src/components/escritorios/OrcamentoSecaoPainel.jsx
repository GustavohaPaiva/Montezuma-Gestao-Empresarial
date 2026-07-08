import {
  orcSecaoCabecalhoClass,
  orcSecaoClass,
  orcSecaoCorpoClass,
  orcSecaoDescricaoClass,
  orcSecaoIconClass,
  orcSecaoTituloClass,
} from "../../pages/escritorios/orcamentosUi";

export default function OrcamentoSecaoPainel({
  titulo,
  descricao,
  icon,
  children,
  className = "",
  acoes = null,
}) {
  return (
    <section className={`${orcSecaoClass} ${className}`.trim()}>
      <div className={orcSecaoCabecalhoClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {icon ? (
              <span className={orcSecaoIconClass} aria-hidden>
                {icon}
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className={orcSecaoTituloClass}>{titulo}</h3>
              {descricao ? (
                <p className={orcSecaoDescricaoClass}>{descricao}</p>
              ) : null}
            </div>
          </div>
          {acoes ? <div className="shrink-0">{acoes}</div> : null}
        </div>
      </div>
      <div className={orcSecaoCorpoClass}>{children}</div>
    </section>
  );
}
