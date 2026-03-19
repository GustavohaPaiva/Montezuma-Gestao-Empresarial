import CardHome from "../../components/cards/CardHome";
import logo from "../../assets/logos/logo sem fundo.png";
import imagemHome from "../../assets/img/ImagemHome.png";
import Navbar from "../../components/navbar/Navbar";

export default function Home() {
  const modulos = [
    {
      id: 1,
      titulo: "Projetos",
      imagem: "https://img.icons8.com/ios/125/project.png",
      path: "/projetos",
    },
    {
      id: 2,
      titulo: "Processos",
      imagem:
        "https://img.icons8.com/external-outline-design-circle/125/external-Process-Lists-artificial-intelligence-outline-design-circle.png",
      path: "/processos",
    },
    {
      id: 3,
      titulo: "Obras",
      imagem: "https://img.icons8.com/ios/125/company--v1.png",
      path: "/obras",
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
    <div className="text-center relative min-h-screen">
      <img
        src={imagemHome}
        className="w-full h-full absolute inset-0 object-cover -z-10"
        alt="Fundo Home"
      />

      <div className="w-full flex justify-end pt-4 px-16">
        <img
          src=""
          alt="Foto Cliente"
          className="w-[50px] h-[50px] rounded-[50%] border-2 border-[#DC3B0B] object-cover group-hover:opacity-70 transition-opacity"
        />
      </div>

      <div className="w-full p-20 flex flex-row justify-center items-center gap-14">
        <img src={logo} className="w-60" alt="Logo Montezuma" />
        <div className="flex gap-5 items-start flex-col">
          <h2 className="text-7xl font-bold">MONTEZUMA</h2>
          <p className="text-[28px]">Sistema de Gestão Empresarial</p>
        </div>
      </div>

      <div className="px-[7%] gap-10 mt-8 grid grid-cols-[repeat(auto-fit,minmax(0,350px))] w-full justify-between">
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
