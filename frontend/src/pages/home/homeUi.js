import { homeDictionary } from "../../constants/dictionaries";

export const homePageClass =
  "relative flex min-h-screen w-full flex-col items-center overflow-x-hidden bg-bg-primary font-montserrat text-text-primary";

export const homePageInnerClass = "relative z-10 w-full px-[5%]";

export const homeGridTextureStyle = {
  backgroundImage: `
    linear-gradient(to right, rgba(220, 59, 11, 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(220, 59, 11, 0.04) 1px, transparent 1px)
  `,
  backgroundSize: "48px 48px",
};

export const homeHeroBannerClass =
  "relative mt-2 w-full overflow-hidden rounded-2xl border border-accent-primary/15 bg-gradient-to-br from-white via-white to-accent-primary/[0.06] p-6 shadow-[0_10px_40px_-10px_rgba(220,59,11,0.14)] ring-1 ring-slate-900/5 md:p-8";

export const homeDatePillClass =
  "inline-flex rounded-full border border-accent-primary/15 bg-accent-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-text-muted";

export const homeWelcomeClass = "mb-8";

export const homeSessionPanelClass =
  "flex w-full shrink-0 flex-col gap-1 rounded-xl border border-accent-primary/12 bg-gradient-to-br from-white to-accent-primary/[0.04] px-4 py-3 text-sm shadow-sm ring-1 ring-slate-900/5 md:max-w-xs";

export const homeKpiGridClass =
  "grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6";

export const homeModuleGridClass =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

/**
 * Classe de grid dos KPIs/resumo que se adapta à quantidade de cards (1–4),
 * preenchendo a linha de forma equilibrada em vez de deixar colunas vazias.
 */
export function getKpiGridClass(count) {
  const base = "grid gap-4 md:gap-6";
  if (count <= 1) return `${base} grid-cols-1`;
  if (count === 2) return `${base} grid-cols-2`;
  if (count === 3) return `${base} grid-cols-2 sm:grid-cols-3`;
  return `${base} grid-cols-2 md:grid-cols-4`;
}

/**
 * Classe de grid dos cards de acesso que se adapta à quantidade (1–4),
 * evitando itens "órfãos" numa segunda linha ou espaço vazio à direita.
 */
export function getModuleGridClass(count) {
  const base = "grid gap-4";
  if (count <= 1) return `${base} grid-cols-1 sm:max-w-md`;
  if (count === 2) return `${base} grid-cols-1 sm:grid-cols-2 lg:max-w-3xl`;
  if (count === 3) return `${base} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`;
  return `${base} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`;
}

export const HOME_MODULE_THEMES = {
  primary: {
    topBar: "bg-accent-primary",
    softBg: "bg-accent-primary/10",
    strongText: "text-accent-primary",
    leftBorder: "border-l-accent-primary",
    pill: "bg-accent-primary/10 text-accent-primary",
    glow: "bg-accent-primary",
    chip: "border-accent-primary/15 bg-accent-primary/[0.06] text-accent-primary/90",
    cta: "text-accent-primary",
  },
  blue: {
    topBar: "bg-accent-blue-600",
    softBg: "bg-accent-blue-50",
    strongText: "text-accent-blue-600",
    leftBorder: "border-l-accent-blue-600",
    pill: "bg-accent-blue-50 text-accent-blue-600",
    glow: "bg-accent-blue-600",
    chip: "border-accent-blue-600/15 bg-accent-blue-50/80 text-accent-blue-600",
    cta: "text-accent-blue-600",
  },
  indigo: {
    topBar: "bg-accent-indigo-600",
    softBg: "bg-accent-indigo-50",
    strongText: "text-accent-indigo-600",
    leftBorder: "border-l-accent-indigo-600",
    pill: "bg-accent-indigo-50 text-accent-indigo-600",
    glow: "bg-accent-indigo-600",
    chip: "border-accent-indigo-600/15 bg-accent-indigo-50/80 text-accent-indigo-600",
    cta: "text-accent-indigo-600",
  },
  amber: {
    topBar: "bg-accent-amber-600",
    softBg: "bg-accent-amber-50",
    strongText: "text-accent-amber-600",
    leftBorder: "border-l-accent-amber-600",
    pill: "bg-accent-amber-50 text-accent-amber-600",
    glow: "bg-accent-amber-600",
    chip: "border-accent-amber-600/15 bg-accent-amber-50/80 text-accent-amber-600",
    cta: "text-accent-amber-600",
  },
  emerald: {
    topBar: "bg-accent-emerald-600",
    softBg: "bg-accent-emerald-50",
    strongText: "text-accent-emerald-600",
    leftBorder: "border-l-accent-emerald-600",
    pill: "bg-accent-emerald-50 text-accent-emerald-600",
    glow: "bg-accent-emerald-600",
    chip: "border-accent-emerald-600/15 bg-accent-emerald-50/80 text-accent-emerald-600",
    cta: "text-accent-emerald-600",
  },
  pink: {
    topBar: "bg-accent-pink-600",
    softBg: "bg-accent-pink-50",
    strongText: "text-accent-pink-600",
    leftBorder: "border-l-accent-pink-600",
    pill: "bg-accent-pink-50 text-accent-pink-600",
    glow: "bg-accent-pink-600",
    chip: "border-accent-pink-600/15 bg-accent-pink-50/80 text-accent-pink-600",
    cta: "text-accent-pink-600",
  },
  purple: {
    topBar: "bg-accent-purple-600",
    softBg: "bg-accent-purple-50",
    strongText: "text-accent-purple-600",
    leftBorder: "border-l-accent-purple-600",
    pill: "bg-accent-purple-50 text-accent-purple-600",
    glow: "bg-accent-purple-600",
    chip: "border-accent-purple-600/15 bg-accent-purple-50/80 text-accent-purple-600",
    cta: "text-accent-purple-600",
  },
};

export const homeNavCardClass =
  "group relative flex h-[225px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border-primary/35 border-l-4 bg-white text-left tracking-tight ring-1 ring-slate-900/5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_-10px_rgba(0,0,0,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/25";

export const homeNavChevronClass =
  "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5";

export const homeNavGlowClass =
  "pointer-events-none absolute inset-x-0 -top-10 h-24 opacity-0 blur-[70px] transition-opacity duration-500 group-hover:opacity-[0.14]";

export const homeSectionLabelClass =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted";

export const homeSectionLabelAccentClass =
  "text-[10px] font-bold uppercase tracking-[0.18em] text-accent-primary/90";

export const homeSectionTitleClass =
  "text-base font-semibold tracking-tight text-text-primary";

export const homeSectionHeaderClass =
  "mb-3 flex flex-wrap items-end justify-between gap-2";

export const homeSectionAccentLineClass =
  "mt-1.5 h-0.5 w-12 rounded-full bg-gradient-to-r from-accent-primary/90 to-accent-primary/25";

export const homeFooterClass =
  "mt-6 border-t border-border-primary/40 pt-4 text-center text-xs text-text-muted";

export const homeKpiWrapClass =
  "transition-all duration-200 hover:-translate-y-0.5 hover:drop-shadow-[0_8px_20px_rgba(220,59,11,0.08)]";

export const homeWeeklyAgendaClass = "mb-6";

export const homeWeeklyAgendaPanelClass =
  "relative w-full overflow-hidden rounded-2xl border border-accent-primary/15 bg-gradient-to-br from-white via-white to-accent-primary/[0.06] p-4 shadow-[0_10px_40px_-10px_rgba(220,59,11,0.14)] ring-1 ring-slate-900/5 md:p-6";

export const homeWeeklyAgendaTrackClass =
  "relative z-10 grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-2 lg:flex lg:items-stretch lg:gap-2 xl:gap-2.5";

export const homeWeeklyDayColumnClass =
  "group relative flex min-h-0 w-full flex-col self-stretch overflow-hidden rounded-xl border border-border-primary/30 bg-white/90 p-2.5 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm transition-all duration-200 lg:min-w-0 lg:flex-1 lg:p-2 lg:hover:-translate-y-0.5 lg:hover:shadow-md";

export const homeWeeklyDayColumnActiveClass =
  "border-accent-primary/40 bg-gradient-to-br from-white to-accent-primary/[0.09] shadow-[0_8px_20px_-8px_rgba(220,59,11,0.2)] ring-2 ring-accent-primary/30 lg:flex-[1.65]";

export const homeWeeklyDayTopBarClass = "absolute inset-x-0 top-0 h-0.5 shrink-0";

export const homeWeeklyDayHeaderClass =
  "flex w-full shrink-0 items-center justify-between gap-2 pb-1.5";

export const homeWeeklyDayLabelClass =
  "text-xs font-bold tracking-tight text-text-primary";

export const homeWeeklyDayLabelActiveClass =
  "text-sm font-extrabold text-accent-primary xl:text-base";

export const homeWeeklyTodayBadgeClass =
  "inline-flex shrink-0 rounded-full border border-accent-primary/25 bg-accent-primary/12 px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.1em] text-accent-primary";

export const homeWeeklyTodayBadgeActiveClass =
  "px-2 py-0.5 text-[10px] xl:text-[11px]";

export const homeWeeklyTaskListClass =
  "flex min-h-0 flex-1 flex-col gap-1 border-t border-border-primary/20 pt-1.5";

export const homeWeeklyTaskChipClass =
  "flex shrink-0 items-center gap-1 rounded-md border border-border-primary/20 bg-gradient-to-r from-white to-slate-50/80 px-1.5 py-1 text-[10px] leading-tight text-text-primary transition-colors duration-150 group-hover:border-border-primary/30";

export const homeWeeklyTaskListSpacerClass = "mt-auto min-h-0 flex-1 shrink";

export const homeWeeklyTaskChipActiveClass =
  "gap-1.5 px-2 py-1 text-xs leading-snug xl:text-sm";

export const homeWeeklyTaskIconWrapClass =
  "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded bg-accent-primary/8 text-accent-primary/80";

export const homeWeeklyTaskIconWrapActiveClass =
  "h-5 w-5 rounded-md xl:h-[1.375rem] xl:w-[1.375rem]";

export const homeWeeklyTaskIconClass = "h-2.5 w-2.5";

export const homeWeeklyTaskIconActiveClass = "h-3.5 w-3.5";

export function getSaudacao() {
  const hour = new Date().getHours();
  if (hour < 12) return homeDictionary.greeting.bomDia;
  if (hour < 18) return homeDictionary.greeting.boaTarde;
  return homeDictionary.greeting.boaNoite;
}

export function getPerfilLabel(tipo) {
  if (!tipo) return "";
  return homeDictionary.perfis[tipo] ?? tipo;
}

export function formatDataHoje() {
  return new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDataHojeExtenso() {
  const raw = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function formatKpiHint(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? 0));
}

export function buildProcessosKpiHint(counts, dictionary) {
  const { kpiHints, kpiStatusLabels } = dictionary.dashboard;
  const partes = [
    ["Prefeitura", counts?.processosPrefeitura],
    ["Caixa", counts?.processosCaixa],
    ["Cartorio", counts?.processosCartorio],
    ["Obra", counts?.processosObra],
  ]
    .filter(([, total]) => (total ?? 0) > 0)
    .map(([status, total]) => `${total} ${kpiStatusLabels[status]}`);

  return partes.length > 0 ? partes.join(" · ") : kpiHints.processosEmpty;
}

export function userVeDashboard(tipo) {
  return tipo === "diretoria" || tipo === "gestor_master";
}

/** Índice 0–5 para Seg–Sáb; -1 para domingo (fora da rotina). */
export function getDiaSemanaAgendaIndex(date = new Date()) {
  const jsDay = date.getDay();
  if (jsDay === 0) return -1;
  return jsDay - 1;
}
