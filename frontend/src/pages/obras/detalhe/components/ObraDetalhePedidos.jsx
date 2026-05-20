import { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { SUB_ABAS_PEDIDOS_OBRA } from "../../../../constants/pedidos";
import { pedidoSubAbaClass } from "../../../../components/pedidos/pedidosUi";
import { useObraPedidos } from "../hooks/useObraPedidos";
import ObraPedidosListaView from "./pedidos/ObraPedidosListaView";
import ObraPedidoNovoView from "./pedidos/ObraPedidoNovoView";

/**
 * @param {{ obraId: string | number | undefined }} props
 */
export default function ObraDetalhePedidos({ obraId }) {
  const { user } = useAuth();
  const [subAba, setSubAba] = useState("lista");
  const { pedidos, loading, erro, carregar, setErro } = useObraPedidos(obraId);

  const handleSucessoNovo = () => {
    setErro(null);
    carregar();
    setSubAba("lista");
  };

  return (
    <div className="mb-6 w-full">
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {SUB_ABAS_PEDIDOS_OBRA.map((opt) => {
          const ativa = subAba === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setSubAba(opt.id);
                setErro(null);
              }}
              className={pedidoSubAbaClass(ativa)}
            >
              <span
                className={[
                  "text-sm font-bold tracking-tight",
                  ativa ? "text-accent-primary" : "text-text-primary",
                ].join(" ")}
              >
                {opt.label}
              </span>
              <span className="text-xs leading-snug tracking-tight text-text-muted">
                {opt.sub}
              </span>
            </button>
          );
        })}
      </div>

      {erro ? (
        <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
          {erro}
        </p>
      ) : null}

      {subAba === "lista" ? (
        <div className="rounded-2xl border border-border-primary bg-surface p-5 shadow-sm md:p-6">
          <ObraPedidosListaView
            obraId={obraId}
            pedidos={pedidos}
            loading={loading}
            user={user}
            onIrParaNovo={() => setSubAba("novo")}
          />
        </div>
      ) : null}

      {subAba === "novo" && user ? (
        <ObraPedidoNovoView
          obraId={obraId}
          onSucesso={handleSucessoNovo}
          onVoltar={() => setSubAba("lista")}
          setErroGlobal={setErro}
        />
      ) : null}

      {subAba === "novo" && !user ? (
        <div className="rounded-2xl border border-border-primary bg-surface p-5 shadow-sm md:p-6">
          <p className="text-sm text-text-muted">
            Inicie sessão para lançar um pedido.
          </p>
        </div>
      ) : null}
    </div>
  );
}
