import CardHome from "../components/CardHome";
import Navbar from "../components/Navbar";

export default function Home() {
  const modulos = [
    {
      id: 1,
      titulo: "Obras",
      imagem: "https://img.icons8.com/ios/125/company--v1.png",
      path: "/obras", // <-- Apenas a string da rota
    },
    {
      id: 2,
      titulo: "Projetos",
      imagem:
        "https://img.icons8.com/external-outline-design-circle/125/external-Process-Lists-artificial-intelligence-outline-design-circle.png",
      path: "/projetos",
    },
    {
      id: 3,
      titulo: "Financeiro",
      imagem:
        "https://img.icons8.com/external-outline-wichaiwi/125/external-financial-business-continuity-plan-outline-wichaiwi.png",
      path: "/",
    },
  ];

  return (
    <div className="text-center">
      <Navbar />
      <div className="grid grid-cols-3 gap-6 px-[5%] w-full">
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
