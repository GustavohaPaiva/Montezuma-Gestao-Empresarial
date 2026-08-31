import { useCallback, useState } from "react";
import ModalHistoricoLancamentos from "../../components/modals/ModalHistoricoLancamentos";

export function useHistoricoLancamentos() {
  const [historico, setHistorico] = useState(null);

  const abrirHistorico = useCallback((payload) => {
    setHistorico({
      titulo: payload?.titulo || "Histórico",
      subtitulo: payload?.subtitulo || "",
      itens: payload?.itens || [],
      loading: Boolean(payload?.loading),
    });
  }, []);

  const fecharHistorico = useCallback(() => setHistorico(null), []);

  const modalHistorico = (
    <ModalHistoricoLancamentos
      isOpen={historico != null}
      onClose={fecharHistorico}
      titulo={historico?.titulo}
      subtitulo={historico?.subtitulo}
      itens={historico?.itens}
      loading={historico?.loading}
    />
  );

  return { abrirHistorico, fecharHistorico, modalHistorico };
}
