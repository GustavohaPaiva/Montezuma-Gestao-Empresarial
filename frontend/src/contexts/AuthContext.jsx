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

  // Login do Cliente (O Caminho Duplo)
  const loginCliente = async (nome, local) => {
    setLoading(true);
    try {
      // TENTATIVA 1: O jeito antigo (RPC) - Para quem JÁ TEM Obra lançada
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

      // Se a RPC funcionou e achou o cara, ele é um cliente normal de obra
      if (!rpcError && idObra) {
        const userData = {
          ...(typeof rpcData === "object" ? rpcData : {}),
          id: String(idObra),
          nome: nome,
          tipo: "cliente",
          isSomenteProcesso: false, // AVISA O FRONT QUE É PRA MOSTRAR RELATÓRIOS
        };
        setUser(userData);
        sessionStorage.setItem("montezuma_session", JSON.stringify(userData));
        return userData;
      }

      // TENTATIVA 2: Se a RPC falhou, é um cliente NOVO sem obra. Busca na tabela de clientes.
      const nomeLimpo = nome.trim();
      const bairroLimpo = local.trim();

      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .ilike("nome", `%${nomeLimpo}%`)
        .ilike("bairro", `%${bairroLimpo}%`)
        .maybeSingle();

      if (clienteError || !clienteData) {
        throw new Error("Dados incorretos.");
      }

      // Cliente sem obra encontrado!
      const userData = {
        ...clienteData,
        id: String(clienteData.id), // Vamos usar o ID do cliente na URL
        nome: clienteData.nome,
        tipo: "cliente",
        isSomenteProcesso: true, // AVISA O FRONT QUE É PRA MOSTRAR SÓ PROCESSOS
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
