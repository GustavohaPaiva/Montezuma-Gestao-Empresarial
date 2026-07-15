import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { userVeDashboard } from "../homeUi";

function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWindowDays(days = 7, from = new Date()) {
  const d = startOfLocalDay(from);
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function useHomeReservasSala(user) {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enabled = userVeDashboard(user?.tipo);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setReservas([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const from = startOfLocalDay().toISOString();
      const to = endOfWindowDays(7).toISOString();
      const data = await api.listReservasSala({ from, to });
      setReservas(data);
    } catch (err) {
      console.error("[useHomeReservasSala]", err);
      setError(err);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    reservas,
    loading,
    error,
    visible: enabled,
    refetch,
  };
}
