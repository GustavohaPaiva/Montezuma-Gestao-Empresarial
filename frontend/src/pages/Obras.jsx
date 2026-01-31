import Navbar from "../components/Navbar";
import ObraCard from "../components/ObraCard";

export default function Obras() {
  const obras = [
    { id: 1, nome: "Obra 1", client: "A", status: "Concluido" },
    { id: 2, nome: "Obra 2", client: "B", status: "Concluido" },
    { id: 3, nome: "Obra 3", client: "C", status: "Em andamento" },
    { id: 4, nome: "Obra 4", client: "D", status: "Em andamento" },
    { id: 5, nome: "Obra 5", client: "E", status: "Em andamento" },
    { id: 6, nome: "Obra 6", client: "F", status: "Em andamento" },
    { id: 7, nome: "Obra 7", client: "G", status: "Em andamento" },
    { id: 8, nome: "Obra 8", client: "H", status: "Em andamento" },
    { id: 9, nome: "Obra 9", client: "I", status: "Em andamento" },
  ];

  return (
    <div className="flex flex-col min-h-screen items-center bg-white">
      <Navbar />

      <main className="flex justify-center justify-items-center w-[90%] mt-[40px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(0,350px))] grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-y-[30px] w-full justify-between">
          {obras.map((obra) => (
            <ObraCard
              key={obra.id}
              nome={obra.nome}
              client={obra.client}
              status={obra.status}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
