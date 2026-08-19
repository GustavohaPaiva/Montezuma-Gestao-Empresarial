import { useEffect, useState } from "react";
import ModalPortal from "../gerais/ModalPortal";
import BaseDatePicker from "../gerais/BaseDatePicker";
import BaseButton from "../gerais/BaseButton";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { temaEscritorio } from "../../constants/escritorios";

const fieldClassDefault =
  "h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const fieldClassEsc =
  "h-11 w-full rounded-xl border border-esc-border bg-esc-card px-4 text-sm text-esc-text shadow-inner transition-all duration-300 placeholder:text-esc-muted/40 focus:border-esc-destaque focus:bg-esc-bg focus:outline-none focus:ring-1 focus:ring-esc-destaque";

export default function ModalAmortizarEmprestimo({
  isOpen,
  onClose,
  onSave,
  salvando,
  emprestimo,
  escritorioId,
  variant = "default",
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

  const isEsc = variant === "escritorio";
  const fieldClass = isEsc ? fieldClassEsc : fieldClassDefault;
  const labelClass = isEsc
    ? "text-[11px] font-bold uppercase tracking-wider text-esc-muted"
    : "text-[11px] font-bold uppercase tracking-wider text-text-muted";
  const selectVariant = isEsc ? "escritorio" : "default";

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
        className={[
          isEsc ? temaEscritorio(escritorioId) : "",
          "fixed inset-0 z-[80] flex items-center justify-center",
          isEsc
            ? "bg-black/60 p-4 backdrop-blur-md"
            : "bg-black/45 p-3 backdrop-blur-[2px] sm:p-4",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-amortizar-titulo"
      >
        <div
          className={
            isEsc
              ? "animate-premium-reveal relative flex max-h-[95vh] w-[480px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-esc-border bg-esc-card shadow-[0_0_80px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl"
              : "flex max-h-[95vh] w-[480px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
          }
        >
          {isEsc ? (
            <>
              <div className="pointer-events-none absolute -top-20 -right-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/20 blur-[70px]" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 -z-10 h-64 w-64 rounded-full bg-esc-destaque/10 blur-[70px]" />
            </>
          ) : null}
          <div
            className={
              isEsc
                ? "flex items-center justify-between border-b border-esc-border bg-esc-bg px-5 py-4"
                : "flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4"
            }
          >
            <div className="min-w-0 flex-1">
              <h2
                id="modal-amortizar-titulo"
                className={
                  isEsc
                    ? "text-base font-bold tracking-tight text-esc-text sm:text-lg"
                    : "text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg"
                }
              >
                Receber / devolver
              </h2>
              <p
                className={
                  isEsc
                    ? "mt-1 text-xs font-medium text-esc-muted"
                    : "mt-1 text-xs font-medium text-text-muted"
                }
              >
                {emprestimo.origemLabel} → {emprestimo.destinoLabel}
              </p>
              <p
                className={
                  isEsc
                    ? "mt-0.5 text-xs font-medium text-esc-muted"
                    : "mt-0.5 text-xs font-medium text-text-muted"
                }
              >
                Em aberto:{" "}
                <span
                  className={
                    isEsc
                      ? "font-semibold text-esc-destaque"
                      : "font-semibold text-amber-700"
                  }
                >
                  R$ {formatarMoeda(saldo)}
                </span>
                . Pode ser parcial. Não entra no mês.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className={
                isEsc
                  ? "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-esc-bg text-esc-muted transition-all duration-300 hover:text-esc-text disabled:opacity-50"
                  : "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] text-[22px] text-text-muted transition-all hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
              }
              aria-label="Fechar"
            >
              &times;
            </button>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-[5px]">
              <label className={labelClass}>Descrição</label>
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
                <label className={labelClass}>Valor (R$)</label>
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
                <label className={labelClass}>Data</label>
                <BaseDatePicker
                  variant={selectVariant}
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

          <div
            className={
              isEsc
                ? "flex justify-end gap-2 border-t border-esc-border bg-esc-bg px-5 py-4"
                : "flex justify-end gap-2 border-t border-border-primary/35 px-5 py-4"
            }
          >
            {isEsc ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={salvando}
                  className="w-full rounded-xl border border-esc-border bg-transparent px-6 py-2.5 text-sm font-semibold text-esc-text transition-all duration-300 hover:bg-esc-bg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvar}
                  disabled={salvando}
                  className="w-full rounded-xl border border-esc-destaque/50 bg-esc-destaque/20 px-8 py-2.5 text-sm font-bold text-esc-destaque shadow-[0_0_15px_-3px_var(--color-esc-destaque)] transition-all duration-300 hover:bg-esc-destaque/30 disabled:opacity-50"
                >
                  {salvando ? "Salvando…" : "Confirmar"}
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
