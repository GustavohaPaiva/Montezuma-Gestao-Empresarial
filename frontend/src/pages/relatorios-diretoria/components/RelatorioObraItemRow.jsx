import { GripVertical, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import BaseDatePicker from "../../../components/gerais/BaseDatePicker";
import { textareaCampoClass } from "../../projecoes/projecoesUi";
import {
  relatorioObraItemAcaoClass,
  relatorioObraItemEditorClass,
  relatorioObraItemRemoverClass,
  relatorioObraItemToolbarClass,
} from "../relatoriosDiretoriaUi";
import RelatorioObraItemAssistente from "./RelatorioObraItemAssistente";

export default function RelatorioObraItemRow({
  item,
  onChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}) {
  const [assistenteAberto, setAssistenteAberto] = useState(false);

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart?.(e, item.id)}
        onDragOver={(e) => onDragOver?.(e, item.id)}
        onDrop={(e) => onDrop?.(e, item.id)}
        onDragEnd={() => onDragEnd?.()}
        className={`${relatorioObraItemEditorClass} ${
          isDragging ? "opacity-50" : ""
        } ${isDragOver ? "border-accent-primary/40 ring-2 ring-accent-primary/15" : ""}`}
      >
        <div className={relatorioObraItemToolbarClass}>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg border border-border-primary/30 bg-[#FAFAFA] text-text-muted active:cursor-grabbing"
            aria-label="Reordenar item"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <BaseDatePicker
              size="compact"
              value={item.prazo || ""}
              onChange={(e) =>
                onChange({
                  ...item,
                  prazo: e.target.value || null,
                })
              }
              wrapperClassName="w-auto shrink-0"
            />
            <button
              type="button"
              onClick={() => setAssistenteAberto(true)}
              disabled={!item.texto.trim()}
              className={relatorioObraItemAcaoClass}
              title="Melhorar texto com IA"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent-primary" />
              <span className="hidden sm:inline">Melhorar com IA</span>
            </button>
            <button
              type="button"
              onClick={onRemove}
              className={relatorioObraItemRemoverClass}
              title="Remover item"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Remover</span>
            </button>
          </div>
        </div>

        <div className="p-4">
          <textarea
            rows={3}
            value={item.texto}
            onChange={(e) => onChange({ ...item, texto: e.target.value })}
            className={textareaCampoClass}
            placeholder="Descreva o item…"
          />
        </div>
      </div>

      <RelatorioObraItemAssistente
        isOpen={assistenteAberto}
        textoInicial={item.texto}
        onClose={() => setAssistenteAberto(false)}
        onAplicar={(texto) => onChange({ ...item, texto })}
      />
    </>
  );
}
