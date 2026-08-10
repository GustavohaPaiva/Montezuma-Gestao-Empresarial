import { Download, Share } from "lucide-react";
import { useAdminPwa } from "../../pwa/AdminPwaContext";

export function AdminPwaInstallButton({ className = "" }) {
  const { enabled, canInstall, installed, iosHint, promptInstall } =
    useAdminPwa();

  if (!enabled || installed) return null;

  if (canInstall) {
    return (
      <button
        type="button"
        onClick={() => promptInstall()}
        className={
          className ||
          "inline-flex min-h-[2.25rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-accent-primary px-3 py-1.5 text-xs font-semibold tracking-tight text-white ring-1 ring-slate-900/5 transition-all duration-200 hover:opacity-95 sm:px-3.5 sm:text-sm"
        }
        title="Instalar aplicativo"
        aria-label="Instalar aplicativo"
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">Instalar app</span>
      </button>
    );
  }

  if (iosHint) {
    return (
      <p
        className="hidden max-w-[11rem] text-right text-[10px] leading-snug text-text-muted sm:block sm:max-w-[14rem] sm:text-[11px]"
        title="No iPhone: Compartilhar → Adicionar à Tela de Início"
      >
        <Share className="mr-1 inline h-3 w-3 text-accent-primary" aria-hidden />
        iPhone: Compartilhar → Adicionar à Tela de Início
      </p>
    );
  }

  return null;
}
