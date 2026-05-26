import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, Pencil, User } from "lucide-react";
import LoadingPainel from "../../../components/gerais/LoadingPainel";
import { api } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { useObraById } from "./hooks/useObraById";
import { getCorStatusMaterial } from "./utils/formatters";
import { rotuloPedido } from "../../../utils/pedidosUtils";
import { isPedidoEditavel } from "../../../constants/pedidos";
import PedidoItensTable from "../../../components/pedidos/PedidoItensTable";
import PedidoFormComposer from "../../../components/pedidos/PedidoFormComposer";
import ButtonDefault from "../../../components/gerais/ButtonDefault";
import {
  btnOutlinePremium,
  pedidoDetalheHeaderClass,
  pedidoDetalheIconClass,
  pedidoSecaoToolbarClass,
} from "../../../components/pedidos/pedidosUi";

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

export default function PedidoObraDetalhe() {
  const { id: obraId, pedidoId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { obra } = useObraById(obraId);

  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [editando, setEditando] = useState(
    () => location.state?.editar === true,
  );
  const [salvando, setSalvando] = useState(false);

  const carregarPedido = useCallback(async () => {
    if (!pedidoId) return;
    setLoading(true);
    setErro(null);
    try {
      const dados = await api.getObraPedidoById(pedidoId);
      if (!dados) {
        setErro("Pedido não encontrado.");
        setPedido(null);
        return;
      }
      if (obraId != null && String(dados.obra_id) !== String(obraId)) {
        setErro("Este pedido não pertence a esta obra.");
        setPedido(null);
        return;
      }
      setPedido(dados);
      if (!isPedidoEditavel(dados.status)) setEditando(false);
    } catch (e) {
      console.error("[PedidoObraDetalhe] carregar:", e);
      setErro(e?.message || "Não foi possível carregar o pedido.");
      setPedido(null);
    } finally {
      setLoading(false);
    }
  }, [pedidoId, obraId]);

  useEffect(() => {
    carregarPedido();
  }, [carregarPedido]);

  const voltarParaPedidos = () => {
    navigate(`/obrasD/${obraId}`, { state: { secao: "pedidos" } });
  };

  const handleSalvar = async (itens) => {
    if (!pedido?.id) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await api.updateObraPedido(pedido.id, { itens });
      setPedido(atualizado);
      setEditando(false);
    } catch (e) {
      setErro(e?.message || "Não foi possível guardar.");
    } finally {
      setSalvando(false);
    }
  };

  const nomeCliente = obra?.clientes?.nome || obra?.cliente;
  const localObra = obra?.local;
  const status = pedido?.status || "Pendente";
  const podeEditar = pedido && isPedidoEditavel(pedido.status) && user;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#FAFAFA]">
      <header className="sticky top-0 z-[60] shrink-0 border-b border-border-primary/40 bg-[#FAFAFA]/95 shadow-sm backdrop-blur-sm">
        <div className="flex w-full items-center gap-3 px-[5%] py-3">
          <button
            type="button"
            onClick={voltarParaPedidos}
            aria-label="Voltar aos pedidos"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-primary/50 bg-white text-text-primary shadow-sm transition-all hover:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
              Detalhe do pedido
            </p>
            <h1 className="truncate text-sm font-bold text-text-primary sm:text-base">
              {nomeCliente && localObra ? (
                <>
                  <span className="text-accent-primary">{nomeCliente}</span>
                  <span className="text-text-muted"> · </span>
                  {localObra}
                </>
              ) : (
                "Obra"
              )}
            </h1>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-[5%] py-6">
        {loading ? (
          <LoadingPainel
            titulo="Carregando pedido"
            descricao="Buscando materiais e informações deste pedido."
            icon={<Package className="h-7 w-7" strokeWidth={2} />}
          />
        ) : erro && !pedido ? (
          <div className="rounded-2xl border border-danger-primary/30 bg-danger-soft/40 p-6 text-center">
            <p className="text-sm font-medium text-danger-primary">{erro}</p>
            <button
              type="button"
              onClick={voltarParaPedidos}
              className="mt-4 text-sm font-semibold text-accent-primary underline"
            >
              Voltar aos pedidos
            </button>
          </div>
        ) : pedido ? (
          <article className="w-full overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)]">
            <div className={pedidoDetalheHeaderClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={pedidoDetalheIconClass}>
                    <Package className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                      {rotuloPedido(pedido)}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                      <User className="h-3.5 w-3.5" />
                      {pedido.solicitante_nome || "—"}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-semibold ${getCorStatusMaterial(status)}`}
                >
                  {status}
                </span>
              </div>
              <p className="mt-3 text-xs text-text-muted">
                Criado em {formatarDataHora(pedido.created_at)}
                {pedido.updated_at !== pedido.created_at
                  ? ` · Atualizado em ${formatarDataHora(pedido.updated_at)}`
                  : ""}
              </p>
            </div>

            <div className="p-5 sm:p-6">
              {erro ? (
                <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
                  {erro}
                </p>
              ) : null}

              {!isPedidoEditavel(pedido.status) ? (
                <p className="mb-6 rounded-xl border border-border-primary/30 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-text-muted">
                  Este pedido não pode ser editado porque o status já foi
                  alterado na gestão de pedidos.
                </p>
              ) : null}

              {editando && podeEditar ? (
                <div className="rounded-2xl border border-accent-primary/30 bg-accent-primary-50/30">
                  <div className="border-b border-border-primary/25 px-5 py-4 sm:px-6">
                    <h3 className="text-base font-bold text-text-primary">
                      Editar materiais do pedido
                    </h3>
                    <p className="mt-1 text-xs text-text-muted sm:text-sm">
                      Ajuste quantidades, unidades ou datas. Guarde para aplicar
                      as alterações.
                    </p>
                  </div>
                  <div className="p-5 sm:p-6">
                    <PedidoFormComposer
                      itensIniciais={pedido.itens || []}
                      onSubmit={handleSalvar}
                      submitting={salvando}
                      submitLabel="Guardar alterações"
                      onCancel={() => setEditando(false)}
                    />
                  </div>
                </div>
              ) : (
                <section>
                  <div className={`${pedidoSecaoToolbarClass} mb-3`}>
                    <h3 className="text-sm font-bold text-text-primary sm:text-base">
                      Materiais do pedido
                    </h3>
                    {podeEditar ? (
                      <ButtonDefault
                        type="button"
                        onClick={() => setEditando(true)}
                        className={`${btnOutlinePremium} shrink-0 !w-full lg:!w-auto`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Pencil className="h-4 w-4" />
                          Editar pedido
                        </span>
                      </ButtonDefault>
                    ) : null}
                  </div>
                  <PedidoItensTable itens={pedido.itens || []} />
                </section>
              )}
            </div>
          </article>
        ) : null}
      </main>
    </div>
  );
}
