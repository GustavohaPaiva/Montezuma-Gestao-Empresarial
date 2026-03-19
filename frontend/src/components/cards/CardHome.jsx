import { useNavigate } from "react-router-dom";

export default function CardHome({ img, titulo, path }) {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate(path);
  };

  return (
    <div
      onClick={handleNavigation}
      className="w-full h-[210px] rounded-[10px] cursor-pointer flex flex-col justify-center items-center bg-white/30 backdrop-blur-md border border-white/40 transition-all duration-300 hover:bg-white/40 hover:shadow-[0_10px_40px_rgba(255,223,0,0.35)] hover:scale-103
        "
    >
      <div className="absolute inset-0 rounded-[12px] pointer-events-none bg-gradient-to-br from-white/70 via-white/10 to-transparent opacity-60 " />
      <img src={img} alt={titulo} className="w-[100px] h-[100px] opacity-90" />

      <h2 className="text-[28px] mt-4 font-semibold text-black">{titulo}</h2>
    </div>
  );
}
