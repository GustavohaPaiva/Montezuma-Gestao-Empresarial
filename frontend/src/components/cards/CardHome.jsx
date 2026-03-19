import { useNavigate } from "react-router-dom";

export default function CardHome({ img, titulo, path }) {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(path);
  };

  return (
    <div
      onClick={handleNavigation}
      className="w-[350px] h-[250px] rounded-[10px] cursor-pointer flex flex-col justify-center items-center bg-white/30 backdrop-blur-md border border-white/40 shadow-sm transition-all duration-300 hover:bg-white/40 hover:shadow-lg"
    >
      <div className="absolute inset-0 rounded-[12px] pointer-events-none bg-gradient-to-br from-white/70 via-white/10 to-transparent opacity-60" />
      <img src={img} alt={titulo} className="w-[100px] h-[100px] opacity-90" />

      <h2 className="text-[28px] mt-4 font-semibold text-black">{titulo}</h2>
    </div>
  );
}
