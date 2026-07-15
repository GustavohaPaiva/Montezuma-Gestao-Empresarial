import { useEffect, useMemo, useRef, useState } from "react";

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

function parseTime(value) {
  const raw = String(value || "09:00");
  const [h = "09", m = "00"] = raw.split(":");
  const hora = HORAS.includes(h) ? h : "09";
  let minuto = MINUTOS.includes(m) ? m : "00";
  if (!MINUTOS.includes(m)) {
    const n = Number.parseInt(m, 10);
    if (Number.isFinite(n)) {
      minuto = String(Math.min(55, Math.round(n / 5) * 5)).padStart(2, "0");
    }
  }
  return { hora, minuto };
}

function TimeList({ items, selected, onSelect, onClose }) {
  const listRef = useRef(null);

  useEffect(() => {
    const active = listRef.current?.querySelector("[data-selected='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={listRef}
      className="absolute left-0 right-0 top-full z-20 mt-1 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5"
      role="listbox"
    >
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <button
            key={item}
            type="button"
            role="option"
            aria-selected={isSelected}
            data-selected={isSelected ? "true" : "false"}
            onClick={() => onSelect(item)}
            className={[
              "flex w-full items-center justify-center px-3 py-2 font-mono text-sm tracking-wide transition",
              isSelected
                ? "bg-accent-primary text-white"
                : "text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary",
            ].join(" ")}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Horário compacto: clica na hora → lista de horas; clica no minuto → lista de minutos.
 */
export default function DigitalTimePicker({
  id,
  label,
  value,
  onChange,
  labelClassName = "",
}) {
  const { hora, minuto } = useMemo(() => parseTime(value), [value]);
  const [aberto, setAberto] = useState(null); // "hora" | "minuto" | null
  const rootRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setAberto(null);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [aberto]);

  const escolherHora = (next) => {
    onChange?.(`${next}:${minuto}`);
    setAberto("minuto");
  };

  const escolherMinuto = (next) => {
    onChange?.(`${hora}:${next}`);
    setAberto(null);
  };

  const pillClass = (ativo) =>
    [
      "min-w-[2.75rem] rounded-xl px-2.5 py-2 text-center font-mono text-base font-semibold tracking-wider transition",
      ativo
        ? "bg-accent-primary text-white shadow-sm"
        : "bg-slate-100 text-text-primary hover:bg-accent-primary/10 hover:text-accent-primary",
    ].join(" ");

  return (
    <div ref={rootRef} className="relative">
      {label ? (
        <label className={labelClassName} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div
        id={id}
        className="flex items-center justify-between gap-1.5 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 ring-1 ring-slate-900/5"
      >
        <button
          type="button"
          className={pillClass(aberto === "hora")}
          onClick={() => setAberto((v) => (v === "hora" ? null : "hora"))}
          aria-expanded={aberto === "hora"}
          aria-label="Selecionar hora"
        >
          {hora}
        </button>
        <span className="font-mono text-lg font-bold text-slate-300" aria-hidden>
          :
        </span>
        <button
          type="button"
          className={pillClass(aberto === "minuto")}
          onClick={() => setAberto((v) => (v === "minuto" ? null : "minuto"))}
          aria-expanded={aberto === "minuto"}
          aria-label="Selecionar minuto"
        >
          {minuto}
        </button>
      </div>

      {aberto === "hora" ? (
        <TimeList
          items={HORAS}
          selected={hora}
          onSelect={escolherHora}
          onClose={() => setAberto(null)}
        />
      ) : null}

      {aberto === "minuto" ? (
        <TimeList
          items={MINUTOS}
          selected={minuto}
          onSelect={escolherMinuto}
          onClose={() => setAberto(null)}
        />
      ) : null}
    </div>
  );
}
