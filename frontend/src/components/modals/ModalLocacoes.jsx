import { useEffect, useState } from "react";
import ButtonDefault from "../gerais/ButtonDefault";
import ModalPortal from "../gerais/ModalPortal";

const TIPOS_PERIODO = ["Diário", "Semanal", "Mensal", "Anual"];
const SOLICITANTES_FIXOS = ["Montezuma", "Marcelo"];

function estadoInicialForm() {
  return {
    equipamento: "",
    quantidade: "",
    tipoPeriodo: "",
    periodo: "",
    solicitante: "",
  };
}

export default function ModalLocacoes({
  isOpen,
  onClose,
  onSave,
  nomeObra,
  nomeCliente,
}) {
  const [form, setForm] = useState(estadoInicialForm);
  const [salvando, setSalvando] = useState(false);

  const nomeDoCliente =
    (typeof nomeCliente === "string" ? nomeCliente : nomeCliente?.nome) ||
    "Cliente";

  const opcoesSolicitante = [
    ...SOLICITANTES_FIXOS,
    ...(nomeDoCliente && !SOLICITANTES_FIXOS.includes(nomeDoCliente)
      ? [nomeDoCliente]
      : []),
  ];

  useEffect(() => {
    if (isOpen) setForm(estadoInicialForm());
  }, [isOpen]);

  if (!isOpen) return null;

  const atualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleConfirmar = async () => {
    const { equipamento, quantidade, tipoPeriodo, periodo, solicitante } = form;

    const qtdNum = Number(quantidade);
    const periodoNum = Number(periodo);

    if (
      !String(equipamento).trim() ||
      !tipoPeriodo ||
      !String(solicitante).trim()
    ) {
      alert("Preencha o equipamento, o tipo de período e o solicitante.");
      return;
    }

    if (!Number.isFinite(qtdNum) || qtdNum <= 0) {
      alert("Informe uma quantidade válida maior que zero.");
      return;
    }

    if (!Number.isFinite(periodoNum) || periodoNum <= 0) {
      alert("Informe um período válido maior que zero.");
      return;
    }

    setSalvando(true);
    try {
      await onSave({
        equipamento: String(equipamento).trim(),
        quantidade: qtdNum,
        tipo_periodo: tipoPeriodo,
        periodo: Math.trunc(periodoNum),
        solicitante: String(solicitante).trim(),
      });
      setForm(estadoInicialForm());
    } catch {
      /* erro tratado no pai */
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 backdrop-blur-[2px] sm:p-4">
        <div className="flex max-h-[95vh] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-border-primary/40 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-primary/35 bg-white px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-bold uppercase tracking-wide text-text-primary sm:text-lg">
                Solicitação Locações
              </h2>
              <p className="truncate text-xs text-text-muted sm:text-sm">
                Obra: {nomeObra}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border-primary/40 bg-[#FAFAFA] transition-all hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 disabled:opacity-50"
            >
              <img
                width="20"
                height="20"
                src="https://img.icons8.com/ios/50/multiply.png"
                alt="fechar"
              />
            </button>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Equipamento
              </label>
              <input
                type="text"
                placeholder="Ex: Betoneira, andaime, compactador..."
                value={form.equipamento}
                onChange={(e) => atualizar("equipamento", e.target.value)}
                className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
              />
            </div>

            <div className="flex w-full gap-3">
              <div className="flex flex-[2] flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Quant.
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={form.quantidade}
                  onChange={(e) => atualizar("quantidade", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                />
              </div>
            </div>

            <div className="flex flex-row gap-3">
              <div className="flex flex-1 flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Tipo de período
                </label>
                <select
                  value={form.tipoPeriodo}
                  onChange={(e) => atualizar("tipoPeriodo", e.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                >
                  <option value="">Selecione...</option>
                  {TIPOS_PERIODO.map((tp) => (
                    <option key={tp} value={tp}>
                      {tp}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-[5px]">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Período
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={form.periodo}
                  onChange={(e) => atualizar("periodo", e.target.value)}
                  className="h-11 w-full rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
                />
              </div>
            </div>

            <div className="flex flex-col gap-[5px]">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                Solicitante
              </label>
              <select
                value={form.solicitante}
                onChange={(e) => atualizar("solicitante", e.target.value)}
                className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-border-primary/55 bg-[#FAFAFA] px-3 text-sm text-text-primary shadow-sm transition-all focus:border-accent-primary/45 focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
              >
                <option value="">Selecione...</option>
                {opcoesSolicitante.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <ButtonDefault
              onClick={handleConfirmar}
              disabled={salvando}
              className="!mt-2 !h-11 !w-full !cursor-pointer !rounded-xl !border !border-accent-primary !bg-accent-primary !text-sm !font-bold !text-white !shadow-[0_4px_14px_rgba(220,59,11,0.35)] transition-all hover:!bg-accent-primary-dark hover:!shadow-lg disabled:!cursor-not-allowed disabled:!opacity-60"
            >
              {salvando ? "A guardar…" : "Confirmar Solicitação"}
            </ButtonDefault>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
