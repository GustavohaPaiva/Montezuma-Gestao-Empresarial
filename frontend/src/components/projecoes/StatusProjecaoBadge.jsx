import { statusProjecaoBadgeClass } from "../../utils/projecaoUtils";

export default function StatusProjecaoBadge({ status }) {
  const label = status || "Rascunho";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ring-1 ${statusProjecaoBadgeClass(label)}`}
    >
      {label}
    </span>
  );
}
