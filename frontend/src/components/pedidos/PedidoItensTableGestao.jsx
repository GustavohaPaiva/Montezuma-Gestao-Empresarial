import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { api } from "../../services/api";
import { UNIDADES_MEDIDA_PEDIDO } from "../../constants/pedidos";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { etapasParaSelectOptions } from "../../pages/obras/detalhe/utils/etapasLancamento";
import {
  normalizarNomeMaterial,
  validarItemPedido,
} from "../../utils/pedidosUtils";
import BaseSelect from "../gerais/BaseSelect";
import BaseDatePicker from "../gerais/BaseDatePicker";
import ButtonDefault from "../gerais/ButtonDefault";
import BaseModal from "../gerais/BaseModal";
import BaseButton from "../gerais/BaseButton";
import {
  btnAccentPremium,
  inputPremium,
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

function itemJaComprado(item) {
  return item?.material_relatorio_id != null;
}

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
 * Tabela de materiais na gestão — edição local; grava na API ao sair do campo (blur)
 * ou ao alterar selects/datas. Inputs não são desativados durante o save.
 */
export default function PedidoItensTableGestao({
  itens = [],
  fornecedores = [],
  obra = null,
  pedidoId,
  onAtualizarPedido,
}) {
  const [linhas, setLinhas] = useState(itens);
  const [salvandoId, setSalvandoId] = useState(null);
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [fornecedorMassa, setFornecedorMassa] = useState("");
  const [etapaMassa, setEtapaMassa] = useState("");
  const [aplicandoMassa, setAplicandoMassa] = useState(false);
  const [erroMassa, setErroMassa] = useState(null);
  const [material, setMaterial] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("Un.");
  const [dataEntrega, setDataEntrega] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [erroAcao, setErroAcao] = useState(null);
  const [itemParaExcluir, setItemParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
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

  const aplicarPedidoAtualizado = async (atualizado) => {
    if (atualizado?.itens) {
      itensChaveRef.current = chaveItens(atualizado.itens);
      setLinhas(atualizado.itens);
      setSelecionados(new Set());
    }
    if (onAtualizarPedido) await onAtualizarPedido();
  };

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

  const itemValido = validarItemPedido({
    material,
    quantidade,
    unidade,
    data_entrega: dataEntrega,
  });

  const adicionarMaterial = async () => {
    const parsed = validarItemPedido({
      material,
      quantidade,
      unidade,
      data_entrega: dataEntrega,
    });
    if (!parsed || pedidoId == null) {
      setErroAcao("Preencha material, quantidade, unidade e data de entrega.");
      return;
    }
    setAdicionando(true);
    setErroAcao(null);
    try {
      const atualizado = await api.addObraPedidoItem(pedidoId, parsed);
      setMaterial("");
      setQuantidade("");
      setUnidade("Un.");
      setDataEntrega("");
      await aplicarPedidoAtualizado(atualizado);
    } catch (e) {
      setErroAcao(e?.message || "Não foi possível adicionar o material.");
    } finally {
      setAdicionando(false);
    }
  };

  const confirmarExclusaoItem = async () => {
    if (!itemParaExcluir?.id) return;
    setExcluindo(true);
    setErroAcao(null);
    try {
      const atualizado = await api.deleteObraPedidoItem(itemParaExcluir.id);
      setItemParaExcluir(null);
      await aplicarPedidoAtualizado(atualizado);
    } catch (e) {
      setErroAcao(e?.message || "Não foi possível excluir o material.");
      setItemParaExcluir(null);
    } finally {
      setExcluindo(false);
    }
  };

  const idsSelecionaveis = linhas.filter((i) => i.id).map((i) => i.id);
  const todosSelecionados =
    idsSelecionaveis.length > 0 &&
    idsSelecionaveis.every((id) => selecionados.has(id));
  const ehUltimoItem = linhas.filter((i) => i.id).length <= 1;

  return (
    <div className="space-y-4">
      <div className={pedidoSubpainelClass}>
        <p className={`${pedidoSubpainelTituloClass} mb-3`}>Adicionar material</p>
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
            <BaseSelect
              searchable={false}
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className={selectPremium}
              options={UNIDADES_MEDIDA_PEDIDO.map((u) => ({
                value: u,
                label: u,
              }))}
            />
          </CampoForm>
          <CampoForm label="Data de entrega" className="md:col-span-6">
            <BaseDatePicker
              value={dataEntrega}
              onChange={(e) => setDataEntrega(e.target.value)}
              triggerClassName={inputPremium}
            />
          </CampoForm>
        </div>
        <div className="mt-4 flex justify-end">
          <ButtonDefault
            type="button"
            onClick={adicionarMaterial}
            disabled={!itemValido || adicionando || pedidoId == null}
            className={`${btnAccentPremium} !w-full`}
          >
            <span className="inline-flex items-center gap-2">
              {adicionando ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 shrink-0" />
              )}
              {adicionando ? "A adicionar…" : "Adicionar material"}
            </span>
          </ButtonDefault>
        </div>
      </div>

      {erroAcao ? (
        <p className="rounded-lg border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-xs text-danger-primary">
          {erroAcao}
        </p>
      ) : null}

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

      {!linhas.length ? (
        <p className="rounded-xl border border-dashed border-border-primary/40 bg-[#FAFAFA] px-4 py-8 text-center text-xs text-text-muted">
          Nenhum material neste pedido. Adicione o primeiro acima.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border-primary/35">
          <table className="w-full min-w-[1100px] border-collapse text-center text-sm">
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
                  "Ações",
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
                const comprado = itemJaComprado(item);
                const bloquearExclusao = comprado || ehUltimoItem;
                const tituloExclusao = comprado
                  ? "Este material já foi comprado e não pode ser excluído."
                  : ehUltimoItem
                    ? "Não é possível excluir o último material. Exclua o pedido inteiro."
                    : "Excluir material";

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
                        className={`${inputTabelaGestao} mx-auto max-w-[5rem]`}
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
                        className={`${selectTabelaGestao} mx-auto max-w-[5.5rem]`}
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
                        className={`${inputTabelaGestao} mx-auto max-w-[9.5rem]`}
                        wrapperClassName="mx-auto max-w-[9.5rem]"
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
                    <td className="px-3 py-2 align-middle">
                      <button
                        type="button"
                        disabled={!item.id || bloquearExclusao || excluindo}
                        onClick={() => setItemParaExcluir(item)}
                        title={tituloExclusao}
                        aria-label={tituloExclusao}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-soft/50 hover:text-danger-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <BaseModal
        isOpen={Boolean(itemParaExcluir)}
        onClose={() => {
          if (!excluindo) setItemParaExcluir(null);
        }}
        title="Confirmar exclusão"
        size="sm"
      >
        <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/70 to-white p-4 shadow-[0_5px_18px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700/80">
            Atenção
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Tem certeza que deseja excluir o material{" "}
            <span className="font-semibold text-text-primary">
              {itemParaExcluir?.material || "selecionado"}
            </span>
            ?
            {itemParaExcluir?.grupo_compra_id != null
              ? " Ele também será removido da ordem de compra."
              : ""}{" "}
            Esta ação não pode ser desfeita.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="ghost"
            onClick={() => setItemParaExcluir(null)}
            disabled={excluindo}
            className="w-full sm:w-auto"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={confirmarExclusaoItem}
            isLoading={excluindo}
            className="w-full sm:w-auto"
          >
            Confirmar exclusão
          </BaseButton>
        </div>
      </BaseModal>
    </div>
  );
}
