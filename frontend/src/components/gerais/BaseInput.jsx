import { escInputClass } from "../../constants/escritorioUi";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const defaultInputClass =
  "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm tracking-tight text-text-primary ring-1 ring-slate-900/5 outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-blue-600 focus:ring-accent-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60";

export default function BaseInput({ className = "", variant = "default", ...props }) {
  const baseClass = variant === "escritorio" ? escInputClass : defaultInputClass;

  return (
    <input
      {...props}
      className={joinClasses(baseClass, className)}
    />
  );
}
