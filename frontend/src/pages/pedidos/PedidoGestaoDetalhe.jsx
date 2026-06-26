import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  Package,
  Settings2,
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
import PedidoItensTableGestao from "../../components/pedidos/PedidoItensTableGestao";
import PedidoOrdensCompra from "../../components/pedidos/PedidoOrdensCompra";
import PedidoSecaoPainel from "../../components/pedidos/PedidoSecaoPainel";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import BaseSelect from "../../components/gerais/BaseSelect";
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
  const [fornecedores, setFornecedores] = useState([]);
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
      setPedido(dados);
      if (!silencioso) {
        setStatusSel(dados.status || STATUS_PEDIDO_PENDENTE);
        statusIgnorarRef.current = true;
      }
    } catch (e) {
      console.error("[PedidoGestaoDetalhe] carregar:", e);
      if (!silencioso) {
        setErro(e?.message || "Não foi possível carregar o pedido.");
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
        setTimeout(() => {
          statusIgnorarRef.current = false;
        }, 0);
      }
    }
  }, [pedidoId, autorizado]);

  const atualizarPedidoSilencioso = useCallback(() => {
    return carregar({ silencioso: true });
  }, [carregar]);

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
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getCorStatusMaterial(pedido.status)}`}
                  >
                    {pedido.status}
                  </span>
                </div>
                <p className="mt-3 text-xs text-text-muted">
                  Criado em {formatarDataHora(pedido.created_at)}
                </p>
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
              descricao="Edite qualquer coluna diretamente na tabela. O valor pode ficar em branco no lançamento. A sincronização com a obra ocorre ao marcar cada ordem de compra como Comprado."
              icon={<ClipboardList className="h-5 w-5" />}
              iconTheme="blue"
            >
              <PedidoItensTableGestao
                itens={pedido.itens || []}
                fornecedores={fornecedores}
              />
            </PedidoSecaoPainel>

            <PedidoSecaoPainel
              titulo="Status do pedido"
              descricao="Alterações são guardadas automaticamente."
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
                  disabled={salvandoStatus}
                  className={selectPremium}
                  options={STATUS_PEDIDO_OPCOES.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
              </label>
            </PedidoSecaoPainel>

            <PedidoOrdensCompra
              pedido={pedido}
              obra={obra}
              onAtualizarPedido={atualizarPedidoSilencioso}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
