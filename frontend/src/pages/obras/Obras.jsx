import { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/navbar/NavbarObras";
import ObraCard from "../../components/cards/CardObra";
import ModalNovaObra from "../../components/modals/ModalNovaObra";
import { api } from "../../services/api";
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

const verificarStatusPagamento = (obra) => {
  const extrato = obra.extrato || obra.relatorioExtrato || [];
  const mdo = obra.maoDeObra || [];
  const mat = obra.materiais || [];

  if (extrato.length === 0 && mdo.length === 0 && mat.length === 0) {
    return true;
  }

  for (let e of extrato) {
    if ((e.status_financeiro || "").toLowerCase().trim() !== "pago") {
      return false;
    }
  }

  for (let m of mdo) {
    const orcado = parseFloat(m.valor_orcado) || 0;
    const pago = parseFloat(m.valor_pago) || 0;
    if (
      orcado - pago > 0.01 &&
      !extrato.some((e) => e.mao_de_obra_id === m.id)
    ) {
      return false;
    }
  }

  for (let m of mat) {
    if (
      (parseFloat(m.valor) || 0) > 0 &&
      !extrato.some((e) => e.material_id === m.id)
    ) {
      return false;
    }
  }

  return true;
};

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain, isMainVisible] = useScrollFadeIn();

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setCarregando(true);
      try {
        const dados = await api.getObras({ signal: controller.signal });
        setObras(dados || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setCarregando(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [refresh]);

  const reloadObras = () => setRefresh((prev) => !prev);

  const obrasVisiveis = useMemo(() => {
    const termo = busca.toLowerCase();

    const filtradas = obras.filter((obra) => {
      if (obra.active === false) return false;
      if (filtroStatus !== "Tudo" && obra.status !== filtroStatus) return false;

      return (
        (obra.cliente?.toLowerCase() || "").includes(termo) ||
        (obra.local?.toLowerCase() || "").includes(termo)
      );
    });

    const pesos = {
      "Em andamento": 1,
      "Aguardando iniciação": 2,
      Concluída: 3,
    };

    return filtradas
      .sort((a, b) => (pesos[a.status] || 99) - (pesos[b.status] || 99))
      .map((obra) => ({
        ...obra,
        isTudoPago: verificarStatusPagamento(obra),
      }));
  }, [obras, busca, filtroStatus]);

  const handleCreateObra = async (formData) => {
    try {
      await api.createObra({
        cliente: formData.cliente,
        local: formData.nomeObra,
      });
      reloadObras();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao criar obra.");
    }
  };

  const handleUpdateInline = async (id, dadosAtualizados) => {
    try {
      await api.updateObra(id, dadosAtualizados);
      setObras((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...dadosAtualizados } : o)),
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar a obra.");
      reloadObras();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja remover esta obra?")) {
      try {
        await api.deleteObra(id);
        setObras((prev) =>
          prev.map((o) => (o.id === id ? { ...o, active: false } : o)),
        );
      } catch (err) {
        console.error(err);
        alert("Erro ao remover obra.");
        reloadObras();
      }
    }
  };

  const showContent = isMainVisible && !carregando;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[#EEEDF0]">
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
          onOpenModal={() => setIsModalOpen(true)}
        />
      </div>

      <main ref={refMain} className="w-[90%] mt-10">
        {carregando ? (
          <div className="flex justify-center items-center py-20">
            <Hourglass className="w-8 h-8 animate-spin text-[#DC3B0B]" />
          </div>
        ) : (
          <div className="grid w-full gap-8 grid-cols-[repeat(auto-fit,minmax(0,322px))] justify-center md:justify-between">
            {obrasVisiveis.map((obra, index) => (
              <div
                key={obra.id}
                className={`transition-all duration-700 ease-out transform ${
                  showContent
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <ObraCard
                  id={obra.id}
                  nome={obra.local}
                  client={obra.clientes?.nome || obra.cliente}
                  status={obra.status || "Aguardando iniciação"}
                  tudoPago={obra.isTudoPago}
                  onUpdate={handleUpdateInline}
                  onDelete={() => handleDelete(obra.id)}
                />
              </div>
            ))}
            {obrasVisiveis.length === 0 && (
              <p className="w-full mt-10 text-center text-gray-500 col-span-full">
                Nenhuma obra encontrada.
              </p>
            )}
          </div>
        )}
      </main>

      <ModalNovaObra
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateObra}
        obra={null}
      />
    </div>
  );
}
