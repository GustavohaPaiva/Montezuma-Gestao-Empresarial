import {
  TOPICOS_RELATORIO_OBRA,
  formatarPrazoObra,
  ordenarItensObra,
} from "../relatoriosDiretoriaUtils";
import {
  relatorioAutoFitGridClass,
  relatorioItemLeituraClass,
  relatorioItemListaClass,
  relatorioObraItemPrazoChipClass,
  relatorioTopicoSecaoClass,
  relatorioTopicoStackClass,
  relatorioTopicoTituloTextoClass,
} from "../relatoriosDiretoriaUi";

export default function RelatorioObraConsolidadoView({
  topicos,
  layout = "stack",
}) {
  const topicosPreenchidos = TOPICOS_RELATORIO_OBRA.map((topico) => ({
    topico,
    itens: ordenarItensObra(topicos?.[topico.id] || []),
  })).filter(({ itens }) => itens.length > 0);

  if (topicosPreenchidos.length === 0) return null;

  const containerClass =
    layout === "grid" ? relatorioAutoFitGridClass : relatorioTopicoStackClass;

  return (
    <div className={containerClass}>
      {topicosPreenchidos.map(({ topico, itens }) => {
        const conteudo = (
          <>
            <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-border-primary/15 pb-2">
              <h4 className={relatorioTopicoTituloTextoClass}>{topico.label}</h4>
              <span className="shrink-0 text-[11px] text-text-muted">
                {itens.length} item{itens.length !== 1 ? "s" : ""}
              </span>
            </div>

            <ul className={relatorioItemListaClass}>
              {itens.map((item) => (
                <li key={item.id} className={relatorioItemLeituraClass}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                    {item.texto}
                  </p>
                  {item.prazo ? (
                    <div className="mt-2 flex justify-end">
                      <span className={relatorioObraItemPrazoChipClass}>
                        Prazo: {formatarPrazoObra(item.prazo)}
                      </span>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        );

        if (layout === "grid") {
          return (
            <section
              key={topico.id}
              className={`${relatorioTopicoSecaoClass} p-4 sm:p-5`}
            >
              {conteudo}
            </section>
          );
        }

        return <section key={topico.id}>{conteudo}</section>;
      })}
    </div>
  );
}
