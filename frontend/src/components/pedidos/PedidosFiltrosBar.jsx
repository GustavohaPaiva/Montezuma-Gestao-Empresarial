import BaseInput from "../gerais/BaseInput";
import BaseSelect from "../gerais/BaseSelect";
import { STATUS_PEDIDO_OPCOES } from "../../constants/pedidos";

const OPCOES_STATUS = [
  { value: "Tudo", label: "Todos os status" },
  ...STATUS_PEDIDO_OPCOES.map((s) => ({ value: s, label: s })),
];

/**
 * @param {{
 *   busca: string,
 *   onBuscaChange: (value: string) => void,
 *   status: string,
 *   onStatusChange: (value: string) => void,
 *   placeholderBusca?: string,
 *   className?: string,
 * }} props
 */
export default function PedidosFiltrosBar({
  busca,
  onBuscaChange,
  status,
  onStatusChange,
  placeholderBusca = "Buscar por material, solicitante ou nº do pedido…",
  className = "",
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_min(14rem,100%)] ${className}`.trim()}
    >
      <BaseInput
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        placeholder={placeholderBusca}
        aria-label="Pesquisar pedidos"
      />
      <BaseSelect
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        options={OPCOES_STATUS}
        aria-label="Filtrar por status"
      />
    </div>
  );
}
