import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import Navbar from "../../components/navbar/Navbar";
import BaseCard from "../../components/cards/BaseCard";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import BaseButton from "../../components/gerais/BaseButton";
import ModalPrestador from "../../components/modals/ModalPrestador";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import {
  UserRound,
  Phone,
  Mail,
  Power,
  PowerOff,
  Search,
  Camera,
  Hourglass,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Tags,
} from "lucide-react";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function Prestadores() {
  const navigate = useNavigate();
  const [prestadores, setPrestadores] = useState([]);
  const [classesPrestadores, setClassesPrestadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroClasseId, setFiltroClasseId] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showElements, setShowElements] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const [prestadorParaFoto, setPrestadorParaFoto] = useState(null);
  const [uploadingFotoId, setUploadingFotoId] = useState(null);

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchBase = useCallback(async () => {
    setLoading(true);
    try {
      const [dadosPrestadores, dadosClasses] = await Promise.all([
        api.getPrestadores(),
        api.getClassesPrestadores(),
      ]);
      setPrestadores(dadosPrestadores || []);
      setClassesPrestadores(dadosClasses || []);
    } catch (err) {
      console.error("Erro ao carregar prestadores:", err);
      alert("Falha ao carregar os prestadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBase();
  }, [fetchBase]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(timer);
    }
    setShowElements(false);
  }, [loading]);

  const handleCreateClasse = async (nomeClasse) => {
    const classe = await api.createClassePrestador({ nome: nomeClasse });
    setClassesPrestadores((prev) =>
      [...prev, classe].sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || ""),
      ),
    );
    return classe;
  };

  const handleSavePrestador = async (dados) => {
    try {
      const { id: _ignoreId, ...dadosSemId } = dados;
      await api.createPrestador({ ...dadosSemId, ativo: true });
      setModalOpen(false);
      fetchBase();
    } catch (error) {
      console.error("Erro ao guardar prestador:", error);
      alert("Falha ao criar o prestador.");
    }
  };

  const toggleAtivo = async (id, statusAtual) => {
    try {
      setPrestadores((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ativo: !statusAtual } : p)),
      );
      await api.updatePrestador(id, { ativo: !statusAtual });
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      fetchBase();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !prestadorParaFoto) return;

    try {
      setUploadingFotoId(prestadorParaFoto.id);
      await api.uploadFotoPrestador(prestadorParaFoto.id, file);
      await fetchBase();
    } catch (error) {
      console.error("Erro ao subir foto:", error);
      alert("Erro ao alterar a foto.");
    } finally {
      setUploadingFotoId(null);
      setPrestadorParaFoto(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const prestadoresFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const idClasse = filtroClasseId ? String(filtroClasseId) : "";

    return prestadores
      .filter((p) => {
        const matchTexto =
          !termo ||
          p.nome?.toLowerCase().includes(termo) ||
          p.cnpj_cpf?.toLowerCase().includes(termo);

        const matchClasse =
          !idClasse ||
          (p.prestadores_classes || []).some(
            (rel) => String(rel.classe_id) === idClasse,
          );

        return matchTexto && matchClasse;
      })
      .sort((a, b) => {
        if (a.ativo === b.ativo) {
          return (a.nome || "").localeCompare(b.nome || "");
        }
        return a.ativo ? -1 : 1;
      });
  }, [prestadores, busca, filtroClasseId]);

  const formatarMoeda = (valor) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor || 0);

  const totaisGerais = useMemo(() => {
    let contratado = 0;
    let pago = 0;

    prestadoresFiltrados.forEach((p) => {
      const resumo = p.resumo_mdo || { contratado: 0, pago: 0 };
      contratado += parseFloat(resumo.contratado) || 0;
      pago += parseFloat(resumo.pago) || 0;
    });

    const pendente = Math.max(contratado - pago, 0);
    const excedente = Math.max(pago - contratado, 0);

    return { contratado, pago, pendente, excedente };
  }, [prestadoresFiltrados]);

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
          title="Prestadores"
          actions={[
            {
              key: "novo-prestador",
              label: "Novo prestador",
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
                <UserRound className="h-7 w-7" strokeWidth={2} />
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
                Carregando prestadores
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
                Buscando cadastros e resumo de mão de obra.
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
            <div className="flex flex-row items-center gap-2 border-b border-slate-100 pb-4">
              <Wallet
                className="h-5 w-5 shrink-0 text-orange-600/55"
                aria-hidden
              />
              <h2 className="text-md font-semibold uppercase">
                Visão financeira
              </h2>
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-500">
              Totais de mão de obra (contratado e pago) dos prestadores que
              passam pelos filtros abaixo.
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 text-left sm:grid-cols-3">
              <div className="min-w-0">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <Wallet
                    className="h-3.5 w-3.5 shrink-0 text-orange-600/55"
                    aria-hidden
                  />
                  Contratado
                </dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-text-primary sm:text-xl">
                  R$ {formatarMoeda(totaisGerais.contratado)}
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
                  {totaisGerais.excedente > 0 ? (
                    <AlertCircle
                      className="h-3.5 w-3.5 shrink-0 text-red-600/70"
                      aria-hidden
                    />
                  ) : totaisGerais.pendente > 0 ? (
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
                  {totaisGerais.excedente > 0
                    ? "Acima do contratado"
                    : "A pagar"}
                </dt>
                <dd
                  className={`mt-1 text-lg font-semibold tabular-nums sm:text-xl ${
                    totaisGerais.excedente > 0
                      ? "text-red-800"
                      : "text-text-primary"
                  }`}
                >
                  R${" "}
                  {formatarMoeda(
                    totaisGerais.excedente > 0
                      ? totaisGerais.excedente
                      : totaisGerais.pendente,
                  )}
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
              Pesquisa e filtro
            </h2>
            <div className="mt-4 flex w-full flex-col gap-4">
              <div>
                <label
                  htmlFor="filtro-classe-prestador"
                  className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-500"
                >
                  Classe
                </label>
                <BaseSelect
                  id="filtro-classe-prestador"
                  searchable
                  value={filtroClasseId}
                  onChange={(e) => setFiltroClasseId(e.target.value)}
                  placeholder="Todas as classes"
                  aria-label="Filtrar por classe"
                  options={classesPrestadores.map((c) => ({
                    value: String(c.id),
                    label: c.nome || `Classe ${c.id}`,
                  }))}
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="busca-prestadores"
                  className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-500"
                >
                  Nome ou documento
                </label>
                <BaseInput
                  id="busca-prestadores"
                  className="w-full"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Filtrar por texto…"
                  aria-label="Filtrar prestadores por nome ou documento"
                />
              </div>
            </div>
          </section>

          {prestadoresFiltrados.length === 0 ? (
            <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-primary/60 bg-white/80 px-6 py-12 text-center shadow-inner ring-1 ring-slate-900/5">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-slate-200/80">
                <UserRound className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="text-base font-semibold text-text-primary">
                Nenhum prestador encontrado.
              </p>
              <p className="mt-2 max-w-md text-sm text-text-muted">
                Ajuste a busca, a classe ou cadastre um novo prestador.
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
              {prestadoresFiltrados.map((prestador, index) => {
                const resumoCard = prestador.resumo_mdo || {
                  contratado: 0,
                  pago: 0,
                };
                const contratadoCard = parseFloat(resumoCard.contratado) || 0;
                const pagoCard = parseFloat(resumoCard.pago) || 0;
                const pendenteCard = Math.max(contratadoCard - pagoCard, 0);
                const excedenteCard = Math.max(pagoCard - contratadoCard, 0);

                const classes = (prestador.prestadores_classes || [])
                  .map((rel) => rel.classes_prestadores?.nome)
                  .filter(Boolean);

                let linhaFinanceira;
                if (contratadoCard <= 0 && pagoCard <= 0) {
                  linhaFinanceira = {
                    icon: (
                      <Wallet
                        className="h-4 w-4 text-orange-600/45"
                        aria-hidden
                      />
                    ),
                    label: "Sem valores de mão de obra",
                    textClass: "text-slate-500",
                  };
                } else if (excedenteCard > 0) {
                  linhaFinanceira = {
                    icon: (
                      <AlertCircle
                        className="h-4 w-4 text-red-600/90"
                        aria-hidden
                      />
                    ),
                    label: `Acima do contratado: R$ ${formatarMoeda(excedenteCard)}`,
                    textClass: "text-red-800 font-medium",
                  };
                } else if (pendenteCard > 0) {
                  linhaFinanceira = {
                    icon: (
                      <AlertCircle
                        className="h-4 w-4 text-amber-600/90"
                        aria-hidden
                      />
                    ),
                    label: `Pendente: R$ ${formatarMoeda(pendenteCard)}`,
                    textClass: "text-amber-800 font-medium",
                  };
                } else {
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
                }

                const classesLabel = classes.length
                  ? classes.join(", ")
                  : "Sem classes vinculadas";

                const metadata = [
                  {
                    icon: (
                      <Phone
                        className="h-4 w-4 text-orange-600/50"
                        aria-hidden
                      />
                    ),
                    label: prestador.telefone || "Sem telefone",
                  },
                  {
                    icon: (
                      <Mail
                        className="h-4 w-4 text-orange-600/50"
                        aria-hidden
                      />
                    ),
                    label: prestador.email || "Sem e-mail",
                  },
                  {
                    icon: (
                      <Tags
                        className="h-4 w-4 text-orange-600/50"
                        aria-hidden
                      />
                    ),
                    label: classesLabel,
                    textClass: classes.length ? "" : "text-slate-500",
                  },
                  linhaFinanceira,
                ];

                return (
                  <div
                    key={prestador.id}
                    className={`flex h-full w-full justify-stretch transition-all duration-700 ease-out ${
                      showElements
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    } ${!prestador.ativo ? "opacity-80 grayscale-[20%]" : ""}`}
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
                          navigate(`/prestadores/${prestador.id}`);
                        }
                      }}
                      onClick={() => navigate(`/prestadores/${prestador.id}`)}
                    >
                      <BaseCard
                        variant="entity"
                        title={prestador.nome}
                        value={prestador.cnpj_cpf || "Sem registo"}
                        status={prestador.ativo ? "Ativo" : "Inativo"}
                        metadata={metadata}
                        colorTheme={prestador.ativo ? "emerald" : "amber"}
                        leading={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPrestadorParaFoto(prestador);
                              fileInputRef.current?.click();
                            }}
                            className="relative flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 shadow-sm ring-1 ring-slate-900/5 transition hover:border-slate-300"
                            title="Alterar imagem"
                          >
                            {uploadingFotoId === prestador.id ? (
                              <Hourglass className="h-5 w-5 animate-spin text-accent-primary" />
                            ) : prestador.foto ? (
                              <>
                                <img
                                  src={prestador.foto}
                                  alt={prestador.nome}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                                  <Camera className="h-4 w-4 text-white" />
                                </div>
                              </>
                            ) : (
                              <>
                                <UserRound
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
                              prestador.ativo ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAtivo(prestador.id, prestador.ativo);
                            }}
                          >
                            {prestador.ativo ? "Desativar" : "Ativar"}
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
        <ModalPrestador
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSavePrestador}
          classesDisponiveis={classesPrestadores}
          onCreateClasse={handleCreateClasse}
        />
      )}
    </div>
  );
}
