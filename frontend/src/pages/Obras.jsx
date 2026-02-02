import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ObraCard from "../components/ObraCard";
import { api } from "../services/api";

export default function Obras() {
  const [obras, setObras] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    api.getObras().then((dados) => setObras(dados));
  }, []);

  const obrasFiltradas = obras.filter(
    (obra) =>
      obra.nome.toLowerCase().includes(busca.toLowerCase()) ||
      obra.client.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="flex flex-col min-h-screen items-center bg-white">
      <Navbar searchTerm={busca} onSearchChange={setBusca} />

      <main className="w-[90%] mt-[40px]">
        <div className="grid grid-cols-3 grid-cols-[repeat(auto-fit,minmax(0,350px))] gap-y-[30px] w-full justify-between ">
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
            <p className="col-span-full text-gray-400 mt-10">
              Nenhuma obra encontrada para "{busca}"
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
