import { HardHat, Lock, Shield } from "lucide-react";
import {
  LoginBrandPanelDesktop,
  LoginMobileHero,
} from "./LoginBrandPanel";

const TRUST_ITEMS = [
  { label: "Ambiente seguro", icon: Shield },
  { label: "Acompanhamento de obra", icon: HardHat },
  { label: "Dados protegidos", icon: Lock },
];

function FormSideBlobs() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-accent-primary-50/25 lg:to-accent-primary-50/35" />
      <div className="login-form-blob absolute -left-20 -top-16 size-56 rounded-full bg-orange-200/40 blur-3xl sm:size-64 md:size-72" />
      <div
        className="login-form-blob absolute -bottom-24 -right-20 size-52 rounded-full bg-amber-200/35 blur-3xl md:size-56"
        style={{ animationDirection: "reverse" }}
      />
      <div className="login-form-blob absolute right-[12%] top-[38%] hidden size-36 rounded-full bg-orange-100/50 opacity-80 blur-3xl lg:block" />
      <div className="absolute inset-0 opacity-[0.28] sm:opacity-[0.35] lg:opacity-[0.4]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="montezuma-login-dots-form"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="0.65" fill="rgb(220 59 11 / 0.1)" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="url(#montezuma-login-dots-form)"
          />
        </svg>
      </div>
    </div>
  );
}

function DesktopWelcomePanel({ formTitle, formSubtitle }) {
  return (
    <div className="login-fade-up login-fade-up-delay-1 relative mb-6 hidden overflow-hidden rounded-2xl border border-orange-100/70 bg-white/70 p-5 shadow-sm backdrop-blur-md lg:block">
      <div
        className="pointer-events-none absolute -left-8 -top-8 size-32 rounded-full bg-orange-200/40 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-primary to-accent-primary-dark text-white shadow-md shadow-orange-600/20">
          <Lock className="size-5" />
        </span>
        <div className="min-w-0 flex-1 border-l border-orange-100/80 pl-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-accent-primary">
            Montezuma · Gestão Empresarial
          </p>
          <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900">
            {formTitle}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
            {formSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function LoginCardHeader({ formTitle, formSubtitle }) {
  return (
    <div className="mb-6 flex items-center gap-3.5 border-b border-slate-100/90 pb-5 lg:hidden">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary-50 to-orange-100 text-accent-primary ring-1 ring-orange-100">
        <Lock className="size-5" />
      </span>
      <div>
        <p className="text-[0.9375rem] font-semibold text-slate-900">
          {formTitle}
        </p>
        <p className="text-sm text-slate-500">{formSubtitle}</p>
      </div>
    </div>
  );
}

function LoginTrustFooter() {
  return (
    <div className="login-fade-up login-fade-up-delay-5 mt-6 text-center lg:text-left">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-start">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <span
              key={item.label}
              className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-slate-500"
            >
              <Icon className="size-3.5 text-accent-primary/80" />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginShell({
  formTitle,
  formSubtitle,
  children,
}) {
  return (
    <div className="login-page flex min-h-svh font-montserrat">
      <LoginBrandPanelDesktop />

      <div className="relative flex min-h-svh flex-1 flex-col overflow-hidden bg-white lg:items-center lg:justify-center lg:bg-slate-50">
        <FormSideBlobs />
        <LoginMobileHero formTitle={formTitle} />

        <div className="relative z-10 flex flex-1 flex-col px-5 pb-10 sm:px-8 lg:flex-none lg:justify-center lg:px-[5%] lg:py-10">
          <div className="mx-auto w-full max-w-[26rem] sm:max-w-md md:max-w-lg lg:max-w-[30rem]">
            <DesktopWelcomePanel
              formTitle={formTitle}
              formSubtitle={formSubtitle}
            />

            <div className="login-fade-up login-fade-up-delay-2 relative mt-3 sm:mt-5 lg:mt-0">
              <div
                className="absolute -inset-px rounded-3xl bg-gradient-to-br from-orange-300/50 via-orange-100/30 to-amber-200/40 opacity-100"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-3xl border border-white bg-white/95 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.15)] backdrop-blur-xl sm:shadow-[0_24px_60px_-18px_rgba(220,59,11,0.18)]">
                <div
                  className="h-1.5 w-full bg-gradient-to-r from-accent-primary via-accent-primary-dark to-orange-700"
                  aria-hidden
                />
                <div
                  className="login-card-shine pointer-events-none absolute inset-0 opacity-30"
                  aria-hidden
                />
                <div className="relative p-6 sm:p-8 md:p-9">
                  <LoginCardHeader
                    formTitle={formTitle}
                    formSubtitle={formSubtitle}
                  />
                  {children}
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center">
            <LoginTrustFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
