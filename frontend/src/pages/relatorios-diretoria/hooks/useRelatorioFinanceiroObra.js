import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../services/api";
import { classificarLancamentosObra } from "../relatorioFinanceiroUtils";

export function useRelatorioFinanceiroObra(obraId, semanaInicio) {
  const [obra, setObra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (!obraId) return;
    setLoading(true);
    try {
      const obraData = await api.getObraFinanceiroParaRelatorio(obraId);
      setObra(obraData);
      setErro(null);
    } catch (e) {
      console.error("[useRelatorioFinanceiroObra] carregar:", e);
      setErro(e?.message || "Não foi possível carregar os dados financeiros.");
      setObra(null);
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const resumo = useMemo(
    () => classificarLancamentosObra(obra, semanaInicio),
    [obra, semanaInicio],
  );

  return {
    obra,
    resumo,
    loading,
    erro,
    recarregar: carregar,
  };
}
