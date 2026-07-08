import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { api } from "../../../../../services/api";
import PedidoFormComposer from "../../../../../components/pedidos/PedidoFormComposer";
import ButtonDefault from "../../../../../components/gerais/ButtonDefault";
import {
  btnOutlinePremium,
  pedidoSecaoToolbarClass,
} from "../../../../../components/pedidos/pedidosUi";

/**
 * @param {{
 *   obraId: string | number,
 *   onSucesso: () => void,
 *   onVoltar: () => void,
 *   setErroGlobal: (msg: string | null) => void,
 * }} props
 */
export default function ObraPedidoNovoView({
  obraId,
  onSucesso,
  onVoltar,
  setErroGlobal,
}) {
  const { user } = useAuth();
  const [enviando, setEnviando] = useState(false);

  const handleLancar = async (itens) => {
    if (!obraId || !user) return;
    setEnviando(true);
    setErroGlobal(null);
    try {
      await api.addObraPedido({
        obra_id: obraId,
        itens,
        solicitante_id: user.id,
        solicitante_nome: user.nome || user.email || "Usuário",
      });
      onSucesso();
    } catch (e) {
      console.error("[ObraPedidoNovoView] lançar:", e);
      setErroGlobal(e?.message || "Não foi possível lançar o pedido.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.06)]">
      <div
        className={`${pedidoSecaoToolbarClass} border-b border-border-primary/30 px-5 py-4 lg:items-center sm:px-6`}
      >
        <div>
          <h3 className="text-base font-bold text-text-primary sm:text-lg">
            Novo pedido de materiais
          </h3>
          <p className="mt-1 text-xs text-text-muted sm:text-sm">
            Adicione os materiais à lista e confirme com &quot;Lançar pedido&quot;.
          </p>
        </div>
        <ButtonDefault
          type="button"
          onClick={onVoltar}
          disabled={enviando}
          className={`${btnOutlinePremium} !min-w-0 shrink-0 !w-full lg:!w-auto`}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar à lista
          </span>
        </ButtonDefault>
      </div>
      <div className="p-5 sm:p-6">
        <PedidoFormComposer
          onSubmit={handleLancar}
          submitting={enviando}
          onCancel={onVoltar}
        />
      </div>
    </div>
  );
}
