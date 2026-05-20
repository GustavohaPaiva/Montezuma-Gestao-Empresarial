import { useMemo } from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileSearch,
  Package,
  Truck,
} from "lucide-react";
import BaseCard from "../cards/BaseCard";
import { PEDIDO_METRICAS_CONFIG } from "../../constants/pedidos";
import { calcularMetricasPedidos } from "../../utils/pedidosUtils";

const ICONES_METRICA = {
  total: Package,
  Pendente: Clock,
  "Em cotação": FileSearch,
  Aprovado: CheckCircle2,
  "Aguardando entrega": Truck,
  Entregue: ClipboardList,
  Cancelado: Ban,
};

/**
 * @param {{ pedidos: object[], className?: string }} props
 */
export default function PedidosMetricasResumo({ pedidos, className = "" }) {
  const metricas = useMemo(() => calcularMetricasPedidos(pedidos), [pedidos]);

  if (!pedidos?.length) return null;

  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-7 ${className}`.trim()}
    >
      {PEDIDO_METRICAS_CONFIG.map((cfg) => {
        const Icon = ICONES_METRICA[cfg.id] || Package;
        const valor = metricas[cfg.id] ?? 0;

        return (
          <BaseCard
            key={cfg.id}
            variant="metric"
            title={cfg.label}
            value={valor}
            colorTheme={cfg.colorTheme}
            icon={<Icon className="h-5 w-5" />}
          />
        );
      })}
    </div>
  );
}
