import Navbar from "../../components/navbar/NavbarProcessos";
import CardProcessos from "../../components/cards/CardProcessos";

export default function Processos() {
  const modulos = [
    {
      id: 1,
      client: "Teste1",
    },
    {
      id: 2,
      titulo: "Projetos",
      imagem: "https://img.icons8.com/ios/125/project.png",
      path: "/projetos",
    },
    {
      id: 3,
      titulo: "Processos",
      imagem:
        "https://img.icons8.com/external-outline-design-circle/125/external-Process-Lists-artificial-intelligence-outline-design-circle.png",
      path: "/processos",
    },
    {
      id: 4,
      titulo: "Financeiro",
      imagem:
        "https://img.icons8.com/external-outline-wichaiwi/125/external-financial-business-continuity-plan-outline-wichaiwi.png",
      path: "/financeiro",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen w-full items-center bg-[#EEEDF0]">
      <Navbar />
      <main className="w-[90%] mt-[40px]">
        <div className="grid w-full md:grid-cols-[repeat(auto-fit,minmax(0,380px))] gap-y-[30px] w-full justify-center md:justify-between">
          {modulos.map((item) => (
            <CardProcessos
              key={item.id}
              client={item.client}
              path={item.path}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
