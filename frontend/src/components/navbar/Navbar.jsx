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

  const rotuloUtilizador =
    (user.nome && String(user.nome).trim()) ||
    user.email ||
    "";
  const tituloCompleto =
    user.nome && user.email
      ? `${user.nome} — ${user.email}`
      : rotuloUtilizador;

  return (
    <header
      className={[
        "box-border mb-5 flex h-[min(5.5rem,auto)] min-h-[70px] min-w-0 w-full flex-wrap items-center justify-between gap-3 border-b border-border-primary px-4 py-4 transition-all sm:mb-8 sm:gap-4 md:px-[5%] md:py-4 lg:py-5",
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
        <p className="min-w-0 max-w-full flex-1 text-xs font-semibold leading-snug tracking-tight text-text-primary sm:max-w-[18rem] sm:text-sm md:max-w-md">
          Montezuma
        </p>
      </div>

      {rotuloUtilizador && (
        <div className="flex w-full min-w-0 max-w-full flex-1 flex-col items-start gap-2 text-left sm:ml-auto sm:max-w-md sm:flex-none sm:items-end sm:text-right">
          <span
            className="w-full max-w-full truncate text-xs font-medium leading-snug text-text-primary sm:text-sm"
            title={tituloCompleto}
          >
            {rotuloUtilizador}
          </span>
          {user.nome && user.email && (
            <span
              className="hidden max-w-full truncate text-xs text-text-muted sm:block"
              title={user.email}
            >
              {user.email}
            </span>
          )}
        </div>
      )}
    </header>
  );
}
