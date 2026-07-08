import { useState } from "react";
import { Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import BaseButton from "../../components/gerais/BaseButton";
import LoginField from "./LoginField";
import LoginShell from "./LoginShell";

export default function LoginAdm() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  const handleNavigation = async (event) => {
    event.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await loginAdmin(login, senha);
      navigate("/");
    } catch (error) {
      console.error(error);
      setErro("Acesso negado. Verifique suas credenciais.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <LoginShell
      formTitle="Acesso Administrativo"
      formSubtitle="Acesse com seu usuário e senha corporativos."
    >
      <form
        className="flex flex-col gap-6"
        onSubmit={handleNavigation}
        noValidate
      >
        <div className="space-y-5">
          <LoginField
            label="Login"
            name="login"
            icon={User}
            autoComplete="username"
            placeholder="Seu usuário"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            disabled={carregando}
          />

          <LoginField
            label="Senha"
            name="senha"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            placeholder="••••••••"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            disabled={carregando}
          />
        </div>

        {erro ? (
          <p
            className="rounded-2xl border border-red-200/90 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-800"
            role="alert"
          >
            {erro}
          </p>
        ) : null}

        <BaseButton
          type="submit"
          fullWidth
          size="lg"
          isLoading={carregando}
          className="login-btn-glow shadow-md shadow-orange-600/20"
        >
          Entrar na plataforma
        </BaseButton>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          Problemas para acessar?{" "}
          <span className="font-medium text-accent-primary">
            Contate o administrador do sistema.
          </span>
        </p>
      </form>
    </LoginShell>
  );
}
