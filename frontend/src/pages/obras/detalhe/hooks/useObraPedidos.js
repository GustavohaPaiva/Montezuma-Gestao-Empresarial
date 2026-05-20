import { useCallback, useEffect, useState } from "react";
import { api } from "../../../../services/api";

/**
 * @param {string | number | undefined} obraId
 */
export function useObraPedidos(obraId) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    if (obraId == null || String(obraId) === "") {
      setPedidos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await api.getObraPedidos(obraId);
      setPedidos(rows || []);
      setErro(null);
    } catch (e) {
      console.error("[useObraPedidos] carregar:", e);
      setPedidos([]);
      setErro(e?.message || "Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }, [obraId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { pedidos, loading, erro, carregar, setErro };
}
