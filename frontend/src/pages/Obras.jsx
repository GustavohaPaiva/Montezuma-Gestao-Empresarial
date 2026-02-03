import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ObraCard from "../components/ObraCard";
import ModalNovaObra from "../components/ModalNovaObra";
import { api } from "../services/api";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadObras() {
      try {
        const dados = await api.getObras();
        if (isMounted) {
          setObras(dados || []);
        }
      } catch (err) {
        console.error("Erro ao carregar obras:", err);
      }
    }

    loadObras();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveObra = async (formData) => {
    try {
      await api.createObra({
        cliente: formData.cliente,
        local: formData.nomeObra,
      });

      const dadosAtualizados = await api.getObras();
      setObras(dadosAtualizados || []);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Erro ao salvar obra:", err);
      alert(
        "Erro ao criar obra. Verifique se as colunas 'nome', 'cliente' e 'local' existem no Supabase.",
      );
    }
  };

  const obrasFiltradas = obras.filter(
    (obra) =>
      obra.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      obra.cliente?.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="flex flex-col min-h-screen items-center bg-white">
      <Navbar
        searchTerm={busca}
        onSearchChange={setBusca}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <main className="w-[90%] mt-[40px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(0,350px))] gap-y-[30px] w-full justify-between">
          {obrasFiltradas.map((obra) => (
            <ObraCard
              key={obra.id}
              id={obra.id}
              nome={obra.local}
              client={obra.cliente}
              status={obra.status || "Em andamento"}
            />
          ))}

          {obrasFiltradas.length === 0 && (
            <p className="col-span-full text-gray-400 mt-10 text-center">
              Nenhuma obra encontrada.
            </p>
          )}
        </div>
      </main>

      <ModalNovaObra
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveObra}
      />
    </div>
  );
}
