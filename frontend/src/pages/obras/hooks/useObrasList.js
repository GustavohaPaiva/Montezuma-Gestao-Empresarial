import { useEffect, useState } from "react";
import { api } from "../../../services/api";

export function useObrasList() {
  const [obras, setObras] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [showElements, setShowElements] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setCarregando(true);
      setShowElements(false);
      try {
        const dados = await api.getObras({ signal: controller.signal });
        setObras(dados || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setCarregando(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!carregando) {
      const timer = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowElements(false);
    }
  }, [carregando]);

  const reloadObras = () => setRefresh((prev) => !prev);

  return { obras, setObras, carregando, showElements, reloadObras };
}
