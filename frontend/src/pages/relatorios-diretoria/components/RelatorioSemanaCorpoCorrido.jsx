import {
  MODALIDADES_RELATORIO,
  modalidadeEstaPreenchida,
  normalizarConteudo,
  normalizarConteudoObra,
} from "../relatoriosDiretoriaUtils";
import {
  relatorioCorridoVazioClass,
  relatorioDocumentoSecaoClass,
  relatorioDocumentoSecaoHeaderClass,
  relatorioProsaClass,
  themeModalidade,
} from "../relatoriosDiretoriaUi";
import RelatorioFinanceiroDetalhes from "./RelatorioFinanceiroDetalhes";
import RelatorioFinanceiroResumo from "./RelatorioFinanceiroResumo";
import RelatorioObraConsolidadoView from "./RelatorioObraConsolidadoView";

function SecaoModulo({ mod, children }) {
  const theme = themeModalidade(mod.colorTheme);
  const Icon = mod.Icon;

  return (
    <section className={relatorioDocumentoSecaoClass}>
      <div className={relatorioDocumentoSecaoHeaderClass}>
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.icon}`}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-text-primary">
              {mod.label}
            </h3>
            <p className="mt-0.5 text-xs text-text-muted">{mod.descricao}</p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${theme.badge}`}
        >
          Lançado
        </span>
      </div>

      <div className="mt-1">{children}</div>
    </section>
  );
}

export default function RelatorioSemanaCorpoCorrido({ consolidado }) {
  const porModalidade = consolidado?.porModalidade || {};
  const financeiroResumo = consolidado?.financeiroResumo;

  const temConteudo = MODALIDADES_RELATORIO.some((mod) =>
    modalidadeEstaPreenchida(
      mod.id,
      porModalidade[mod.id],
      financeiroResumo,
    ),
  );

  if (!temConteudo) {
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
    <>
      {MODALIDADES_RELATORIO.map((mod) => {
        const lancamento = porModalidade[mod.id];
        const preenchido = modalidadeEstaPreenchida(
          mod.id,
          lancamento,
          financeiroResumo,
        );
        if (!preenchido) return null;

        if (mod.id === "obra") {
          const { topicos } = normalizarConteudoObra(lancamento.conteudo);
          return (
            <SecaoModulo key={mod.id} mod={mod}>
              <RelatorioObraConsolidadoView topicos={topicos} layout="grid" />
            </SecaoModulo>
          );
        }

        if (mod.id === "financeiro") {
          return (
            <SecaoModulo key={mod.id} mod={mod}>
              <RelatorioFinanceiroResumo
                totais={financeiroResumo.totais}
                porCategoria={financeiroResumo.porCategoria}
              />
              <RelatorioFinanceiroDetalhes
                extratoSemana={financeiroResumo.extratoSemana}
                emEsperaSemana={financeiroResumo.emEsperaSemana}
              />
            </SecaoModulo>
          );
        }

        const texto =
          normalizarConteudo(lancamento.conteudo).observacoes?.trim() ||
          "Sem observações registradas.";

        return (
          <SecaoModulo key={mod.id} mod={mod}>
            <p className={`whitespace-pre-wrap ${relatorioProsaClass}`}>
              {texto}
            </p>
          </SecaoModulo>
        );
      })}
    </>
  );
}
