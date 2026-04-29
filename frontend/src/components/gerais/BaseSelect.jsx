import { ChevronDown } from "lucide-react";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function BaseSelect({
  options = [],
  placeholder,
  className = "",
  ...props
}) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={joinClasses(
          "h-10 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 pr-9 text-sm tracking-tight text-text-primary ring-1 ring-slate-900/5 outline-none transition-all duration-200 focus:border-accent-blue-600 focus:ring-accent-blue-600/20",
          className
        )}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
    </div>
  );
}
