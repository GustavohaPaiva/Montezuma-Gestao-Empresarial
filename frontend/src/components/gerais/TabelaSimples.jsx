export default function TabelaSimples({ colunas, dados, variant = "light" }) {
  const esc = variant === "escritorio";
  const obraDetalhe = variant === "obraDetalhe";
  const financeiro = variant === "financeiro";
  return (
    <div
      className={
        esc
          ? "mb-6 w-full overflow-hidden rounded-xl border border-esc-border bg-esc-card/90 shadow-sm backdrop-blur-md"
          : obraDetalhe
            ? "mb-6 w-full max-w-full overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)]"
            : financeiro
              ? "mb-6 w-full overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)]"
            : "mb-[24px] w-full overflow-hidden rounded-[8px] border border-[#DBDADE] bg-[#FFFFFF] shadow-sm"
      }
    >
      <div className="scrollbar-thin max-h-[1450px] overflow-x-auto overflow-y-auto">
        <table
          className={
            obraDetalhe || financeiro
              ? "relative w-full min-w-[640px] border-collapse text-left"
              : "relative w-full border-collapse text-left"
          }
        >
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr
              className={
                esc
                  ? "bg-esc-bg/95 text-center text-xs font-semibold uppercase text-esc-muted"
                  : obraDetalhe
                    ? "bg-[#FAFAFA] text-center text-[11px] font-semibold uppercase tracking-wide text-text-muted sm:text-xs"
                    : financeiro
                      ? "bg-[#FAFAFA] text-center text-xs font-semibold uppercase tracking-[0.12em] text-text-muted"
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
                        ? "whitespace-nowrap bg-[#FAFAFA] px-3 py-3.5 text-center sm:px-4 sm:py-4"
                        : financeiro
                          ? "whitespace-nowrap bg-[#FAFAFA] px-4 py-4 text-center"
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
                  ? "text-center text-sm text-text-primary"
                  : financeiro
                    ? "text-center text-sm text-text-primary"
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
                      ? "border-b border-border-primary/15 transition-colors last:border-0 hover:bg-[#FAFAFA]/90"
                      : financeiro
                        ? "border-b border-border-primary/20 transition-colors last:border-0 hover:bg-[#FCFCFD]"
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
                          ? "px-3 py-3 align-middle sm:px-4 sm:py-3.5"
                          : financeiro
                            ? "px-4 py-4 align-middle"
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
