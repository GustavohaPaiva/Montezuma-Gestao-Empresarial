import CardHome from "../components/CardHome";
import Navbar from "../components/Navbar";

export default function Home() {
  const modulos = [
    {
      id: 1,
      titulo: "Obras",
      imagem: "https://img.icons8.com/ios/125/company--v1.png",
      path: "/obras",
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
      path: "/",
    },
  ];

  return (
    <div className="text-center">
      <Navbar />
      <div className="px-[5%] gap-[50px] grid grid-cols-[repeat(auto-fit,minmax(0,350px))] w-full justify-between">
        {modulos.map((item) => (
          <CardHome
            key={item.id}
            titulo={item.titulo}
            img={item.imagem}
            path={item.path}
          />
        ))}
      </div>
    </div>
  );
}
