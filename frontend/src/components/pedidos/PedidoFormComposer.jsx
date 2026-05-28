import { useState } from "react";
import { Plus, Send, Trash2 } from "lucide-react";
import { UNIDADES_MEDIDA_PEDIDO } from "../../constants/pedidos";
import ButtonDefault from "../gerais/ButtonDefault";
import { formatarDataBR } from "../../pages/obras/detalhe/utils/formatters";
import {
  formatarQuantidadePedido,
  validarItemPedido,
} from "../../utils/pedidosUtils";
import {
  btnAccentPremium,
  btnOutlinePremium,
  inputPremium,
  pedidoSecaoToolbarClass,
  selectPremium,
} from "./pedidosUi";

function CampoForm({ label, children, className = "" }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

/**
 * @param {{
 *   itensIniciais?: Array<{ material: string, quantidade: number, unidade?: string, data_entrega: string }>,
 *   onSubmit: (itens: Array<{ material: string, quantidade: number, unidade: string, data_entrega: string }>) => void | Promise<void>,
 *   submitLabel?: string,
 *   submitting?: boolean,
 *   onCancel?: () => void,
 * }} props
 */
export default function PedidoFormComposer({
  itensIniciais = [],
  onSubmit,
  submitLabel = "Lançar pedido",
  submitting = false,
  onCancel,
}) {
  const [itens, setItens] = useState(() =>
    itensIniciais.map((i, idx) => ({
      ...i,
      unidade: i.unidade || "Un.",
      _key: `init-${idx}`,
    })),
  );
  const [material, setMaterial] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("Un.");
  const [dataEntrega, setDataEntrega] = useState("");
  const [erroLocal, setErroLocal] = useState(null);

  const itemValido = validarItemPedido({
    material,
    quantidade,
    unidade,
    data_entrega: dataEntrega,
  });

  const adicionarMaterial = () => {
    const parsed = validarItemPedido({
      material,
      quantidade,
      unidade,
      data_entrega: dataEntrega,
    });
    if (!parsed) {
      setErroLocal(
        "Preencha material, quantidade, unidade de medida e data de entrega.",
      );
      return;
    }
    setItens((prev) => [
      ...prev,
      { ...parsed, _key: `tmp-${Date.now()}-${prev.length}` },
    ]);
    setMaterial("");
    setQuantidade("");
    setUnidade("Un.");
    setDataEntrega("");
    setErroLocal(null);
  };

  const removerItem = (key) => {
    setItens((prev) => prev.filter((i) => i._key !== key));
  };

  const handleLancar = async () => {
    if (itens.length === 0) {
      setErroLocal("Adicione pelo menos um material ao pedido.");
      return;
    }
    setErroLocal(null);
    const payload = itens.map(
      ({ material: m, quantidade: q, unidade: u, data_entrega: d }) => ({
        material: m,
        quantidade: q,
        unidade: u,
        data_entrega: d,
      }),
    );
    await onSubmit(payload);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border-primary/35 bg-[#FAFAFA] p-4 sm:p-5">
        <div className={`${pedidoSecaoToolbarClass} mb-4 lg:items-start`}>
          <div className="w-full">
            <div className="min-w-0 shrink-0 mb-4">
              <h4 className="text-xl font-bold text-text-primary">
                Adicionar material
              </h4>
              <p className=" text-xs text-text-muted">
                Preencha os campos e clique em &quot;Adicionar à lista&quot;.
              </p>
            </div>

            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <CampoForm label="Material" className="md:col-span-12">
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Ex.: Cimento CP II 50kg"
                    className={inputPremium}
                  />
                </CampoForm>
                <CampoForm label="Quantidade" className="md:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    placeholder="120"
                    className={inputPremium}
                  />
                </CampoForm>
                <CampoForm label="Un." className="md:col-span-3">
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className={selectPremium}
                  >
                    {UNIDADES_MEDIDA_PEDIDO.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </CampoForm>
                <CampoForm label="Data de entrega" className="md:col-span-6">
                  <input
                    type="date"
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    className={inputPremium}
                  />
                </CampoForm>
              </div>
            </div>
            <div className="mt-4 w-full flex justify-end">
              <ButtonDefault
                type="button"
                onClick={adicionarMaterial}
                disabled={!itemValido}
                className={`${btnAccentPremium} !w-full sm:!min-w-[200px]`}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4 shrink-0" />
                  Adicionar à lista
                </span>
              </ButtonDefault>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border-primary/35 bg-white p-4 sm:p-5">
        <h4 className="mb-3 text-sm font-bold text-text-primary">
          Materiais do pedido ({itens.length})
        </h4>

        {itens.length > 0 ? (
          <ul className="space-y-2">
            {itens.map((item, index) => (
              <li
                key={item._key}
                className="flex items-start gap-3 rounded-xl border border-border-primary/30 bg-[#FAFAFA] px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-xs font-bold text-accent-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text-primary">
                    {item.material}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatarQuantidadePedido(item.quantidade)} {item.unidade} ·
                    Entrega {formatarDataBR(item.data_entrega)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removerItem(item._key)}
                  className="shrink-0 rounded-lg p-2 text-text-muted transition-colors hover:bg-danger-soft/50 hover:text-danger-primary"
                  aria-label="Remover material"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border-primary/40 bg-[#FAFAFA] px-4 py-8 text-center text-xs text-text-muted">
            A lista está vazia. Adicione materiais antes de lançar o pedido.
          </p>
        )}
      </section>

      {erroLocal ? (
        <p className="rounded-xl border border-danger-primary/25 bg-danger-soft/30 px-3 py-2 text-sm text-danger-primary">
          {erroLocal}
        </p>
      ) : null}

      <footer className="flex flex-col-reverse gap-2 border-t border-border-primary/25 pt-4 sm:flex-row sm:justify-end">
        {onCancel ? (
          <ButtonDefault
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className={`${btnOutlinePremium} sm:!w-full`}
          >
            Cancelar
          </ButtonDefault>
        ) : null}
        <ButtonDefault
          type="button"
          onClick={handleLancar}
          disabled={submitting || itens.length === 0}
          className={`${btnAccentPremium} sm:!w-full`}
        >
          <span className="inline-flex items-center gap-2">
            <Send className="h-4 w-4 shrink-0" />
            {submitting ? "A guardar…" : submitLabel}
          </span>
        </ButtonDefault>
      </footer>
    </div>
  );
}
