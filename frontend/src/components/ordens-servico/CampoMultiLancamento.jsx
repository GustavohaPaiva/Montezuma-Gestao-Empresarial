import { useState } from "react";
import { Plus, X } from "lucide-react";
import BaseButton from "../gerais/BaseButton";
import BaseInput from "../gerais/BaseInput";

export default function CampoMultiLancamento({
  itens = [],
  onChange,
  placeholder = "Descreva o item…",
  disabled = false,
  isVk = false,
}) {
  const [rascunho, setRascunho] = useState("");

  const lancar = () => {
    const texto = rascunho.trim();
    if (!texto || disabled) return;
    onChange([...(Array.isArray(itens) ? itens : []), texto]);
    setRascunho("");
  };

  const remover = (idx) => {
    if (disabled) return;
    onChange(itens.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lancar();
    }
  };

  const chipClass = isVk
    ? "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm text-esc-text"
    : "inline-flex items-center gap-1.5 rounded-lg border border-border-primary/30 bg-white px-2.5 py-1 text-sm text-text-primary";

  return (
    <div className="flex flex-col gap-2">
      {!disabled ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <BaseInput
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            variant={isVk ? "escritorio" : "default"}
            className="min-w-0 flex-1"
          />
          <BaseButton
            type="button"
            variant="outline"
            size="sm"
            onClick={lancar}
            disabled={!rascunho.trim()}
            icon={<Plus className="h-4 w-4" />}
            className="w-full shrink-0 sm:w-auto"
          >
            Lançar item
          </BaseButton>
        </div>
      ) : null}
      {Array.isArray(itens) && itens.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {itens.map((item, idx) => (
            <li key={`${idx}-${item}`} className={chipClass}>
              <span>{item}</span>
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => remover(idx)}
                  className={
                    isVk
                      ? "text-esc-muted hover:text-esc-text"
                      : "text-text-muted hover:text-text-primary"
                  }
                  aria-label="Remover item"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p
          className={
            isVk ? "text-xs text-esc-muted" : "text-xs text-text-muted"
          }
        >
          Nenhum item lançado.
        </p>
      )}
    </div>
  );
}
