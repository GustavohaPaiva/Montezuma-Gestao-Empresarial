import ButtonDefault from "../gerais/ButtonDefault";
import logo from "../../assets/logos/logo sem fundo.png";
import { useNavigate } from "react-router-dom";

export default function NavbarObras({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterChange,
  onOpenModal,
}) {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate("/");
  };

  return (
    <header className="relative z-50 flex justify-center w-full px-4 lg:px-[5%] py-4 lg:py-0 lg:h-[82px] transition-all bg-[#EEEDF0] border-b border-[#DBDADE] sticky top-0">
      <div className="flex flex-col items-center justify-between w-full gap-4 lg:flex-row lg:h-full">
        {/* LOGO */}
        <div className="flex items-center justify-center transition-opacity">
          <img
            src={logo}
            alt="Logo Montezuma"
            onClick={handleNavigation}
            className="object-contain w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] mr-3 cursor-pointer"
          />
          <p className="text-3xl lg:text-[40px] font-semibold text-[#464C54]">
            Montezuma
          </p>
        </div>

        {/* CONTROLES (Filtros, Busca e Botão) */}
        <div className="flex flex-col lg:flex-row items-center w-full lg:w-auto gap-3 lg:gap-4 lg:pr-6">
          <ButtonDefault
            onClick={onOpenModal}
            className="w-full lg:w-[150px] h-[45px] lg:h-[40px] text-[#464C54] bg-[#F7F7F8] text-sm font-medium shrink-0 shadow-sm"
          >
            + Nova Obra
          </ButtonDefault>

          {/* Filtro Status */}
          <div className="relative w-full lg:w-[200px]">
            <select
              value={filterStatus}
              onChange={(e) => onFilterChange(e.target.value)}
              className="w-full h-[45px] lg:h-[40px] px-3 bg-[#FFFFFF] border border-[#C4C4C9] rounded-md text-[#464C54] focus:ring-2 focus:ring-blue-400 focus:outline-none cursor-pointer appearance-none shadow-sm"
            >
              <option value="Tudo">Todas as Obras</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Aguardando iniciação">Aguardando iniciação</option>
              <option value="Concluída">Concluídas</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-[#464C54]">
              <svg
                className="w-4 h-4"
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

          {/* Busca */}
          <div className="w-full lg:w-[250px]">
            <input
              type="text"
              placeholder="Buscar obra ou cliente..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-[45px] lg:h-[40px] px-3 bg-[#FFFFFF] border border-[#C4C4C9] rounded-md text-[#464C54] focus:ring-2 focus:ring-blue-400 focus:outline-none shadow-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
