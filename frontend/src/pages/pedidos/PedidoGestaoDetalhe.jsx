import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  Package,
  Settings2,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import {
  isGestorPedidos,
  STATUS_PEDIDO_OPCOES,
  STATUS_PEDIDO_PENDENTE,
} from "../../constants/pedidos";
import { getCorStatusMaterial } from "../obras/detalhe/utils/formatters";
import { pedidoStatusFoiAlteradoManual } from "../../utils/pedidosUtils";
import PedidoItensTableGestao from "../../components/pedidos/PedidoItensTableGestao";
import PedidoOrdensCompra from "../../components/pedidos/PedidoOrdensCompra";
import PedidoSecaoPainel from "../../components/pedidos/PedidoSecaoPainel";
import PedidoValorTotal from "../../components/pedidos/PedidoValorTotal";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import BaseSelect from "../../components/gerais/BaseSelect";
import BaseModal from "../../components/gerais/BaseModal";
import BaseButton from "../../components/gerais/BaseButton";
import {
  pedidoDetalheHeaderClass,
  pedidoDetalheIconClass,
  pedidoSecaoClass,
  selectPremium,
} from "../../components/pedidos/pedidosUi";
import { rotuloPedido } from "../../utils/pedidosUtils";

function formatarDataHora(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const DD = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const YYYY = d.getFullYear();
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${DD}/${MM}/${YYYY} às ${HH}:${mm}`;
}

export default function PedidoGestaoDetalhe() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [statusSel, setStatusSel] = useState(STATUS_PEDIDO_PENDENTE);
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [restaurandoAutomatico, setRestaurandoAutomatico] = useState(false);
  const [fornecedores, setFornecedores] = useState([]);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindoPedido, setExcluindoPedido] = useState(false);
  const statusDebounceRef = useRef(null);
  const statusIgnorarRef = useRef(true);

  const autorizado = isGestorPedidos(user);

  const carregar = useCallback(async (opts = {}) => {
    const silencioso = opts?.silencioso === true;
    if (!pedidoId || !autorizado) return;
    const idRequisitado = String(pedidoId);
    if (!silencioso) {
      setLoading(true);
      setErro(null);
      statusIgnorarRef.current = true;
    }
    try {
      const dados = await api.getObraPedidoById(pedidoId);
      if (!dados || String(dados.id) !== idRequisitado) {
        if (!silencioso) {
          setErro("Pedido não encontrado.");
          setPedido(null);
        }
        return;
      }
      statusIgnorarRef.current = true;
      setPedido(dados);
      setStatusSel(dados.status || STATUS_PEDIDO_PENDENTE);
    } catch (e) {
      console.error("[PedidoGestaoDetalhe] carregar:", e);
      if (!silencioso) {
        setErro(e?.message || "Não foi possível carregar o pedido.");
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
      }
      setTimeout(() => {
        statusIgnorarRef.current = false;
      }, 0);
    }
  }, [pedidoId, autorizado]);

  const atualizarPedidoSilencioso = useCallback(() => {
    return carregar({ silencioso: true });
  }, [carregar]);

  const pedidoTemItemComprado = (pedido?.itens || []).some(
    (item) => item.material_relatorio_id != null,
  );

  const pedidoStatusManual = pedidoStatusFoiAlteradoManual(pedido);

  const restaurarStatusAutomatico = async () => {
    if (!pedido?.id) return;
    setRestaurandoAutomatico(true);
    setErro(null);
    statusIgnorarRef.current = true;
    try {
      const atualizado = await api.restaurarStatusPedidoAutomatico(pedido.id);
      if (String(atualizado?.id) !== String(pedidoId)) return;
      setPedido(atualizado);
      setStatusSel(atualizado.status || STATUS_PEDIDO_PENDENTE);
    } catch (e) {
      setErro(e?.message || "Não foi possível restaurar o status automático.");
    } finally {
      setRestaurandoAutomatico(false);
      setTimeout(() => {
        statusIgnorarRef.current = false;
      }, 0);
    }
  };

  const excluirPedido = async () => {
    if (!pedido?.id) return;
    setExcluindoPedido(true);
    setErro(null);
    try {
      await api.deleteObraPedido(pedido.id);
      navigate("/pedidos");
    } catch (e) {
      setErro(e?.message || "Não foi possível excluir o pedido.");
      setConfirmandoExclusao(false);
    } finally {
      setExcluindoPedido(false);
    }
  };

  useEffect(() => {
    statusIgnorarRef.current = true;
    setPedido(null);
    setStatusSel(STATUS_PEDIDO_PENDENTE);
    setErro(null);
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!autorizado) return;
    api
      .getFornecedoresSimples()
      .then((lista) => setFornecedores(lista || []))
      .catch(() => setFornecedores([]));
  }, [autorizado]);

  useEffect(() => {
    if (!autorizado && user) {
      navigate("/", { replace: true });
    }
  }, [autorizado, user, navigate]);

  useEffect(() => {
    if (statusIgnorarRef.current || !pedido?.id || !pedidoId) return;
    if (String(pedido.id) !== String(pedidoId)) return;
    if (statusSel === (pedido.status || "")) return;

    if (statusDebounceRef.current) {
      clearTimeout(statusDebounceRef.current);
    }

    const idSalvar = pedido.id;
    statusDebounceRef.current = setTimeout(async () => {
      setSalvandoStatus(true);
      setErro(null);
      try {
        const atualizado = await api.updateObraPedidoStatus(idSalvar, statusSel);
        if (String(atualizado?.id) !== String(pedidoId)) return;
        setPedido(atualizado);
        statusIgnorarRef.current = true;
        setStatusSel(atualizado.status);
        setTimeout(() => {
          statusIgnorarRef.current = false;
        }, 0);
      } catch (e) {
        setErro(e?.message || "Não foi possível atualizar o status.");
        setStatusSel(pedido.status || STATUS_PEDIDO_PENDENTE);
      } finally {
        setSalvandoStatus(false);
      }
    }, 300);

    return () => {
      if (statusDebounceRef.current) clearTimeout(statusDebounceRef.current);
    };
  }, [statusSel, pedido?.id, pedido?.status, pedidoId]);

  const obra = pedido?.obras;
  const nomeObra =
    obra?.clientes?.nome && obra?.local
      ? `${obra.clientes.nome} · ${obra.local}`
      : obra?.cliente || obra?.local || "—";

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FAFAFA]">
      <header className="sticky top-0 z-[60] shrink-0 border-b border-border-primary/40 bg-[#FAFAFA]/95 shadow-sm backdrop-blur-sm">
        <div className="flex w-full items-center gap-3 px-[5%] py-3">
          <button
            type="button"
            onClick={() => navigate("/pedidos")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-primary/50 bg-white shadow-sm"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Gestão de pedidos
            </p>
            <h1 className="truncate text-sm font-bold sm:text-base">
              {pedido ? rotuloPedido(pedido) : "Pedido"}
            </h1>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-[5%] py-6">
        {loading ? (
          <LoadingPainel
            titulo="Carregando pedido"
            descricao="Buscando materiais, status e ordens de compra deste pedido."
            icon={<Package className="h-7 w-7" strokeWidth={2} />}
          />
        ) : erro && !pedido ? (
          <div className="rounded-2xl border border-danger-primary/30 bg-danger-soft/40 p-6 text-center text-sm text-danger-primary">
            {erro}
          </div>
        ) : pedido ? (
          <div className="flex w-full flex-col gap-6">
            <article className={pedidoSecaoClass}>
              <div className={pedidoDetalheHeaderClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className={pedidoDetalheIconClass}>
                      <Package className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold">{rotuloPedido(pedido)}</h2>
                      <p className="mt-1 text-sm text-text-muted">{nomeObra}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                        <User className="h-3.5 w-3.5" />
                        {pedido.solicitante_nome || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getCorStatusMaterial(pedido.status)}`}
                    >
                      {pedido.status}
                    </span>
                    <BaseButton
                      variant="danger"
                      size="sm"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => setConfirmandoExclusao(true)}
                      disabled={pedidoTemItemComprado || excluindoPedido}
                      title={
                        pedidoTemItemComprado
                          ? "Este pedido tem materiais já comprados e não pode ser excluído."
                          : "Excluir pedido"
                      }
                    >
                      Excluir pedido
                    </BaseButton>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <p className="text-xs text-text-muted">
                    Criado em {formatarDataHora(pedido.created_at)}
                  </p>
                  <PedidoValorTotal
                    itens={pedido.itens || []}
                    desconto={pedido}
                    variant="header"
                  />
                </div>
                {pedido.obra_id ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/obrasD/${pedido.obra_id}`, {
                        state: { secao: "pedidos" },
                      })
                    }
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-primary hover:underline"
                  >
                    Ver na obra
                    <ExternalLink className="h-3 w-3" />
                  </button>
                ) : null}
              </div>
            </article>

            {erro ? (
              <p className="rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
                {erro}
              </p>
            ) : null}

            <PedidoSecaoPainel
              titulo="Materiais do pedido"
              descricao="Edite qualquer coluna diretamente na tabela. Selecione linhas para atribuir fornecedor ou etapa em massa. A sincronização com a obra ocorre ao marcar cada ordem de compra como Comprado."
              icon={<ClipboardList className="h-5 w-5" />}
              iconTheme="blue"
            >
              <PedidoItensTableGestao
                itens={pedido.itens || []}
                fornecedores={fornecedores}
                obra={obra}
                pedidoId={pedido.id}
                pedido={pedido}
                onAtualizarPedido={atualizarPedidoSilencioso}
              />
            </PedidoSecaoPainel>

            <PedidoSecaoPainel
              titulo="Status do pedido"
              descricao={
                pedidoStatusManual
                  ? "Status definido manualmente. Deixa de acompanhar as ordens de compra até voltar ao automático."
                  : "Acompanha automaticamente o status mais atrasado das ordens de compra. Alterar aqui passa a ser manual."
              }
              icon={<Settings2 className="h-5 w-5" />}
              iconTheme="amber"
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Status atual
                </span>
                <BaseSelect
                  searchable={false}
                  value={statusSel}
                  onChange={(e) => setStatusSel(e.target.value)}
                  disabled={salvandoStatus || restaurandoAutomatico}
                  className={selectPremium}
                  options={STATUS_PEDIDO_OPCOES.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
              </label>
              {pedidoStatusManual ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-text-muted">
                    Alteração manual — as ordens de compra já não atualizam este status.
                  </p>
                  <BaseButton
                    variant="ghost"
                    onClick={restaurarStatusAutomatico}
                    disabled={restaurandoAutomatico || salvandoStatus}
                    isLoading={restaurandoAutomatico}
                    className="w-full sm:w-auto"
                  >
                    Voltar ao automático
                  </BaseButton>
                </div>
              ) : (
                <p className="mt-2 text-xs text-text-muted">
                  Quando todas as ordens avançam juntas, o pedido segue. Se uma
                  ficar para trás, o pedido fica com o status dessa ordem.
                </p>
              )}
            </PedidoSecaoPainel>

            <PedidoOrdensCompra
              pedido={pedido}
              obra={obra}
              onAtualizarPedido={atualizarPedidoSilencioso}
            />
          </div>
        ) : null}
      </main>

      <BaseModal
        isOpen={confirmandoExclusao}
        onClose={() => {
          if (!excluindoPedido) setConfirmandoExclusao(false);
        }}
        title="Confirmar exclusão"
        size="sm"
      >
        <div className="rounded-2xl border border-rose-200/60 bg-gradient-to-br from-rose-50/70 to-white p-4 shadow-[0_5px_18px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700/80">
            Atenção
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Tem certeza que deseja excluir o pedido{" "}
            <span className="font-semibold text-text-primary">
              {pedido ? rotuloPedido(pedido) : ""}
            </span>
            ? Ordens de compra ainda não compradas serão removidas. Esta ação
            não pode ser desfeita.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="ghost"
            onClick={() => setConfirmandoExclusao(false)}
            disabled={excluindoPedido}
            className="w-full sm:w-auto"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={excluirPedido}
            isLoading={excluindoPedido}
            className="w-full sm:w-auto"
          >
            Confirmar exclusão
          </BaseButton>
        </div>
      </BaseModal>
    </div>
  );
}
