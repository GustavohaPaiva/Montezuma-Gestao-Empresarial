import { Calendar, ChevronRight, MapPin, Package, User } from "lucide-react";
import BaseCard from "../cards/BaseCard";
import { formatarDataBR } from "../../pages/obras/detalhe/utils/formatters";
import { pedidoLeadingIconClass } from "./pedidosUi";
import {
  getPedidoStatusColorTheme,
  resumoPedidoCard,
} from "../../utils/pedidosUtils";

function labelObra(pedido) {
  const obra = pedido?.obras;
  if (!obra) return null;
  const nome = obra.clientes?.nome || obra.cliente;
  const local = obra.local;
  if (nome && local) return `${nome} · ${local}`;
  return nome || local || null;
}

/**
 * @param {{ pedido: object, onClick: () => void, showObra?: boolean }} props
 */
export default function PedidoCardLista({ pedido, onClick, showObra = false }) {
  const { titulo, subtitulo } = resumoPedidoCard(pedido);
  const obraLabel = showObra ? labelObra(pedido) : null;

  const metadata = [
    {
      icon: <Calendar className="h-3.5 w-3.5" />,
      label: `Pedido em ${formatarDataBR(pedido.created_at)}`,
    },
  ];
  if (pedido.solicitante_nome) {
    metadata.unshift({
      icon: <User className="h-3.5 w-3.5" />,
      label: pedido.solicitante_nome,
    });
  }
  if (obraLabel) {
    metadata.unshift({
      icon: <MapPin className="h-3.5 w-3.5" />,
      label: obraLabel,
    });
  }

  const status = pedido.status || "Pendente";
  const colorTheme = getPedidoStatusColorTheme(status);

  return (
    <BaseCard
      variant="entity"
      colorTheme={colorTheme}
      title={titulo}
      value={subtitulo}
      status={status}
      onClick={onClick}
      leading={
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${pedidoLeadingIconClass(colorTheme)}`}
        >
          <Package className="h-5 w-5" strokeWidth={2} />
        </span>
      }
      metadata={metadata}
    >
      <div className="flex items-center justify-end gap-1 text-xs font-semibold text-accent-primary">
        Ver detalhes
        <ChevronRight className="h-4 w-4" />
      </div>
    </BaseCard>
  );
}
