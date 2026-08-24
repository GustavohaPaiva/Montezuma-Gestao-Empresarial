import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import BaseModal from "../gerais/BaseModal";
import BaseButton from "../gerais/BaseButton";
import BaseSelect from "../gerais/BaseSelect";

const TIME_INPUT_CLASS =
  "box-border h-11 w-full rounded-xl border border-border-primary/55 bg-white px-3 pr-10 text-sm text-text-primary shadow-sm outline-none transition-all focus:border-accent-primary/45 focus:ring-2 focus:ring-accent-primary/25 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:hidden [&::-moz-calendar-picker-indicator]:hidden appearance-none";

function formatDataBR(iso) {
  if (!iso) return "";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function labelObra(obra) {
  if (!obra) return "Obra";
  const cliente = String(obra.cliente || "").trim();
  const local = String(obra.local || "").trim();
  if (cliente && local) return `${cliente} — ${local}`;
  return cliente || local || `Obra #${obra.id}`;
}

/**
 * Modal para lançar / editar presença do diarista em uma obra (intervalo de horário).
 */
export default function ModalAgendaPrestador({
  isOpen,
  onClose,
  onSave,
  onDelete,
  obras = [],
  dataDia = "",
  lancamento = null,
}) {
  const [obraId, setObraId] = useState("");
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFim, setHoraFim] = useState("12:00");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const horaInicioRef = useRef(null);
  const horaFimRef = useRef(null);

  const editando = Boolean(lancamento?.id);

  useEffect(() => {
    if (!isOpen) return;
    setObraId(
      lancamento?.obra_id != null ? String(lancamento.obra_id) : "",
    );
    setHoraInicio(
      String(lancamento?.hora_inicio || "08:00").slice(0, 5) || "08:00",
    );
    setHoraFim(String(lancamento?.hora_fim || "12:00").slice(0, 5) || "12:00");
    setSaving(false);
    setDeleting(false);
  }, [isOpen, lancamento]);

  const opcoesObras = useMemo(
    () => [
      { value: "", label: "— Selecionar obra —" },
      ...(obras || []).map((o) => ({
        value: String(o.id),
        label: labelObra(o),
      })),
    ],
    [obras],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!obraId) {
      alert("Selecione a obra.");
      return;
    }
    if (!horaInicio || !horaFim) {
      alert("Informe o horário de início e fim.");
      return;
    }
    if (horaFim <= horaInicio) {
      alert("O horário de fim deve ser depois do início.");
      return;
    }
    if (!dataDia) {
      alert("Data inválida.");
      return;
    }

    setSaving(true);
    try {
      await Promise.resolve(
        onSave({
          id: lancamento?.id || null,
          obra_id: Number(obraId),
          data: dataDia,
          hora_inicio: horaInicio.slice(0, 5),
          hora_fim: horaFim.slice(0, 5),
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lancamento?.id || !onDelete) return;
    if (!window.confirm("Remover este lançamento da agenda?")) return;
    setDeleting(true);
    try {
      await Promise.resolve(onDelete(lancamento.id));
    } finally {
      setDeleting(false);
    }
  };

  const busy = saving || deleting;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? "Editar lançamento" : "Lançar na obra"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-text-muted">
          Data:{" "}
          <span className="font-semibold text-text-primary">
            {formatDataBR(dataDia)}
          </span>
        </p>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase text-text-muted">
            Obra *
          </label>
          <BaseSelect
            value={obraId}
            onChange={(e) => setObraId(e.target.value)}
            options={opcoesObras}
            disabled={busy}
            searchable
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-text-muted">
              Início *
            </label>
            <div className="relative">
              <input
                ref={horaInicioRef}
                type="time"
                required
                className={TIME_INPUT_CLASS}
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center py-2 pl-2 text-accent-primary"
                onClick={() => void horaInicioRef.current?.showPicker?.()}
                tabIndex={-1}
                aria-label="Abrir seletor de horário"
              >
                <Clock className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-text-muted">
              Fim *
            </label>
            <div className="relative">
              <input
                ref={horaFimRef}
                type="time"
                required
                className={TIME_INPUT_CLASS}
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                disabled={busy}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center py-2 pl-2 text-accent-primary"
                onClick={() => void horaFimRef.current?.showPicker?.()}
                tabIndex={-1}
                aria-label="Abrir seletor de horário"
              >
                <Clock className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {editando && onDelete ? (
            <BaseButton
              type="button"
              variant="ghost"
              onClick={handleDelete}
              disabled={busy}
              className="justify-center text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="mr-1.5 h-4 w-4" aria-hidden />
              {deleting ? "Removendo…" : "Excluir"}
            </BaseButton>
          ) : (
            <span />
          )}
          <div className="flex gap-2 sm:justify-end">
            <BaseButton
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={busy}
            >
              Cancelar
            </BaseButton>
            <BaseButton type="submit" disabled={busy}>
              {saving ? "Salvando…" : editando ? "Salvar" : "Lançar"}
            </BaseButton>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
