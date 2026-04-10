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
      className="w-full bg-white h-auto rounded-[12px] mb-[24px] p-[24px] shadow-sm relative overflow-hidden"
    >
      <h2 className="text-[24px] font-bold text-[#464C54] mb-[20px]">
        Resumo Financeiro
      </h2>
      <div
        className={`flex flex-col md:flex-row gap-[20px] transition-all duration-700 ease-in-out ${categoriaAtiva ? "md:h-[320px]" : "md:h-[280px] items-center justify-center"}`}
      >
        <div
          className={`flex flex-col transition-all duration-700 ease-in-out h-full ${categoriaAtiva ? "w-full md:w-[60%] justify-between" : "w-full md:w-[50%] justify-center items-center"}`}
        >
          <div
            className={`w-full transition-all duration-700 ease-in-out overflow-hidden ${categoriaAtiva ? "max-h-[250px] opacity-100 mb-4" : "max-h-0 opacity-0"}`}
          >
            {categoriaAtiva &&
              (() => {
                const ativo = dataGrafico.find((d) => d.name === categoriaAtiva);
                return (
                  <div className="bg-[#f6f6f6] border border-[#f1f1f1] rounded-[8px] p-5 shadow-sm h-auto">
                    <h3 className="text-xl font-bold text-[#464C54] mb-2 uppercase">
                      Visão: {ativo.name}
                    </h3>
                    <div className="flex flex-col md:flex-row md:items-end gap-3 mb-3">
                      <span
                        className="text-4xl font-bold"
                        style={{ color: ativo.color }}
                      >
                        R$ {formatarMoeda(ativo.value)}
                      </span>
                      <span className="text-sm font-medium text-[#919191] mb-1">
                        ({ativo.percentual}% do custo total da obra)
                      </span>
                    </div>
                    <p className="text-sm text-[#71717A] leading-relaxed">
                      Este painel consolida todos os gastos referentes a{" "}
                      <strong>{ativo.name.toLowerCase()}</strong>. Até o
                      momento, foram registrados{" "}
                      <strong className="text-black">{ativo.qtd}</strong>{" "}
                      lançamentos.
                    </p>
                  </div>
                );
              })()}
          </div>

          <div
            className={`transition-all duration-700 ease-in-out ${categoriaAtiva ? "w-[140px] h-[140px] self-start" : "w-full h-[250px] md:h-full flex justify-center"}`}
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
              <div className="flex items-center justify-center h-full w-full text-[#919191] italic">
                Sem dados suficientes para gerar o gráfico.
              </div>
            )}
          </div>
        </div>

        <div
          className={`flex flex-col justify-center transition-all duration-700 ease-in-out w-full md:w-[40%]`}
        >
          <div className="flex flex-col w-full bg-[#fcfcfc] border border-[#f1f1f1] rounded-[8px] shadow-sm z-10 relative">
            {dataGrafico.map((item, index) => (
              <div
                key={index}
                onClick={() => toggleCategoria(item.name)}
                className={`flex justify-between items-center py-3 border-b border-[#f1f1f1] last:border-b-0 cursor-pointer transition-all duration-300 rounded-md px-2 ${categoriaAtiva === item.name ? "bg-[#EEEDF0] scale-[1.02] shadow-sm" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 10px ${item.color}`,
                      opacity:
                        categoriaAtiva && categoriaAtiva !== item.name
                          ? 0.4
                          : 1,
                    }}
                  ></div>
                  <span
                    className={`font-medium text-sm transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#a1a1a1]" : "text-[#464C54]"}`}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold text-sm transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#a1a1a1]" : "text-[#464C54]"}`}
                  >
                    R$ {formatarMoeda(item.value)}
                  </span>
                  <span
                    className={`text-xs font-medium w-[35px] text-right transition-all duration-300 ${categoriaAtiva && categoriaAtiva !== item.name ? "text-[#d1d1d1]" : "text-[#919191]"}`}
                  >
                    {item.percentual}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            className="bg-[#EEEDF0] border border-[#DBDADE] rounded-[8px] p-[8px] flex justify-between items-center shadow-sm mt-4 w-full cursor-pointer hover:bg-[#e4e3e6] transition-colors"
            onClick={() => setCategoriaAtiva(null)}
          >
            <span className="font-bold text-black uppercase text-sm">
              Custo Total Lançado
            </span>
            <span className="font-bold text-[#2E7D32] text-lg">
              R$ {formatarMoeda(totais.materiais + totais.maoDeObra)}
            </span>
          </div>

          <div
            className={`text-center mt-3 transition-all duration-500 ${categoriaAtiva ? "opacity-100 max-h-[30px]" : "opacity-0 max-h-0"}`}
          >
            <button
              onClick={() => setCategoriaAtiva(null)}
              className="text-xs text-[#DC3B0B] underline font-medium cursor-pointer"
            >
              Restaurar gráfico completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
