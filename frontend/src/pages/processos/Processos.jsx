import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/navbar/Navbar";
import BaseCard from "../../components/cards/BaseCard";
import BaseInput from "../../components/gerais/BaseInput";
import BaseSelect from "../../components/gerais/BaseSelect";
import CardProcessos from "../../components/cards/CardProcessos";
import { api } from "../../services/api";
import { ID_VOGELKOP, ID_YBYOCA } from "../../constants/escritorios";
import {
  CheckCircle2,
  ClipboardList,
  Hammer,
  Hourglass,
  LayoutGrid,
  Loader2,
} from "lucide-react";

function useScrollFadeIn() {
  const [element, setElement] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [element]);

  return [setElement, isVisible];
}

export default function Processos() {
  const [processos, setProcessos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [showElements, setShowElements] = useState(false);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain] = useScrollFadeIn();

  const carregarProcessos = useCallback(async () => {
    setCarregando(true);
    setShowElements(false);
    try {
      const data = await api.getClientesPorEscritorios([
        ID_VOGELKOP,
        ID_YBYOCA,
      ]);

      setProcessos(data);
    } catch (error) {
      console.error("Erro ao carregar processos:", error);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProcessos();
  }, [carregarProcessos]);

  useEffect(() => {
    if (!carregando) {
      const timer = setTimeout(() => setShowElements(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowElements(false);
    }
  }, [carregando]);

  const handleUpdateProcesso = async (id, dadosAtualizados) => {
    try {
      const clienteAtual = processos.find((p) => p.id === id);
      if (!clienteAtual?.escritorio_id) return;

      await api.updateCliente(id, dadosAtualizados, clienteAtual.escritorio_id);

      if (dadosAtualizados.status === "Obra" && clienteAtual) {
        const { created } = await api.ensureObraForCliente({
          cliente: clienteAtual.nome,
          local:
            clienteAtual.rua_obra ||
            clienteAtual.bairro_obra ||
            "Local a definir",
          cliente_id: clienteAtual.id,
        });
        if (created) {
          alert(
            `Obra criada automaticamente para o cliente ${clienteAtual.nome}!`,
          );
        }
      }

      carregarProcessos();
    } catch (error) {
      console.error("Erro ao atualizar processo:", error);
    }
  };

  const handleDeleteProcesso = async (id) => {
    try {
      const row = processos.find((p) => p.id === id);
      if (!row?.escritorio_id) return;
      await api.deleteCliente(id, row.escritorio_id);
      carregarProcessos();
    } catch (error) {
      console.error("Erro ao deletar processo:", error);
    }
  };

  const processosProcessados = useMemo(() => {
    let lista = [...processos];

    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome?.toLowerCase().includes(termo) ||
          p.tipo?.toLowerCase().includes(termo),
      );
    }

    if (filtroStatus !== "Tudo") {
      lista = lista.filter((p) => p.status === filtroStatus);
    }

    const pesosStatus = {
      Produção: 1,
      Prefeitura: 2,
      Caixa: 3,
      Cartorio: 4,
      Obra: 5,
      Finalizado: 6,
    };

    lista.sort((a, b) => {
      const pesoA = pesosStatus[a.status] || 99;
      const pesoB = pesosStatus[b.status] || 99;

      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }

      const dataA = new Date(a.data || a.created_at).getTime();
      const dataB = new Date(b.data || b.created_at).getTime();
      return dataB - dataA;
    });

    return lista;
  }, [processos, busca, filtroStatus]);

  const metricas = useMemo(() => {
    const list = processos;
    return {
      total: list.length,
      producao: list.filter((p) => p.status === "Produção").length,
      emTramite: list.filter((p) =>
        ["Prefeitura", "Caixa", "Cartorio", "Obra"].includes(p.status),
      ).length,
      finalizadas: list.filter((p) => p.status === "Finalizado").length,
    };
  }, [processos]);

  const filtrosNavbar = [
    <BaseInput
      key="filtro-busca-processos"
      value={busca}
      onChange={(event) => setBusca(event.target.value)}
      placeholder="Buscar por cliente ou tipo..."
    />,
    <BaseSelect
      key="filtro-status-processos"
      searchable={false}
      value={filtroStatus}
      onChange={(event) => setFiltroStatus(event.target.value)}
      options={[
        { value: "Tudo", label: "Todos os cadastros" },
        { value: "Produção", label: "Produção" },
        { value: "Prefeitura", label: "Prefeitura" },
        { value: "Caixa", label: "Caixa" },
        { value: "Cartorio", label: "Cartorio" },
        { value: "Obra", label: "Obra" },
        { value: "Finalizado", label: "Finalizado" },
      ]}
    />,
  ];

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out ${
          isNavVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Navbar title="Processos" filters={filtrosNavbar} />
      </div>

      {carregando ? (
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
                <ClipboardList className="h-7 w-7" strokeWidth={2} />
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
                Carregando informações
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
                Buscando cadastros e etapas. Isso costuma levar só um instante.
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
          <div
            className={`mb-8 grid w-full grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 transition-all duration-700 ease-out ${
              showElements
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            <BaseCard
              variant="metric"
              title="Total de cadastros"
              value={metricas.total}
              colorTheme="blue"
              icon={<LayoutGrid className="h-5 w-5" />}
            />
            <BaseCard
              variant="metric"
              title="Em produção"
              value={metricas.producao}
              colorTheme="purple"
              icon={<Hourglass className="h-5 w-5" />}
            />
            <BaseCard
              variant="metric"
              title="Em trâmite"
              value={metricas.emTramite}
              colorTheme="amber"
              icon={<Hammer className="h-5 w-5" />}
            />
            <BaseCard
              variant="metric"
              title="Finalizados"
              value={metricas.finalizadas}
              colorTheme="emerald"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
          </div>

          {processosProcessados.length > 0 ? (
            <div className="grid w-full grid-cols-1 place-items-center gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-8">
              {processosProcessados.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex w-full justify-center transition-all duration-700 ease-out ${
                    showElements
                      ? "translate-y-0 opacity-100"
                      : "translate-y-8 opacity-0"
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <CardProcessos
                    id={item.id}
                    client={item.nome}
                    tipo={item.tipo}
                    status={item.status}
                    dataRegistro={item.data || item.created_at}
                    onUpdate={handleUpdateProcesso}
                    onDelete={() => handleDeleteProcesso(item.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-primary/60 bg-white/80 px-6 py-12 text-center shadow-inner ring-1 ring-slate-900/5">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 ring-1 ring-slate-200/80">
                <ClipboardList className="h-6 w-6" strokeWidth={2} />
              </div>
              <p className="text-base font-semibold text-text-primary">
                Nenhum cadastro encontrado com esses filtros.
              </p>
              <p className="mt-2 max-w-md text-sm text-text-muted">
                Ajuste o status ou limpe a busca para ver mais registros.
              </p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
