import logo from "../assets/logo sem fundo.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  //Verificação de tamanho da tela
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate("/");
  };

  return (
    <header
      className={`w-full mb-[30px] border-b px-[5%] box-border border-[#DBDADE] flex justify-between transition-all items-center ${isMobile ? "h-auto py-[15px]" : "h-[82px]"}`}
    >
      <div className="flex flex-row justify-center items-center">
        <img
          src={logo}
          onClick={handleNavigation}
          alt="Logo Montezuma"
          className="object-contain transition-all mr-[10px] w-[60px] h-[60px]"
        />
        <p className="text-[40px]">Montezuma</p>
      </div>
    </header>
  );
}
