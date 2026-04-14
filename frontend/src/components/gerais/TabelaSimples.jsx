export default function TabelaSimples({ colunas, dados, variant = "light" }) {
  const esc = variant === "escritorio";
  return (
    <div
      className={
        esc
          ? "mb-6 w-full overflow-hidden rounded-xl border border-esc-border bg-esc-card/90 shadow-sm backdrop-blur-md"
          : "mb-[24px] w-full overflow-hidden rounded-[8px] border border-[#DBDADE] bg-[#FFFFFF] shadow-sm"
      }
    >
      <div className="scrollbar-thin max-h-[1450px] overflow-x-auto overflow-y-auto">
        <table className="relative w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr
              className={
                esc
                  ? "bg-esc-bg/95 text-center text-xs font-semibold uppercase text-esc-muted"
                  : "bg-[#eeedf0] text-center text-[14px] font-semibold uppercase text-[#71717A]"
              }
            >
              {colunas.map((col, i) => (
                <th
                  key={i}
                  className={
                    esc
                      ? "bg-esc-bg/95 p-3 text-esc-muted"
                      : "bg-[#eeedf0] p-[12px]"
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
                : "text-center text-[#464C54]"
            }
          >
            {dados.map((linha, i) => (
              <tr
                key={i}
                className={
                  esc
                    ? "border-b border-esc-border/60 last:border-0 hover:bg-white/[0.03]"
                    : "border-b border-[#F0F0F2] last:border-0 hover:bg-[#F9FAFB]"
                }
              >
                {linha.map((valor, j) => (
                  <td key={j} className={esc ? "p-3" : "p-[12px]"}>
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
