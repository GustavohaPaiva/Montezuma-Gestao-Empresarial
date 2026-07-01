import { useState } from "react";
import { MapPin, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import BaseButton from "../../components/gerais/BaseButton";
import LoginField from "./LoginField";
import LoginShell from "./LoginShell";

export default function LoginCliente() {
  const [nome, setNome] = useState("");
  const [bairro, setBairro] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();
  const { loginCliente } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setErro("");

    const nomeTratado = nome.trim().replace(/\s+/g, " ");
    const bairroTratado = bairro.trim().replace(/\s+/g, " ");

    if (!nomeTratado || !bairroTratado) {
      setErro("Preencha os campos corretamente.");
      return;
    }

    setCarregando(true);
    try {
      const usuario = await loginCliente(nomeTratado, bairroTratado);
      navigate(`/obra/${usuario.id}`);
    } catch (error) {
      console.error(error);
      setErro("Cliente ou Bairro não encontrados.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <LoginShell
      formTitle="Preencha seus dados"
      formSubtitle="Informe seu nome e bairro para acompanhar sua obra."
    >
      <form className="flex flex-col gap-6" onSubmit={handleLogin} noValidate>
        <div className="space-y-5">
          <LoginField
            label="Nome"
            name="nome"
            icon={User}
            autoComplete="name"
            placeholder="Seu nome completo"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            disabled={carregando}
          />

          <LoginField
            label="Bairro"
            name="bairro"
            icon={MapPin}
            autoComplete="address-level3"
            placeholder="Bairro da obra"
            value={bairro}
            onChange={(event) => setBairro(event.target.value)}
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
          Entrar
        </BaseButton>

        <p className="text-center text-xs leading-relaxed text-slate-500">
          Problemas para acessar?{" "}
          <span className="font-medium text-accent-primary">
            Entre em contato com a Montezuma.
          </span>
        </p>
      </form>
    </LoginShell>
  );
}
