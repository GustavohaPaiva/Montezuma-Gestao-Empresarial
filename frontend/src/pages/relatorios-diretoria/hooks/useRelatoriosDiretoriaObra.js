import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { periodoAtual } from "../relatoriosDiretoriaUtils";

export function useRelatoriosDiretoriaObra(obraId, periodoInicial) {
  const [obra, setObra] = useState(null);
  const [obraFinanceiro, setObraFinanceiro] = useState(null);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [periodo, setPeriodo] = useState(
    periodoInicial || periodoAtual(),
  );

  useEffect(() => {
    if (periodoInicial?.ano && periodoInicial?.mes) {
      setPeriodo(periodoInicial);
    }
  }, [periodoInicial?.ano, periodoInicial?.mes]);

  const carregar = useCallback(async () => {
    if (!obraId) return;
    setLoading(true);
    try {
      const [obraData, obraFin, relatorios] = await Promise.all([
        api.getObraResumoParaRelatorio(obraId),
        api.getObraFinanceiroParaRelatorio(obraId),
        api.getRelatoriosDiretoriaPorObra(obraId, {
          ano: periodo.ano,
          mes: periodo.mes,
        }),
      ]);
      setObra(obraData);
      setObraFinanceiro(obraFin);
      setLancamentos(relatorios || []);
      setErro(null);
    } catch (e) {
      console.error("[useRelatoriosDiretoriaObra] carregar:", e);
      setErro(e?.message || "Não foi possível carregar os relatórios.");
      setObra(null);
      setObraFinanceiro(null);
      setLancamentos([]);
    } finally {
      setLoading(false);
    }
  }, [obraId, periodo.ano, periodo.mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const atualizarPeriodo = (novo) => {
    setPeriodo((prev) => ({ ...prev, ...novo }));
  };

  return {
    obra,
    obraFinanceiro,
    lancamentos,
    loading,
    erro,
    periodo,
    atualizarPeriodo,
    recarregar: carregar,
  };
}
