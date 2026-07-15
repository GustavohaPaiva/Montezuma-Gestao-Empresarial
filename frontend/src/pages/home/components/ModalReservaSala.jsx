import { useCallback, useEffect, useMemo, useState } from "react";
import BaseModal from "../../../components/gerais/BaseModal";
import BaseButton from "../../../components/gerais/BaseButton";
import BaseDatePicker from "../../../components/gerais/BaseDatePicker";
import BaseSelect from "../../../components/gerais/BaseSelect";
import FeedbackModal from "../../../components/gerais/FeedbackModal";
import { api } from "../../../services/api";
import { homeDictionary } from "../../../constants/dictionaries";
import DigitalTimePicker from "./DigitalTimePicker";

const CUSTOM_PREFIX = "custom:";

const fieldClass =
  "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm tracking-tight text-text-primary ring-1 ring-slate-900/5 outline-none transition focus:border-accent-primary focus:ring-accent-primary/20";

const labelClass =
  "mb-1.5 block text-xs font-bold uppercase tracking-[0.14em] text-text-muted";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateInputValue(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toTimeInputValue(date) {
  const minutos = date.getMinutes();
  const snapped = Math.round(minutos / 5) * 5;
  const adjusted = new Date(date);
  if (snapped === 60) {
    adjusted.setHours(adjusted.getHours() + 1, 0, 0, 0);
  } else {
    adjusted.setMinutes(snapped, 0, 0);
  }
  return `${pad2(adjusted.getHours())}:${pad2(adjusted.getMinutes())}`;
}

function emptyForm() {
  const now = new Date();
  const rounded = new Date(now);
  rounded.setSeconds(0, 0);
  const nextSlot = Math.ceil((rounded.getMinutes() + 1) / 5) * 5;
  if (nextSlot >= 60) {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  } else {
    rounded.setMinutes(nextSlot, 0, 0);
  }
  const fim = new Date(rounded);
  fim.setMinutes(fim.getMinutes() + 60);

  return {
    titulo: "",
    clienteValue: "",
    data: toDateInputValue(rounded),
    horaInicio: `${pad2(rounded.getHours())}:${pad2(rounded.getMinutes())}`,
    horaFim: `${pad2(fim.getHours())}:${pad2(fim.getMinutes())}`,
    observacoes: "",
  };
}

function customClienteValue(nome) {
  return `${CUSTOM_PREFIX}${nome}`;
}

function isCustomClienteValue(value) {
  return String(value || "").startsWith(CUSTOM_PREFIX);
}

function nomeFromCustomValue(value) {
  return String(value || "").slice(CUSTOM_PREFIX.length).trim();
}

function resolveClienteValue(reserva, clientes) {
  const nome = String(reserva?.cliente_nome || "").trim();
  if (!nome) return "";
  const match = clientes.find(
    (c) => String(c.nome || "").trim().toLowerCase() === nome.toLowerCase(),
  );
  if (match?.id) return String(match.id);
  return customClienteValue(nome);
}

function formFromReserva(reserva, clientes) {
  const inicio = new Date(reserva.inicio);
  const fim = new Date(reserva.fim);
  return {
    titulo: reserva.titulo || "",
    clienteValue: resolveClienteValue(reserva, clientes),
    data: toDateInputValue(inicio),
    horaInicio: toTimeInputValue(inicio),
    horaFim: toTimeInputValue(fim),
    observacoes: reserva.observacoes || "",
  };
}

function buildIso(data, hora) {
  return new Date(`${data}T${hora}:00`).toISOString();
}

export default function ModalReservaSala({
  isOpen,
  onClose,
  onSave,
  onDelete,
  reservaEdicao = null,
}) {
  const copy = homeDictionary.salaReunioes;
  const modoEdicao = Boolean(reservaEdicao?.id);

  const [form, setForm] = useState(emptyForm);
  const [clientes, setClientes] = useState([]);
  const [opcoesExtras, setOpcoesExtras] = useState([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmCancelarOpen, setConfirmCancelarOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    variant: "error",
  });

  const showFeedback = useCallback((message, variant = "error") => {
    setFeedback({ open: true, message, variant });
  }, []);

  const carregarClientes = useCallback(async () => {
    setCarregandoClientes(true);
    try {
      const lista = await api.listClientesSimples();
      setClientes(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error("[ModalReservaSala] clientes:", err);
      setClientes([]);
    } finally {
      setCarregandoClientes(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void carregarClientes();
  }, [isOpen, carregarClientes]);

  useEffect(() => {
    if (!isOpen) return;
    queueMicrotask(() => {
      setConfirmCancelarOpen(false);
      setFeedback({ open: false, message: "", variant: "error" });
      if (modoEdicao && reservaEdicao) {
        const base = formFromReserva(reservaEdicao, clientes);
        setForm(base);
        if (isCustomClienteValue(base.clienteValue)) {
          setOpcoesExtras([
            {
              value: base.clienteValue,
              label: nomeFromCustomValue(base.clienteValue),
            },
          ]);
        } else {
          setOpcoesExtras([]);
        }
      } else {
        setForm(emptyForm());
        setOpcoesExtras([]);
      }
    });
  }, [isOpen, modoEdicao, reservaEdicao]);

  useEffect(() => {
    if (!isOpen || !modoEdicao || !reservaEdicao) return;
    const resolved = resolveClienteValue(reservaEdicao, clientes);
    setForm((prev) =>
      prev.clienteValue === resolved
        ? prev
        : { ...prev, clienteValue: resolved },
    );
    if (isCustomClienteValue(resolved)) {
      const nome = nomeFromCustomValue(resolved);
      setOpcoesExtras((prev) => {
        if (prev.some((o) => o.value === resolved)) return prev;
        return [...prev, { value: resolved, label: nome }];
      });
    }
  }, [isOpen, modoEdicao, reservaEdicao, clientes]);

  const opcoesClientes = useMemo(() => {
    const fromDb = clientes
      .filter((c) => c?.id)
      .map((c) => ({
        value: String(c.id),
        label: c.nome || "Sem nome",
      }));

    const existentes = new Set(fromDb.map((o) => o.value));
    const extras = opcoesExtras.filter((o) => !existentes.has(o.value));
    return [...fromDb, ...extras];
  }, [clientes, opcoesExtras]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resolveClienteNome = () => {
    const value = form.clienteValue;
    if (!value) return null;
    if (isCustomClienteValue(value)) {
      return nomeFromCustomValue(value) || null;
    }
    const found = clientes.find((c) => String(c.id) === String(value));
    return found?.nome?.trim() || null;
  };

  const handleCreateClienteOption = async (query) => {
    const nome = String(query || "").trim();
    if (!nome) return "";
    const value = customClienteValue(nome);
    setOpcoesExtras((prev) => {
      if (prev.some((o) => o.value === value)) return prev;
      return [...prev, { value, label: nome }];
    });
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || deleting) return;

    const titulo = form.titulo.trim();
    if (!titulo) {
      showFeedback(copy.modal.tituloObrigatorio);
      return;
    }
    if (!form.data || !form.horaInicio || !form.horaFim) {
      showFeedback(copy.modal.horarioObrigatorio);
      return;
    }

    const inicio = buildIso(form.data, form.horaInicio);
    const fim = buildIso(form.data, form.horaFim);

    if (new Date(fim) <= new Date(inicio)) {
      showFeedback(copy.modal.fimAposInicio);
      return;
    }
    if (new Date(fim) - new Date(inicio) < 30 * 60 * 1000) {
      showFeedback(copy.modal.duracaoMinima);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: reservaEdicao?.id,
        titulo,
        cliente_nome: resolveClienteNome(),
        inicio,
        fim,
        observacoes: form.observacoes.trim() || null,
      });
      onClose();
    } catch (err) {
      showFeedback(err?.message || copy.modal.erroSalvar);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!modoEdicao || !onDelete || saving || deleting) return;
    setConfirmCancelarOpen(false);
    setDeleting(true);
    try {
      await onDelete(reservaEdicao.id);
      onClose();
    } catch (err) {
      showFeedback(err?.message || copy.modal.erroCancelar);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={() => {
          if (saving || deleting) return;
          onClose();
        }}
        title={modoEdicao ? copy.modal.editTitle : copy.modal.createTitle}
        size="md"
        contentPaddingClass="p-6 sm:p-8"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelClass} htmlFor="reserva-titulo">
              {copy.modal.tituloLabel}
            </label>
            <input
              id="reserva-titulo"
              type="text"
              className={fieldClass}
              value={form.titulo}
              onChange={(e) => updateField("titulo", e.target.value)}
              placeholder={copy.modal.tituloPlaceholder}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="reserva-cliente">
              {copy.modal.clienteLabel}
            </label>
            <BaseSelect
              id="reserva-cliente"
              searchable
              loading={carregandoClientes}
              placeholder={copy.modal.clientePlaceholder}
              value={form.clienteValue}
              onChange={(e) => updateField("clienteValue", e.target.value)}
              options={opcoesClientes}
              emptyMessage={copy.modal.clienteVazio}
              onCreateOption={handleCreateClienteOption}
              createOptionLabel={(q) =>
                copy.modal.clienteUsar.replace("{nome}", q)
              }
            />
          </div>

          <div>
            <label className={labelClass}>{copy.modal.dataLabel}</label>
            <BaseDatePicker
              value={form.data}
              onChange={(e) => updateField("data", e.target.value)}
              clearable={false}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-16 sm:grid-cols-2">
            <DigitalTimePicker
              id="reserva-inicio"
              label={copy.modal.inicioLabel}
              labelClassName={labelClass}
              value={form.horaInicio}
              onChange={(v) => updateField("horaInicio", v)}
            />
            <DigitalTimePicker
              id="reserva-fim"
              label={copy.modal.fimLabel}
              labelClassName={labelClass}
              value={form.horaFim}
              onChange={(v) => updateField("horaFim", v)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="reserva-obs">
              {copy.modal.obsLabel}
            </label>
            <textarea
              id="reserva-obs"
              rows={2}
              className={`${fieldClass} h-auto resize-none py-2.5`}
              value={form.observacoes}
              onChange={(e) => updateField("observacoes", e.target.value)}
              placeholder={copy.modal.obsPlaceholder}
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {modoEdicao ? (
              <BaseButton
                type="button"
                variant="danger"
                onClick={() => setConfirmCancelarOpen(true)}
                disabled={saving || deleting}
              >
                {deleting ? copy.modal.cancelando : copy.modal.cancelarReserva}
              </BaseButton>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <BaseButton
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving || deleting}
              >
                {copy.modal.fechar}
              </BaseButton>
              <BaseButton
                type="submit"
                disabled={saving || deleting}
                isLoading={saving}
              >
                {saving
                  ? copy.modal.salvando
                  : modoEdicao
                    ? copy.modal.salvar
                    : copy.modal.reservar}
              </BaseButton>
            </div>
          </div>
        </form>
      </BaseModal>

      <BaseModal
        isOpen={confirmCancelarOpen}
        onClose={() => setConfirmCancelarOpen(false)}
        title={copy.modal.confirmTitle}
        size="sm"
      >
        <p className="text-sm leading-relaxed text-text-muted">
          {copy.modal.confirmCancelar}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <BaseButton
            variant="outline"
            onClick={() => setConfirmCancelarOpen(false)}
            disabled={deleting}
          >
            {copy.modal.fechar}
          </BaseButton>
          <BaseButton
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleting}
            isLoading={deleting}
          >
            {deleting ? copy.modal.cancelando : copy.modal.confirmAction}
          </BaseButton>
        </div>
      </BaseModal>

      <FeedbackModal
        isOpen={feedback.open}
        onClose={() =>
          setFeedback((f) => ({ ...f, open: false, message: "" }))
        }
        message={feedback.message}
        variant={feedback.variant}
      />
    </>
  );
}
