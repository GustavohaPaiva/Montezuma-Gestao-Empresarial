import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { MODALIDADES_RELATORIO } from "../relatoriosDiretoriaUtils";
import { relatorioHeaderBotaoPrimarioClass, themeModalidade } from "../relatoriosDiretoriaUi";

const LABELS_ACAO = {
  obra: "Novo relatório de obra",
  financeiro: "Ver financeiro",
  compras: "Novo relatório de compras",
};

export default function MenuNovoLancamento({ aberto, onToggle, onSelecionar }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onToggle(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [aberto, onToggle]);

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => onToggle(!aberto)}
        className={relatorioHeaderBotaoPrimarioClass}
      >
        <Plus className="h-4 w-4" />
        Novo lançamento
      </button>
      {aberto ? (
        <div className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-border-primary/30 bg-white shadow-lg ring-1 ring-black/5">
          {MODALIDADES_RELATORIO.map((mod) => {
            const theme = themeModalidade(mod.colorTheme);
            const Icon = mod.Icon;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onSelecionar(mod.id)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-text-primary transition hover:bg-slate-50"
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${theme.icon}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {LABELS_ACAO[mod.id] || mod.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
