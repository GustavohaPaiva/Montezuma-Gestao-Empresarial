import { useEffect, useMemo, useState } from "react";
import ModalPortal from "../gerais/ModalPortal";
import BaseDatePicker from "../gerais/BaseDatePicker";
import BaseSelect from "../gerais/BaseSelect";
import BaseButton from "../gerais/BaseButton";
import { formatarMoeda } from "../../pages/obras/detalhe/utils/formatters";
import { labelObraResumo } from "../../pages/obras/detalhe/utils/obraCaixa";
import { ESCRITORIOS_OPCOES } from "../../pages/usuarios/usuariosUtils";

const fieldClass =
  "h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25";

const segmentBtnClass = (ativo) =>
  [
    "flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all",
    ativo
      ? "bg-white text-text-primary shadow-sm"
      : "text-text-muted hover:text-text-primary",
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
}) {
  const [formData, setFormData] = useState(emptyForm);
  const [erro, setErro] = useState("");

  const opcoesEscritorio = useMemo(
    () =>
      ESCRITORIOS_OPCOES.filter((o) => o.value !== escritorioAtualId),
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

  const exigeCaixa = formData.sentido === "emprestar";

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
    if (exigeCaixa && v > (parseFloat(caixaDisponivel) || 0) + 1e-9) {
      setErro(
        `Saldo insuficiente no caixa. Disponível: R$ ${formatarMoeda(caixaDisponivel)}`,
      );
      return;
    }
    if (!formData.data) {
      setErro("Informe a data.");
      return;
    }
    if (!formData.contraId) {
      setErro(
        formData.contraTipo === "obra"
          ? "Selecione a obra."
          : "Selecione o escritório.",
      );
      return;
    }

    const atualEhOrigem = formData.sentido === "emprestar";
    const payload = {
      valor: v,
      descricao: formData.descricao?.trim() || "",
      data: formData.data,
    };

    if (formData.contraTipo === "obra") {
      const obraId = Number(formData.contraId);
      if (atualEhOrigem) {
        payload.origem_tipo = "escritorio";
        payload.origem_escritorio_id = escritorioAtualId;
        payload.destino_tipo = "obra";
        payload.destino_obra_id = obraId;
      } else {
        payload.origem_tipo = "obra";
        payload.origem_obra_id = obraId;
        payload.destino_tipo = "escritorio";
        payload.destino_escritorio_id = escritorioAtualId;
      }
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
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-emprestimo-titulo"
      >
        <div className="flex max-h-[95vh] w-[520px] max-w-[95%] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2
                id="modal-emprestimo-titulo"
                className="text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg"
              >
                Empréstimo
              </h2>
              <p className="mt-1 text-xs font-medium text-text-muted">
                Sai do caixa de {escritorioAtualNome}, não do mês. Disponível:{" "}
                <span className="font-semibold text-emerald-700">
                  R$ {formatarMoeda(caixaDisponivel)}
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
                Operação
              </label>
              <div className="flex gap-1 rounded-xl border border-border-primary/40 bg-slate-100/80 p-1">
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
                    setFormData({ ...formData, sentido: "receber" })
                  }
                >
                  Pega emprestado
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Contraparte
              </label>
              <div className="flex gap-1 rounded-xl border border-border-primary/40 bg-slate-100/80 p-1">
                <button
                  type="button"
                  className={segmentBtnClass(formData.contraTipo === "escritorio")}
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
                    setFormData({ ...formData, contraTipo: "obra", contraId: "" })
                  }
                >
                  Obra
                </button>
              </div>
            </div>

            {formData.contraTipo === "obra" ? (
              <div className="flex flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Obra
                </label>
                <BaseSelect
                  searchable
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
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Escritório
                </label>
                <BaseSelect
                  searchable
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
                placeholder="Motivo (opcional)"
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
