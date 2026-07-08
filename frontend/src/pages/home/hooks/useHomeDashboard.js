import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { userVeDashboard } from "../homeUi";

const INITIAL_COUNTS = {
  obrasAtivas: 0,
  processos: 0,
  pendencias: 0,
  tarefas: 0,
};

export function useHomeDashboard(user) {
  const [counts, setCounts] = useState(INITIAL_COUNTS);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const enabled = userVeDashboard(user?.tipo);

  const fetchCounts = useCallback(async () => {
    if (!enabled) {
      setVisible(false);
      return;
    }

    setLoading(true);
    setVisible(true);

    try {
      const data = await api.getHomeDashboardCounts();
      setCounts(data);
    } catch (error) {
      console.error("[useHomeDashboard]", error);
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void fetchCounts();
  }, [fetchCounts]);

  return { counts, loading, visible };
}
