import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  FileDown,
  Layers,
  Loader2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { api } from "../../services/api";
import {
  EMITENTE_ORDEM_MONTEZUMA,
  getEmitenteOrdemOpcoes,
  labelEmitenteGrupo,
  STATUS_GRUPO_COMPRA_OPCOES,
} from "../../constants/pedidos";
import { getCorStatusMaterial } from "../../pages/obras/detalhe/utils/formatters";
import { formatarQuantidadePedido } from "../../utils/pedidosUtils";
import { gerarPdfOrdemCompra } from "../../utils/pedidosOrdemCompraPdf";
import { abrirPdfEmNovaAba } from "../../utils/pdfPreview";
import ButtonDefault from "../gerais/ButtonDefault";
import BaseSelect from "../gerais/BaseSelect";
import PedidoSecaoPainel from "./PedidoSecaoPainel";
import {
  btnAccentPremium,
  btnOutlinePremium,
  pedidoSubpainelClass,
  pedidoSubpainelTituloClass,
  selectPremium,
} from "./pedidosUi";

/**
 * @param {{ pedido: object, obra?: object, onAtualizarPedido?: () => void }} props
 */
export default function PedidoOrdensCompra({
  pedido,
  obra,
  onAtualizarPedido,
}) {
  const [grupos, setGrupos] = useState([]);
  const [itensSemGrupo, setItensSemGrupo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [emitente, setEmitente] = useState(EMITENTE_ORDEM_MONTEZUMA);
  const [fornecedorId, setFornecedorId] = useState("");
  const [fornecedores, setFornecedores] = useState([]);
  const [gerando, setGerando] = useState(false);
  const [obraCompleta, setObraCompleta] = useState(obra ?? null);
  const [salvandoGrupoId, setSalvandoGrupoId] = useState(null);

  const carregar = useCallback(async () => {
    if (!pedido?.id) return;
    setLoading(true);
    setErro(null);
    try {
      const dados = await api.getPedidoGruposCompra(pedido.id);
      setGrupos(dados.grupos || []);
      setItensSemGrupo(dados.itensSemGrupo || []);
      setSelecionados(new Set());
    } catch (e) {
      setErro(e?.message || "Não foi possível carregar ordens de compra.");
    } finally {
      setLoading(false);
    }
  }, [pedido?.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    api
      .getFornecedoresSimples()
      .then((lista) => setFornecedores(lista || []))
      .catch(() => setFornecedores([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const resolverObra = async () => {
      if (obra?.clientes != null || obra?.cliente) {
        setObraCompleta(obra);
        return;
      }
      if (!pedido?.obra_id) {
        setObraCompleta(null);
        return;
      }
      try {
        const dados = await api.getObraById(pedido.obra_id);
        if (!cancelled) setObraCompleta(dados);
      } catch {
        if (!cancelled) setObraCompleta(obra ?? null);
      }
    };
    resolverObra();
    return () => {
      cancelled = true;
    };
  }, [obra, pedido?.obra_id]);

  const opcoesEmitente = useMemo(
    () => getEmitenteOrdemOpcoes(obraCompleta),
    [obraCompleta],
  );

  const itensDisponiveis = useMemo(
    () => itensSemGrupo.filter((i) => i.grupo_compra_id == null),
    [itensSemGrupo],
  );

  const toggleItem = (id) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGerarOrdens = async () => {
    if (!pedido?.id || selecionados.size === 0) return;
    setGerando(true);
    setErro(null);
    try {
      const resultado = await api.criarOrdensCompra({
        pedidoId: pedido.id,
        emitente,
        itemIds: [...selecionados],
        fornecedorId: fornecedorId || null,
        separarPorItem: false,
      });
      setGrupos(resultado.grupos || []);
      setItensSemGrupo(resultado.itensSemGrupo || []);
      setSelecionados(new Set());
      await onAtualizarPedido?.();
    } catch (e) {
      setErro(e?.message || "Não foi possível gerar a ordem de compra.");
    } finally {
      setGerando(false);
    }
  };

  const handleStatusGrupo = async (grupoId, novoStatus) => {
    setSalvandoGrupoId(grupoId);
    setErro(null);
    try {
      const resultado = await api.updateGrupoCompraStatus(grupoId, novoStatus);
      setGrupos(resultado.grupos || []);
      setItensSemGrupo(resultado.itensSemGrupo || []);
      if (novoStatus === "Comprado") {
        await onAtualizarPedido?.();
      }
    } catch (e) {
      setErro(e?.message || "Não foi possível atualizar o grupo.");
    } finally {
      setSalvandoGrupoId(null);
    }
  };

  const fornecedorDoGrupo = (grupo) => {
    const item = (grupo.itens || [])[0];
    return item?.fornecedor_id ?? "";
  };

  const handleFornecedorGrupo = async (grupoId, novoFornecedorId) => {
    setSalvandoGrupoId(grupoId);
    setErro(null);
    try {
      const resultado = await api.updateGrupoCompraFornecedor(
        grupoId,
        novoFornecedorId || null,
      );
      setGrupos(resultado.grupos || []);
      setItensSemGrupo(resultado.itensSemGrupo || []);
    } catch (e) {
      setErro(e?.message || "Não foi possível atualizar o fornecedor.");
    } finally {
      setSalvandoGrupoId(null);
    }
  };

  const handleRemoverItemOrdem = async (itemId) => {
    setSalvandoGrupoId(itemId);
    setErro(null);
    try {
      const resultado = await api.removerItemDaOrdemCompra(itemId);
      setGrupos(resultado.grupos || []);
      setItensSemGrupo(resultado.itensSemGrupo || []);
      await onAtualizarPedido?.();
    } catch (e) {
      setErro(e?.message || "Não foi possível remover o material da ordem.");
    } finally {
      setSalvandoGrupoId(null);
    }
  };

  const handleVisualizarPdf = (grupo) => {
    abrirPdfEmNovaAba(
      () =>
        gerarPdfOrdemCompra({
          grupo,
          pedido,
          obra: obraCompleta,
          retornarBlob: true,
        }),
      `ORDEM_COMPRA_${grupo.numero}.pdf`,
    ).catch((e) => {
      setErro(e?.message || "Não foi possível abrir o PDF.");
    });
  };

  if (loading) {
    return (
      <PedidoSecaoPainel
        titulo="Ordens de compra"
        descricao="A carregar grupos e materiais disponíveis…"
        icon={<ShoppingCart className="h-5 w-5" />}
        iconTheme="emerald"
      >
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent-primary" />A
          carregar ordens de compra…
        </p>
      </PedidoSecaoPainel>
    );
  }

  return (
    <PedidoSecaoPainel
      titulo="Ordens de compra"
      descricao="Selecione materiais, fornecedor e emitente. Ao marcar a ordem como Comprado, os itens dessa ordem são lançados na obra com status Aguardando entrega."
      icon={<ShoppingCart className="h-5 w-5" />}
      iconTheme="emerald"
    >
      {erro ? (
        <p className="mb-5 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
          {erro}
        </p>
      ) : null}

      {itensDisponiveis.length > 0 ? (
        <div className={`${pedidoSubpainelClass} mb-6`}>
          <h4 className={`${pedidoSubpainelTituloClass} mb-3`}>
            Nova ordem de compra
          </h4>
          <ul className="mb-5 max-h-48 space-y-2 overflow-y-auto custom-scrollbar pr-1">
            {itensDisponiveis.map((item) => (
              <li key={item.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-primary/25 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-accent-primary/25 hover:bg-[#FAFAFA]">
                  <input
                    type="checkbox"
                    checked={selecionados.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="mt-1 h-4 w-4 rounded border-border-primary text-accent-primary focus:ring-accent-primary/30"
                  />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold text-text-primary">
                      {item.material}
                    </span>
                    <span className="text-text-muted">
                      {" "}
                      · {formatarQuantidadePedido(item.quantidade)}{" "}
                      {item.unidade || "Un."}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 gap-4 border-t border-border-primary/20 pt-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={pedidoSubpainelTituloClass}>
                Emitente no documento
              </span>
              <BaseSelect
                searchable={false}
                value={emitente}
                onChange={(e) => setEmitente(e.target.value)}
                className={selectPremium}
                options={opcoesEmitente.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={pedidoSubpainelTituloClass}>Fornecedor</span>
              <BaseSelect
                searchable
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
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
          </div>

          <div className="mt-5 flex justify-end border-t border-border-primary/20 pt-4">
            <ButtonDefault
              type="button"
              disabled={gerando || selecionados.size === 0}
              onClick={handleGerarOrdens}
              className={`${btnAccentPremium} w-full sm:!w-full`}
            >
              <span className="inline-flex items-center gap-2">
                {gerando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Gerar ordem de compra
              </span>
            </ButtonDefault>
          </div>
        </div>
      ) : (
        <p className="mb-6 rounded-xl border border-dashed border-border-primary/40 bg-[#FAFAFA] px-4 py-3 text-xs text-text-muted">
          Todos os materiais deste pedido já estão em ordens de compra.
        </p>
      )}

      {grupos.length > 0 ? (
        <div className="space-y-4">
          <h4
            className={`${pedidoSubpainelTituloClass} flex items-center gap-2`}
          >
            <Layers className="h-4 w-4" />
            Ordens geradas ({grupos.length})
          </h4>
          {grupos.map((grupo) => (
            <article key={grupo.id} className={pedidoSubpainelClass}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-primary/20 pb-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    Ordem #{grupo.numero}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Emitente: {labelEmitenteGrupo(grupo.emitente, obraCompleta)}{" "}
                    · {(grupo.itens || []).length} material
                    {(grupo.itens || []).length !== 1 ? "is" : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getCorStatusMaterial(grupo.status)}`}
                >
                  {grupo.status}
                </span>
              </div>

              <ul className="my-4 space-y-1.5 text-sm text-text-primary">
                {(grupo.itens || []).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-border-primary/15"
                  >
                    <span className="min-w-0 flex-1 font-medium">
                      {item.material}
                    </span>
                    <span className="shrink-0 text-text-muted">
                      {formatarQuantidadePedido(item.quantidade)}{" "}
                      {item.unidade || "Un."}
                    </span>
                    <button
                      type="button"
                      title="Remover só este material da ordem"
                      disabled={salvandoGrupoId === item.id}
                      onClick={() => handleRemoverItemOrdem(item.id)}
                      className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger-soft/50 hover:text-danger-primary disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-1 gap-3 border-t border-border-primary/20 pt-4 sm:grid-cols-2">
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className={pedidoSubpainelTituloClass}>Fornecedor</span>
                  <BaseSelect
                    searchable
                    value={fornecedorDoGrupo(grupo)}
                    disabled={salvandoGrupoId === grupo.id}
                    onChange={(e) =>
                      handleFornecedorGrupo(grupo.id, e.target.value)
                    }
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
                <label className="flex min-w-0 flex-col gap-1.5">
                  <span className={pedidoSubpainelTituloClass}>
                    Status da ordem
                  </span>
                  <BaseSelect
                    searchable={false}
                    value={grupo.status || "Pendente"}
                    disabled={salvandoGrupoId === grupo.id}
                    onChange={(e) =>
                      handleStatusGrupo(grupo.id, e.target.value)
                    }
                    className={selectPremium}
                    options={STATUS_GRUPO_COMPRA_OPCOES.map((s) => ({
                      value: s,
                      label: s,
                    }))}
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end border-t border-border-primary/20 pt-4">
                <ButtonDefault
                  type="button"
                  onClick={() => handleVisualizarPdf(grupo)}
                  className={`${btnOutlinePremium} w-full sm:!w-full shrink-0`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Ver PDF
                  </span>
                </ButtonDefault>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </PedidoSecaoPainel>
  );
}
