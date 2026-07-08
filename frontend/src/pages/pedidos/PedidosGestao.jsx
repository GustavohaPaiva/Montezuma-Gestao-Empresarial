import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { isGestorPedidos, STATUS_PEDIDO_OPCOES } from "../../constants/pedidos";
import PedidoCardLista from "../../components/pedidos/PedidoCardLista";
import PedidosMetricasResumo from "../../components/pedidos/PedidosMetricasResumo";
import Navbar from "../../components/navbar/Navbar";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import { filtrarPedidos } from "../../utils/pedidosUtils";

export default function PedidosGestao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");

  const autorizado = isGestorPedidos(user);

  const carregar = useCallback(async () => {
    if (!autorizado) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await api.getAllObraPedidos();
      setPedidos(rows || []);
      setErro(null);
    } catch (e) {
      console.error("[PedidosGestao] carregar:", e);
      setErro(e?.message || "Não foi possível carregar os pedidos.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [autorizado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!autorizado && user !== undefined && user !== null) {
      navigate("/", { replace: true });
    }
  }, [autorizado, user, navigate]);

  const pedidosFiltrados = useMemo(
    () => filtrarPedidos(pedidos, { busca, status: filtroStatus }),
    [pedidos, busca, filtroStatus],
  );

  const filtrosNavbar = [
    <BaseInput
      key="filtro-busca-pedidos"
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
      placeholder="Buscar por obra, nº do pedido, material ou solicitante…"
    />,
    <BaseSelect
      key="filtro-status-pedidos"
      searchable={false}
      value={filtroStatus}
      onChange={(e) => setFiltroStatus(e.target.value)}
      options={[
        { value: "Tudo", label: "Todos os status" },
        ...STATUS_PEDIDO_OPCOES.map((s) => ({ value: s, label: s })),
      ]}
    />,
  ];

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
      <Navbar title="Gestão de pedidos" filters={filtrosNavbar} />

      <main className="w-full px-[5%] pb-12 pt-2">
        {erro ? (
          <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
            {erro}
          </p>
        ) : null}

        {!loading && pedidos.length > 0 ? (
          <PedidosMetricasResumo className="mb-6" pedidos={pedidos} />
        ) : null}

        {!loading && pedidos.length > 0 ? (
          <p className="mb-4 text-xs font-medium text-text-muted">
            {pedidosFiltrados.length} de {pedidos.length} pedido
            {pedidos.length !== 1 ? "s" : ""}
          </p>
        ) : null}

        {loading ? (
          <LoadingPainel
            titulo="Carregando pedidos"
            descricao="Buscando pedidos de materiais de todas as obras."
            icon={<Package className="h-7 w-7" strokeWidth={2} />}
          />
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-text-muted">Nenhum pedido registado.</p>
        ) : pedidosFiltrados.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border-primary/40 bg-white px-4 py-10 text-center text-sm text-text-muted">
            Nenhum pedido corresponde aos filtros aplicados.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pedidosFiltrados.map((pedido) => (
              <PedidoCardLista
                key={pedido.id}
                pedido={pedido}
                showObra
                onClick={() => navigate(`/pedidos/${pedido.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
