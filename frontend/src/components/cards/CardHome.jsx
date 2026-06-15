import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { homeDictionary } from "../../constants/dictionaries";
import {
  HOME_MODULE_THEMES,
  homeNavCardClass,
  homeNavChevronClass,
  homeNavGlowClass,
} from "../../pages/home/homeUi";

export default function CardHome({
  titulo,
  descricao,
  categoria,
  destaques = [],
  colorTheme = "primary",
  path,
  Icon,
  img,
  statValue,
  statKey,
  loadingStat = false,
}) {
  const navigate = useNavigate();
  const theme = HOME_MODULE_THEMES[colorTheme] || HOME_MODULE_THEMES.primary;
  const statLabel = statKey
    ? homeDictionary.modulos.card.stats[statKey]
    : null;

  const handleNavigation = () => {
    if (path) navigate(path);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleNavigation}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNavigation();
        }
      }}
      className={`${homeNavCardClass} ${theme.leftBorder}`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 ${theme.topBar}`}
        aria-hidden
      />
      <div className={`${homeNavGlowClass} ${theme.glow}`} aria-hidden />

      <div className="relative flex h-full flex-col justify-between p-4 pt-3.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/[0.04] ${theme.softBg} ${theme.strongText} transition-transform duration-200 group-hover:scale-105`}
            >
              {Icon ? (
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              ) : img ? (
                <img src={img} alt="" className="h-5 w-5 opacity-90" />
              ) : null}
            </span>

            {categoria ? (
              <span
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${theme.pill}`}
              >
                {categoria}
              </span>
            ) : null}
          </div>

          <h2
            className={`mt-3 text-[15px] font-semibold leading-snug tracking-tight ${theme.strongText}`}
          >
            {titulo}
          </h2>

          {descricao ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-text-muted">
              {descricao}
            </p>
          ) : null}
        </div>

        <div>
          {destaques.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {destaques.map((item) => (
                <span
                  key={item}
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium ${theme.chip}`}
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            <div className="min-w-0">
              {statKey ? (
                loadingStat ? (
                  <span className="inline-block h-4 w-20 animate-pulse rounded bg-surface-muted" />
                ) : statValue != null ? (
                  <p className="text-[11px] text-text-muted">
                    <span
                      className={`font-bold tabular-nums ${theme.strongText}`}
                    >
                      {statValue}
                    </span>{" "}
                    {statLabel}
                  </p>
                ) : null
              ) : null}
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${theme.cta} opacity-80 transition-all duration-200 group-hover:gap-1.5 group-hover:opacity-100`}
            >
              {homeDictionary.modulos.card.acessar}
              <ArrowRight className={homeNavChevronClass} aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
