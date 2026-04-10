import { useMemo } from "react";

export function useObraFinancialSummary(obra) {
  const totais = useMemo(() => {
    if (!obra)
      return {
        materiais: 0,
        maoDeObra: 0,
        totalExtrato: 0,
      };
    return {
      materiais: (obra.materiais || []).reduce(
        (acc, m) => acc + (parseFloat(m.valor) || 0),
        0,
      ),
      maoDeObra: (obra.maoDeObra || []).reduce(
        (acc, m) => acc + (parseFloat(m.valor_orcado) || 0),
        0,
      ),
      totalExtrato: (obra.relatorioExtrato || []).reduce(
        (acc, item) => acc + (parseFloat(item.valor) || 0),
        0,
      ),
    };
  }, [obra]);

  const dataGrafico = useMemo(() => {
    const paletaCores = ["#860000", "#EE5B11", "#F67D15", "#FBA51B", "#FDC626"];
    const totalGeral = totais.materiais + totais.maoDeObra;
    const dados = [
      {
        name: "Materiais",
        value: totais.materiais,
        qtd: obra?.materiais?.length || 0,
      },
      {
        name: "Mão de Obra",
        value: totais.maoDeObra,
        qtd: obra?.maoDeObra?.length || 0,
      },
    ];
    dados.sort((a, b) => b.value - a.value);
    return dados.map((d, index) => {
      const percentual =
        totalGeral > 0 ? ((d.value / totalGeral) * 100).toFixed(0) : 0;
      return {
        ...d,
        percentual,
        color: paletaCores[index] || paletaCores[paletaCores.length - 1],
      };
    });
  }, [totais, obra]);

  const prestadoresUnicos = useMemo(() => {
    if (!obra || !obra.maoDeObra) return [];
    const prestadores = obra.maoDeObra
      .map((m) => m.profissional)
      .filter(Boolean);
    return Array.from(new Set(prestadores)).sort();
  }, [obra]);

  return { totais, dataGrafico, prestadoresUnicos };
}
