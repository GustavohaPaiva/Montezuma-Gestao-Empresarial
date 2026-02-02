import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ObraCard from "../components/ObraCard";
import ModalNovaObra from "../components/ModalNovaObra"; // Importação do novo modal
import { api } from "../services/api";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [busca, setBusca] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api.getObras().then((dados) => setObras(dados));
  }, []);

  const handleSaveObra = (novaObra) => {
    console.log("Dados da nova obra:", novaObra);
    // Aqui você integraria com sua API futuramente
    setIsModalOpen(false);
  };

  const obrasFiltradas = obras.filter(
    (obra) =>
      obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
      obra.client.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="flex flex-col min-h-screen items-center bg-white">
      {/* Passando a função para abrir o modal para a Navbar */}
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
              nome={obra.nome}
              client={obra.client}
              status={obra.status}
            />
          ))}

          {obrasFiltradas.length === 0 && (
            <p className="col-span-full text-gray-400 mt-10 text-center">
              Nenhuma obra encontrada para "{busca}"
            </p>
          )}
        </div>
      </main>

      {/* Modal Nova Obra */}
      <ModalNovaObra
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveObra}
      />
    </div>
  );
}
