const THEME_STYLES = {
  primary: {
    topBar: "bg-accent-primary",
    softBg: "bg-accent-primary/10",
    strongText: "text-accent-primary",
    leftIdle: "border-l-accent-primary",
    leftHover: "group-hover:border-l-accent-primary",
    pill: "bg-accent-primary/10 text-accent-primary",
    actionHover: "hover:bg-accent-primary/5",
  },
  blue: {
    topBar: "bg-accent-blue-600",
    softBg: "bg-accent-blue-50",
    strongText: "text-accent-blue-600",
    leftIdle: "border-l-accent-blue-600",
    leftHover: "group-hover:border-l-accent-blue-600",
    pill: "bg-accent-blue-50 text-accent-blue-600",
    actionHover: "hover:bg-accent-blue-50",
  },
  emerald: {
    topBar: "bg-accent-emerald-600",
    softBg: "bg-accent-emerald-50",
    strongText: "text-accent-emerald-600",
    leftIdle: "border-l-accent-emerald-600",
    leftHover: "group-hover:border-l-accent-emerald-600",
    pill: "bg-accent-emerald-50 text-accent-emerald-600",
    actionHover: "hover:bg-accent-emerald-50",
  },
  purple: {
    topBar: "bg-accent-purple-600",
    softBg: "bg-accent-purple-50",
    strongText: "text-accent-purple-600",
    leftIdle: "border-l-accent-purple-600",
    leftHover: "group-hover:border-l-accent-purple-600",
    pill: "bg-accent-purple-50 text-accent-purple-600",
    actionHover: "hover:bg-accent-purple-50",
  },
  amber: {
    topBar: "bg-accent-amber-600",
    softBg: "bg-accent-amber-50",
    strongText: "text-accent-amber-600",
    leftIdle: "border-l-accent-amber-600",
    leftHover: "group-hover:border-l-accent-amber-600",
    pill: "bg-accent-amber-50 text-accent-amber-600",
    actionHover: "hover:bg-accent-amber-50",
  },
  pink: {
    topBar: "bg-accent-pink-600",
    softBg: "bg-accent-pink-50",
    strongText: "text-accent-pink-600",
    leftIdle: "border-l-accent-pink-600",
    leftHover: "group-hover:border-l-accent-pink-600",
    pill: "bg-accent-pink-50 text-accent-pink-600",
    actionHover: "hover:bg-accent-pink-50",
  },
  indigo: {
    topBar: "bg-accent-indigo-600",
    softBg: "bg-accent-indigo-50",
    strongText: "text-accent-indigo-600",
    leftIdle: "border-l-accent-indigo-600",
    leftHover: "group-hover:border-l-accent-indigo-600",
    pill: "bg-accent-indigo-50 text-accent-indigo-600",
    actionHover: "hover:bg-accent-indigo-50",
  },
};

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function BaseCard({
  variant = "metric",
  title,
  value,
  icon,
  status,
  metadata = [],
  colorTheme = "primary",
  onClick,
  children,
}) {
  const palette = THEME_STYLES[colorTheme] || THEME_STYLES.primary;
  const isInteractive = typeof onClick === "function";
  const WrapperTag = isInteractive ? "button" : "div";

  if (variant === "action") {
    return (
      <WrapperTag
        type={isInteractive ? "button" : undefined}
        onClick={onClick}
        className={joinClasses(
          "group h-full min-h-36 w-full flex flex-col items-center rounded-2xl bg-white p-6 text-center tracking-tight ring-1 ring-slate-900/5 shadow-sm transition-all duration-200",
          palette.actionHover,
          isInteractive &&
            "cursor-pointer hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]",
        )}
      >
        <div className="flex flex-1 w-full flex-col items-center justify-center gap-3">
          {icon ? (
            <span
              className={joinClasses(
                "inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                palette.softBg,
                palette.strongText,
              )}
            >
              {icon}
            </span>
          ) : null}
          {title ? (
            <p className="text-sm font-semibold text-text-primary tracking-tight">
              {title}
            </p>
          ) : null}
        </div>
        {children ? (
          <div className="mt-auto pt-4 w-full">{children}</div>
        ) : null}
      </WrapperTag>
    );
  }

  if (variant === "entity") {
    return (
      <WrapperTag
        type={isInteractive ? "button" : undefined}
        onClick={onClick}
        className={joinClasses(
          "group h-full w-full flex flex-col rounded-2xl border-l-4 bg-white p-5 text-left ring-1 ring-slate-900/5 shadow-sm transition-all duration-200",
          palette.leftIdle,
          palette.leftHover,
          isInteractive && "cursor-pointer hover:shadow-md",
        )}
      >
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              {title ? (
                <h3 className="truncate text-base font-semibold text-text-primary tracking-tight">
                  {title}
                </h3>
              ) : null}
              {value !== undefined && value !== null ? (
                <p className="truncate text-sm text-text-muted tracking-tight">
                  {value}
                </p>
              ) : null}
              {metadata?.length ? (
                <div className="mt-3 flex flex-col gap-1.5">
                  {metadata.map((item, index) => (
                    <div
                      key={`${item?.label || "metadata"}-${index}`}
                      className={[
                        "flex items-center gap-2 text-sm text-slate-600",
                        item?.color,
                        item?.textClass,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {item?.icon ? (
                        <span className="inline-flex shrink-0">
                          {item.icon}
                        </span>
                      ) : null}
                      <span>{item?.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            {status ? (
              <span
                className={joinClasses(
                  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight",
                  palette.pill,
                )}
              >
                {status}
              </span>
            ) : null}
          </div>
        </div>
        {children ? <div className="mt-auto pt-4">{children}</div> : null}
      </WrapperTag>
    );
  }

  return (
    <WrapperTag
      type={isInteractive ? "button" : undefined}
      onClick={onClick}
      className={joinClasses(
        "group relative h-full w-full flex flex-col overflow-hidden rounded-2xl bg-white p-5 text-left tracking-tight ring-1 ring-slate-900/5 shadow-sm transition-all duration-200",
        isInteractive && "cursor-pointer hover:shadow-md",
      )}
    >
      <span
        className={joinClasses("absolute inset-x-0 top-0 h-1", palette.topBar)}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="space-y-1">
            {title ? (
              <p className="text-sm font-medium text-text-muted tracking-tight">
                {title}
              </p>
            ) : null}
            {value !== undefined && value !== null ? (
              <p className="text-2xl font-semibold text-text-primary tracking-tight">
                {value}
              </p>
            ) : null}
          </div>
          {icon ? (
            <span
              className={joinClasses(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                palette.softBg,
                palette.strongText,
              )}
            >
              {icon}
            </span>
          ) : null}
        </div>
      </div>
      {children ? <div className="mt-auto pt-4">{children}</div> : null}
    </WrapperTag>
  );
}
