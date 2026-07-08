import { useId } from "react";

export default function LoginField({
  label,
  icon: Icon,
  id,
  error,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className="text-[0.9375rem] font-medium text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden
        >
          <Icon className="size-[1.125rem]" />
        </span>
        <input
          id={fieldId}
          {...(hasError ? { "aria-invalid": "true" } : {})}
          className={[
            "h-11 w-full rounded-2xl border bg-white/90 pl-11 pr-4 text-sm text-slate-900 shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-slate-400",
            "focus:border-accent-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-accent-primary/20",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            hasError
              ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
              : "border-slate-200/90 hover:border-accent-primary-50",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>
      {hasError ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
