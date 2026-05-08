import logo from "../../assets/logos/logo sem fundo.png";
import { useNavigate } from "react-router-dom";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function Navbar({
  title = [],
  subtitle,
  actions = [],
  filters = [],
  className = "",
}) {
  const safeActions = Array.isArray(actions) ? actions : [];
  const safeFilters = Array.isArray(filters) ? filters : [];
  const navigate = useNavigate();
  const onLogoClick = () => {
    navigate("/");
  };

  return (
    <header
      className={[
        "mb-6 flex w-full min-w-0 flex-col gap-3 border-b border-border-primary bg-bg-primary/95 px-3 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-bg-primary/85 transition-all sm:gap-4 sm:px-[4%] md:px-[5%] md:py-3",
        "md:flex-row md:flex-nowrap md:items-center md:justify-between",
        className,
      ].join(" ")}
    >
      <div className="flex min-w-0 w-full shrink-0 items-center gap-2.5 sm:gap-3 md:min-w-0 md:max-w-[min(40%,28rem)] md:flex-1 md:shrink">
        <img
          src={logo}
          onClick={onLogoClick}
          aria-label="Ir para o início"
          alt="Logo Montezuma"
          className="h-10 w-10 shrink-0 cursor-pointer object-contain sm:h-11 sm:w-11 md:h-12 md:w-12"
        />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold tracking-tight text-text-primary text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-text-muted sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {safeFilters.length > 0 || safeActions.length > 0 ? (
        <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-stretch sm:gap-3 md:w-auto md:min-w-0 md:flex-1 md:flex-nowrap md:items-center md:justify-end md:gap-3 xl:max-w-none">
          {safeFilters.length > 0 ? (
            <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center md:min-w-0 md:flex-1 md:flex-row md:flex-nowrap md:justify-end">
              {safeFilters.map((filterNode, index) => (
                <div
                  key={`filter-${index}`}
                  className="min-w-0 w-full flex-1 sm:min-w-[12rem] md:w-[min(100%,14rem)] md:max-w-[16rem] md:flex-none xl:w-[min(100%,16rem)]"
                >
                  {filterNode}
                </div>
              ))}
            </div>
          ) : null}

          {safeActions.length > 0 ? (
            <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end lg:flex-nowrap">
              {safeActions.map((action, index) => {
                if (action?.hidden) return null;

                return (
                  <button
                    key={action?.key || action?.label || index}
                    type={action?.type || "button"}
                    onClick={action?.onClick}
                    disabled={action?.disabled}
                    className={joinClasses(
                      "inline-flex min-h-[2.5rem] w-full max-w-full flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium tracking-tight ring-1 ring-slate-900/5 transition-all duration-200 sm:w-auto sm:flex-none sm:px-3 lg:shrink-0",
                      action?.className ||
                        "bg-white text-text-primary hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
                    )}
                  >
                    {action?.icon ? (
                      <span className="inline-flex shrink-0">
                        {action.icon}
                      </span>
                    ) : null}
                    <span>{action?.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
