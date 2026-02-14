import { useNavigate } from "react-router-dom";

export default function CardHome({ img, titulo, path }) {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(path);
  };

  return (
    <div
      onClick={handleNavigation}
      className="w-[320px] bg-[#FFFFFF] shadow-xl/xl h-[350px] rounded-[10px] cursor-pointer shadow-sm hover:shadow-lg transition-shadow flex flex-col justify-center items-center"
    >
      <img src={img} alt={titulo} className="w-[125px] h-[125px]" />
      <h2 className="text-[45px] mt-4 font-semibold">{titulo}</h2>
    </div>
  );
}
