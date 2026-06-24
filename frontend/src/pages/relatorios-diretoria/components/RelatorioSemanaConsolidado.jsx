import BaseButton from "../../../components/gerais/BaseButton";
import {
  MODALIDADES_RELATORIO,
  conteudoObraTemItens,
  modalidadePorId,
  normalizarConteudo,
  normalizarConteudoObra,
} from "../relatoriosDiretoriaUtils";
import {
  relatorioProsaClass,
  relatorioSubpainelClass,
  themeModalidade,
} from "../relatoriosDiretoriaUi";
import RelatorioObraConsolidadoView from "./RelatorioObraConsolidadoView";

export default function RelatorioSemanaConsolidado({
  consolidado,
  onLancarModalidade,
}) {
  return (
    <div className="mt-4 space-y-3 border-t border-border-primary/20 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Relatório consolidado da semana
      </p>

      <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-3">
        {MODALIDADES_RELATORIO.map((mod) => {
          const lancamento = consolidado.porModalidade[mod.id];
          const theme = themeModalidade(mod.colorTheme);
          const Icon = mod.Icon;

          const temLancamentoObra =
            mod.id === "obra" &&
            lancamento &&
            conteudoObraTemItens(lancamento.conteudo);
          const temLancamentoTexto =
            mod.id !== "obra" && Boolean(lancamento);

          return (
            <div
              key={mod.id}
              className={`${relatorioSubpainelClass} ${theme.border}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${theme.icon}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {mod.label}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {mod.descricao}
                  </p>
                </div>
              </div>

              {mod.id === "obra" ? (
                temLancamentoObra ? (
                  <div className="space-y-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${theme.badge}`}
                    >
                      Lançado
                    </span>
                    <RelatorioObraConsolidadoView
                      topicos={
                        normalizarConteudoObra(lancamento.conteudo).topicos
                      }
                    />
                    <BaseButton
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onLancarModalidade?.(mod.id, lancamento)
                      }
                    >
                      Editar
                    </BaseButton>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-text-muted">
                      Nenhum lançamento nesta modalidade.
                    </p>
                    <BaseButton
                      variant="primary"
                      size="sm"
                      onClick={() => onLancarModalidade?.(mod.id, null)}
                    >
                      Lançar Obra
                    </BaseButton>
                  </div>
                )
              ) : temLancamentoTexto ? (
                <div className="space-y-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${theme.badge}`}
                  >
                    Lançado
                  </span>
                  <p className={`whitespace-pre-wrap ${relatorioProsaClass}`}>
                    {normalizarConteudo(lancamento.conteudo).observacoes ||
                      "Sem observações registradas."}
                  </p>
                  <BaseButton
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onLancarModalidade?.(mod.id, lancamento)
                    }
                  >
                    Editar
                  </BaseButton>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-text-muted">
                    Nenhum lançamento nesta modalidade.
                  </p>
                  <BaseButton
                    variant="primary"
                    size="sm"
                    onClick={() => onLancarModalidade?.(mod.id, null)}
                  >
                    Lançar {modalidadePorId(mod.id)?.label}
                  </BaseButton>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
