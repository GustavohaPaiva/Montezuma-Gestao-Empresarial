import logo from "../../assets/logos/logo sem fundo.png";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function Navbar({
  title = "Montezuma",
  actions = [],
  filters = [],
  onLogoClick,
  className = "",
}) {
  const safeActions = Array.isArray(actions) ? actions : [];
  const safeFilters = Array.isArray(filters) ? filters : [];

  return (
    <header
      className={[
        "mb-6 flex w-full min-w-0 flex-col gap-3 border-b border-border-primary bg-bg-primary/95 px-3 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-bg-primary/85 transition-all sm:gap-4 sm:px-[4%] md:px-[5%] md:py-3",
        "lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between",
        className,
      ].join(" ")}
    >
      <div className="flex min-w-0 w-full shrink-0 items-center gap-2.5 sm:gap-3 lg:min-w-0 lg:max-w-[min(40%,28rem)] lg:flex-1 lg:shrink">
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
        </div>
      </div>

      {safeFilters.length > 0 || safeActions.length > 0 ? (
        <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-stretch sm:gap-3 lg:w-auto lg:min-w-0 lg:flex-1 lg:flex-nowrap lg:items-center lg:justify-end lg:gap-3 xl:max-w-none">
          {safeFilters.length > 0 ? (
            <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center md:justify-end lg:min-w-0 lg:flex-1 lg:flex-row lg:flex-nowrap lg:justify-end">
              {safeFilters.map((filterNode, index) => (
                <div
                  key={`filter-${index}`}
                  className="min-w-0 w-full flex-1 sm:min-w-[12rem] md:max-w-[18rem] lg:w-[min(100%,14rem)] lg:max-w-[16rem] lg:flex-none xl:w-[min(100%,16rem)]"
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
