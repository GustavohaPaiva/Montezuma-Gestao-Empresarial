import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { api } from "../services/api";

const AuthContext = createContext();

function parseSubclasses(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const session = sessionStorage.getItem("montezuma_session");
    if (session) {
      return JSON.parse(session);
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || user.tipo === "cliente") return;

    let cancelado = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("tipo, escritorio, nome, escritorio_id, subclasses")
          .eq("id", user.id)
          .single();

        if (cancelado || error || !data) return;

        const subclasses = parseSubclasses(data.subclasses);
        const atual = parseSubclasses(user.subclasses);
        const mudou =
          JSON.stringify(subclasses) !== JSON.stringify(atual) ||
          data.tipo !== user.tipo ||
          data.escritorio_id !== user.escritorio_id;

        if (!mudou) return;

        const userData = {
          ...user,
          nome: data.nome ?? user.nome,
          tipo: data.tipo,
          escritorio: data.escritorio,
          escritorio_id: data.escritorio_id ?? null,
          subclasses,
        };

        setUser(userData);
        sessionStorage.setItem("montezuma_session", JSON.stringify(userData));
      } catch (e) {
        console.error("[AuthContext] refresh subclasses:", e);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [user?.id, user?.tipo]);

  const updateUserFoto = (novaFotoUrl) => {
    if (user) {
      const usuarioAtualizado = { ...user, foto: novaFotoUrl };
      setUser(usuarioAtualizado);
      sessionStorage.setItem(
        "montezuma_session",
        JSON.stringify(usuarioAtualizado),
      );
    }
  };

  const loginCliente = async (nome, local) => {
    setLoading(true);
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "validar_login_cliente",
        {
          nome_digitado: nome,
          local_digitado: local,
        },
      );

      let idObra = rpcData
        ? typeof rpcData === "object"
          ? rpcData.id
          : rpcData
        : null;

      if (!rpcError && idObra) {
        const userData = {
          ...(typeof rpcData === "object" ? rpcData : {}),
          id: String(idObra),
          nome: nome,
          tipo: "cliente",
          isSomenteProcesso: false,
        };
        setUser(userData);
        sessionStorage.setItem("montezuma_session", JSON.stringify(userData));
        return userData;
      }

      const nomeLimpo = nome.trim();
      const bairroLimpo = local.trim();

      const clienteData = await api.loginClientePorNomeEBairro(
        nomeLimpo,
        bairroLimpo,
      );

      if (!clienteData) {
        throw new Error("Dados incorretos.");
      }

      const userData = {
        ...clienteData,
        id: String(clienteData.id),
        nome: clienteData.nome,
        tipo: "cliente",
        isSomenteProcesso: true,
      };

      setUser(userData);
      sessionStorage.setItem("montezuma_session", JSON.stringify(userData));
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const loginAdmin = async (login, senha) => {
    setLoading(true);
    try {
      const emailFormatado = `${login}@sistema.com`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailFormatado,
        password: senha,
      });

      if (error) throw error;

      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("tipo, escritorio, nome, escritorio_id, subclasses")
        .eq("id", data.user.id)
        .single();

      if (usuarioError)
        throw new Error("Erro ao buscar permissões do usuário.");

      const fotoDoAdmin = data.user.user_metadata?.foto || null;

      const subclasses = parseSubclasses(usuarioData.subclasses);

      const userData = {
        id: data.user.id,
        email: data.user.email,
        nome: usuarioData.nome ?? null,
        tipo: usuarioData.tipo,
        escritorio: usuarioData.escritorio,
        escritorio_id: usuarioData.escritorio_id ?? null,
        subclasses,
        foto: fotoDoAdmin,
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
      value={{
        user,
        loginCliente,
        loginAdmin,
        logout,
        loading,
        updateUserFoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
