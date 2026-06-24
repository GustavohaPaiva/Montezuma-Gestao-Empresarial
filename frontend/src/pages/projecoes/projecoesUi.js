export {
  inputTabelaGestao,
  selectTabelaGestao,
} from "../../components/pedidos/pedidosUi";

const PROJECAO_ICON_BY_THEME = {
  amber: "bg-accent-amber-50 text-accent-amber-600",
  purple: "bg-accent-purple-50 text-accent-purple-600",
  indigo: "bg-accent-indigo-50 text-accent-indigo-600",
  blue: "bg-accent-blue-50 text-accent-blue-600",
  emerald: "bg-accent-emerald-50 text-accent-emerald-600",
  primary: "bg-accent-primary/10 text-accent-primary",
};

export const projecaoLeadingIconClass = (colorTheme) =>
  PROJECAO_ICON_BY_THEME[colorTheme] || PROJECAO_ICON_BY_THEME.primary;

export const projecaoSecaoClass =
  "overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)]";

export const projecaoSecaoCabecalhoClass =
  "border-b border-border-primary/30 bg-gradient-to-r from-[#FAFAFA] to-white px-5 py-4 sm:px-6";

export const projecaoSecaoIconClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary";

export const projecaoSecaoTituloClass = "text-lg font-bold text-text-primary";

export const projecaoSecaoDescricaoClass =
  "mt-1 text-xs leading-relaxed text-text-muted sm:text-sm";

export const projecaoSecaoCorpoClass = "p-5 sm:p-6";

export const projecaoDetalheHeaderClass =
  "border-b border-border-primary/30 bg-gradient-to-r from-accent-primary-50/80 to-white px-5 py-5 sm:px-6";

export const projecaoDetalheIconClass =
  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary";

export const projecaoSubpainelClass =
  "rounded-xl border border-border-primary/30 bg-[#FAFAFA]/70 p-4 shadow-sm ring-1 ring-black/[0.02] sm:p-5";

export const projecaoSubpainelTituloClass =
  "text-[11px] font-semibold uppercase tracking-wide text-text-muted";

export const projecaoTabelaHeadClass =
  "border-b border-border-primary/30 bg-[#FAFAFA] text-xs font-semibold uppercase tracking-wide text-text-muted";

/** Até 4 elementos por linha (métricas, valores, cards). */
export const projecaoGrid4Class =
  "grid grid-cols-1 gap-4 min-[500px]:grid-cols-2 lg:grid-cols-4";

/** Até 3 elementos por linha (1 mobile, 2 tablet, 3 desktop). */
export const projecaoGrid3Class =
  "grid grid-cols-1 gap-4 min-[500px]:grid-cols-2 lg:grid-cols-3";

/** Botão primário na Navbar — mesmo padrão de Obras / Fornecedores. */
export const navbarAcaoPrimariaClass =
  "bg-accent-primary text-white hover:opacity-90 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 h-10 px-4";

export const labelCampoClass = "mb-1 block text-xs font-medium text-text-muted";

/** Textarea alinhado ao BaseInput (rounded-2xl, ring slate). */
export const textareaCampoClass =
  "min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm tracking-tight text-text-primary ring-1 ring-slate-900/5 outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-blue-600 focus:ring-accent-blue-600/20";

export const projecaoTotalBarClass =
  "flex min-h-[44px] w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-border-primary/40 bg-[#FAFAFA] px-4 py-3 text-center shadow-inner ring-1 ring-black/[0.04]";

/** Valor somente leitura (4º bloco — subtotal de itens). */
export const valorSomenteLeituraClass =
  "flex min-h-10 items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 text-sm font-semibold tabular-nums text-text-primary ring-1 ring-slate-900/5";
