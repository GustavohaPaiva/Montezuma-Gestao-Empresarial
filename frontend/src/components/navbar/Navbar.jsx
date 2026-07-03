import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import logo from "../../assets/logos/logo sem fundo.png";
import { useNavigate } from "react-router-dom";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const GREETING_DURATION_MS = 4500;

function UserProfileBlock({ userProfile, elaborate = false }) {
  const [greetingVisible, setGreetingVisible] = useState(true);
  const [greetingFading, setGreetingFading] = useState(false);

  useEffect(() => {
    if (!elaborate || !userProfile?.saudacao) return undefined;
    setGreetingVisible(true);
    setGreetingFading(false);
    const fadeTimer = setTimeout(
      () => setGreetingFading(true),
      GREETING_DURATION_MS - 800,
    );
    const hideTimer = setTimeout(
      () => setGreetingVisible(false),
      GREETING_DURATION_MS,
    );
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [elaborate, userProfile?.saudacao, userProfile?.nomeUsuario]);

  if (!userProfile) return null;

  const greeting = userProfile.saudacao
    ? `${userProfile.saudacao}, ${userProfile.nomeUsuario}`
    : userProfile.nomeUsuario;

  const nome = userProfile.saudacao
    ? `${userProfile.saudacao}, ${userProfile.nomeUsuario}`
    : userProfile.nomeUsuario;

  const avatarButton = (
    <button
      type="button"
      onClick={userProfile.onAvatarClick}
      className={joinClasses(
        "relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-accent-primary bg-surface object-cover transition-all duration-200 hover:opacity-90 hover:shadow-[0_0_18px_-2px_rgba(220,59,11,0.4)]",
        elaborate
          ? "h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11"
          : "h-9 w-9 md:h-10 md:w-10",
      )}
      title="Alterar foto de perfil"
      aria-label="Alterar foto de perfil"
    >
      {userProfile.fotoUrl ? (
        <img
          src={userProfile.fotoUrl}
          alt="Foto do usuário"
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound
          className={
            elaborate
              ? "h-4 w-4 text-accent-primary sm:h-5 sm:w-5"
              : "h-5 w-5 text-accent-primary md:h-6 md:w-6"
          }
        />
      )}
      <span
        className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-surface bg-accent-primary sm:h-2.5 sm:w-2.5"
        aria-hidden
      />
    </button>
  );

  if (!elaborate) {
    return (
      <div className="flex shrink-0 items-center gap-2.5 md:gap-3">
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium text-text-primary">{nome}</p>
          {userProfile.perfilLabel ? (
            <div className="mt-1 flex justify-end">
              <span className="inline-flex rounded-full border border-border-primary bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-text-muted">
                {userProfile.perfilLabel}
              </span>
            </div>
          ) : null}
        </div>
        {avatarButton}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
      {greetingVisible ? (
        <p
          className={joinClasses(
            "max-w-[8rem] truncate text-right text-xs font-semibold text-text-primary transition-opacity duration-700 sm:max-w-[12rem] sm:text-sm",
            greetingFading ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          {greeting}
        </p>
      ) : null}
      {avatarButton}
    </div>
  );
}

function BrandLogo({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative shrink-0"
      aria-label="Ir para o início"
    >
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_4px_16px_-4px_rgba(220,59,11,0.25)] ring-2 ring-accent-primary/10 sm:h-10 sm:w-10 md:h-11 md:w-11">
        <img
          src={logo}
          alt="Logo Montezuma"
          className="h-6 w-6 object-contain sm:h-7 sm:w-7 md:h-9 md:w-9"
        />
      </span>
    </button>
  );
}

export default function Navbar({
  title = [],
  subtitle,
  actions = [],
  filters = [],
  userProfile,
  brand,
  variant = "default",
  className = "",
}) {
  const isHome = variant === "home";
  const safeActions = Array.isArray(actions) ? actions : [];
  const safeFilters = Array.isArray(filters) ? filters : [];
  const navigate = useNavigate();

  const onLogoClick = () => {
    navigate("/");
  };

  const hasRightContent =
    safeFilters.length > 0 || safeActions.length > 0 || Boolean(userProfile);

  if (isHome) {
    return (
      <header
        className={joinClasses(
          "sticky rounded-b-3xl top-0 z-20 mb-6 w-full min-w-0 border-b border-accent-primary/10 bg-gradient-to-b from-white/98 via-white/95 to-accent-primary/[0.03] shadow-[0_6px_28px_-6px_rgba(220,59,11,0.12)] backdrop-blur-md",
          className,
        )}
      >
        <div
          className="h-[3px] w-full bg-gradient-to-r from-accent-primary/60 via-accent-primary to-accent-primary/60"
          aria-hidden
        />

        <div className="flex w-full flex-row items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-[4%] sm:py-2.5 md:px-[5%] md:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 md:gap-4">
            <BrandLogo onClick={onLogoClick} />

            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight text-text-primary sm:text-base md:text-xl">
                {brand?.name ?? "Montezuma"}
              </p>
              {brand?.tagline ? (
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-primary sm:text-[11px] sm:tracking-[0.16em] md:text-xs">
                  {brand.tagline}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {safeActions.length > 0 ? (
              <div className="flex shrink-0 items-center gap-2">
                {safeActions.map((action, index) => {
                  if (action?.hidden) return null;
                  return (
                    <button
                      key={action?.key || action?.label || index}
                      type={action?.type || "button"}
                      onClick={action?.onClick}
                      disabled={action?.disabled}
                      className={joinClasses(
                        "inline-flex min-h-[2.25rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold tracking-tight ring-1 ring-slate-900/5 transition-all duration-200 sm:px-3.5 sm:text-sm",
                        action?.className ||
                          "bg-white text-text-primary hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
                      )}
                    >
                      {action?.icon ? (
                        <span className="inline-flex shrink-0">
                          {action.icon}
                        </span>
                      ) : null}
                      <span className="hidden sm:inline">{action?.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {userProfile ? (
              <UserProfileBlock userProfile={userProfile} elaborate />
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={joinClasses(
        "mb-6 flex w-full min-w-0 flex-col gap-3 border-b border-border-primary bg-bg-primary/95 px-3 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-bg-primary/85 transition-all sm:gap-4 sm:px-[4%] md:px-[5%] md:py-3",
        "md:flex-row md:flex-nowrap md:items-center md:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 w-full shrink-0 items-center gap-2.5 sm:gap-3 md:min-w-0 md:max-w-[min(40%,28rem)] md:flex-1 md:shrink">
        <img
          src={logo}
          onClick={onLogoClick}
          aria-label="Ir para o início"
          alt="Logo Montezuma"
          className="h-10 w-10 shrink-0 cursor-pointer object-contain sm:h-11 sm:w-11 md:h-12 md:w-12"
        />

        <div className="min-w-0 flex-1">
          <h1 className="break-words text-xl font-semibold tracking-tight text-text-primary sm:text-2xl md:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-text-muted sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {hasRightContent ? (
        <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:justify-stretch sm:gap-3 md:w-auto md:min-w-0 md:flex-1 md:flex-nowrap md:items-center md:justify-end md:gap-3 xl:max-w-none">
          {safeFilters.length > 0 ? (
            <div className="flex min-w-0 w-full flex-col gap-2 sm:flex-1 sm:flex-row sm:flex-wrap sm:items-center md:min-w-0 md:flex-1 md:flex-row md:flex-nowrap md:justify-end">
              {safeFilters.map((filterNode, index) => (
                <div
                  key={`filter-${index}`}
                  className="min-w-0 w-full flex-1 sm:min-w-[12rem] md:w-[min(100%,14rem)] md:max-w-[16rem] md:flex-none xl:w-[min(100%,16rem)]"
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

          <UserProfileBlock userProfile={userProfile} />
        </div>
      ) : null}
    </header>
  );
}
