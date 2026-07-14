import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../services/api";
import { UNIDADES_MEDIDA_PEDIDO } from "../../constants/pedidos";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { etapasParaSelectOptions } from "../../pages/obras/detalhe/utils/etapasLancamento";
import { normalizarNomeMaterial } from "../../utils/pedidosUtils";
import BaseSelect from "../gerais/BaseSelect";
import BaseDatePicker from "../gerais/BaseDatePicker";
import ButtonDefault from "../gerais/ButtonDefault";
import {
  btnAccentPremium,
  inputTabelaGestao,
  pedidoSubpainelClass,
  pedidoSubpainelTituloClass,
  selectPremium,
  selectTabelaGestao,
} from "./pedidosUi";

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
        `${i.id}:${i.material_relatorio_id ?? ""}:${i.grupo_compra_id ?? ""}:${i.etapa_nome ?? ""}`,
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
  obra = null,
}) {
  const [linhas, setLinhas] = useState(itens);
  const [salvandoId, setSalvandoId] = useState(null);
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [fornecedorMassa, setFornecedorMassa] = useState("");
  const [etapaMassa, setEtapaMassa] = useState("");
  const [aplicandoMassa, setAplicandoMassa] = useState(false);
  const [erroMassa, setErroMassa] = useState(null);
  const itensChaveRef = useRef(chaveItens(itens));
  const editandoRef = useRef(new Set());

  useEffect(() => {
    const novaChave = chaveItens(itens);
    if (novaChave === itensChaveRef.current) return;
    itensChaveRef.current = novaChave;
    if (editandoRef.current.size > 0) return;
    setLinhas(itens);
    setSelecionados(new Set());
  }, [itens]);

  const opcoesEtapa = etapasParaSelectOptions(obra);

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

  const toggleSelecao = (itemId) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleTodos = () => {
    const ids = linhas.filter((i) => i.id).map((i) => i.id);
    setSelecionados((prev) => {
      if (prev.size === ids.length) return new Set();
      return new Set(ids);
    });
  };

  const aplicarMassa = async (tipo) => {
    if (!selecionados.size) return;
    setAplicandoMassa(true);
    setErroMassa(null);
    try {
      const campos =
        tipo === "fornecedor"
          ? { fornecedor_id: fornecedorMassa || null }
          : { etapa_nome: etapaMassa || null };

      if (tipo === "fornecedor" && !fornecedorMassa) {
        setErroMassa("Selecione um fornecedor para aplicar.");
        return;
      }
      if (tipo === "etapa" && !etapaMassa) {
        setErroMassa("Selecione uma etapa para aplicar.");
        return;
      }

      await api.updateObraPedidoItensGestaoInIds([...selecionados], campos);

      setLinhas((prev) =>
        prev.map((row) =>
          selecionados.has(row.id) ? { ...row, ...campos } : row,
        ),
      );
      setSelecionados(new Set());
    } catch (e) {
      setErroMassa(e?.message || "Não foi possível aplicar aos selecionados.");
    } finally {
      setAplicandoMassa(false);
    }
  };

  if (!linhas.length) {
    return (
      <p className="text-sm text-text-muted">Nenhum material neste pedido.</p>
    );
  }

  const idsSelecionaveis = linhas.filter((i) => i.id).map((i) => i.id);
  const todosSelecionados =
    idsSelecionaveis.length > 0 &&
    idsSelecionaveis.every((id) => selecionados.has(id));

  return (
    <div className="space-y-4">
      {selecionados.size > 0 ? (
        <div className={pedidoSubpainelClass}>
          <p className={`${pedidoSubpainelTituloClass} mb-3`}>
            {selecionados.size} material
            {selecionados.size !== 1 ? "is" : ""} selecionado
            {selecionados.size !== 1 ? "s" : ""}
          </p>
          {erroMassa ? (
            <p className="mb-3 rounded-lg border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-xs text-danger-primary">
              {erroMassa}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className={pedidoSubpainelTituloClass}>Fornecedor</span>
                <BaseSelect
                  searchable
                  value={fornecedorMassa}
                  disabled={aplicandoMassa}
                  onChange={(e) => setFornecedorMassa(e.target.value)}
                  className={selectPremium}
                  options={[
                    { value: "", label: "— Selecionar fornecedor —" },
                    ...fornecedores.map((f) => ({
                      value: String(f.id),
                      label: f.nome,
                    })),
                  ]}
                />
              </label>
              <ButtonDefault
                type="button"
                disabled={aplicandoMassa}
                onClick={() => aplicarMassa("fornecedor")}
                className={`${btnAccentPremium} w-full shrink-0 sm:!w-auto`}
              >
                Aplicar fornecedor
              </ButtonDefault>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className={pedidoSubpainelTituloClass}>Etapa</span>
                <BaseSelect
                  searchable
                  value={etapaMassa}
                  disabled={aplicandoMassa}
                  onChange={(e) => setEtapaMassa(e.target.value)}
                  className={selectPremium}
                  options={opcoesEtapa}
                />
              </label>
              <ButtonDefault
                type="button"
                disabled={aplicandoMassa}
                onClick={() => aplicarMassa("etapa")}
                className={`${btnAccentPremium} w-full shrink-0 sm:!w-auto`}
              >
                Aplicar etapa
              </ButtonDefault>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-border-primary/35">
        <table className="w-full min-w-[1040px] border-collapse text-center text-sm">
          <thead>
            <tr className="border-b border-border-primary/30 bg-[#FAFAFA]">
              <th className="w-10 px-2 py-3">
                <input
                  type="checkbox"
                  checked={todosSelecionados}
                  onChange={toggleTodos}
                  aria-label="Selecionar todos"
                  className="h-4 w-4 rounded border-border-primary text-accent-primary focus:ring-accent-primary/30"
                />
              </th>
              {[
                "Material",
                "Qtd.",
                "Un.",
                "Entrega",
                "Fornecedor",
                "Etapa",
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
                  <td className="px-2 py-2 align-middle">
                    <input
                      type="checkbox"
                      checked={selecionados.has(item.id)}
                      disabled={!item.id}
                      onChange={() => toggleSelecao(item.id)}
                      aria-label={`Selecionar ${item.material || "material"}`}
                      className="h-4 w-4 rounded border-border-primary text-accent-primary focus:ring-accent-primary/30 disabled:opacity-40"
                    />
                  </td>
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
                        salvarNoBlur(item.id, "quantidade", {
                          quantidade: val,
                        });
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
                    <BaseDatePicker
                      size="compact"
                      value={dataInputValue(item.data_entrega)}
                      disabled={!item.id}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        atualizarLinha(item.id, { data_entrega: val });
                        salvarCampo(item.id, { data_entrega: val });
                      }}
                      className={`${inputTabelaGestao} max-w-[9.5rem] mx-auto`}
                      wrapperClassName="max-w-[9.5rem] mx-auto"
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
                    <BaseSelect
                      size="compact"
                      searchable
                      value={item.etapa_nome ?? ""}
                      disabled={!item.id}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        atualizarLinha(item.id, { etapa_nome: val });
                        salvarCampo(item.id, { etapa_nome: val });
                      }}
                      className={selectTabelaGestao}
                      options={opcoesEtapa}
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
                      <BaseDatePicker
                        size="compact"
                        value={dataInputValue(item.data_pagamento)}
                        disabled={!item.id}
                        onChange={(e) => {
                          const val = e.target.value || null;
                          atualizarLinha(item.id, { data_pagamento: val });
                          salvarCampo(item.id, { data_pagamento: val });
                        }}
                        triggerClassName={inputTabelaGestao}
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
    </div>
  );
}
