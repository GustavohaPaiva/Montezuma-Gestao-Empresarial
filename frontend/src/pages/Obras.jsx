import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ObraCard from "../components/ObraCard";
import ModalNovaObra from "../components/ModalNovaObra";
import { api } from "../services/api";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [busca, setBusca] = useState("");
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

  // --- CRIAR NOVA OBRA (Via Modal) ---
  const handleCreateObra = async (formData) => {
    try {
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

  // --- ATUALIZAR OBRA (Edição Inline no Card) ---
  const handleUpdateInline = async (id, dadosAtualizados) => {
    try {
      // 1. Chama API
      await api.updateObra(id, dadosAtualizados);

      // 2. Atualiza lista localmente para não precisar recarregar tudo
      setObras((prevObras) =>
        prevObras.map((obra) =>
          obra.id === id ? { ...obra, ...dadosAtualizados } : obra,
        ),
      );
    } catch (err) {
      console.error("Erro ao atualizar obra:", err);
      alert("Erro ao atualizar a obra.");
    }
  };

  // --- DELETE (Soft Delete) ---
  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja remover esta obra?")) {
      try {
        // Atualiza visualmente primeiro
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

  // Filtros
  const obrasVisiveis = obras.filter((obra) => {
    if (obra.active === false) return false;
    const termo = busca.toLowerCase();
    const nomeCliente = obra.cliente?.toLowerCase() || "";
    const nomeLocal = obra.local?.toLowerCase() || ""; // API retorna 'local', não 'nome'
    return nomeCliente.includes(termo) || nomeLocal.includes(termo);
  });

  return (
    <div className="flex flex-col min-h-screen items-center bg-white">
      <Navbar
        searchTerm={busca}
        onSearchChange={setBusca}
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
              status={obra.status || "Em andamento"}
              // Passamos onUpdate em vez de onEdit
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

      {/* Modal usado APENAS para criar nova obra */}
      <ModalNovaObra
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateObra}
        obra={null}
      />
    </div>
  );
}
