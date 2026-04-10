import { useCallback, useEffect, useState } from "react";
import { api } from "../../../../services/api";

export function useObraById(id) {
  const [obra, setObra] = useState(null);

  const fetchDados = useCallback(async () => {
    if (!id) return;
    try {
      const dados = await api.getObraById(id);
      if (dados) setObra(dados);
    } catch (err) {
      console.error("ERRO NO FETCH:", err);
    }
  }, [id]);

  useEffect(() => {
    const carregarDados = async () => {
      await fetchDados();
    };

    carregarDados();
  }, [fetchDados]);

  return { obra, setObra, fetchDados };
}
