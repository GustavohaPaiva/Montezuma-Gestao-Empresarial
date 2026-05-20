export const inputPremium =
  "box-border min-h-11 h-11 w-full min-w-0 shrink-0 rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all placeholder:text-text-muted focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

export const selectPremium =
  "box-border min-h-11 h-11 w-full min-w-0 shrink-0 cursor-pointer rounded-xl border border-border-primary/55 bg-white px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

/** Células editáveis na tabela de gestão (Home) — aspecto de texto, não de botão */
export const inputTabelaGestao =
  "box-border w-full min-w-0 border-0 border-b border-transparent bg-transparent px-1 py-1.5 text-center text-sm text-text-primary shadow-none outline-none transition-[border-color,background-color] placeholder:text-text-muted/50 hover:border-border-primary/30 focus:border-accent-primary/50 focus:bg-accent-primary/[0.04] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const selectTabelaGestao =
  "box-border w-full min-w-0 cursor-pointer appearance-none border-0 border-b border-transparent bg-transparent bg-[length:0.5rem] bg-[right_0.1rem_center] bg-no-repeat px-1 py-1.5 pr-4 text-center text-sm text-text-primary shadow-none outline-none transition-[border-color,background-color] hover:border-border-primary/30 focus:border-accent-primary/50 focus:bg-accent-primary/[0.04] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

export const btnOutlinePremium =
  "!h-11 !w-full !cursor-pointer !rounded-xl !border !border-border-primary/50 !bg-white !px-4 !text-sm !font-semibold !text-text-primary !shadow-sm transition-all hover:!-translate-y-0.5 hover:!border-accent-primary/35 hover:!shadow-md focus:!outline-none focus:!ring-2 focus:!ring-accent-primary/25 active:!translate-y-0 disabled:!cursor-not-allowed sm:!w-auto";

export const btnAccentPremium =
  "!h-11 !cursor-pointer !rounded-xl !border !border-accent-primary !bg-accent-primary !px-4 !text-sm !font-semibold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!-translate-y-0.5 hover:!bg-accent-primary-dark hover:!shadow-lg focus:!outline-none focus:!ring-2 focus:!ring-accent-primary/35 focus:!ring-offset-2 active:!translate-y-0 disabled:!cursor-not-allowed";

const LEADING_ICON_BY_THEME = {
  amber: "bg-accent-amber-50 text-accent-amber-600",
  purple: "bg-accent-purple-50 text-accent-purple-600",
  indigo: "bg-accent-indigo-50 text-accent-indigo-600",
  blue: "bg-accent-blue-50 text-accent-blue-600",
  emerald: "bg-accent-emerald-50 text-accent-emerald-600",
  pink: "bg-accent-pink-50 text-accent-pink-600",
  primary: "bg-accent-primary/10 text-accent-primary",
};

export const pedidoLeadingIconClass = (colorTheme) =>
  LEADING_ICON_BY_THEME[colorTheme] || LEADING_ICON_BY_THEME.primary;

export const pedidoDetalheHeaderClass =
  "border-b border-border-primary/30 bg-gradient-to-r from-accent-primary-50/80 to-white px-5 py-5 sm:px-6";

export const pedidoDetalheIconClass =
  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary";

export const pedidoSubAbaClass = (ativa) =>
  [
    "flex w-full cursor-pointer flex-col items-start gap-1 rounded-2xl border p-4 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all sm:p-5",
    ativa
      ? "border-accent-primary/45 bg-white ring-2 ring-accent-primary/20"
      : "border-border-primary/35 bg-white hover:-translate-y-0.5 hover:border-accent-primary/25 hover:shadow-md",
  ].join(" ");

/** Painel de secção (padrão Processos / Tarefas / obra pedidos) */
export const pedidoSecaoClass =
  "overflow-hidden rounded-2xl border border-border-primary/35 bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)]";

export const pedidoSecaoCabecalhoClass =
  "border-b border-border-primary/30 bg-gradient-to-r from-[#FAFAFA] to-white px-5 py-4 sm:px-6";

export const pedidoSecaoIconClass =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary/10 text-accent-primary";

export const pedidoSecaoTituloClass = "text-base font-bold text-text-primary";

export const pedidoSecaoDescricaoClass =
  "mt-1 text-xs leading-relaxed text-text-muted sm:text-sm";

export const pedidoSecaoCorpoClass = "p-5 sm:p-6";

/** Bloco interno (formulários, grupos, listas) */
export const pedidoSubpainelClass =
  "rounded-xl border border-border-primary/30 bg-[#FAFAFA]/70 p-4 shadow-sm ring-1 ring-black/[0.02] sm:p-5";

export const pedidoSubpainelTituloClass =
  "text-[11px] font-semibold uppercase tracking-wide text-text-muted";

/** Cabeçalho de secção: título à esquerda, ações/inputs à direita em telas grandes */
export const pedidoSecaoToolbarClass =
  "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6";
