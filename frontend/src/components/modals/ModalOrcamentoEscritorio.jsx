import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ModalPortal from "../gerais/ModalPortal";
import { ID_VOGELKOP } from "../../constants/escritorios";

const STATUS_OPTIONS = ["Em andamento", "Não fechado", "Fechado"];

export default function ModalOrcamentoEscritorio({
  isOpen,
  onClose,
  onSave,
  escritorioId,
  orcamentoEdicao,
}) {
  const modoEdicao = Boolean(orcamentoEdicao?.id);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [status, setStatus] = useState("Em andamento");

  const temaClasse =
    escritorioId === ID_VOGELKOP ? "theme-vogelkop" : "theme-ybyoca";

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-esc-text shadow-inner transition-all duration-300 placeholder:text-esc-muted/40 focus:border-esc-destaque focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-esc-destaque";

  const modalOverlayClass = `${temaClasse} fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md`;

  const modalPanelClass =
    "animate-premium-reveal relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/20 bg-esc-card shadow-[0_0_40px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl";

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      if (orcamentoEdicao?.id) {
        setNome(orcamentoEdicao.nome ?? "");
        setValor(
          orcamentoEdicao.valor != null ? String(orcamentoEdicao.valor) : "",
        );
        setStatus(orcamentoEdicao.status || "Em andamento");
      } else {
        setNome("");
        setValor("");
        setStatus("Em andamento");
      }
    });
  }, [isOpen, orcamentoEdicao]);

  if (!isOpen || !escritorioId) return null;

  const submit = () => {
    if (!nome?.trim() || valor === "") {
      alert("Preencha nome e valor.");
      return;
    }
    const v = parseFloat(valor);
    if (Number.isNaN(v)) {
      alert("Valor inválido.");
      return;
    }
    const base = {
      nome: nome.trim(),
      valor: v,
      status: status || "Em andamento",
      escritorio_id: escritorioId,
    };
    if (modoEdicao) {
      onSave({ id: orcamentoEdicao.id, ...base });
    } else {
      onSave(base);
    }
  };

  return (
    <ModalPortal>
      <div className={modalOverlayClass} role="dialog" aria-modal="true">
        <div className={modalPanelClass}>
          <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]"></div>
          <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/10 blur-[70px]"></div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
            <h2 className="text-xl font-bold tracking-tight text-esc-text">
              {modoEdicao ? "Editar Orçamento" : "Novo Orçamento"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-esc-muted transition-all duration-300 hover:bg-white/10 hover:text-esc-text"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6 custom-scrollbar">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                Nome / Referência
              </label>
              <input
                type="text"
                className={fieldClass}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Projeto Residencial"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                className={fieldClass}
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                Status
              </label>
              <select
                className={fieldClass}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-esc-bg text-esc-text">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-transparent px-6 py-2.5 text-sm font-semibold text-esc-text transition-all duration-300 hover:bg-white/5 w-full"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submit}
              className="rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 px-8 py-2.5 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all duration-300 hover:bg-esc-destaque/30 hover:shadow-[0_0_25px_-3px_var(--color-esc-destaque)] w-full"
            >
              Salvar Orçamento
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
