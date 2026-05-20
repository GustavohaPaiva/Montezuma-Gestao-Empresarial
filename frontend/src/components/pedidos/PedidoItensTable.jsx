import { formatarDataBR } from "../../pages/obras/detalhe/utils/formatters";
import { formatarQuantidadePedido } from "../../utils/pedidosUtils";

/**
 * @param {{ itens: Array<{ id?: number, material: string, quantidade: number, data_entrega: string }> }} props
 */
export default function PedidoItensTable({ itens = [] }) {
  if (!itens.length) {
    return (
      <p className="text-sm text-text-muted">Nenhum material neste pedido.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-primary/35">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border-primary/30 bg-[#FAFAFA]">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Material
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Qtd.
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Un.
            </th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Data de entrega
            </th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, idx) => (
            <tr
              key={item.id ?? `item-${idx}`}
              className="border-b border-border-primary/20 last:border-0"
            >
              <td className="px-4 py-3 font-medium text-text-primary">
                {item.material}
              </td>
              <td className="px-4 py-3 text-text-primary/90">
                {formatarQuantidadePedido(item.quantidade)}
              </td>
              <td className="px-4 py-3 text-text-primary/90">
                {item.unidade || "Un."}
              </td>
              <td className="px-4 py-3 text-text-primary/90">
                {formatarDataBR(item.data_entrega)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
