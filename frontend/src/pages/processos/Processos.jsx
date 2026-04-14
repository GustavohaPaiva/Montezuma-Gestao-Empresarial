import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/navbar/NavbarProcessos";
import CardProcessos from "../../components/cards/CardProcessos";
import { api } from "../../services/api";
import { ID_VOGELKOP, ID_YBYOCA } from "../../constants/escritorios";
import { Hourglass } from "lucide-react";

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

      await api.updateCliente(
        id,
        dadosAtualizados,
        clienteAtual.escritorio_id,
      );

      if (dadosAtualizados.status === "Obra") {
        if (clienteAtual) {
          await api.createObra({
            cliente: clienteAtual.nome,
            local:
              clienteAtual.rua_obra ||
              clienteAtual.bairro_obra ||
              "Local a definir",
            cliente_id: clienteAtual.id,
          });
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

  return (
    <div className="flex flex-col min-h-screen w-full items-center bg-[#EEEDF0] pb-10">
      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out transform ${
          isNavVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <Navbar
          searchTerm={busca}
          onSearchChange={setBusca}
          filterStatus={filtroStatus}
          onFilterChange={setFiltroStatus}
        />
      </div>

      <main ref={refMain} className="w-[90%] mt-[40px] flex flex-col gap-6">
        {carregando ? (
          <div className="flex justify-center items-center py-20">
            <Hourglass className="w-8 h-8 animate-spin text-[#DC3B0B]" />
          </div>
        ) : processosProcessados.length > 0 ? (
          <div className="grid w-full md:grid-cols-[repeat(auto-fit,minmax(0,380px))] gap-[30px] justify-center md:justify-between">
            {processosProcessados.map((item, index) => (
              <div
                key={item.id}
                className={`transition-all duration-700 ease-out transform w-full flex justify-center ${
                  showElements
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <CardProcessos
                  id={item.id}
                  client={item.nome}
                  tipo={item.tipo}
                  status={item.status}
                  onUpdate={handleUpdateProcesso}
                  onDelete={() => handleDeleteProcesso(item.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center w-full h-[200px] text-gray-500 font-medium">
            Nenhum processo encontrado com esses filtros.
          </div>
        )}
      </main>
    </div>
  );
}
