import { useEffect, useState } from "react";
import Navbar from "../components/NavbarObras";
import ObraCard from "../components/ObraCard";
import ModalNovaObra from "../components/ModalNovaObra";
import { api } from "../services/api";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Tudo"); // Novo estado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);

  // Carregar obras
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const dados = await api.getObras();
        if (isMounted) {
          setObras(dados || []);
        }
      } catch (err) {
        console.error("Erro ao carregar obras:", err);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [refresh]);

  const reloadObras = () => setRefresh((prev) => !prev);

  // --- CRIAR NOVA OBRA ---
  const handleCreateObra = async (formData) => {
    try {
      // API já define status como "Aguardando iniciação"
      await api.createObra({
        cliente: formData.cliente,
        local: formData.nomeObra,
      });
      reloadObras();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao criar obra:", err);
      alert("Erro ao criar obra.");
    }
  };

  // --- ATUALIZAR OBRA ---
  const handleUpdateInline = async (id, dadosAtualizados) => {
    try {
      // Atualização Otimista
      setObras((prevObras) =>
        prevObras.map((obra) =>
          obra.id === id ? { ...obra, ...dadosAtualizados } : obra,
        ),
      );
      await api.updateObra(id, dadosAtualizados);
    } catch (err) {
      console.error("Erro ao atualizar obra:", err);
      alert("Erro ao atualizar a obra.");
      reloadObras(); // Reverte se der erro
    }
  };

  // --- DELETE ---
  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja remover esta obra?")) {
      try {
        setObras((prevObras) =>
          prevObras.map((obra) =>
            obra.id === id ? { ...obra, active: false } : obra,
          ),
        );
        await api.deleteObra(id);
      } catch (err) {
        console.error("Erro ao deletar:", err);
        alert("Erro ao remover obra.");
        reloadObras();
      }
    }
  };

  // --- LÓGICA DE ORDENAÇÃO ---
  const ordenarObras = (lista) => {
    const pesos = {
      "Em andamento": 1,
      "Aguardando iniciação": 2,
      Concluída: 3,
    };

    return [...lista].sort((a, b) => {
      const pesoA = pesos[a.status] || 99;
      const pesoB = pesos[b.status] || 99;
      return pesoA - pesoB;
    });
  };

  // --- FILTROS ---
  const obrasFiltradas = obras.filter((obra) => {
    if (obra.active === false) return false;

    // Filtro Navbar
    if (filtroStatus !== "Tudo" && obra.status !== filtroStatus) return false;

    // Busca Texto
    const termo = busca.toLowerCase();
    const nomeCliente = obra.cliente?.toLowerCase() || "";
    const nomeLocal = obra.local?.toLowerCase() || "";
    return nomeCliente.includes(termo) || nomeLocal.includes(termo);
  });

  const obrasVisiveis = ordenarObras(obrasFiltradas);

  return (
    <div className="flex flex-col min-h-screen items-center bg-[#EEEDF0]">
      <Navbar
        searchTerm={busca}
        onSearchChange={setBusca}
        filterStatus={filtroStatus}
        onFilterChange={setFiltroStatus}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <main className="w-[90%] mt-[40px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(0,350px))] gap-y-[30px] w-full justify-between">
          {obrasVisiveis.map((obra) => (
            <ObraCard
              key={obra.id}
              id={obra.id}
              nome={obra.local}
              client={obra.cliente}
              status={obra.status || "Aguardando iniciação"}
              onUpdate={handleUpdateInline}
              onDelete={() => handleDelete(obra.id)}
            />
          ))}

          {obrasVisiveis.length === 0 && (
            <p className="col-span-full text-gray-400 mt-10 text-center">
              Nenhuma obra encontrada.
            </p>
          )}
        </div>
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
