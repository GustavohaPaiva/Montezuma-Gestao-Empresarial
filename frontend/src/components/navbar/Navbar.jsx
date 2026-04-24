import logo from "../../assets/logos/logo sem fundo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function Navbar({ className = "" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate("/");
  };

  if (!user) return null;

  return (
    <header
      className={[
        "box-border mb-6 flex h-[min(5.5rem,auto)] min-h-[70px] min-w-0 w-full flex-wrap items-center justify-between gap-3 border-b border-border-primary transition-all sm:gap-4 md:px-[5%] ",
        className,
      ].join(" ")}
    >
      <div className="flex min-w-0 max-w-full flex-1 flex-wrap items-center gap-2 sm:gap-3">
        <img
          src={logo}
          onClick={handleNavigation}
          alt="Logo Montezuma"
          className="h-11 w-11 flex-shrink-0 object-contain transition-all sm:h-14 sm:w-14 md:h-16 md:w-16"
        />
        <p className="min-w-0 max-w-full flex-1 text-xs font-semibold leading-snug tracking-tight text-text-primary sm:max-w-[18rem] sm:text-xl md:text-3xl">
          Montezuma
        </p>
      </div>
    </header>
  );
}
