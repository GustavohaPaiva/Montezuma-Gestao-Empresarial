import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronsLeft,
  Menu,
  PanelLeft,
  UserRound,
  X,
} from "lucide-react";
import logo from "../assets/logos/logo sem fundo.png";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import HomeProfilePhotoModal from "../pages/home/components/HomeProfilePhotoModal";
import { getPerfilLabel } from "../pages/home/homeUi";
import { homeDictionary } from "../constants/dictionaries";
import {
  buildMatrizNavSections,
  pathMatchesItem,
  sectionContainsPath,
} from "../navigation/matrizNav";
import { MatrizShellProvider } from "./MatrizShellContext";

const COLLAPSE_STORAGE_KEY = "montezuma:matriz-sidebar-collapsed";

function userInitial(name) {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function SidebarNavLink({ item, collapsed, indented = false, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={Boolean(item.end) || item.to === "/"}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex items-center rounded-2xl text-sm font-medium transition-colors duration-200",
          collapsed
            ? "justify-center px-0 py-2"
            : indented
              ? "gap-2.5 py-2 pl-8 pr-2.5"
              : "gap-2.5 px-2.5 py-2",
          isActive
            ? "bg-accent-primary/10 text-accent-primary"
            : "text-text-muted hover:bg-[#FAFAFA] hover:text-text-primary",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed ? (
            <span
              className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent-primary"
              aria-hidden
            />
          ) : null}
          <Icon
            className={[
              "size-[1.125rem] shrink-0 transition-colors",
              isActive
                ? "text-accent-primary"
                : "text-text-muted/70 group-hover:text-text-primary",
            ].join(" ")}
          />
          <span
            className={[
              "matriz-sidebar-reveal truncate",
              collapsed ? "is-collapsed" : "is-expanded",
            ].join(" ")}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export default function AppShellMatriz() {
  const { user, updateUserFoto } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
  });
  const [openSectionId, setOpenSectionId] = useState(null);
  const [sectionSynced, setSectionSynced] = useState(false);
  const [lastPathname, setLastPathname] = useState(location.pathname);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoLocal, setFotoLocal] = useState(null);
  const fileInputRef = useRef(null);

  const sections = useMemo(() => buildMatrizNavSections(user), [user]);

  const activeGroupId =
    sections.find(
      (section) =>
        section.id && sectionContainsPath(section, location.pathname),
    )?.id ?? null;

  if (!sectionSynced) {
    setSectionSynced(true);
    if (activeGroupId) setOpenSectionId(activeGroupId);
  }

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname);
    if (mobileOpen) setMobileOpen(false);
    setOpenSectionId(activeGroupId);
  }

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    if (user) {
      setFotoLocal(user?.user_metadata?.foto || user?.foto || null);
    }
  }, [user]);

  const displayName =
    user?.nome ||
    user?.user_metadata?.nome ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const perfilLabel = getPerfilLabel(user?.tipo);

  function toggleSection(sectionId) {
    setOpenSectionId((current) => {
      const next = current === sectionId ? null : sectionId;
      if (next != null && collapsed) {
        setCollapsed(false);
      }
      return next;
    });
  }

  const handleAbrirModal = () => {
    setSelectedFile(null);
    setPreviewUrl(fotoLocal);
    setIsModalOpen(true);
  };

  const handleFecharModal = () => {
    if (uploadingFoto) return;
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleConfirmarUpload = async () => {
    if (!selectedFile) {
      alert(homeDictionary.modalFoto.pickImageError);
      return;
    }
    if (!user?.id) {
      alert(homeDictionary.modalFoto.missingUserIdError);
      return;
    }
    try {
      setUploadingFoto(true);
      const response = await api.uploadFotoUsuario(user.id, selectedFile);
      setFotoLocal(response.fotoUrl);
      updateUserFoto(response.fotoUrl);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert(homeDictionary.modalFoto.uploadError);
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const shellValue = useMemo(
    () => ({
      hideLogo: true,
      openMobileNav: () => setMobileOpen(true),
    }),
    [],
  );

  return (
    <MatrizShellProvider value={shellValue}>
      <div className="flex h-svh w-full overflow-hidden bg-bg-primary">
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
            "matriz-sidebar-shell fixed inset-y-0 left-0 z-40 flex h-svh w-64 shrink-0 flex-col border-r border-border-primary/30 bg-white",
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
                  "matriz-sidebar-reveal min-w-0",
                  collapsed ? "is-collapsed" : "is-expanded",
                ].join(" ")}
              >
                <span className="block truncate text-sm font-semibold leading-tight text-text-primary">
                  Montezuma
                </span>
                <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-accent-primary">
                  Gestão
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
            id="matriz-sidebar-nav"
            className={[
              "flex min-h-0 flex-1 flex-col overflow-y-auto py-3",
              collapsed ? "gap-0.5 px-1.5" : "gap-1 px-2.5",
            ].join(" ")}
          >
            {sections.map((section, sectionIndex) => {
              const isGroup = Boolean(section.id);
              const isOpen = isGroup && openSectionId === section.id;
              const GroupIcon = section.icon;
              const groupActive =
                isGroup && sectionContainsPath(section, location.pathname);

              return (
                <div
                  key={section.id ?? `section-${sectionIndex}`}
                  className="flex flex-col gap-0.5"
                >
                  {isGroup ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        title={collapsed ? section.label : undefined}
                        onClick={() => toggleSection(section.id)}
                        className={[
                          "group relative flex w-full items-center rounded-2xl text-sm font-medium transition-colors duration-200",
                          collapsed
                            ? "justify-center px-0 py-2"
                            : "gap-2.5 px-2.5 py-2",
                          groupActive
                            ? "bg-[#FAFAFA] text-text-primary"
                            : "text-text-muted hover:bg-[#FAFAFA] hover:text-text-primary",
                        ].join(" ")}
                      >
                        {GroupIcon ? (
                          <GroupIcon
                            className={[
                              "size-[1.125rem] shrink-0 transition-colors",
                              groupActive
                                ? "text-accent-primary"
                                : "text-text-muted/70 group-hover:text-text-primary",
                            ].join(" ")}
                          />
                        ) : null}
                        <span
                          className={[
                            "matriz-sidebar-reveal truncate",
                            collapsed ? "is-collapsed" : "is-expanded",
                          ].join(" ")}
                        >
                          {section.label}
                        </span>
                        <ChevronDown
                          className={[
                            "ml-auto size-4 shrink-0 text-text-muted transition-transform duration-200",
                            collapsed ? "hidden" : "",
                            isOpen ? "rotate-180" : "",
                          ].join(" ")}
                        />
                      </button>
                      {isOpen
                        ? section.items.map((item) => (
                            <SidebarNavLink
                              key={item.to}
                              item={item}
                              collapsed={collapsed}
                              indented={!collapsed}
                              onNavigate={() => setMobileOpen(false)}
                            />
                          ))
                        : null}
                    </>
                  ) : (
                    section.items.map((item) => (
                      <SidebarNavLink
                        key={item.to}
                        item={item}
                        collapsed={collapsed}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    ))
                  )}
                </div>
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
              onClick={handleAbrirModal}
              title={
                collapsed
                  ? `${displayName}${perfilLabel ? ` · ${perfilLabel}` : ""}`
                  : "Minha conta"
              }
              className={[
                "group flex w-full items-center rounded-2xl text-left transition-colors hover:bg-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/30",
                collapsed ? "justify-center p-1.5" : "gap-2.5 p-2",
              ].join(" ")}
              aria-label="Minha conta"
            >
              {fotoLocal ? (
                <img
                  src={fotoLocal}
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
                  "matriz-sidebar-reveal min-w-0 flex-1",
                  collapsed ? "is-collapsed" : "is-expanded",
                ].join(" ")}
              >
                <span
                  className="block truncate text-sm font-semibold text-text-primary"
                  title={displayName}
                >
                  {displayName}
                </span>
                {perfilLabel ? (
                  <span className="block truncate text-xs text-text-muted">
                    {perfilLabel}
                  </span>
                ) : null}
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
              aria-controls="matriz-sidebar-nav"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-text-primary">
              <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-primary/25 bg-white p-0.5">
                <img
                  src={logo}
                  alt=""
                  className="h-full w-auto object-contain"
                />
              </span>
              <span className="truncate">Montezuma</span>
            </span>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <Outlet />
          </div>
        </div>
      </div>

      <HomeProfilePhotoModal
        isOpen={isModalOpen}
        onClose={handleFecharModal}
        previewUrl={previewUrl}
        selectedFile={selectedFile}
        uploadingFoto={uploadingFoto}
        onFileSelect={handleFileSelect}
        onConfirm={handleConfirmarUpload}
        fileInputRef={fileInputRef}
      />
    </MatrizShellProvider>
  );
}
