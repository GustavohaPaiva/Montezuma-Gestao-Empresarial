import logo from "../../assets/img/img tela login.png";
import { LOGIN_BRAND } from "./loginContent";

function BrandGrid({ patternId }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.14]"
      aria-hidden
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id={patternId}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M40 0H0V40"
              fill="none"
              stroke="white"
              strokeWidth="0.45"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

function BrandContent({ compact = false }) {
  return (
    <>
      <div className="login-fade-up flex flex-col items-center text-center lg:items-start lg:text-left">
        <img
          src={logo}
          alt="Montezuma"
          className={
            compact
              ? "h-[72px] w-auto drop-shadow-lg"
              : "h-[95px] w-auto drop-shadow-lg"
          }
        />

        <h1
          className={
            compact
              ? "mt-6 text-xl font-bold uppercase leading-tight tracking-tight text-white sm:text-2xl"
              : "mt-10 max-w-md text-2xl font-bold uppercase leading-[1.2] tracking-tight text-white xl:text-[1.75rem]"
          }
        >
          {LOGIN_BRAND.headline}
        </h1>

        <p
          className={
            compact
              ? "mt-3 max-w-md text-sm leading-relaxed text-orange-100/90"
              : "mt-4 max-w-lg text-base leading-relaxed text-orange-100/85"
          }
        >
          {LOGIN_BRAND.description}
        </p>
      </div>

      <div
        className={`login-fade-up login-fade-up-delay-2 ${compact ? "mt-6" : "mt-10"} text-center lg:text-left`}
      >
        <p className="text-lg font-bold uppercase tracking-wide text-white sm:text-xl">
          {LOGIN_BRAND.verseRef}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-orange-50/90 sm:text-base">
          {LOGIN_BRAND.verseText}
        </p>
      </div>
    </>
  );
}

export function LoginBrandPanelDesktop() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:w-[46%] xl:w-[44%]">
      <div
        className="absolute inset-0 bg-gradient-to-br from-accent-primary-dark via-accent-primary to-orange-950"
        aria-hidden
      />
      <div
        className="login-brand-blob pointer-events-none absolute -left-1/4 top-1/4 size-[28rem] rounded-full bg-orange-400/25 blur-3xl"
        aria-hidden
      />
      <div
        className="login-brand-blob-alt pointer-events-none absolute -bottom-1/4 -right-1/4 size-[32rem] rounded-full bg-amber-300/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-0 size-64 rounded-full bg-white/5 blur-2xl"
        aria-hidden
      />
      <BrandGrid patternId="montezuma-login-grid" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
        <BrandContent />

        <p className="login-fade-up login-fade-up-delay-4 text-xs text-orange-200/70">
          © {new Date().getFullYear()} Montezuma. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}

export function LoginMobileHero({ formTitle }) {
  return (
    <header className="relative shrink-0 overflow-hidden lg:hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-accent-primary-dark via-accent-primary to-orange-950"
        aria-hidden
      />
      <div
        className="login-form-blob pointer-events-none absolute -left-16 -top-8 size-56 rounded-full bg-orange-400/35 blur-3xl"
        aria-hidden
      />
      <div
        className="login-form-blob pointer-events-none absolute -right-12 top-12 size-44 rounded-full bg-amber-400/25 blur-3xl"
        style={{ animationDirection: "reverse" }}
        aria-hidden
      />
      <BrandGrid patternId="montezuma-login-grid-mobile" />

      <div className="relative px-6 pb-14 pt-10 sm:px-10 sm:pt-12 md:px-12">
        <div className="login-fade-up mx-auto max-w-lg">
          <BrandContent compact />

          <div className="login-fade-up login-fade-up-delay-1 mt-8 text-center">
            <span
              className="mb-3 inline-block h-0.5 w-10 rounded-full bg-orange-300/80"
              aria-hidden
            />
            <h2 className="text-lg font-semibold uppercase tracking-wide text-white">
              {formTitle}
            </h2>
          </div>
        </div>
      </div>

      <svg
        className="absolute bottom-0 left-0 block w-full text-white"
        viewBox="0 0 1440 72"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M0,36 C240,72 480,8 720,36 C960,64 1200,16 1440,32 L1440,72 L0,72 Z"
        />
      </svg>
    </header>
  );
}
