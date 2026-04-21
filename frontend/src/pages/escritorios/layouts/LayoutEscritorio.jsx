import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/logos/logo sem fundo.png";
import { useAuth } from "../../../contexts/AuthContext";
import { ESCRITORIO_NOME_POR_ID } from "../../../constants/escritorios";

export default function LayoutEscritorio() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [isEntering, setIsEntering] = useState(true);
  const [saudacaoSaindo, setSaudacaoSaindo] = useState(false);
  const [saudacaoRemovida, setSaudacaoRemovida] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setIsEntering(false), 50);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setSaudacaoSaindo(true), 8000);
    return () => clearTimeout(id);
  }, []);

  function inicialNome(nome) {
    const n = (nome || "?").trim();
    return n.slice(0, 1).toUpperCase();
  }

  const isVogel = pathname.includes("/vogelkop");
  const temaClasse = isVogel ? "theme-vogelkop" : "theme-ybyoca";
  const { user } = useAuth();
  const nomeEscritorio =
    ESCRITORIO_NOME_POR_ID[user?.escritorio_id] ?? "Escritório";
  const nomeUsuario = user?.nome?.trim() || "Usuário";

  return (
    <div
      className={`${temaClasse} relative min-h-screen bg-esc-bg text-esc-text transition-colors duration-700 overflow-x-hidden`}
    >
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[min(100vw,42rem)] w-[min(100vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-esc-destaque/10 opacity-50 blur-[100px]" />

      <div
        className={`fixed inset-0 z-[100] bg-black transition-opacity duration-1000 ease-out ${
          isEntering ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />

      <header
        title={nomeEscritorio}
        className="box-border sticky top-0 z-50 border-b border-esc-border/50 bg-esc-bg/60 px-6 backdrop-blur-xl md:px-12"
      >
        <div className="flex w-full items-center justify-between py-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex cursor-pointer flex-row items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm font-semibold text-esc-text backdrop-blur-md transition-all duration-300 hover:bg-white/10 md:px-4 md:py-2"
          >
            <img src={logo} alt="Logo Montezuma" className="w-6 h-6" />{" "}
            Montezuma
          </button>
          <div className="flex min-w-0 items-center gap-3">
            {!saudacaoRemovida ? (
              <p
                onTransitionEnd={(e) => {
                  if (e.propertyName !== "opacity" || !saudacaoSaindo) return;
                  setSaudacaoRemovida(true);
                }}
                className={`max-w-[min(100%,14rem)] truncate text-sm text-esc-muted transition-[opacity,filter] duration-[1100ms] ease-in-out ${
                  saudacaoSaindo
                    ? "pointer-events-none opacity-0 blur-[4px]"
                    : "opacity-100 blur-0"
                }`}
              >
                Olá, {nomeUsuario}
              </p>
            ) : null}
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-esc-border bg-esc-card/50">
              {user?.foto ? (
                <img
                  src={user.foto}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-sm font-semibold text-esc-text"
                  aria-hidden
                >
                  {inicialNome(nomeUsuario)}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="box-border w-full flex-1 animate-premium-reveal px-6 pb-12 md:px-12">
        <Outlet />
      </main>
    </div>
  );
}
