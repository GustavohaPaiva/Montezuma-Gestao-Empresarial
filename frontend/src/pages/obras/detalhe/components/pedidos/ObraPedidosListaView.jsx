import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus } from "lucide-react";
import LoadingPainel from "../../../../../components/gerais/LoadingPainel";
import PedidoCardLista from "../../../../../components/pedidos/PedidoCardLista";
import PedidosFiltrosBar from "../../../../../components/pedidos/PedidosFiltrosBar";
import ButtonDefault from "../../../../../components/gerais/ButtonDefault";
import {
  btnAccentPremium,
  pedidoSecaoToolbarClass,
} from "../../../../../components/pedidos/pedidosUi";
import { filtrarPedidos } from "../../../../../utils/pedidosUtils";

/**
 * @param {{
 *   obraId: string | number,
 *   pedidos: object[],
 *   loading: boolean,
 *   user: object | null,
 *   onIrParaNovo: () => void,
 * }} props
 */
export default function ObraPedidosListaView({
  obraId,
  pedidos,
  loading,
  user,
  onIrParaNovo,
}) {
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");

  const pedidosFiltrados = useMemo(
    () => filtrarPedidos(pedidos, { busca, status: filtroStatus }),
    [pedidos, busca, filtroStatus],
  );

  const abrirDetalhe = (pedidoId) => {
    navigate(`/obrasD/${obraId}/pedidos/${pedidoId}`, {
      state: { secao: "pedidos" },
    });
  };

  if (loading) {
    return (
      <LoadingPainel
        titulo="Carregando pedidos"
        descricao="Buscando pedidos lançados nesta obra."
        icon={<Package className="h-7 w-7" strokeWidth={2} />}
        className="min-h-[28vh]"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={pedidoSecaoToolbarClass}>
        <div className="min-w-0 shrink-0">
          <h3 className="text-base font-bold text-text-primary sm:text-lg">
            Pedidos lançados
          </h3>
          <p className="mt-1 text-xs text-text-muted sm:text-sm">
            {pedidos.length === 0
              ? "Nenhum pedido nesta obra."
              : `${pedidosFiltrados.length} de ${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:flex-1 lg:justify-end lg:gap-3">
          {pedidos.length > 0 ? (
            <PedidosFiltrosBar
              className="w-full min-w-0 sm:flex-1 lg:max-w-2xl"
              busca={busca}
              onBuscaChange={setBusca}
              status={filtroStatus}
              onStatusChange={setFiltroStatus}
              placeholderBusca="Buscar por material ou nº do pedido…"
            />
          ) : null}
          {user ? (
            <ButtonDefault
              type="button"
              onClick={onIrParaNovo}
              className={`${btnAccentPremium} shrink-0 !w-full sm:!w-auto`}
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4 shrink-0" />
                Adicionar pedido
              </span>
            </ButtonDefault>
          ) : null}
        </div>
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-primary/40 bg-[#FAFAFA] px-6 py-12 text-center">
          <p className="text-sm font-medium text-text-primary">
            Nenhum pedido registado nesta obra.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Utilize &quot;Adicionar pedido&quot; para lançar materiais.
          </p>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-primary/40 bg-[#FAFAFA] px-4 py-10 text-center text-sm text-text-muted">
          Nenhum pedido corresponde aos filtros aplicados.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pedidosFiltrados.map((pedido) => (
            <PedidoCardLista
              key={pedido.id}
              pedido={pedido}
              onClick={() => abrirDetalhe(pedido.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
