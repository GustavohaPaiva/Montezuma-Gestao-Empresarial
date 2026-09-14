import { useEffect, useRef, useState } from "react";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { resumoValoresPedido } from "../../utils/pedidosUtils";
import { inputTabelaGestao } from "./pedidosUi";

function textoNumero(valor) {
  if (valor == null || valor === "" || Number(valor) === 0) return "";
  return String(valor);
}

/**
 * Soma dos valores dos materiais, com desconto opcional em R$.
 * @param {{
 *   itens?: object[],
 *   desconto?: object,
 *   variant?: "header" | "bar",
 *   editavel?: boolean,
 *   onSalvarDesconto?: (campos: object) => void | Promise<void>,
 * }} props
 */
export default function PedidoValorTotal({
  itens = [],
  desconto = {},
  variant = "bar",
  editavel = false,
  onSalvarDesconto,
}) {
  const editando = useRef(false);
  const dirty = useRef(false);
  const [descontoSalvo, setDescontoSalvo] = useState(null);
  const inicial = resumoValoresPedido(itens, desconto);
  const [valInput, setValInput] = useState(textoNumero(inicial.desconto_valor));

  const baseDesconto = descontoSalvo || desconto;
  const resumoBase = resumoValoresPedido(itens, baseDesconto);
  const resumo = dirty.current
    ? resumoValoresPedido(itens, {
        desconto_valor: valInput === "" ? 0 : Number(valInput) || 0,
      })
    : resumoBase;

  useEffect(() => {
    setDescontoSalvo(null);
  }, [desconto?.desconto_valor]);

  useEffect(() => {
    if (editando.current) return;
    setValInput(textoNumero(resumoBase.desconto_valor));
  }, [resumoBase.desconto_valor]);

  const salvar = (valor) => {
    const campos = {
      desconto_valor: valor === "" ? 0 : Number(valor) || 0,
    };
    setDescontoSalvo(campos);
    if (onSalvarDesconto) onSalvarDesconto(campos);
  };

  if (variant === "header") {
    return (
      <div className="text-right">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          Valor total
        </p>
        <p className="text-lg font-bold tabular-nums text-text-primary">
          R$ {formatarMoeda(resumo.total)}
        </p>
        {resumo.desconto_valor > 0 ? (
          <p className="text-[11px] text-text-muted">
            Desc. R$ {formatarMoeda(resumo.desconto_valor)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-border-primary/35 bg-[#FAFAFA] px-3.5 py-2.5 text-sm shadow-inner ring-1 ring-black/4">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <span className="font-medium text-text-muted">Subtotal</span>
        <span className="tabular-nums text-text-primary">
          R$ {formatarMoeda(resumo.subtotal)}
        </span>
      </div>

      {editavel ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-text-muted">Desconto</span>
          <label className="inline-flex items-center gap-1">
            <span className="text-xs text-text-muted">R$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={valInput}
              onFocus={() => {
                editando.current = true;
              }}
              onChange={(e) => {
                dirty.current = true;
                setValInput(e.target.value);
              }}
              onBlur={() => {
                editando.current = false;
                if (!dirty.current) return;
                dirty.current = false;
                salvar(valInput);
              }}
              className={`${inputTabelaGestao} w-24 !text-right`}
              aria-label="Desconto em reais"
            />
          </label>
        </div>
      ) : resumo.desconto_valor > 0 ? (
        <div className="flex min-h-8 items-center justify-between gap-2">
          <span className="font-medium text-text-muted">Desconto</span>
          <span className="tabular-nums text-text-primary">
            − R$ {formatarMoeda(resumo.desconto_valor)}
          </span>
        </div>
      ) : null}

      <div className="flex min-h-8 items-center justify-between gap-2 border-t border-border-primary/25 pt-2">
        <span className="font-medium text-text-muted">Valor total</span>
        <span className="font-bold tabular-nums text-text-primary">
          R$ {formatarMoeda(resumo.total)}
        </span>
      </div>
    </div>
  );
}
