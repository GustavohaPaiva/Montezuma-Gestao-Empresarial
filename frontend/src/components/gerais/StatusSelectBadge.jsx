import BaseSelect from "./BaseSelect";
import { getCorStatusMaterial } from "../../pages/obras/detalhe/utils/formatters";

const join = (...c) => c.filter(Boolean).join(" ");

const TEXTO_CENTRO =
  "text-center [text-align-last:center]";

const BASE_BADGE = join(
  "inline-block w-auto cursor-pointer appearance-none rounded-full border",
  "px-3 py-1 pr-6 text-xs font-semibold leading-snug",
  TEXTO_CENTRO,
  "outline-none transition focus:ring-2 backdrop-blur-sm",
  "bg-no-repeat bg-[length:0.45rem] bg-[right_0.5rem_center]",
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 fill=%27none%27 stroke=%27%23a3a3a3%27 stroke-width=%272%27%3E%3Cpath d=%27m2 4 3 3 3-3%27/%3E%3C/svg%3E')]",
);

const BASE_PROCESSO = join(
  "box-border block w-full cursor-pointer appearance-none rounded-xl border",
  "px-3 py-2 pr-7 text-sm font-semibold leading-snug shadow-none",
  TEXTO_CENTRO,
  "outline-none transition focus:ring-2",
  "bg-no-repeat bg-[length:0.45rem] bg-[right_0.6rem_center]",
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27 fill=%27none%27 stroke=%27%2364748b%27 stroke-width=%272%27%3E%3Cpath d=%27m2 4 3 3 3-3%27/%3E%3C/svg%3E')]",
);

const BASE_MATERIAL = join(
  "inline-block w-full max-w-[13rem] cursor-pointer rounded-full border-0 px-3 py-1.5 text-center text-sm font-semibold sm:h-9 sm:w-fit",
  "outline-none transition focus:outline-none focus:ring-2 focus:ring-accent-primary/30",
);

function classesCliente(status) {
  const s = (status || "").trim().toLowerCase();
  const base = BASE_BADGE;
  if (!s)
    return `${base} border-esc-border bg-esc-bg text-esc-muted focus:ring-esc-destaque/25`;
  if (s.includes("finaliz"))
    return `${base} border-status-concluida-text/45 bg-status-concluida-bg text-status-concluida-text focus:ring-status-concluida-text/30`;
  if (s === "produção" || s === "producao")
    return `${base} border-purple-300 bg-purple-50 text-purple-700 focus:ring-purple-500/30`;
  if (s === "prefeitura")
    return `${base} border-status-andamento-text/45 bg-status-andamento-bg text-status-andamento-text focus:ring-status-andamento-text/30`;
  if (s === "caixa")
    return `${base} border-teal-300 bg-teal-50 text-teal-700 focus:ring-teal-500/30`;
  if (s === "cartorio" || s === "cartório")
    return `${base} border-rose-300 bg-rose-50 text-rose-700 focus:ring-rose-500/30`;
  if (s === "obra")
    return `${base} border-blue-300 bg-blue-50 text-blue-700 focus:ring-blue-500/30`;
  return `${base} border-esc-border bg-esc-bg text-esc-muted focus:ring-esc-destaque/25`;
}

function classesOrcamento(status) {
  const s = (status || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const base = BASE_BADGE;
  if (!s)
    return `${base} border-esc-border bg-esc-bg text-esc-muted focus:ring-esc-destaque/25`;
  if (s.includes("andamento"))
    return `${base} border-orange-300 bg-orange-50 text-orange-700 focus:ring-orange-400/30`;
  if (s.includes("nao fechado"))
    return `${base} border-red-300 bg-red-50 text-red-700 focus:ring-red-400/30`;
  if (s === "fechado")
    return `${base} border-green-300 bg-green-50 text-green-700 focus:ring-green-400/30`;
  return `${base} border-esc-destaque/45 bg-esc-destaque/10 text-esc-destaque focus:ring-esc-destaque/25`;
}

function classesObra(status) {
  const base = BASE_BADGE;
  if (status === "Concluída")
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-emerald-100`;
  if (status === "Em andamento")
    return `${base} border-amber-200 bg-amber-50 text-amber-700 focus:ring-amber-100`;
  if (status === "Aguardando iniciação")
    return `${base} border-purple-200 bg-purple-50 text-purple-700 focus:ring-purple-100`;
  return `${base} border-slate-200 bg-white text-text-primary focus:ring-accent-primary/15`;
}

function classesProcesso(status) {
  const s = status || "Produção";
  const base = BASE_PROCESSO;
  if (s === "Finalizado")
    return `${base} border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-300 focus:ring-emerald-100`;
  if (s === "Obra")
    return `${base} border-amber-200 bg-amber-50 text-amber-700 focus:border-amber-300 focus:ring-amber-100`;
  if (s === "Cartorio")
    return `${base} border-pink-200 bg-pink-50 text-pink-700 focus:border-pink-300 focus:ring-pink-100`;
  if (s === "Caixa")
    return `${base} border-indigo-200 bg-indigo-50 text-indigo-700 focus:border-indigo-300 focus:ring-indigo-100`;
  if (s === "Prefeitura")
    return `${base} border-blue-200 bg-blue-50 text-blue-700 focus:border-blue-300 focus:ring-blue-100`;
  if (s === "Produção")
    return `${base} border-purple-200 bg-purple-50 text-purple-700 focus:border-purple-300 focus:ring-purple-100`;
  return `${base} border-slate-200 bg-white text-text-primary focus:border-accent-primary/40 focus:ring-accent-primary/15`;
}

function classesMaterial(status) {
  return `${BASE_MATERIAL} ${getCorStatusMaterial(status || "Solicitado")}`;
}

const CLASS_BY_VARIANT = {
  cliente: classesCliente,
  orcamento: classesOrcamento,
  obra: classesObra,
  processo: classesProcesso,
  material: classesMaterial,
};

/**
 * Select de status com aparência de badge — usa dropdown customizado do BaseSelect.
 */
export default function StatusSelectBadge({
  value,
  options,
  onChange,
  variant = "cliente",
  selectVariant = "default",
  disabled = false,
  id,
  className = "",
}) {
  const getClasses = CLASS_BY_VARIANT[variant] || CLASS_BY_VARIANT.cliente;
  const atual = value || options[0] || "";

  const pararPropagacao = (e) => {
    e?.stopPropagation?.();
  };

  return (
    <BaseSelect
      id={id}
      variant={selectVariant}
      searchable={false}
      hideChevron
      optionsCentered
      wrapperClassName={
        variant === "material"
          ? "inline-block w-full max-w-[13rem] sm:w-fit"
          : variant === "processo"
            ? "block w-full min-w-[9.5rem]"
            : "inline-block w-auto max-w-full"
      }
      triggerClassName={join(getClasses(atual), className)}
      value={atual}
      disabled={disabled}
      onClick={pararPropagacao}
      onMouseDown={pararPropagacao}
      onChange={(e) => {
        const novo = e?.target?.value;
        if (novo != null && novo !== atual) onChange(novo);
      }}
      aria-label="Alterar status"
      options={options.map((opt) => ({ value: opt, label: opt }))}
    />
  );
}
