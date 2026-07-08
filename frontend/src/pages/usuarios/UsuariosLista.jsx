import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, PenLine, Plus, Search, UserRound, Users } from "lucide-react";
import Navbar from "../../components/navbar/Navbar";
import BaseInput from "../../components/gerais/BaseInput";
import BaseCard from "../../components/cards/BaseCard";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { podeGerenciarUsuarios } from "../../utils/usuarioPermissions";
import { labelTipoUsuario } from "./usuariosUtils";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function UsuariosLista() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [showElements, setShowElements] = useState(false);

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

  const autorizado = podeGerenciarUsuarios(user);

  const carregar = useCallback(async () => {
    if (!autorizado) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.listUsuariosSistemaComFotos();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  }, [autorizado]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (user && !autorizado) {
      navigate("/", { replace: true });
    }
  }, [user, autorizado, navigate]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(timer);
    }
    setShowElements(false);
  }, [loading]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => {
      const nome = String(u.nome ?? "").toLowerCase();
      const tipo = String(u.tipo ?? "").toLowerCase();
      const escritorio = String(u.escritorio ?? "").toLowerCase();
      return nome.includes(q) || tipo.includes(q) || escritorio.includes(q);
    });
  }, [usuarios, busca]);

  if (!autorizado) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-text-muted">
        A redirecionar…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary font-montserrat text-text-primary">
      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out ${
          isNavVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Navbar
          title="Usuários do sistema"
          actions={[
            {
              key: "novo-usuario",
              label: "Novo usuário",
              onClick: () => navigate("/usuarios/novo"),
              icon: <Plus className="h-4 w-4" aria-hidden />,
              className:
                "bg-accent-primary text-white hover:opacity-90 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 h-10 px-4",
            },
          ]}
        />
      </div>

      {loading ? (
        <div className="flex min-h-[42vh] w-full items-center justify-center px-4 py-16">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-primary/35 bg-white px-8 py-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]">
            <div className="relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-inner ring-1 ring-accent-primary/15">
                <Users className="h-7 w-7" strokeWidth={2} />
              </div>
              <Loader2
                className="mx-auto mb-5 h-10 w-10 animate-spin text-accent-primary"
                strokeWidth={2.25}
                aria-hidden
              />
              <h3 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                Carregando usuários
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
                Buscando cadastros e fotos de perfil.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <main ref={refMain} className="w-[90%] pb-10">
          <section
            className={`mb-8 w-full rounded-2xl border border-border-primary/35 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition-all duration-700 ease-out sm:p-6 ${
              showElements
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
                aria-hidden
              />
              <BaseInput
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, perfil ou escritório…"
                className="pl-9"
              />
            </div>
          </section>

          {filtrados.length === 0 ? (
            <p className="text-center text-sm text-text-muted">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
              {filtrados.map((u, index) => {
                const metadata = [
                  {
                    icon: (
                      <UserRound
                        className="h-4 w-4 text-orange-600/50"
                        aria-hidden
                      />
                    ),
                    label: labelTipoUsuario(u.tipo),
                  },
                  {
                    icon: (
                      <PenLine
                        className="h-4 w-4 text-orange-600/50"
                        aria-hidden
                      />
                    ),
                    label: u.assinatura_url
                      ? "Assinatura cadastrada"
                      : "Sem assinatura OS",
                  },
                ];

                return (
                  <div
                    key={u.id}
                    className={`flex h-full w-full justify-stretch transition-all duration-700 ease-out ${
                      showElements
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    }`}
                    style={{ transitionDelay: `${index * 40}ms` }}
                  >
                    <div
                      className={joinClasses(
                        "h-full w-full rounded-2xl outline-none transition-shadow",
                        "focus-within:ring-2 focus-within:ring-accent-primary/25",
                      )}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/usuarios/${u.id}`);
                        }
                      }}
                      onClick={() => navigate(`/usuarios/${u.id}`)}
                    >
                      <BaseCard
                        variant="entity"
                        title={u.nome || "Sem nome"}
                        value={u.escritorio || "—"}
                        metadata={metadata}
                        colorTheme="blue"
                        leading={
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm ring-1 ring-slate-900/5">
                            {u.foto ? (
                              <img
                                src={u.foto}
                                alt={u.nome || ""}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <UserRound
                                className="h-5 w-5 text-slate-500"
                                aria-hidden
                              />
                            )}
                          </div>
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
