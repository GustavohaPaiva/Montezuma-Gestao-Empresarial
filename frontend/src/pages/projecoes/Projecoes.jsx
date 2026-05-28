import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Eye,
  FileSpreadsheet,
  LineChart,
  Pencil,
  Plus,
  Send,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import Navbar from "../../components/navbar/Navbar";
import BaseCard from "../../components/cards/BaseCard";
import BaseButton from "../../components/gerais/BaseButton";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import BaseModal from "../../components/gerais/BaseModal";
import LoadingPainel from "../../components/gerais/LoadingPainel";
import ModalProjecao from "../../components/modals/ModalProjecao";
import StatusProjecaoBadge from "../../components/projecoes/StatusProjecaoBadge";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import { api } from "../../services/api";
import {
  STATUS_PROJECAO_OPCOES,
  calcularTotalProjecao,
  formatarDataProjecao,
  formatarMoedaBRL,
} from "../../utils/projecaoUtils";
import { navbarAcaoPrimariaClass, projecaoGrid4Class } from "./projecoesUi";

export default function Projecoes() {
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");
  const [modalAberto, setModalAberto] = useState(false);
  const [edicao, setEdicao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [excluirAlvo, setExcluirAlvo] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
  const [showElements, setShowElements] = useState(false);

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.getProjecoes();
      setLista(rows || []);
      setErro(null);
    } catch (e) {
      console.error("[Projecoes] carregar:", e);
      setErro(e?.message || "Não foi possível carregar as projeções.");
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(t);
    }
    setShowElements(false);
  }, [loading]);

  const filtradas = useMemo(() => {
    let rows = [...lista];
    const termo = busca.trim().toLowerCase();
    if (termo) {
      rows = rows.filter(
        (p) =>
          p.nome?.toLowerCase().includes(termo) ||
          p.cliente_nome?.toLowerCase().includes(termo) ||
          p.endereco_obra?.toLowerCase().includes(termo),
      );
    }
    if (filtroStatus !== "Tudo") {
      rows = rows.filter((p) => (p.status || "") === filtroStatus);
    }
    return rows;
  }, [lista, busca, filtroStatus]);

  const metricas = useMemo(() => {
    const totalValor = filtradas.reduce(
      (acc, p) => acc + calcularTotalProjecao(p),
      0,
    );
    const rascunhos = filtradas.filter(
      (p) => (p.status || "").toLowerCase() === "rascunho",
    ).length;
    const enviadas = filtradas.filter(
      (p) => (p.status || "").toLowerCase() === "enviada",
    ).length;
    return { totalValor, rascunhos, enviadas, quantidade: filtradas.length };
  }, [filtradas]);

  const filtrosNavbar = [
    <BaseInput
      key="busca-projecoes"
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
      placeholder="Buscar por nome, cliente ou endereço…"
    />,
    <BaseSelect
      key="status-projecoes"
      value={filtroStatus}
      onChange={(e) => setFiltroStatus(e.target.value)}
      options={[
        { value: "Tudo", label: "Todos os status" },
        ...STATUS_PROJECAO_OPCOES.map((s) => ({ value: s, label: s })),
      ]}
    />,
  ];

  const abrirEditar = (p, e) => {
    e?.stopPropagation();
    setEdicao(p);
    setModalAberto(true);
  };

  const salvarModal = async (dados) => {
    setSalvando(true);
    try {
      if (dados.id) {
        await api.updateProjecao(dados.id, dados);
      } else {
        const criada = await api.createProjecao(dados);
        setModalAberto(false);
        setEdicao(null);
        navigate(`/projecoes/${criada.id}`);
        return;
      }
      setModalAberto(false);
      setEdicao(null);
      await carregar();
    } catch (e) {
      console.error("[Projecoes] salvar:", e);
      alert(e?.message || "Não foi possível salvar a projeção.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExcluir = async () => {
    if (!excluirAlvo?.id) return;
    setExcluindo(true);
    try {
      await api.deleteProjecao(excluirAlvo.id);
      setExcluirAlvo(null);
      await carregar();
    } catch (e) {
      console.error("[Projecoes] excluir:", e);
      alert(e?.message || "Não foi possível excluir a projeção.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out ${
          isNavVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Navbar
          title="Projeções"
          filters={filtrosNavbar}
          actions={[
            {
              key: "nova-projecao",
              label: "Nova projeção",
              onClick: () => {
                setEdicao(null);
                setModalAberto(true);
              },
              icon: <Plus className="h-4 w-4" aria-hidden />,
              className: navbarAcaoPrimariaClass,
            },
          ]}
        />
      </div>

      {loading ? (
        <LoadingPainel
          titulo="Carregando projeções"
          descricao="Buscando propostas comerciais cadastradas…"
          icon={<FileSpreadsheet className="h-7 w-7" strokeWidth={2} />}
        />
      ) : (
        <main
          ref={refMain}
          className={`w-full px-[5%] pb-12 transition-all duration-700 ease-out ${
            showElements
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          {erro ? (
            <p className="mb-4 rounded-xl border border-danger-primary/30 bg-danger-soft/40 px-3 py-2 text-sm text-danger-primary">
              {erro}
            </p>
          ) : null}

          {lista.length > 0 ? (
            <section className={`mb-6 ${projecaoGrid4Class}`}>
              <BaseCard
                variant="metric"
                title="Projeções"
                value={String(metricas.quantidade)}
                icon={<LineChart className="h-5 w-5" />}
                colorTheme="primary"
              />
              <BaseCard
                variant="metric"
                title="Valor total (filtro)"
                value={formatarMoedaBRL(metricas.totalValor)}
                icon={<Wallet className="h-5 w-5" />}
                colorTheme="amber"
              />
              <BaseCard
                variant="metric"
                title="Em rascunho"
                value={String(metricas.rascunhos)}
                icon={<FileSpreadsheet className="h-5 w-5" />}
                colorTheme="blue"
              />
              <BaseCard
                variant="metric"
                title="Enviadas"
                value={String(metricas.enviadas)}
                icon={<Send className="h-5 w-5" />}
                colorTheme="emerald"
              />
            </section>
          ) : null}

          {lista.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-primary/40 bg-white px-6 py-14 text-center shadow-sm ring-1 ring-black/[0.03]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary ring-1 ring-accent-primary/15">
                <FileSpreadsheet className="h-7 w-7" strokeWidth={2} />
              </div>
              <p className="text-base font-semibold text-text-primary">
                Nenhuma projeção cadastrada
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Use &quot;Nova projeção&quot; na barra superior para lançar a
                primeira proposta.
              </p>
            </div>
          ) : filtradas.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border-primary/40 bg-white px-4 py-10 text-center text-sm text-text-muted shadow-sm ring-1 ring-black/[0.03]">
              Nenhuma projeção corresponde aos filtros aplicados.
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs font-medium text-text-muted">
                {filtradas.length} de {lista.length} projeção
                {lista.length !== 1 ? "ões" : ""}
              </p>
              <div className={projecaoGrid4Class}>
                {filtradas.map((p) => (
                  <BaseCard
                    key={p.id}
                    variant="entity"
                    colorTheme="primary"
                    title={p.nome}
                    value={p.cliente_nome || "Cliente não informado"}
                    statusElement={<StatusProjecaoBadge status={p.status} />}
                    onClick={() => navigate(`/projecoes/${p.id}`)}
                    metadata={[
                      {
                        icon: (
                          <CalendarDays className="h-3.5 w-3.5 text-text-muted" />
                        ),
                        label: formatarDataProjecao(p.data_proposta),
                      },
                      {
                        icon: (
                          <Wallet className="h-3.5 w-3.5 text-accent-primary" />
                        ),
                        label: formatarMoedaBRL(calcularTotalProjecao(p)),
                        textClass: "font-semibold text-accent-primary",
                      },
                      ...(p.endereco_obra
                        ? [
                            {
                              icon: (
                                <UserRound className="h-3.5 w-3.5 text-text-muted" />
                              ),
                              label: p.endereco_obra,
                            },
                          ]
                        : []),
                    ]}
                  >
                    <div className="flex flex-wrap gap-2">
                      <BaseButton
                        variant="outline"
                        size="sm"
                        icon={<Eye className="h-3.5 w-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projecoes/${p.id}`);
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        Detalhes
                      </BaseButton>
                      <BaseButton
                        variant="ghost"
                        size="sm"
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        onClick={(e) => abrirEditar(p, e)}
                      >
                        Editar
                      </BaseButton>
                      <BaseButton
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setExcluirAlvo(p);
                        }}
                      >
                        Excluir
                      </BaseButton>
                    </div>
                  </BaseCard>
                ))}
              </div>
            </>
          )}
        </main>
      )}

      <ModalProjecao
        isOpen={modalAberto}
        onClose={() => {
          if (!salvando) {
            setModalAberto(false);
            setEdicao(null);
          }
        }}
        onSave={salvarModal}
        projecaoEdicao={edicao}
        salvando={salvando}
      />

      <BaseModal
        isOpen={Boolean(excluirAlvo)}
        onClose={() => !excluindo && setExcluirAlvo(null)}
        title="Excluir projeção"
        size="sm"
      >
        <p className="text-sm text-text-muted">
          Tem certeza que deseja excluir{" "}
          <strong className="text-text-primary">{excluirAlvo?.nome}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="outline"
            onClick={() => setExcluirAlvo(null)}
            disabled={excluindo}
          >
            Cancelar
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={confirmarExcluir}
            isLoading={excluindo}
          >
            Excluir
          </BaseButton>
        </div>
      </BaseModal>
    </div>
  );
}
