import { useState, useEffect } from "react";
import ButtonDefault from "./ButtonDefault";
import logo from "../assets/logo sem fundo.png";
import { useNavigate } from "react-router-dom";

export default function Navbar({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onOpenModal,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1100);

  const navigate = useNavigate();
  const handleNavigation = () => {
    navigate("/");
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1100);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className={`w-full px-[5%] box-border border-b border-[#DBDADE] flex justify-center bg-[#EEEDF0]  top-0 z-10 transition-all ${isMobile ? "h-auto py-[15px]" : "h-[82px]"}`}
    >
      <div
        className={`w-full flex items-center justify-between gap-[20px] ${isMobile ? "flex-col" : "flex-row h-full"}`}
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

        <div
          className={`flex gap-[10px] sm:pr-[27px] ${isMobile ? "flex-col w-full" : "flex-row items-center"}`}
        >
          <ButtonDefault
            onClick={onOpenModal}
            className={`${isMobile ? "w-full h-[45px]" : "w-[150px]"} text-[14px] shrink-0`}
          >
            + Cliente
          </ButtonDefault>

          <div className={`relative ${isMobile ? "w-full" : "w-[200px]"}`}>
            <select
              value={filterStatus}
              onChange={(e) => onFilterChange(e.target.value)}
              className={`bg-[#F7F7F8] border border-[#C4C4C9] rounded-[6px] text-[16px] text-[#464C54] px-[12px] focus:outline-none w-full box-border cursor-pointer appearance-none ${isMobile ? "h-[45px]" : "h-[40px]"}`}
              style={{ backgroundImage: "none" }}
            >
              <option value="A.P.">A.P.</option>
              <option value="P.M.U e Caixa">P.M.U e Caixa</option>
              <option value="Contrato">Contrato</option>
              <option value="Obra">Obra</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>

          <div className={`relative ${isMobile ? "w-full" : "w-[250px]"}`}>
            <input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`bg-[#F7F7F8] border border-[#C4C4C9] rounded-[6px] text-[16px] text-[#464C54] px-[12px] focus:outline-none w-full box-border ${isMobile ? "h-[45px]" : "h-[40px]"}`}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
