import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { periodoAtual } from "../relatoriosDiretoriaUtils";

export function useRelatoriosDiretoriaPeriodo(periodoInicial) {
  const [obrasFinanceiro, setObrasFinanceiro] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [periodo, setPeriodo] = useState(periodoInicial || periodoAtual());

  useEffect(() => {
    if (periodoInicial?.ano && periodoInicial?.mes) {
      setPeriodo(periodoInicial);
    }
  }, [periodoInicial?.ano, periodoInicial?.mes]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [relatorios, obrasFin] = await Promise.all([
        api.getRelatoriosDiretoriaPeriodo({
          ano: periodo.ano,
          mes: periodo.mes,
        }),
        api.getObrasFinanceiroParaRelatorioGlobal(),
      ]);
      setLancamentos(relatorios || []);
      setObrasFinanceiro(obrasFin || []);
      setErro(null);
    } catch (e) {
      console.error("[useRelatoriosDiretoriaPeriodo] carregar:", e);
      setErro(e?.message || "Não foi possível carregar os relatórios.");
      setLancamentos([]);
      setObrasFinanceiro([]);
    } finally {
      setLoading(false);
    }
  }, [periodo.ano, periodo.mes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const atualizarPeriodo = (novo) => {
    setPeriodo((prev) => ({ ...prev, ...novo }));
  };

  return {
    obrasFinanceiro,
    lancamentos,
    loading,
    erro,
    periodo,
    atualizarPeriodo,
    recarregar: carregar,
  };
}
