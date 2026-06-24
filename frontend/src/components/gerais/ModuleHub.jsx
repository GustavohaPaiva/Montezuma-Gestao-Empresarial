import { ArrowLeft, ArrowRight } from "lucide-react";
import { homeDictionary } from "../../constants/dictionaries";
import {
  HOME_MODULE_THEMES,
  getKpiGridClass,
  getModuleGridClass,
  homeNavCardClass,
  homeNavChevronClass,
  homeNavGlowClass,
  homeSectionAccentLineClass,
  homeSectionHeaderClass,
  homeSectionLabelAccentClass,
  homeSectionTitleClass,
} from "../../pages/home/homeUi";
import BaseCard from "../cards/BaseCard";
import LoadingPainel from "./LoadingPainel";

function ModuleHubAccessCard({
  titulo,
  descricao,
  destaques = [],
  colorTheme = "primary",
  Icon,
  onClick,
}) {
  const theme = HOME_MODULE_THEMES[colorTheme] || HOME_MODULE_THEMES.primary;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`${homeNavCardClass} ${theme.leftBorder} h-[210px]`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-1 ${theme.topBar}`}
        aria-hidden
      />
      <div className={`${homeNavGlowClass} ${theme.glow}`} aria-hidden />

      <div className="relative flex h-full flex-col justify-between p-4 pt-3.5">
        <div>
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/[0.04] ${theme.softBg} ${theme.strongText} transition-transform duration-200 group-hover:scale-105`}
          >
            {Icon ? <Icon className="h-5 w-5" strokeWidth={1.75} /> : null}
          </span>

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

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
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

function ModuleHubFeatureCard({
  titulo,
  descricao,
  destaques = [],
  colorTheme = "primary",
  Icon,
  onClick,
  horizontal = false,
}) {
  const theme = HOME_MODULE_THEMES[colorTheme] || HOME_MODULE_THEMES.primary;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group relative flex cursor-pointer overflow-hidden rounded-2xl border border-border-primary/35 border-l-4 ${theme.leftBorder} bg-white text-left tracking-tight shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-12px_rgba(0,0,0,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25 ${
        horizontal ? "flex-col sm:flex-row" : "flex-col"
      }`}
    >
      <span
        className={`absolute inset-x-0 top-0 h-0.5 ${theme.topBar}`}
        aria-hidden
      />
      <div
        className={`${homeNavGlowClass} ${theme.glow}`}
        aria-hidden
      />

      {horizontal ? (
        <div
          className={`relative flex shrink-0 items-center justify-center ${theme.softBg} px-6 py-5 sm:w-40`}
        >
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 ${theme.strongText} ring-1 ring-black/[0.03] transition-transform duration-200 group-hover:scale-105`}
          >
            {Icon ? <Icon className="h-6 w-6" strokeWidth={1.75} /> : null}
          </span>
        </div>
      ) : null}

      <div className="relative flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3.5">
          {!horizontal ? (
            <span
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/[0.04] ${theme.softBg} ${theme.strongText} transition-transform duration-200 group-hover:scale-105`}
            >
              {Icon ? <Icon className="h-5 w-5" strokeWidth={1.75} /> : null}
            </span>
          ) : null}

          <div className="min-w-0 flex-1">
            <h2
              className={`text-[15px] font-semibold leading-snug tracking-tight ${theme.strongText}`}
            >
              {titulo}
            </h2>
            {descricao ? (
              <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
                {descricao}
              </p>
            ) : null}
          </div>
        </div>

        {destaques.length > 0 ? (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
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

        <div className="mt-auto flex items-center justify-end border-t border-slate-100 pt-3">
          <span
            className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold ${theme.cta} opacity-80 transition-all duration-200 group-hover:gap-1.5 group-hover:opacity-100`}
          >
            {homeDictionary.modulos.card.acessar}
            <ArrowRight className={homeNavChevronClass} aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ModuleHub({
  eyebrow,
  titulo,
  onVoltar,
  resumo = [],
  resumoLoading = false,
  acessos = [],
  loading = false,
  loadingTitulo = "Carregando",
  loadingDescricao = "Aguarde um instante…",
  loadingIcon,
  children,
}) {
  const acessosVisiveis = acessos.filter((item) => !item.hidden);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary">
        <LoadingPainel
          titulo={loadingTitulo}
          descricao={loadingDescricao}
          icon={loadingIcon}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary pb-12">
      <header className="sticky top-0 z-[60] mb-1 w-full border-b border-border-primary/40 bg-bg-primary/95 shadow-sm backdrop-blur-sm">
        <div className="flex w-full flex-col gap-3 px-[5%] py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            {onVoltar ? (
              <button
                type="button"
                onClick={onVoltar}
                aria-label="Voltar"
                className="mt-0.5 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border-primary/50 bg-white text-text-primary shadow-sm transition-all hover:border-accent-primary/35 focus:outline-none focus:ring-2 focus:ring-accent-primary/25 active:scale-[0.98]"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
              </button>
            ) : null}

            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <p className={homeSectionLabelAccentClass}>{eyebrow}</p>
              ) : null}
              <h1 className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
                {titulo}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-[5%] pt-4">
        {resumo.length > 0 ? (
          <section className={`mb-8 w-full ${getKpiGridClass(resumo.length)}`}>
            {resumo.map((item) => (
              <BaseCard
                key={item.id}
                variant="metric"
                title={item.label}
                value={
                  resumoLoading ? (
                    <span className="inline-block h-8 w-12 animate-pulse rounded bg-surface-muted" />
                  ) : (
                    String(item.value ?? "—")
                  )
                }
                icon={item.icon}
                colorTheme={item.theme || "primary"}
              />
            ))}
          </section>
        ) : null}

        {acessosVisiveis.length > 0 ? (
          <section className="mb-6">
            <div className={homeSectionHeaderClass}>
              <div>
                <span className={homeSectionLabelAccentClass}>
                  {homeDictionary.moduleHub.acessosLabel}
                </span>
                <h2 className={`${homeSectionTitleClass} mt-1`}>
                  {homeDictionary.moduleHub.acessosTitulo}
                </h2>
                <div className={homeSectionAccentLineClass} aria-hidden />
              </div>
            </div>

            {acessosVisiveis.length <= 2 ? (
              <div
                className={`mt-3.5 grid gap-5 ${
                  acessosVisiveis.length === 2 ? "md:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {acessosVisiveis.map((acesso) => (
                  <ModuleHubFeatureCard
                    key={acesso.id}
                    titulo={acesso.titulo}
                    descricao={acesso.descricao}
                    destaques={acesso.destaques}
                    colorTheme={acesso.colorTheme}
                    Icon={acesso.Icon}
                    onClick={acesso.onClick}
                    horizontal={acessosVisiveis.length === 1}
                  />
                ))}
              </div>
            ) : (
              <div
                className={`mt-3.5 ${getModuleGridClass(acessosVisiveis.length)}`}
              >
                {acessosVisiveis.map((acesso) => (
                  <ModuleHubAccessCard
                    key={acesso.id}
                    titulo={acesso.titulo}
                    descricao={acesso.descricao}
                    destaques={acesso.destaques}
                    colorTheme={acesso.colorTheme}
                    Icon={acesso.Icon}
                    onClick={acesso.onClick}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {children}
      </main>
    </div>
  );
}
