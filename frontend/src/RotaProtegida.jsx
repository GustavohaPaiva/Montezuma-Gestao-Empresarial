import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext"; // Ajuste o caminho

export default function RotaProtegida({ allowedTypes }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se o tipo do usuário não estiver na lista de permitidos
  if (allowedTypes && !allowedTypes.includes(user.tipo)) {
    // Se é cliente tentando acessar área adm -> vai pra obra dele
    if (user.tipo === "cliente") {
      return <Navigate to={`/obra/${user.id}`} replace />;
    }
    // Se é admin -> vai pra lista de obras
    return <Navigate to="/obras" replace />;
  }

  return <Outlet />;
}
