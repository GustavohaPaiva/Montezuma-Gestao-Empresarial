import { useState, useEffect, useMemo } from "react";
import ModalPortal from "../gerais/ModalPortal";
import BaseDatePicker from "../gerais/BaseDatePicker";
import BaseSelect from "../gerais/BaseSelect";
import BaseButton from "../gerais/BaseButton";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { labelObraResumo } from "../../pages/obras/detalhe/utils/obraCaixa";

const emptyForm = () => ({
  obra_destino_id: "",
  descricao: "",
  valor: "",
  data: new Date().toISOString().split("T")[0],
});

const fieldClass =
  "h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

export default function ModalTransferenciaObra({
  isOpen,
  onClose,
  onSave,
  salvando,
  saldoDisponivel = 0,
  obraOrigemId,
  obrasDestino = [],
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [erro, setErro] = useState("");

  const opcoesDestino = useMemo(
    () =>
      (obrasDestino || [])
        .filter((o) => String(o.id) !== String(obraOrigemId))
        .map((o) => ({
          value: String(o.id),
          label: labelObraResumo(o),
        })),
    [obrasDestino, obraOrigemId],
  );

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
    if (!formData.obra_destino_id) {
      setErro("Selecione a obra de destino.");
      return;
    }
    if (!Number.isFinite(v) || v <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (v > (parseFloat(saldoDisponivel) || 0) + 1e-9) {
      setErro(
        `Saldo insuficiente. Disponível: R$ ${formatarMoeda(saldoDisponivel)}`,
      );
      return;
    }
    if (!formData.data) {
      setErro("Informe a data da transferência.");
      return;
    }
    try {
      await onSave({
        obra_destino_id: Number(formData.obra_destino_id),
        descricao: formData.descricao?.trim() || "",
        valor: v,
        data: formData.data,
      });
    } catch (e) {
      setErro(e?.message || "Não foi possível transferir o saldo.");
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-transf-obra-titulo"
      >
        <div className="flex max-h-[95vh] w-[520px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2
                id="modal-transf-obra-titulo"
                className="text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg"
              >
                Transferir saldo
              </h2>
              <p className="mt-1 text-xs font-medium text-text-muted">
                Disponível:{" "}
                <span className="font-semibold text-emerald-700">
                  R$ {formatarMoeda(saldoDisponivel)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] text-[22px] text-text-muted transition-all hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
              aria-label="Fechar"
            >
              &times;
            </button>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Obra de destino
              </label>
              <BaseSelect
                searchable
                value={formData.obra_destino_id}
                onChange={(e) =>
                  setFormData({ ...formData, obra_destino_id: e.target.value })
                }
                options={[
                  { value: "", label: "Selecione a obra…" },
                  ...opcoesDestino,
                ]}
                placeholder="Selecione a obra…"
              />
            </div>

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
                placeholder="Motivo da transferência (opcional)"
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
                  placeholder="Data da transferência"
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
              {salvando ? "Transferindo…" : "Transferir"}
            </BaseButton>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
