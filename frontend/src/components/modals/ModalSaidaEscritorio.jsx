import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ModalPortal from "../gerais/ModalPortal";
import { ID_VOGELKOP } from "../../constants/escritorios";

const emptyForm = () => ({
  descricao: "",
  valor: "",
  data: new Date().toISOString().split("T")[0],
  formaPagamento: "Á vista",
  parcelas: "1X",
});

export default function ModalSaidaEscritorio({
  isOpen,
  onClose,
  onSave,
  escritorioId,
}) {
  const [formData, setFormData] = useState(emptyForm);

  const temaClasse =
    escritorioId === ID_VOGELKOP ? "theme-vogelkop" : "theme-ybyoca";

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-esc-text shadow-inner transition-all duration-300 placeholder:text-esc-muted/40 focus:border-esc-destaque focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-esc-destaque";

  const modalOverlayClass = `${temaClasse} fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md`;

  const modalPanelClass =
    "animate-premium-reveal relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/20 bg-esc-card shadow-[0_0_80px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl";

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => setFormData(emptyForm()));
  }, [isOpen]);

  if (!isOpen || !escritorioId) return null;

  const salvar = () => {
    if (!formData.descricao?.trim() || formData.valor === "") {
      alert("Preencha a descrição e o valor.");
      return;
    }
    const v = parseFloat(formData.valor);
    if (Number.isNaN(v)) {
      alert("Valor inválido.");
      return;
    }
    onSave({
      ...formData,
      valor: v,
      escritorio_id: escritorioId,
    });
  };

  return (
    <ModalPortal>
      <div
        className={modalOverlayClass}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-saida-esc-titulo"
      >
        <div className={modalPanelClass}>
          <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]"></div>
          <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/10 blur-[70px]"></div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-6 py-4">
            <h2
              id="modal-saida-esc-titulo"
              className="text-xl font-bold tracking-tight text-esc-text"
            >
              Nova Saída
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
                Descrição
              </label>
              <input
                type="text"
                className={fieldClass}
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descrição da saída"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className={fieldClass}
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Data
                </label>
                <input
                  type="date"
                  className={fieldClass}
                  value={formData.data}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                  Forma de Pagamento
                </label>
                <select
                  className={fieldClass}
                  value={formData.formaPagamento}
                  onChange={(e) =>
                    setFormData({ ...formData, formaPagamento: e.target.value })
                  }
                >
                  <option value="Á vista" className="bg-esc-bg text-esc-text">
                    Á vista
                  </option>
                  <option value="Debito" className="bg-esc-bg text-esc-text">
                    Débito
                  </option>
                  <option value="Crédito" className="bg-esc-bg text-esc-text">
                    Crédito
                  </option>
                  <option value="Parcelado" className="bg-esc-bg text-esc-text">
                    Parcelado
                  </option>
                </select>
              </div>

              {formData.formaPagamento === "Parcelado" && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-esc-muted">
                    Parcelas
                  </label>
                  <select
                    className={fieldClass}
                    value={formData.parcelas}
                    onChange={(e) =>
                      setFormData({ ...formData, parcelas: e.target.value })
                    }
                  >
                    {[...Array(12)].map((_, i) => (
                      <option
                        key={i + 1}
                        value={`${i + 1}X`}
                        className="bg-esc-bg text-esc-text"
                      >
                        {i + 1}X
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 border-t border-white/10 bg-white/[0.02] px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-transparent px-6 py-2.5 text-sm font-semibold text-esc-text transition-all duration-300 hover:bg-white/5 sm:w-auto w-full"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              className="rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 px-8 py-2.5 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all duration-300 hover:bg-esc-destaque/30 hover:shadow-[0_0_25px_-3px_var(--color-esc-destaque)] sm:w-auto w-full"
            >
              Salvar Saída
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
