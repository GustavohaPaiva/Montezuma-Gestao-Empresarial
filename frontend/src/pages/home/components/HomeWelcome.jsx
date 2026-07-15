import { ArrowRight, Building2, LayoutGrid } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { homeDictionary } from "../../../constants/dictionaries";
import {
  homeWelcomeClass,
  homeHeroBannerClass,
  homeSessionPanelClass,
  homeSectionLabelAccentClass,
  homeSectionLabelClass,
  homeDatePillClass,
  formatDataHojeExtenso,
} from "../homeUi";

export default function HomeWelcome({
  nomeUsuario,
  saudacao,
  escritorioAcesso = null,
  modulosCount = 0,
  perfilLabel = "",
}) {
  const navigate = useNavigate();
  const dataHoje = formatDataHojeExtenso();
  const escritorioCopy = homeDictionary.escritorioAcesso;
  const sessionCopy = homeDictionary.session;

  return (
    <section className={homeWelcomeClass}>
      <div className={homeHeroBannerClass}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_75%_at_100%_0%,rgba(220,59,11,0.09),transparent_52%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-20 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-accent-primary/10 blur-[80px]"
          aria-hidden
        />
        <Building2
          className="pointer-events-none absolute -bottom-6 -right-2 h-28 w-28 text-accent-primary/[0.09] sm:h-36 sm:w-36"
          strokeWidth={1}
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center md:gap-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={homeSectionLabelAccentClass}>
                {homeDictionary.hero.portalLabel}
              </span>
              <span className={homeDatePillClass}>
                {dataHoje.split(",")[0]}
              </span>
            </div>
            <h2 className="mt-3 flex flex-col gap-1 text-2xl font-bold tracking-tight text-text-primary sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2 sm:text-3xl">
              <span>{saudacao},</span>
              <span className="text-accent-primary">{nomeUsuario}</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted md:text-base">
              {dataHoje}
            </p>
            <div className="mt-3 flex items-center gap-1.5" aria-hidden>
              <div className="h-0.5 w-8 rounded-full bg-accent-primary/70" />
              <div className="h-0.5 w-2 rounded-full bg-accent-primary/35" />
              <div className="h-0.5 w-1 rounded-full bg-accent-primary/20" />
            </div>
          </div>

          <div
            className="hidden h-px w-full max-w-xs shrink-0 bg-gradient-to-r from-transparent via-accent-primary/25 to-transparent md:block md:h-16 md:w-px md:bg-gradient-to-b"
            aria-hidden
          />

          {escritorioAcesso ? (
            <aside className={homeSessionPanelClass}>
              <span className={homeSectionLabelClass}>
                {escritorioCopy.label}
              </span>
              <span className="text-base font-bold tracking-tight text-text-primary">
                {escritorioAcesso.nome}
              </span>
              <button
                type="button"
                onClick={() => navigate(escritorioAcesso.path)}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent-primary bg-accent-primary px-4 py-2.5 text-sm font-semibold tracking-tight text-white shadow-sm shadow-accent-primary/25 transition hover:bg-accent-primary-dark hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30"
              >
                {escritorioCopy.cta}
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </button>
            </aside>
          ) : (
            <aside className={homeSessionPanelClass}>
              <span className={homeSectionLabelClass}>{sessionCopy.title}</span>
              {perfilLabel ? (
                <span className="text-base font-bold tracking-tight text-text-primary">
                  {perfilLabel}
                </span>
              ) : null}
              <div className="mt-1 flex items-center gap-2 text-sm text-text-muted">
                <LayoutGrid
                  className="h-4 w-4 shrink-0 text-accent-primary/70"
                  aria-hidden
                />
                <span>
                  <span className="font-semibold text-accent-primary">
                    {modulosCount}
                  </span>{" "}
                  {sessionCopy.modulesAvailable}
                </span>
              </div>
              <span className="mt-1 text-xs leading-relaxed text-text-muted">
                {sessionCopy.profileHint}
              </span>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
