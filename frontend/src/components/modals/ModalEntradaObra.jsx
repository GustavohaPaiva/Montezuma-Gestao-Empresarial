import { useState, useEffect } from "react";
import ModalPortal from "../gerais/ModalPortal";
import BaseDatePicker from "../gerais/BaseDatePicker";
import BaseButton from "../gerais/BaseButton";

const emptyForm = () => ({
  descricao: "",
  valor: "",
  data: new Date().toISOString().split("T")[0],
});

const fieldClass =
  "h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

export default function ModalEntradaObra({ isOpen, onClose, onSave, salvando }) {
  const [formData, setFormData] = useState(emptyForm);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setFormData(emptyForm());
      setErro("");
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const salvar = async () => {
    setErro("");
    const v = parseFloat(formData.valor);
    if (!Number.isFinite(v) || v <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (!formData.data) {
      setErro("Informe a data da entrada.");
      return;
    }
    try {
      await onSave({
        descricao: formData.descricao?.trim() || "",
        valor: v,
        data: formData.data,
      });
    } catch (e) {
      setErro(e?.message || "Não foi possível salvar a entrada.");
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-entrada-obra-titulo"
      >
        <div className="flex max-h-[95vh] w-[480px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <h2
              id="modal-entrada-obra-titulo"
              className="text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg"
            >
              Nova entrada
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] text-[22px] text-text-muted transition-all hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
              aria-label="Fechar"
            >
              &times;
            </button>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Descrição
              </label>
              <input
                type="text"
                className={fieldClass}
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Ex.: Aporte do cliente, liberação de verba"
              />
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
              <div className="flex w-full flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={fieldClass}
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: e.target.value })
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="flex w-full flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Data
                </label>
                <BaseDatePicker
                  placeholder="Data da entrada"
                  value={formData.data}
                  onChange={(e) =>
                    setFormData({ ...formData, data: e.target.value })
                  }
                />
              </div>
            </div>

            {erro ? (
              <p className="text-sm font-medium text-rose-700">{erro}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border-primary/35 px-5 py-4">
            <BaseButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </BaseButton>
            <BaseButton type="button" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando…" : "Lançar entrada"}
            </BaseButton>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
