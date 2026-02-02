import { useState, useEffect } from "react";
import ButtonDefault from "./ButtonDefault";
import logo from "../assets/logo.png";

export default function Navbar({ searchTerm, onSearchChange }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className={`w-full border-b border-[#DBDADE] flex justify-center bg-white sticky top-0 z-10 transition-all ${
        isMobile ? "h-[150px]" : "h-[82px]"
      }`}
    >
      <div
        className={`w-[90%] max-w-7xl flex items-center justify-between gap-[20px] ${
          isMobile ? "flex-col py-[20px]" : "flex-row h-full"
        }`}
      >
        <img
          src={logo}
          alt="Logo Montezuma"
          className={`object-contain transition-all ${
            isMobile ? "hidden" : "w-[120px] h-[75px]"
          }`}
        />

        <div
          className={`flex items-end gap-[10px] ${
            isMobile ? "flex-col w-full h-[150px]" : "flex-row items-center"
          }`}
        >
          <ButtonDefault
            className={`${isMobile ? "w-full h-[45px]" : "w-[150px]"} text-[14px] shrink-0`}
          >
            + Nova Obra
          </ButtonDefault>

          <div className={`relative ${isMobile ? "w-full" : "w-[250px]"}`}>
            <input
              type="text"
              placeholder="Buscar obra ou cliente..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`bg-[#F7F7F8] border border-[#C4C4C9] rounded-[6px] text-[16px] text-[#464C54] px-[12px] focus:outline-none w-full box-border h-[40px] ${
                isMobile ? "h-[45px]" : "h-[35px]"
              }`}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
