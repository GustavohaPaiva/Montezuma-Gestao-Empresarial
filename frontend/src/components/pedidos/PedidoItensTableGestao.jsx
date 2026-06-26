import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../services/api";
import { UNIDADES_MEDIDA_PEDIDO } from "../../constants/pedidos";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { normalizarNomeMaterial } from "../../utils/pedidosUtils";
import BaseSelect from "../gerais/BaseSelect";
import { inputTabelaGestao, selectTabelaGestao } from "./pedidosUi";

function dataInputValue(raw) {
  if (!raw) return "";
  return String(raw).split("T")[0];
}

function valorInputValue(raw) {
  if (raw === null || raw === undefined || raw === "") return "";
  return String(raw);
}

function chaveItens(itens) {
  return (itens || [])
    .map(
      (i) =>
        `${i.id}:${i.material_relatorio_id ?? ""}:${i.grupo_compra_id ?? ""}`,
    )
    .join("|");
}

/**
 * Tabela de materiais na gestão — edição local; grava na API ao sair do campo (blur)
 * ou ao alterar selects/datas. Inputs não são desativados durante o save.
 */
export default function PedidoItensTableGestao({
  itens = [],
  fornecedores = [],
}) {
  const [linhas, setLinhas] = useState(itens);
  const [salvandoId, setSalvandoId] = useState(null);
  const itensChaveRef = useRef(chaveItens(itens));
  const editandoRef = useRef(new Set());

  useEffect(() => {
    const novaChave = chaveItens(itens);
    if (novaChave === itensChaveRef.current) return;
    itensChaveRef.current = novaChave;
    if (editandoRef.current.size > 0) return;
    setLinhas(itens);
  }, [itens]);

  const salvarCampo = useCallback(async (itemId, campos) => {
    setSalvandoId(itemId);
    try {
      await api.updateObraPedidoItemGestao(itemId, campos);
    } catch (e) {
      console.error("[PedidoItensTableGestao] salvar:", e);
    } finally {
      setSalvandoId(null);
    }
  }, []);

  const atualizarLinha = (itemId, patch) => {
    setLinhas((prev) =>
      prev.map((row) => (row.id === itemId ? { ...row, ...patch } : row)),
    );
  };

  const marcarEditando = (itemId, campo) => {
    editandoRef.current.add(`${itemId}:${campo}`);
  };

  const desmarcarEditando = (itemId, campo) => {
    editandoRef.current.delete(`${itemId}:${campo}`);
  };

  const salvarNoBlur = (itemId, campo, campos) => {
    desmarcarEditando(itemId, campo);
    salvarCampo(itemId, campos);
  };

  if (!linhas.length) {
    return (
      <p className="text-sm text-text-muted">Nenhum material neste pedido.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-primary/35">
      <table className="w-full min-w-[920px] border-collapse text-center text-sm">
        <thead>
          <tr className="border-b border-border-primary/30 bg-[#FAFAFA]">
            {[
              "Material",
              "Qtd.",
              "Un.",
              "Entrega",
              "Fornecedor",
              "Valor (R$)",
              "Data pagamento",
            ].map((label) => (
              <th
                key={label}
                className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((item, idx) => {
            const salvando = salvandoId === item.id;

            return (
              <tr
                key={item.id ?? `item-${idx}`}
                className="border-b border-border-primary/20 last:border-0"
              >
                <td className="px-3 py-2 align-middle">
                  <input
                    type="text"
                    value={item.material ?? ""}
                    disabled={!item.id}
                    onFocus={() => marcarEditando(item.id, "material")}
                    onChange={(e) => {
                      atualizarLinha(item.id, {
                        material: normalizarNomeMaterial(e.target.value),
                      });
                    }}
                    onBlur={(e) => {
                      salvarNoBlur(item.id, "material", {
                        material: normalizarNomeMaterial(e.target.value),
                      });
                    }}
                    className={inputTabelaGestao}
                  />
                </td>
                <td className="px-3 py-2 align-middle">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantidade ?? ""}
                    disabled={!item.id}
                    onFocus={() => marcarEditando(item.id, "quantidade")}
                    onChange={(e) => {
                      atualizarLinha(item.id, { quantidade: e.target.value });
                    }}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      salvarNoBlur(item.id, "quantidade", { quantidade: val });
                    }}
                    className={`${inputTabelaGestao} max-w-[5rem] mx-auto`}
                  />
                </td>
                <td className="px-3 py-2 align-middle">
                  <BaseSelect
                    size="compact"
                    searchable={false}
                    value={item.unidade || "Un."}
                    disabled={!item.id}
                    onChange={(e) => {
                      const val = e.target.value;
                      atualizarLinha(item.id, { unidade: val });
                      salvarCampo(item.id, { unidade: val });
                    }}
                    className={`${selectTabelaGestao} max-w-[5.5rem] mx-auto`}
                    options={UNIDADES_MEDIDA_PEDIDO.map((u) => ({
                      value: u,
                      label: u,
                    }))}
                  />
                </td>
                <td className="px-3 py-2 align-middle">
                  <input
                    type="date"
                    value={dataInputValue(item.data_entrega)}
                    disabled={!item.id}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      atualizarLinha(item.id, { data_entrega: val });
                      salvarCampo(item.id, { data_entrega: val });
                    }}
                    className={`${inputTabelaGestao} max-w-[9.5rem] mx-auto`}
                  />
                </td>
                <td className="px-3 py-2 align-middle">
                  <BaseSelect
                    size="compact"
                    searchable
                    value={item.fornecedor_id ?? ""}
                    disabled={!item.id}
                    onChange={(e) => {
                      const val = e.target.value || null;
                      atualizarLinha(item.id, { fornecedor_id: val });
                      salvarCampo(item.id, { fornecedor_id: val });
                    }}
                    className={selectTabelaGestao}
                    options={[
                      { value: "", label: "—" },
                      ...fornecedores.map((f) => ({
                        value: String(f.id),
                        label: f.nome,
                      })),
                    ]}
                  />
                </td>
                <td className="px-3 py-2 align-middle">
                  <div className="relative mx-auto flex max-w-[6.5rem] items-center justify-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="—"
                      value={valorInputValue(item.valor)}
                      disabled={!item.id}
                      onFocus={() => marcarEditando(item.id, "valor")}
                      onChange={(e) => {
                        const val = e.target.value;
                        atualizarLinha(item.id, {
                          valor: val === "" ? null : val,
                        });
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        salvarNoBlur(item.id, "valor", {
                          valor: val === "" ? null : val,
                        });
                      }}
                      className={inputTabelaGestao}
                      title={
                        item.valor != null && item.valor !== ""
                          ? formatarMoeda(item.valor)
                          : undefined
                      }
                    />
                    {salvando ? (
                      <Loader2 className="pointer-events-none absolute -right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-accent-primary/70" />
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2 align-middle">
                  <div className="relative mx-auto flex max-w-[9.5rem] items-center justify-center">
                    <input
                      type="date"
                      value={dataInputValue(item.data_pagamento)}
                      disabled={!item.id}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        atualizarLinha(item.id, { data_pagamento: val });
                        salvarCampo(item.id, { data_pagamento: val });
                      }}
                      className={inputTabelaGestao}
                    />
                    {salvando ? (
                      <Loader2 className="pointer-events-none absolute -right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-accent-primary/70" />
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
