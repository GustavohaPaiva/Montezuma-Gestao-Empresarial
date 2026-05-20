export default function TabelaSimples({
  colunas,
  dados,
  variant = "light",
  /** Linhas e cabeçalho mais compactos (obra detalhe / financeiro). */
  dense = false,
}) {
  const esc = variant === "escritorio";
  const obraDetalhe = variant === "obraDetalhe";
  const financeiro = variant === "financeiro";
  const processoDetalhe = variant === "processoDetalhe";
  const compact = dense && (obraDetalhe || financeiro);

  return (
    <div
      className={
        esc
          ? "mb-6 w-full overflow-hidden rounded-xl border border-esc-border bg-esc-card/90 shadow-sm backdrop-blur-md"
          : obraDetalhe
            ? "mb-6 w-full max-w-full overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)]"
            : financeiro
              ? "mb-6 w-full overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)]"
              : processoDetalhe
                ? "mb-0 w-full max-w-full overflow-hidden rounded-xl border border-gray-100 bg-[#FAFAFA]/80 shadow-inner"
                : "mb-[24px] w-full overflow-hidden rounded-[8px] border border-[#DBDADE] bg-[#FFFFFF] shadow-sm"
      }
    >
      <div
        className={`scrollbar-thin overflow-x-auto overflow-y-auto ${
          obraDetalhe || financeiro
            ? compact
              ? "max-h-[min(70vh,720px)]"
              : "max-h-[1040px]"
            : processoDetalhe
              ? "max-h-none"
              : "max-h-[1450px]"
        }`}
      >
        <table
          className={
            obraDetalhe || financeiro
              ? "relative w-full min-w-[640px] border-separate border-spacing-0 text-left"
              : processoDetalhe
                ? "relative w-full min-w-[640px] border-collapse text-left"
                : "relative w-full border-collapse text-left"
          }
        >
          <thead className="sticky top-0 z-20">
            <tr
              className={
                esc
                  ? "bg-esc-bg/95 text-center text-xs font-semibold uppercase text-esc-muted"
                  : obraDetalhe
                    ? "bg-[#F4F4F5] text-center text-[10px] font-semibold uppercase tracking-wide text-text-muted shadow-[0_1px_0_0_rgba(0,0,0,0.06)] backdrop-blur-sm sm:text-[11px]"
                    : financeiro
                      ? "bg-[#F4F4F5] text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted shadow-[0_1px_0_0_rgba(0,0,0,0.06)] backdrop-blur-sm sm:text-xs"
                      : processoDetalhe
                        ? "border-b border-gray-100 bg-white text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 sm:text-xs"
                        : "bg-[#eeedf0] text-center text-[14px] font-semibold uppercase text-[#71717A]"
              }
            >
              {colunas.map((col, i) => (
                <th
                  key={i}
                  className={
                    esc
                      ? "bg-esc-bg/95 p-3 text-center text-esc-muted"
                      : obraDetalhe
                        ? compact
                          ? "whitespace-nowrap bg-[#F4F4F5] px-2 py-2 text-center sm:px-3"
                          : "whitespace-nowrap bg-[#FAFAFA] px-3 py-3 text-center sm:px-4 sm:py-3.5"
                        : financeiro
                          ? compact
                            ? "whitespace-nowrap bg-[#F4F4F5] px-3 py-2 text-center"
                            : "whitespace-nowrap bg-[#FAFAFA] px-4 py-4 text-center"
                          : processoDetalhe
                            ? compact
                              ? "whitespace-nowrap bg-white px-3 py-2.5 text-center text-gray-600"
                              : "whitespace-nowrap bg-white px-4 py-3.5 text-center text-gray-600 sm:py-4"
                            : "bg-[#eeedf0] p-[12px] text-center"
                  }
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          <tbody
            className={
              esc
                ? "text-center text-sm text-esc-text"
                : obraDetalhe
                  ? compact
                    ? "text-center text-xs text-text-primary"
                    : "text-center text-sm text-text-primary"
                  : financeiro
                    ? compact
                      ? "text-center text-xs text-text-primary"
                      : "text-center text-sm text-text-primary"
                    : processoDetalhe
                      ? "divide-y divide-gray-100 bg-white text-center text-sm text-gray-800"
                      : "text-center text-[#464C54]"
            }
          >
            {dados.map((linha, i) => (
              <tr
                key={i}
                className={
                  esc
                    ? "border-b border-esc-border/60 last:border-0 hover:bg-white/[0.03]"
                    : obraDetalhe
                      ? compact
                        ? "border-b border-border-primary/15 transition-colors last:border-0 hover:bg-[#FAFAFA]/90"
                        : "border-b border-border-primary/15 transition-colors last:border-0 hover:bg-[#FAFAFA]/90"
                      : financeiro
                        ? compact
                          ? "border-b border-border-primary/20 transition-colors last:border-0 hover:bg-[#FCFCFD]"
                          : "border-b border-border-primary/20 transition-colors last:border-0 hover:bg-[#FCFCFD]"
                        : processoDetalhe
                          ? "transition-colors odd:bg-white even:bg-[#FAFAFA]/40 hover:bg-orange-50/40"
                          : "border-b border-[#F0F0F2] last:border-0 hover:bg-[#F9FAFB]"
                }
              >
                {linha.map((valor, j) => (
                  <td
                    key={j}
                    className={
                      esc
                        ? "p-3"
                        : obraDetalhe
                          ? compact
                            ? "px-2 py-1.5 align-middle sm:px-3 sm:py-2"
                            : "px-3 py-3 align-middle sm:px-4 sm:py-3.5"
                          : financeiro
                            ? compact
                              ? "px-3 py-2 align-middle"
                              : "px-4 py-4 align-middle"
                            : processoDetalhe
                              ? compact
                                ? "px-3 py-2.5 align-middle"
                                : "px-4 py-4 align-middle"
                              : "p-[12px]"
                    }
                  >
                    {valor}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
