import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../../services/api";
import { classificarLancamentosGlobal } from "../relatorioFinanceiroUtils";

export function useRelatorioFinanceiroGlobal(semanaInicio) {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getObrasFinanceiroParaRelatorioGlobal();
      setObras(data || []);
      setErro(null);
    } catch (e) {
      console.error("[useRelatorioFinanceiroGlobal] carregar:", e);
      setErro(
        e?.message || "Não foi possível carregar os dados financeiros das obras.",
      );
      setObras([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const resumo = useMemo(
    () => classificarLancamentosGlobal(obras, semanaInicio),
    [obras, semanaInicio],
  );

  return {
    obras,
    resumo,
    loading,
    erro,
    recarregar: carregar,
  };
}
