import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Admin global: ignora totalmente a restrição de `allowedTypes` (qualquer trava por tipo). */
const GESTOR_MASTER = "gestor_master";

const RotaProtegida = ({ allowedTypes }) => {
  const { user, loading } = useAuth();
  const { id } = useParams();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-[#464C54] font-bold">
        Carregando autenticação...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const podeIgnorarRestricao = user.tipo === GESTOR_MASTER;

  if (
    allowedTypes &&
    !podeIgnorarRestricao &&
    !allowedTypes.includes(user.tipo)
  ) {
    return <Navigate to="/" replace />;
  }

  if (user.tipo === "cliente" && id) {
    if (String(user.id) !== String(id)) {
      return <Navigate to={`/obraCliente/${user.id}`} replace />;
    }
  }

  return <Outlet />;
};

export default RotaProtegida;
