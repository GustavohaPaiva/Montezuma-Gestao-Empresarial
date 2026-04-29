import { Loader2 } from "lucide-react";

const VARIANT_STYLES = {
  primary: "bg-accent-primary text-white hover:opacity-90 shadow-sm",
  outline: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
  ghost: "bg-transparent text-slate-500 hover:bg-slate-100",
  danger: "bg-white border border-red-200 text-red-600 hover:bg-red-50",
};

const SIZE_STYLES = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function BaseButton({
  variant = "primary",
  size = "md",
  icon,
  isLoading = false,
  fullWidth = false,
  className = "",
  disabled = false,
  children,
  ...props
}) {
  const computedDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      {...props}
      disabled={computedDisabled}
      className={joinClasses(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-tight ring-1 ring-slate-900/5 transition-all duration-200",
        VARIANT_STYLES[variant] || VARIANT_STYLES.primary,
        SIZE_STYLES[size] || SIZE_STYLES.md,
        fullWidth && "w-full",
        computedDisabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="inline-flex shrink-0">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </button>
  );
}
