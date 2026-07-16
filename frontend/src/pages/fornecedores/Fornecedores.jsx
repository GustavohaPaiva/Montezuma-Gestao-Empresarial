import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import Navbar from "../../components/navbar/Navbar";
import BaseCard from "../../components/cards/BaseCard";
import BaseInput from "../../components/gerais/BaseInput";
import BaseButton from "../../components/gerais/BaseButton";
import ModalFornecedor from "../../components/modals/ModalFornecedor";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import {
  Building2,
  Phone,
  Mail,
  Power,
  PowerOff,
  Camera,
  Hourglass,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { agregarFinanceiroFornecedor } from "./fornecedorFinanceiro";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function Fornecedores() {
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showElements, setShowElements] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const [fornecedorParaFoto, setFornecedorParaFoto] = useState(null);
  const [uploadingFotoId, setUploadingFotoId] = useState(null);

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchFornecedores = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await api.getFornecedores();
      setFornecedores(dados || []);
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(timer);
    }
    setShowElements(false);
  }, [loading]);

  const handleSaveFornecedor = async (dados) => {
    try {
      await api.createFornecedor({ ...dados, ativo: true });
      setModalOpen(false);
      fetchFornecedores();
    } catch (error) {
      console.error("Erro ao guardar fornecedor:", error);
      if (String(error?.code ?? "") === "23505") {
        alert("Já existe um fornecedor registado com este CNPJ / NIF.");
      } else {
        alert("Falha ao criar o fornecedor.");
      }
    }
  };

  const toggleAtivo = async (id, statusAtual) => {
    try {
      setFornecedores((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ativo: !statusAtual } : f)),
      );
      await api.updateFornecedor(id, { ativo: !statusAtual });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      fetchFornecedores();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !fornecedorParaFoto) return;

    try {
      setUploadingFotoId(fornecedorParaFoto.id);
      await api.uploadFotoFornecedor(fornecedorParaFoto.id, file);
      await fetchFornecedores();
    } catch (error) {
      console.error("Erro ao subir foto:", error);
      alert("Erro ao alterar a foto.");
    } finally {
      setUploadingFotoId(null);
      setFornecedorParaFoto(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return fornecedores
      .filter(
        (f) =>
          !termo ||
          f.nome?.toLowerCase().includes(termo) ||
          f.cnpj?.toLowerCase().includes(termo),
      )
      .sort((a, b) => {
        if (a.ativo === b.ativo) {
          return (a.nome || "").localeCompare(b.nome || "");
        }
        return a.ativo ? -1 : 1;
      });
  }, [fornecedores, busca]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);
  };

  const totaisGerais = useMemo(() => {
    let comprado = 0;
    let pago = 0;
    let pendente = 0;
    let vencido = 0;

    fornecedoresFiltrados.forEach((f) => {
      const totais = agregarFinanceiroFornecedor(f.relatorio_materiais || []);
      comprado += totais.comprado;
      pago += totais.pago;
      pendente += totais.pendente;
      vencido += totais.vencido;
    });

    return { comprado, pago, pendente, vencido };
  }, [fornecedoresFiltrados]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out ${
          isNavVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Navbar
          title="Fornecedores"
          actions={[
            {
              key: "novo-fornecedor",
              label: "Novo fornecedor",
              onClick: () => setModalOpen(true),
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
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-primary/[0.06]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-accent-primary/[0.04]"
              aria-hidden
            />
            <div className="relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary shadow-inner ring-1 ring-accent-primary/15">
                <Building2 className="h-7 w-7" strokeWidth={2} />
              </div>
              <Loader2
                className="mx-auto mb-5 h-10 w-10 animate-spin text-accent-primary"
                strokeWidth={2.25}
                aria-hidden
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                Montezuma
              </p>
              <h3 className="mt-1.5 text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                Carregando fornecedores
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
                Buscando cadastros e valores consolidados. Isso costuma levar só
                um instante.
              </p>
              <div
                className="mx-auto mt-7 flex justify-center gap-1.5"
                role="presentation"
                aria-hidden
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-accent-primary/75"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main ref={refMain} className="w-[90%] pb-10">
          <section
            className={`mb-6 w-full rounded-2xl border border-border-primary/35 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition-all duration-700 ease-out sm:p-6 ${
              showElements
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <div className="border-b border-slate-100 pb-4 flex flex-row gap-2 items-center">
              <Wallet
                className="h-5 w-5 shrink-0 text-orange-600/55"
                aria-hidden
              />
              <h2 className="text-md font-semibold uppercase">
                Visão financeira
              </h2>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 text-left sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <Wallet
                    className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                    aria-hidden
                  />
                  Comprado
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
                  R$ {formatarMoeda(totaisGerais.comprado)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <CheckCircle2
                    className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                    aria-hidden
                  />
                  Pago
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
                  R$ {formatarMoeda(totaisGerais.pago)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {totaisGerais.pendente > 0 ? (
                    <AlertCircle
                      className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                      aria-hidden
                    />
                  ) : (
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                      aria-hidden
                    />
                  )}
                  A pagar
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
                  R$ {formatarMoeda(totaisGerais.pendente)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {totaisGerais.vencido > 0 ? (
                    <AlertCircle
                      className="h-3.5 w-3.5 shrink-0 text-red-600/70"
                      aria-hidden
                    />
                  ) : (
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                      aria-hidden
                    />
                  )}
                  Devendo (vencido)
                </dt>
                <dd
                  className={`mt-1 text-lg font-semibold tabular-nums sm:text-xl ${
                    totaisGerais.vencido > 0
                      ? "text-red-700"
                      : "text-text-primary"
                  }`}
                >
                  R$ {formatarMoeda(totaisGerais.vencido)}
                </dd>
              </div>
            </dl>
          </section>

          <section
            className={`mb-8 w-full rounded-2xl border border-border-primary/35 bg-white p-5 shadow-sm ring-1 ring-slate-900/5 transition-all delay-75 duration-700 ease-out sm:p-6 ${
              showElements
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <h2 className="flex items-center gap-2 text-md font-semibold uppercase">
              <Search
                className="h-5 w-5 opacity-80 text-orange-600"
                aria-hidden
              />
              Pesquisa
            </h2>
            <div className="mt-4 w-full">
              <label
                htmlFor="busca-fornecedores"
                className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-500"
              >
                Nome ou NIF/CNPJ
              </label>
              <BaseInput
                id="busca-fornecedores"
                className="w-full"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por texto…"
                aria-label="Filtrar fornecedores por nome ou NIF"
              />
            </div>
          </section>

          {fornecedoresFiltrados.length === 0 ? (
            <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-primary/60 bg-white/80 px-6 py-12 text-center shadow-inner ring-1 ring-slate-900/5">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-slate-200/80">
                <Building2 className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="text-base font-semibold text-text-primary">
                Nenhum fornecedor encontrado.
              </p>
              <p className="mt-2 max-w-md text-sm text-text-muted">
                Ajuste a busca ou cadastre um novo fornecedor.
              </p>
            </div>
          ) : (
            <div
              className={
                isMobile
                  ? "flex w-full flex-col gap-4"
                  : "grid w-full grid-cols-1 place-items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-8"
              }
            >
              {fornecedoresFiltrados.map((f, index) => {
                const materiais = f.relatorio_materiais || [];
                const { comprado, pendente, vencido } =
                  agregarFinanceiroFornecedor(materiais);

                let linhaFinanceira;
                if (materiais.length === 0 || comprado <= 0) {
                  linhaFinanceira = {
                    icon: (
                      <Building2
                        className="h-4 w-4 text-orange-600/45"
                        aria-hidden
                      />
                    ),
                    label: "Sem compras registadas",
                    textClass: "text-slate-500",
                  };
                } else if (pendente <= 0) {
                  linhaFinanceira = {
                    icon: (
                      <CheckCircle2
                        className="h-4 w-4 text-emerald-600/90"
                        aria-hidden
                      />
                    ),
                    label: "Tudo pago",
                    textClass: "text-emerald-700 font-medium",
                  };
                } else {
                  linhaFinanceira = {
                    icon: (
                      <AlertCircle
                        className="h-4 w-4 text-amber-600/90"
                        aria-hidden
                      />
                    ),
                    label: `Pendente: R$ ${formatarMoeda(pendente)}`,
                    textClass: "text-amber-800 font-medium",
                  };
                }

                const linhaDevendo =
                  materiais.length === 0 || comprado <= 0
                    ? null
                    : vencido > 0
                      ? {
                          icon: (
                            <AlertCircle
                              className="h-4 w-4 text-red-600/90"
                              aria-hidden
                            />
                          ),
                          label: `Devendo: R$ ${formatarMoeda(vencido)}`,
                          textClass: "text-red-700 font-medium",
                        }
                      : {
                          icon: (
                            <CheckCircle2
                              className="h-4 w-4 text-emerald-600/90"
                              aria-hidden
                            />
                          ),
                          label: "Sem atraso",
                          textClass: "text-emerald-700 font-medium",
                        };

                const metadata = [
                  {
                    icon: (
                      <Phone
                        className="h-4 w-4 text-orange-600/50"
                        aria-hidden
                      />
                    ),
                    label: f.telefone || "Sem telefone",
                  },
                  {
                    icon: (
                      <Mail
                        className="h-4 w-4 text-orange-600/50"
                        aria-hidden
                      />
                    ),
                    label: f.email || "Sem e-mail",
                  },
                  linhaFinanceira,
                  ...(linhaDevendo ? [linhaDevendo] : []),
                ];

                return (
                  <div
                    key={f.id}
                    className={`flex h-full w-full justify-stretch transition-all duration-700 ease-out ${
                      showElements
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    } ${!f.ativo ? "opacity-80 grayscale-[20%]" : ""}`}
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
                          navigate(`/fornecedores/${f.id}`);
                        }
                      }}
                      onClick={() => navigate(`/fornecedores/${f.id}`)}
                    >
                      <BaseCard
                        variant="entity"
                        title={f.nome}
                        value={f.cnpj || "Sem registo"}
                        status={f.ativo ? "Ativo" : "Inativo"}
                        metadata={metadata}
                        colorTheme={f.ativo ? "emerald" : "amber"}
                        leading={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFornecedorParaFoto(f);
                              fileInputRef.current?.click();
                            }}
                            className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm ring-1 ring-slate-900/5 transition hover:border-slate-300"
                            title="Alterar imagem"
                          >
                            {uploadingFotoId === f.id ? (
                              <Hourglass className="h-5 w-5 animate-spin text-accent-primary" />
                            ) : f.foto ? (
                              <>
                                <img
                                  src={f.foto}
                                  alt={f.nome}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                                  <Camera className="h-4 w-4 text-white" />
                                </div>
                              </>
                            ) : (
                              <>
                                <Building2
                                  size={20}
                                  className="text-slate-500"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                                  <Camera className="h-4 w-4 text-white" />
                                </div>
                              </>
                            )}
                          </button>
                        }
                      >
                        <div
                          className="mt-auto border-t border-slate-100 pt-4"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          role="presentation"
                        >
                          <BaseButton
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            icon={
                              f.ativo ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAtivo(f.id, f.ativo);
                            }}
                          >
                            {f.ativo ? "Desativar" : "Ativar"}
                          </BaseButton>
                        </div>
                      </BaseCard>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {modalOpen && (
        <ModalFornecedor
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveFornecedor}
        />
      )}
    </div>
  );
}
