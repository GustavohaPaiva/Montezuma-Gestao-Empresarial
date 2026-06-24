import { formatarPrazoObra } from "../relatoriosDiretoriaUtils";
import {
  relatorioCorridoBlocoClass,
  relatorioCorridoCorpoClass,
  relatorioCorridoItemClass,
  relatorioCorridoListaClass,
  relatorioCorridoPrazoClass,
  relatorioCorridoProsaClass,
  relatorioCorridoTituloClass,
  relatorioCorridoVazioClass,
} from "../relatoriosDiretoriaUi";
import RelatorioFinanceiroConsolidado from "./RelatorioFinanceiroConsolidado";

export default function RelatorioSemanaCorpoCorrido({ blocos = [] }) {
  if (!blocos.length) {
    return (
      <div className={relatorioCorridoVazioClass}>
        <p className="text-sm font-medium text-text-primary">
          Nenhum conteúdo lançado para esta semana
        </p>
        <p className="mt-2 text-xs text-text-muted">
          Use &quot;Novo lançamento&quot; no topo da página para registrar o
          relatório.
        </p>
      </div>
    );
  }

  return (
    <div className={relatorioCorridoCorpoClass}>
      {blocos.map((bloco) => (
        <section key={bloco.id} className={relatorioCorridoBlocoClass}>
          {bloco.tipo === "financeiro" ? (
            <RelatorioFinanceiroConsolidado
              resumo={{
                totais: bloco.resumo?.totais,
                extratoCount: bloco.resumo?.extratoSemana?.length || 0,
                emEsperaCount: bloco.resumo?.emEsperaSemana?.length || 0,
              }}
            />
          ) : (
            <>
              <h3 className={relatorioCorridoTituloClass}>{bloco.titulo}</h3>

              {bloco.tipo === "itens" ? (
                <ol className={relatorioCorridoListaClass}>
                  {bloco.itens.map((item) => (
                    <li key={item.id} className={relatorioCorridoItemClass}>
                      <p className="whitespace-pre-wrap">{item.texto}</p>
                      {item.prazo ? (
                        <p className={relatorioCorridoPrazoClass}>
                          Prazo: {formatarPrazoObra(item.prazo)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={relatorioCorridoProsaClass}>{bloco.texto}</p>
              )}
            </>
          )}
        </section>
      ))}
    </div>
  );
}
