export default function TabelaSimples({ colunas, dados }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#DBDADE] rounded-[8px] overflow-hidden shadow-sm w-full mb-[24px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#eeedf0] text-[#71717A] text-[14px] uppercase text-center">
              {colunas.map((col, i) => (
                <th key={i} className="p-[12px] font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#464C54] text-center">
            {dados.map((linha, i) => (
              <tr
                key={i}
                className="border-b border-[#F0F0F2] last:border-0 hover:bg-[#F9FAFB]"
              >
                {linha.map((valor, j) => (
                  <td key={j} className="p-[12px]">
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
