import { useEffect, useMemo, useState } from "react";
import ModalPortal from "../gerais/ModalPortal";
import BaseDatePicker from "../gerais/BaseDatePicker";
import BaseSelect from "../gerais/BaseSelect";
import BaseButton from "../gerais/BaseButton";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { labelObraResumo } from "../../pages/obras/detalhe/utils/obraCaixa";
import { ESCRITORIOS_OPCOES } from "../../pages/usuarios/usuariosUtils";
import { temaEscritorio } from "../../constants/escritorios";

const fieldClassDefault =
  "h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const fieldClassEsc =
  "h-11 w-full rounded-xl border border-esc-border bg-esc-card px-4 text-sm text-esc-text shadow-inner transition-all duration-300 placeholder:text-esc-muted/40 focus:border-esc-destaque focus:bg-esc-bg focus:outline-none focus:ring-1 focus:ring-esc-destaque";

const labelClassDefault =
  "text-[11px] font-bold uppercase tracking-wider text-text-muted";
const labelClassEsc =
  "text-[11px] font-bold uppercase tracking-wider text-esc-muted";

const segmentBtnClassDefault = (ativo) =>
  [
    "flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all",
    ativo
      ? "bg-white text-text-primary shadow-sm"
      : "text-text-muted hover:text-text-primary",
  ].join(" ");

const segmentBtnClassEsc = (ativo) =>
  [
    "flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all",
    ativo
      ? "bg-esc-destaque/20 text-esc-destaque"
      : "text-esc-muted hover:text-esc-text",
  ].join(" ");

const emptyForm = () => ({
  sentido: "emprestar",
  contraTipo: "escritorio",
  contraId: "",
  descricao: "",
  valor: "",
  data: new Date().toISOString().split("T")[0],
});

export default function ModalEmprestimo({
  isOpen,
  onClose,
  onSave,
  salvando,
  caixaDisponivel = 0,
  escritorioAtualId,
  escritorioAtualNome = "Escritório",
  obras = [],
  emprestimo = null,
  variant = "default",
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [erro, setErro] = useState("");
  const editando = Boolean(emprestimo?.id);

  const opcoesEscritorio = useMemo(
    () => ESCRITORIOS_OPCOES.filter((o) => o.value !== escritorioAtualId),
    [escritorioAtualId],
  );

  const opcoesObra = useMemo(
    () =>
      (obras || []).map((o) => ({
        value: String(o.id),
        label: labelObraResumo(o),
      })),
    [obras],
  );

  const exigeCaixa = !editando && formData.sentido === "emprestar";
  const origemEhAtual =
    editando &&
    emprestimo?.origem_tipo === "escritorio" &&
    emprestimo?.origem_escritorio_id === escritorioAtualId;

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setErro("");
      if (emprestimo?.id) {
        setFormData({
          ...emptyForm(),
          descricao: emprestimo.descricao || "",
          valor:
            emprestimo.valor_original != null
              ? String(emprestimo.valor_original)
              : "",
          data:
            emprestimo.data || new Date().toISOString().split("T")[0],
        });
      } else {
        setFormData(emptyForm());
      }
    });
  }, [isOpen, emprestimo]);

  if (!isOpen) return null;

  const isEsc = variant === "escritorio";
  const fieldClass = isEsc ? fieldClassEsc : fieldClassDefault;
  const labelClass = isEsc ? labelClassEsc : labelClassDefault;
  const segmentBtnClass = isEsc ? segmentBtnClassEsc : segmentBtnClassDefault;
  const selectVariant = isEsc ? "escritorio" : "default";

  const salvar = async () => {
    setErro("");
    const v = parseFloat(formData.valor);
    if (!Number.isFinite(v) || v <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    const caixa = parseFloat(caixaDisponivel) || 0;
    if (exigeCaixa && v > caixa + 1e-9) {
      setErro(
        `Saldo insuficiente no caixa. Disponível: R$ ${formatarMoeda(caixaDisponivel)}`,
      );
      return;
    }
    if (editando && origemEhAtual) {
      const original = parseFloat(emprestimo.valor_original) || 0;
      if (v - original > caixa + 1e-9) {
        setErro(
          `Saldo insuficiente no caixa. Disponível para aumento: R$ ${formatarMoeda(caixa)}`,
        );
        return;
      }
    }
    if (editando && !origemEhAtual) {
      const original = parseFloat(emprestimo.valor_original) || 0;
      if (original - v > caixa + 1e-9) {
        setErro(
          `Saldo insuficiente no caixa de quem tomou. Disponível: R$ ${formatarMoeda(caixa)}`,
        );
        return;
      }
    }
    if (!formData.data) {
      setErro("Informe a data.");
      return;
    }

    if (editando) {
      try {
        await onSave({
          emprestimo_id: emprestimo.id,
          valor: v,
          descricao: formData.descricao?.trim() || "",
          data: formData.data,
        });
      } catch (e) {
        setErro(e?.message || "Não foi possível atualizar o empréstimo.");
      }
      return;
    }

    const atualEhOrigem = formData.sentido === "emprestar";
    const contraTipo =
      atualEhOrigem && formData.contraTipo === "obra" ? "obra" : "escritorio";
    if (!formData.contraId) {
      setErro(
        contraTipo === "obra"
          ? "Selecione a obra."
          : "Selecione o escritório.",
      );
      return;
    }
    const payload = {
      valor: v,
      descricao: formData.descricao?.trim() || "",
      data: formData.data,
    };

    if (contraTipo === "obra") {
      payload.origem_tipo = "escritorio";
      payload.origem_escritorio_id = escritorioAtualId;
      payload.destino_tipo = "obra";
      payload.destino_obra_id = Number(formData.contraId);
    } else if (atualEhOrigem) {
      payload.origem_tipo = "escritorio";
      payload.origem_escritorio_id = escritorioAtualId;
      payload.destino_tipo = "escritorio";
      payload.destino_escritorio_id = formData.contraId;
    } else {
      payload.origem_tipo = "escritorio";
      payload.origem_escritorio_id = formData.contraId;
      payload.destino_tipo = "escritorio";
      payload.destino_escritorio_id = escritorioAtualId;
    }

    try {
      await onSave(payload);
    } catch (e) {
      setErro(e?.message || "Não foi possível registrar o empréstimo.");
    }
  };

  return (
    <ModalPortal>
      <div
        className={[
          isEsc ? temaEscritorio(escritorioAtualId) : "",
          "fixed inset-0 z-[80] flex items-center justify-center",
          isEsc
            ? "bg-black/60 p-4 backdrop-blur-md"
            : "bg-black/45 p-3 backdrop-blur-[2px] sm:p-4",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-emprestimo-titulo"
      >
        <div
          className={
            isEsc
              ? "animate-premium-reveal relative flex max-h-[95vh] w-[520px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-esc-border bg-esc-card shadow-[0_0_80px_-15px_var(--color-esc-destaque)] backdrop-blur-2xl"
              : "flex max-h-[95vh] w-[520px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
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
                id="modal-emprestimo-titulo"
                className={
                  isEsc
                    ? "text-base font-bold tracking-tight text-esc-text sm:text-lg"
                    : "text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg"
                }
              >
                {editando ? "Editar empréstimo" : "Empréstimo"}
              </h2>
              <p
                className={
                  isEsc
                    ? "mt-1 text-xs font-medium text-esc-muted"
                    : "mt-1 text-xs font-medium text-text-muted"
                }
              >
                {editando
                  ? "Partes travadas. Só valor, data e descrição."
                  : `Sai do caixa de ${escritorioAtualNome}, não do mês.`}{" "}
                Disponível:{" "}
                <span
                  className={
                    isEsc
                      ? "font-semibold text-esc-destaque"
                      : "font-semibold text-emerald-700"
                  }
                >
                  R$ {formatarMoeda(caixaDisponivel)}
                </span>
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
            {editando ? (
              <div
                className={
                  isEsc
                    ? "rounded-xl border border-esc-border bg-esc-bg/60 px-3 py-2.5"
                    : "rounded-xl border border-border-primary/40 bg-[#FAFAFA] px-3 py-2.5"
                }
              >
                <p className={labelClass}>Partes</p>
                <p
                  className={
                    isEsc
                      ? "mt-1 text-sm font-semibold text-esc-text"
                      : "mt-1 text-sm font-semibold text-text-primary"
                  }
                >
                  {emprestimo.origemLabel} → {emprestimo.destinoLabel}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-[5px]">
                  <label className={labelClass}>Operação</label>
                  <div
                    className={
                      isEsc
                        ? "flex gap-1 rounded-xl border border-esc-border bg-esc-bg/80 p-1"
                        : "flex gap-1 rounded-xl border border-border-primary/40 bg-slate-100/80 p-1"
                    }
                  >
                    <button
                      type="button"
                      className={segmentBtnClass(formData.sentido === "emprestar")}
                      onClick={() =>
                        setFormData({ ...formData, sentido: "emprestar" })
                      }
                    >
                      Emprestar
                    </button>
                    <button
                      type="button"
                      className={segmentBtnClass(formData.sentido === "receber")}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          sentido: "receber",
                          contraTipo: "escritorio",
                          contraId:
                            formData.contraTipo === "obra"
                              ? ""
                              : formData.contraId,
                        })
                      }
                    >
                      Pega emprestado
                    </button>
                  </div>
                </div>

                {formData.sentido === "emprestar" ? (
                  <div className="flex flex-col gap-[5px]">
                    <label className={labelClass}>Contraparte</label>
                    <div
                      className={
                        isEsc
                          ? "flex gap-1 rounded-xl border border-esc-border bg-esc-bg/80 p-1"
                          : "flex gap-1 rounded-xl border border-border-primary/40 bg-slate-100/80 p-1"
                      }
                    >
                      <button
                        type="button"
                        className={segmentBtnClass(
                          formData.contraTipo === "escritorio",
                        )}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            contraTipo: "escritorio",
                            contraId: "",
                          })
                        }
                      >
                        Escritório
                      </button>
                      <button
                        type="button"
                        className={segmentBtnClass(formData.contraTipo === "obra")}
                        onClick={() =>
                          setFormData({
                            ...formData,
                            contraTipo: "obra",
                            contraId: "",
                          })
                        }
                      >
                        Obra
                      </button>
                    </div>
                  </div>
                ) : null}

                {formData.sentido === "emprestar" &&
                formData.contraTipo === "obra" ? (
                  <div className="flex flex-col gap-[5px]">
                    <label className={labelClass}>Obra</label>
                    <BaseSelect
                      searchable
                      variant={selectVariant}
                      value={formData.contraId}
                      onChange={(e) =>
                        setFormData({ ...formData, contraId: e.target.value })
                      }
                      options={[
                        { value: "", label: "Selecione a obra…" },
                        ...opcoesObra,
                      ]}
                      placeholder="Selecione a obra…"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-[5px]">
                    <label className={labelClass}>Escritório</label>
                    <BaseSelect
                      searchable
                      variant={selectVariant}
                      value={formData.contraId}
                      onChange={(e) =>
                        setFormData({ ...formData, contraId: e.target.value })
                      }
                      options={[
                        { value: "", label: "Selecione o escritório…" },
                        ...opcoesEscritorio,
                      ]}
                      placeholder="Selecione o escritório…"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-[5px]">
              <label className={labelClass}>Descrição</label>
              <input
                type="text"
                className={fieldClass}
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Motivo (opcional)"
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
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: e.target.value })
                  }
                  placeholder="0,00"
                />
              </div>
              <div className="flex w-full flex-col gap-[5px]">
                <label className={labelClass}>Data</label>
                <BaseDatePicker
                  variant={selectVariant}
                  placeholder="Data do empréstimo"
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
                  {salvando ? "Salvando…" : editando ? "Salvar" : "Confirmar"}
                </button>
              </>
            ) : (
              <>
                <BaseButton
                  type="button"
                  variant="outline"
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
                  {salvando ? "Salvando…" : editando ? "Salvar" : "Confirmar"}
                </BaseButton>
              </>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
