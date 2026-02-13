export default function TabelaSimples({ colunas, dados }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#DBDADE] rounded-[8px] overflow-hidden shadow-sm w-full mb-[24px]">
      {/* max-h-[1450px]: Altura aprox. de 30 linhas. 
          Se tiver 10 linhas, a tabela fica pequena. 
          Se tiver 50, ela cresce até o tamanho de 30 e cria a barra de rolagem.
      */}
      <div className="overflow-x-auto overflow-y-auto max-h-[1450px] scrollbar-thin">
        <table className="w-full text-left border-collapse relative">
          {/* sticky top-0: Faz o cabeçalho travar no topo quando rolar */}
          <thead className="sticky top-0 z-10 shadow-sm">
            <tr className="bg-[#eeedf0] text-[#71717A] text-[14px] uppercase text-center">
              {colunas.map((col, i) => (
                <th
                  key={i}
                  className="p-[12px] font-semibold bg-[#eeedf0]" // Cor de fundo repetida aqui para não ficar transparente ao rolar
                >
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
