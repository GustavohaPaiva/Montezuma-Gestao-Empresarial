import { createContext, useContext, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const session = sessionStorage.getItem("montezuma_session");
    if (session) {
      return JSON.parse(session);
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // Login do Cliente "Fantasma"
  const loginCliente = async (nome, local) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("validar_login_cliente", {
        nome_digitado: nome,
        local_digitado: local,
      });

      if (error || !data) throw new Error("Dados incorretos.");

      // Blindagem: Se a RPC retornar a linha toda, pegamos data.id.
      // Se retornar só o UUID direto, pegamos o próprio data.
      const idObra = typeof data === "object" ? data.id : data;

      if (!idObra) throw new Error("A RPC não retornou um ID de obra válido.");

      // Monta o usuário fantasma e converte o ID pra string pra RotaProtegida não barrar
      const userData = {
        ...(typeof data === "object" ? data : {}),
        id: String(idObra),
        nome: nome,
        tipo: "cliente",
      };

      setUser(userData);
      sessionStorage.setItem("montezuma_session", JSON.stringify(userData));

      return userData;
    } finally {
      setLoading(false);
    }
  };

  // Login do Admin Real
  const loginAdmin = async (login, senha) => {
    setLoading(true);
    try {
      const emailFormatado = `${login}@sistema.com`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFormatado,
        password: senha,
      });

      if (error) throw error;

      const userData = {
        id: data.user.id,
        email: data.user.email,
        tipo: "admin",
      };

      setUser(userData);
      sessionStorage.setItem("montezuma_session", JSON.stringify(userData));

      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem("montezuma_session");
  };

  return (
    <AuthContext.Provider
      value={{ user, loginCliente, loginAdmin, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
