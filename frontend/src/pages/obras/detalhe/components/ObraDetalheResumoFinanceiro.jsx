import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatarMoeda } from "../utils/formatters";

export default function ObraDetalheResumoFinanceiro({
  totais,
  dataGrafico,
  categoriaAtiva,
  setCategoriaAtiva,
  toggleCategoria,
}) {
  return (
    <div
      id="#financeiro"
      className="relative mb-6 w-full overflow-hidden rounded-2xl border border-border-primary/35 bg-white p-5 shadow-[0_5px_20px_rgba(0,0,0,0.08)] sm:p-6 md:p-7"
    >
      <h2 className="mb-5 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
        Resumo financeiro
      </h2>
      <div
        className={`flex flex-col gap-6 transition-all duration-700 ease-in-out md:flex-row md:items-stretch md:gap-8 ${categoriaAtiva ? "md:min-h-[320px]" : "md:min-h-[280px]"}`}
      >
        <div
          className={`flex min-h-0 flex-col transition-all duration-700 ease-in-out ${categoriaAtiva ? "w-full justify-between md:w-[60%]" : "w-full justify-center md:w-1/2 md:items-center"}`}
        >
          <div
            className={`w-full overflow-hidden transition-all duration-700 ease-in-out ${categoriaAtiva ? "mb-4 max-h-[280px] opacity-100" : "max-h-0 opacity-0"}`}
          >
            {categoriaAtiva &&
              (() => {
                const ativo = dataGrafico.find((d) => d.name === categoriaAtiva);
                return (
                  <div className="h-auto rounded-2xl border border-border-primary/30 bg-[#FAFAFA] p-4 shadow-inner sm:p-5">
                    <h3 className="mb-2 text-lg font-bold uppercase tracking-wide text-text-primary">
                      Visão: {ativo.name}
                    </h3>
                    <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:gap-3">
                      <span
                        className="text-3xl font-bold tabular-nums sm:text-4xl"
                        style={{ color: ativo.color }}
                      >
                        R$ {formatarMoeda(ativo.value)}
                      </span>
                      <span className="mb-0.5 text-sm font-medium text-text-muted">
                        ({ativo.percentual}% do custo total da obra)
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-text-muted">
                      Este painel consolida todos os gastos referentes a{" "}
                      <strong className="font-semibold text-text-primary">
                        {ativo.name.toLowerCase()}
                      </strong>
                      . Até o momento, foram registrados{" "}
                      <strong className="font-semibold text-text-primary">
                        {ativo.qtd}
                      </strong>{" "}
                      lançamentos.
                    </p>
                  </div>
                );
              })()}
          </div>

          <div
            className={`transition-all duration-700 ease-in-out ${categoriaAtiva ? "h-[140px] w-[140px] shrink-0 self-start" : "flex h-[240px] w-full min-h-[240px] justify-center md:h-[280px] md:min-h-[280px]"}`}
          >
            {totais.materiais > 0 || totais.maoDeObra > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataGrafico}
                    cx="50%"
                    cy="50%"
                    outerRadius={categoriaAtiva ? 65 : 120}
                    dataKey="value"
                    stroke="none"
                    onClick={(e, index) =>
                      toggleCategoria(dataGrafico[index].name)
                    }
                    className="cursor-pointer outline-none"
                  >
                    {dataGrafico.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        style={{
                          filter: `drop-shadow(0px 0px ${categoriaAtiva ? "4px" : "8px"} ${entry.color}99)`,
                          opacity:
                            categoriaAtiva && categoriaAtiva !== entry.name
                              ? 0.3
                              : 1,
                          transition: "opacity 0.4s ease",
                        }}
                      />
                    ))}
                  </Pie>
                  {!categoriaAtiva && (
                    <Tooltip
                      formatter={(value) => `R$ ${formatarMoeda(value)}`}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm italic text-text-muted">
                Sem dados suficientes para gerar o gráfico.
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex w-full flex-col justify-center transition-all duration-700 ease-in-out md:w-[40%]`}
        >
          <div className="relative z-10 flex w-full flex-col overflow-hidden rounded-2xl border border-border-primary/30 bg-[#FAFAFA] shadow-inner">
            {dataGrafico.map((item, index) => (
              <div
                key={index}
                onClick={() => toggleCategoria(item.name)}
                className={`flex cursor-pointer items-center justify-between border-b border-border-primary/15 px-3 py-3 transition-all last:border-b-0 sm:px-4 ${categoriaAtiva === item.name ? "bg-white shadow-sm ring-1 ring-accent-primary/15" : "hover:bg-white/80"}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="h-3 w-3 shrink-0 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 10px ${item.color}`,
                      opacity:
                        categoriaAtiva && categoriaAtiva !== item.name
                          ? 0.4
                          : 1,
                    }}
                  />
                  <span
                    className={`truncate text-sm font-medium transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-text-muted" : "text-text-primary"}`}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <span
                    className={`text-sm font-semibold tabular-nums transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-text-muted" : "text-text-primary"}`}
                  >
                    R$ {formatarMoeda(item.value)}
                  </span>
                  <span
                    className={`w-9 text-right text-xs font-semibold transition-all duration-300 sm:w-10 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-text-muted/60" : "text-text-muted"}`}
                  >
                    {item.percentual}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-4 flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/12 px-4 py-3 text-left shadow-sm ring-1 ring-emerald-500/25 transition-all hover:bg-emerald-500/18 focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
            onClick={() => setCategoriaAtiva(null)}
          >
            <span className="text-sm font-bold uppercase tracking-wide text-emerald-950">
              Custo total lançado
            </span>
            <span className="text-lg font-bold tabular-nums text-emerald-900">
              R$ {formatarMoeda(totais.materiais + totais.maoDeObra)}
            </span>
          </button>

          <div
            className={`mt-3 text-center transition-all duration-500 ${categoriaAtiva ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}
          >
            <button
              type="button"
              onClick={() => setCategoriaAtiva(null)}
              className="cursor-pointer text-xs font-semibold text-accent-primary underline-offset-2 transition hover:underline"
            >
              Restaurar gráfico completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
