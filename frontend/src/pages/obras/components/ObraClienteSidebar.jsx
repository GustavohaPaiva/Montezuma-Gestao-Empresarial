import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ListChecks,
  CalendarDays,
  Wallet,
  PanelLeft,
  ChevronsLeft,
  Menu,
  X,
  UserRound,
} from "lucide-react";
import logo from "../../../assets/logos/logo sem fundo.png";

const COLLAPSE_STORAGE_KEY = "montezuma:cliente-sidebar-collapsed";

function userInitial(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export default function ObraClienteSidebar({
  secaoAtiva,
  onChangeSecao,
  exibirRelatorios,
  nomeCliente,
  fotoCliente,
  onOpenProfile,
  children,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [secaoAtiva]);

  const items = [
    { id: "resumo", label: "Resumo", icon: LayoutDashboard },
    { id: "etapas", label: "Etapas", icon: ListChecks },
    { id: "cronograma", label: "Cronograma", icon: CalendarDays },
    ...(exibirRelatorios
      ? [{ id: "relatorios", label: "Relatórios", icon: Wallet }]
      : []),
  ];

  const displayName = nomeCliente || "Cliente";

  return (
    <div className="flex h-svh w-full overflow-hidden">
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "cliente-sidebar-shell fixed inset-y-0 left-0 z-40 flex h-svh w-64 shrink-0 flex-col border-r border-border-primary/30 bg-white",
          "lg:static lg:z-auto lg:translate-x-0",
          collapsed ? "lg:w-[3.625rem]" : "lg:w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className="h-px w-full shrink-0 bg-accent-primary/25"
          aria-hidden
        />

        <div
          className={[
            "flex shrink-0 border-b border-border-primary/20 px-2.5 py-3",
            collapsed
              ? "flex-col items-center gap-2"
              : "items-center justify-between gap-2 px-3",
          ].join(" ")}
        >
          <div
            className={[
              "flex min-w-0 items-center",
              collapsed ? "justify-center" : "gap-2.5",
            ].join(" ")}
          >
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border-primary/25 bg-white p-0.5 shadow-sm">
              <img
                src={logo}
                alt=""
                className="h-full w-auto object-contain"
              />
            </span>
            <span
              className={[
                "cliente-sidebar-reveal min-w-0",
                collapsed ? "is-collapsed" : "is-expanded",
              ].join(" ")}
            >
              <span className="block truncate text-sm font-semibold leading-tight text-text-primary">
                Montezuma
              </span>
              <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-accent-primary">
                Área do cliente
              </span>
            </span>
          </div>

          <button
            type="button"
            className="hidden size-8 items-center justify-center rounded-2xl text-text-muted transition-colors hover:bg-[#FAFAFA] hover:text-text-primary lg:inline-flex"
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            aria-pressed={collapsed}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </button>

          <button
            type="button"
            className="rounded-2xl p-2 text-text-muted hover:bg-[#FAFAFA] lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav
          id="cliente-sidebar-nav"
          className={[
            "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto py-3",
            collapsed ? "px-1.5" : "px-2.5",
          ].join(" ")}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const ativa = secaoAtiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChangeSecao(item.id);
                  setMobileOpen(false);
                }}
                title={collapsed ? item.label : undefined}
                className={[
                  "group relative flex items-center rounded-2xl text-sm font-medium transition-colors duration-200",
                  collapsed
                    ? "justify-center px-0 py-2"
                    : "gap-2.5 px-2.5 py-2",
                  ativa
                    ? "bg-accent-primary/10 text-accent-primary"
                    : "text-text-muted hover:bg-[#FAFAFA] hover:text-text-primary",
                ].join(" ")}
              >
                {ativa && !collapsed ? (
                  <span
                    className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent-primary"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={[
                    "size-[1.125rem] shrink-0 transition-colors",
                    ativa
                      ? "text-accent-primary"
                      : "text-text-muted/70 group-hover:text-text-primary",
                  ].join(" ")}
                />
                <span
                  className={[
                    "cliente-sidebar-reveal truncate",
                    collapsed ? "is-collapsed" : "is-expanded",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div
          className={[
            "shrink-0 border-t border-border-primary/20",
            collapsed ? "p-1.5" : "p-2.5",
          ].join(" ")}
        >
          <button
            type="button"
            onClick={onOpenProfile}
            title={collapsed ? `${displayName} · Cliente` : "Minha conta"}
            className={[
              "group flex w-full items-center rounded-2xl text-left transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30",
              collapsed ? "justify-center p-1.5" : "gap-2.5 p-2",
            ].join(" ")}
            aria-label="Minha conta"
          >
            {fotoCliente ? (
              <img
                src={fotoCliente}
                alt=""
                className={[
                  "shrink-0 rounded-full object-cover ring-1 ring-border-primary/40",
                  collapsed ? "size-8" : "size-9",
                ].join(" ")}
              />
            ) : (
              <span
                className={[
                  "flex shrink-0 items-center justify-center rounded-full bg-accent-primary text-xs font-semibold text-white",
                  collapsed ? "size-8 text-[0.65rem]" : "size-9 text-sm",
                ].join(" ")}
                aria-hidden
              >
                {userInitial(displayName) !== "?" ? (
                  userInitial(displayName)
                ) : (
                  <UserRound className="size-4" />
                )}
              </span>
            )}
            <span
              className={[
                "cliente-sidebar-reveal min-w-0 flex-1",
                collapsed ? "is-collapsed" : "is-expanded",
              ].join(" ")}
            >
              <span
                className="block truncate text-sm font-semibold text-text-primary"
                title={displayName}
              >
                {displayName}
              </span>
              <span className="block text-xs text-text-muted">Cliente</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-border-primary/25 bg-white/90 px-4 py-3 backdrop-blur-xl lg:hidden">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-2xl text-text-primary hover:bg-[#FAFAFA]"
            aria-label="Abrir menu"
            aria-controls="cliente-sidebar-nav"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-text-primary">
            <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-primary/25 bg-white p-0.5">
              <img src={logo} alt="" className="h-full w-auto object-contain" />
            </span>
            <span className="truncate">{displayName}</span>
          </span>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
