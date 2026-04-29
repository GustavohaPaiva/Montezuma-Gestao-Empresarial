const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function BaseInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={joinClasses(
        "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm tracking-tight text-text-primary ring-1 ring-slate-900/5 outline-none transition-all duration-200 placeholder:text-text-muted focus:border-accent-blue-600 focus:ring-accent-blue-600/20",
        className
      )}
    />
  );
}
