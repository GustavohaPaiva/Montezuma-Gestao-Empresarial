import { OS_STATUS, OS_STATUS_LABEL } from "../../constants/ordemServico";

export default function StatusOrdemServicoBadge({
  status,
  incompleta = false,
  variant = "default",
}) {
  const concluida = status === OS_STATUS.concluida;
  const label = OS_STATUS_LABEL[status] || status || "—";
  const isEscritorio = variant === "escritorio";

  if (incompleta && !concluida) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
          isEscritorio
            ? "border border-indigo-400/30 bg-indigo-400/15 text-indigo-300"
            : "border border-indigo-200 bg-indigo-50 text-indigo-700"
        }`}
      >
        Em preenchimento
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
        isEscritorio
          ? concluida
            ? "border border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
            : "border border-amber-400/30 bg-amber-400/15 text-amber-300"
          : concluida
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border border-amber-200 bg-amber-50 text-amber-800"
      }`}
    >
      {label}
    </span>
  );
}
