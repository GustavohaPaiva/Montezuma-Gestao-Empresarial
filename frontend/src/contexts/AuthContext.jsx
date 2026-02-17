import { createContext, useContext, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // MUDANÇA 1: Usamos sessionStorage aqui.
  // Ao fechar o navegador, o sessionStorage é limpo automaticamente.
  const [user, setUser] = useState(() => {
    const session = sessionStorage.getItem("montezuma_session");
    if (session) {
      return JSON.parse(session);
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // Login do Cliente
  const loginCliente = async (nome, local) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("validar_login_cliente", {
        nome_digitado: nome,
        local_digitado: local,
      });

      if (error || !data) throw new Error("Dados incorretos.");

      const userData = { ...data, tipo: "cliente" };

      setUser(userData);
      // MUDANÇA 2: Salva na sessão temporária
      sessionStorage.setItem("montezuma_session", JSON.stringify(userData));

      return userData;
    } finally {
      setLoading(false);
    }
  };

  // Login do Admin
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
      // MUDANÇA 3: Salva na sessão temporária
      sessionStorage.setItem("montezuma_session", JSON.stringify(userData));

      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // MUDANÇA 4: Limpa a sessão temporária
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
