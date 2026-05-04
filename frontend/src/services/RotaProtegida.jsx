import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GESTOR_MASTER = "gestor_master";
const ENCARREGADO = "encarregado";

function getFallbackRoute(user) {
  if (!user) return "/login";
  if (user.tipo === "cliente") return `/obra/${user.id}`;
  if (user.tipo === ENCARREGADO) return "/obras";
  return "/";
}

const RotaProtegida = ({ allowedTypes, allowedEscritorios }) => {
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
    return <Navigate to={getFallbackRoute(user)} replace />;
  }

  if (
    Array.isArray(allowedEscritorios) &&
    allowedEscritorios.length > 0 &&
    !podeIgnorarRestricao &&
    (!user.escritorio_id || !allowedEscritorios.includes(user.escritorio_id))
  ) {
    return <Navigate to={getFallbackRoute(user)} replace />;
  }

  if (user.tipo === "cliente" && id) {
    if (String(user.id) !== String(id)) {
      return <Navigate to={`/obra/${user.id}`} replace />;
    }
  }

  return <Outlet />;
};

export default RotaProtegida;
