import { useMemo, useState } from "react";
import { CalendarClock, ChevronDown, ChevronUp, Clock3, Plus, Users } from "lucide-react";
import { api } from "../../../services/api";
import { homeDictionary } from "../../../constants/dictionaries";
import {
  homeSalaReunioesClass,
  homeSalaReunioesPanelClass,
  homeSectionLabelAccentClass,
  homeSectionTitleClass,
  homeSectionAccentLineClass,
} from "../homeUi";
import ModalReservaSala from "./ModalReservaSala";

const PROXIMAS_PREVIEW = 2;

function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDataCurta(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function ReservaItem({ reserva, onClick, showDate = false }) {
  const titulo =
    reserva.cliente_nome?.trim() || reserva.titulo || "Reunião";
  const horario = `${formatHora(reserva.inicio)} – ${formatHora(reserva.fim)}`;
  const responsavel = reserva.responsavel?.nome?.trim();

  return (
    <button
      type="button"
      onClick={() => onClick(reserva)}
      className="group flex w-full items-start gap-3 rounded-xl border border-border-primary/25 bg-white/90 px-3 py-2.5 text-left shadow-sm ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:border-accent-primary/30 hover:shadow-md"
    >
      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary">
        <Clock3 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold tracking-tight text-text-primary">
          {titulo}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
          {showDate ? <span>{formatDataCurta(reserva.inicio)}</span> : null}
          <span className="font-medium text-accent-primary/90">{horario}</span>
          {reserva.cliente_nome && reserva.titulo ? (
            <span className="truncate">{reserva.titulo}</span>
          ) : null}
          {responsavel ? (
            <span className="truncate">Resp.: {responsavel}</span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function ProximasLista({
  proximas,
  proximasVisiveis,
  mostrarTodas,
  onToggle,
  onEdit,
  copy,
}) {
  if (proximas.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
        {copy.proximasLabel}
      </p>
      <ul className="flex flex-col gap-2">
        {proximasVisiveis.map((r) => (
          <li key={r.id}>
            <ReservaItem reserva={r} onClick={onEdit} showDate />
          </li>
        ))}
      </ul>
      {proximas.length > PROXIMAS_PREVIEW ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent-primary transition hover:text-accent-primary-dark"
        >
          {mostrarTodas ? (
            <>
              {copy.verMenos}
              <ChevronUp className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              {copy.verMais}
              <ChevronDown className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

export default function HomeSalaReunioes({ reservas = [], loading, onChanged }) {
  const copy = homeDictionary.salaReunioes;
  const [modalOpen, setModalOpen] = useState(false);
  const [reservaEdicao, setReservaEdicao] = useState(null);
  const [mostrarTodasProximas, setMostrarTodasProximas] = useState(false);

  const { hoje, proximas } = useMemo(() => {
    const nowDay = startOfLocalDay();
    const dayEnd = endOfLocalDay();
    const deHoje = [];
    const depois = [];

    for (const r of reservas) {
      const inicio = new Date(r.inicio);
      if (inicio >= nowDay && inicio <= dayEnd) {
        deHoje.push(r);
      } else if (inicio > dayEnd) {
        depois.push(r);
      } else if (new Date(r.fim) > nowDay) {
        deHoje.push(r);
      }
    }

    return { hoje: deHoje, proximas: depois };
  }, [reservas]);

  const proximasVisiveis = mostrarTodasProximas
    ? proximas
    : proximas.slice(0, PROXIMAS_PREVIEW);

  const openCreate = () => {
    setReservaEdicao(null);
    setModalOpen(true);
  };

  const openEdit = (reserva) => {
    setReservaEdicao(reserva);
    setModalOpen(true);
  };

  const handleSave = async (payload) => {
    if (payload.id) {
      await api.updateReservaSala(payload.id, payload);
    } else {
      await api.createReservaSala(payload);
    }
    await onChanged?.();
  };

  const handleDelete = async (id) => {
    await api.deleteReservaSala(id);
    await onChanged?.();
  };

  return (
    <section className={homeSalaReunioesClass} aria-label={copy.sectionTitle}>
      <div className={homeSalaReunioesPanelClass}>
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_100%_0%,rgba(220,59,11,0.08),transparent_55%)]"
          aria-hidden
        />
        <CalendarClock
          className="pointer-events-none absolute -bottom-3 -left-1 h-20 w-20 text-accent-primary/[0.07] md:h-24 md:w-24"
          strokeWidth={1}
          aria-hidden
        />

        <div className="relative z-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className={homeSectionLabelAccentClass}>
                {copy.sectionLabel}
              </span>
              <h2 className={`${homeSectionTitleClass} mt-2 text-lg md:text-xl`}>
                {copy.sectionTitle}
              </h2>
              <div className={homeSectionAccentLineClass} aria-hidden />
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-accent-primary bg-accent-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-accent-primary/20 transition hover:bg-accent-primary-dark"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {copy.reservarCta}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-text-muted">{copy.loading}</p>
          ) : hoje.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-accent-primary/80">
                <Users className="h-3.5 w-3.5" aria-hidden />
                {copy.hojeLabel}
              </div>
              <ul className="flex flex-col gap-2">
                {hoje.map((r) => (
                  <li key={r.id}>
                    <ReservaItem reserva={r} onClick={openEdit} />
                  </li>
                ))}
              </ul>
              <ProximasLista
                proximas={proximas}
                proximasVisiveis={proximasVisiveis}
                mostrarTodas={mostrarTodasProximas}
                onToggle={() => setMostrarTodasProximas((v) => !v)}
                onEdit={openEdit}
                copy={copy}
              />
            </div>
          ) : (
            <div>
              <p className="text-sm text-text-muted">{copy.nenhumaHoje}</p>
              {proximas.length > 0 ? (
                <ProximasLista
                  proximas={proximas}
                  proximasVisiveis={proximasVisiveis}
                  mostrarTodas={mostrarTodasProximas}
                  onToggle={() => setMostrarTodasProximas((v) => !v)}
                  onEdit={openEdit}
                  copy={copy}
                />
              ) : (
                <p className="mt-2 text-xs text-text-muted">{copy.nenhumaProxima}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <ModalReservaSala
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setReservaEdicao(null);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        reservaEdicao={reservaEdicao}
      />
    </section>
  );
}
