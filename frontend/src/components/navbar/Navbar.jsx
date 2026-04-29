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
        "fixed inset-x-0 top-0 z-50 mb-6 flex w-full flex-wrap items-center justify-between gap-3 border-b border-border-primary bg-bg-primary/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-bg-primary/85 transition-all sm:gap-4 sm:px-[5%] sm:py-3",
        className,
      ].join(" ")}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <img
          src={logo}
          onClick={onLogoClick}
          aria-label="Ir para o início"
          alt="Logo Montezuma"
          className="h-11 w-11 object-contain sm:h-12 sm:w-12 cursor-pointer"
        />

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-text-primary sm:text-base md:text-3xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex min-w-0 w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:max-w-[70%]">
        {safeFilters.map((filterNode, index) => (
          <div key={`filter-${index}`} className="min-w-[180px] max-w-full">
            {filterNode}
          </div>
        ))}

        {safeActions.map((action, index) => {
          if (action?.hidden) return null;

          return (
            <button
              key={action?.key || action?.label || index}
              type={action?.type || "button"}
              onClick={action?.onClick}
              disabled={action?.disabled}
              className={joinClasses(
                "inline-flex max-w-full items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium tracking-tight ring-1 ring-slate-900/5 transition-all duration-200",
                action?.className ||
                  "bg-white text-text-primary hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {action?.icon ? (
                <span className="inline-flex shrink-0">{action.icon}</span>
              ) : null}
              <span className="truncate">{action?.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
