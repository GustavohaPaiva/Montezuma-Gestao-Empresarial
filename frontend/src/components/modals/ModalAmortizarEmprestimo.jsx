import { useEffect, useState } from "react";
import ModalPortal from "../gerais/ModalPortal";
import BaseDatePicker from "../gerais/BaseDatePicker";
import BaseButton from "../gerais/BaseButton";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";

const fieldClass =
  "h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

export default function ModalAmortizarEmprestimo({
  isOpen,
  onClose,
  onSave,
  salvando,
  emprestimo,
}) {
  const saldo = parseFloat(emprestimo?.saldo_aberto) || 0;
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setValor(saldo ? String(saldo) : "");
      setData(new Date().toISOString().split("T")[0]);
      setDescricao("");
      setErro("");
    });
  }, [isOpen, saldo]);

  if (!isOpen || !emprestimo) return null;

  const salvar = async () => {
    setErro("");
    const v = parseFloat(valor);
    if (!Number.isFinite(v) || v <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (v > saldo + 1e-9) {
      setErro(`Máximo em aberto: R$ ${formatarMoeda(saldo)}`);
      return;
    }
    if (!data) {
      setErro("Informe a data.");
      return;
    }
    try {
      await onSave({
        emprestimo_id: emprestimo.id,
        valor: v,
        descricao: descricao?.trim() || "",
        data,
      });
    } catch (e) {
      setErro(e?.message || "Não foi possível amortizar.");
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-amortizar-titulo"
      >
        <div className="flex max-h-[95vh] w-[480px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2
                id="modal-amortizar-titulo"
                className="text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg"
              >
                Receber / devolver
              </h2>
              <p className="mt-1 text-xs font-medium text-text-muted">
                {emprestimo.origemLabel} → {emprestimo.destinoLabel}
              </p>
              <p className="mt-0.5 text-xs font-medium text-text-muted">
                Em aberto:{" "}
                <span className="font-semibold text-amber-700">
                  R$ {formatarMoeda(saldo)}
                </span>
                . Pode ser parcial. Não entra no mês.
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
                Descrição
              </label>
              <input
                type="text"
                className={fieldClass}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Opcional"
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
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="flex w-full flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Data
                </label>
                <BaseDatePicker
                  placeholder="Data"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
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
              className="w-full"
              onClick={onClose}
              disabled={salvando}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="w-full"
            >
              {salvando ? "Salvando…" : "Confirmar"}
            </BaseButton>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
