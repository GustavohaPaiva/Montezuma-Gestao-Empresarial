const THEME_STYLES = {
  primary: {
    topBar: "bg-accent-primary",
    softBg: "bg-accent-primary/10",
    strongText: "text-accent-primary",
    leftIdle: "border-l-accent-primary",
    leftHover: "group-hover:border-l-accent-primary",
    pill: "bg-accent-primary/10 text-accent-primary",
    actionHover: "hover:bg-accent-primary/5",
    selectedRing: "ring-2 ring-accent-primary/45 shadow-md",
  },
  blue: {
    topBar: "bg-accent-blue-600",
    softBg: "bg-accent-blue-50",
    strongText: "text-accent-blue-600",
    leftIdle: "border-l-accent-blue-600",
    leftHover: "group-hover:border-l-accent-blue-600",
    pill: "bg-accent-blue-50 text-accent-blue-600",
    actionHover: "hover:bg-accent-blue-50",
    selectedRing: "ring-2 ring-accent-blue-600/45 shadow-md",
  },
  emerald: {
    topBar: "bg-accent-emerald-600",
    softBg: "bg-accent-emerald-50",
    strongText: "text-accent-emerald-600",
    leftIdle: "border-l-accent-emerald-600",
    leftHover: "group-hover:border-l-accent-emerald-600",
    pill: "bg-accent-emerald-50 text-accent-emerald-600",
    actionHover: "hover:bg-accent-emerald-50",
    selectedRing: "ring-2 ring-accent-emerald-600/45 shadow-md",
  },
  purple: {
    topBar: "bg-accent-purple-600",
    softBg: "bg-accent-purple-50",
    strongText: "text-accent-purple-600",
    leftIdle: "border-l-accent-purple-600",
    leftHover: "group-hover:border-l-accent-purple-600",
    pill: "bg-accent-purple-50 text-accent-purple-600",
    actionHover: "hover:bg-accent-purple-50",
    selectedRing: "ring-2 ring-accent-purple-600/45 shadow-md",
  },
  amber: {
    topBar: "bg-accent-amber-600",
    softBg: "bg-accent-amber-50",
    strongText: "text-accent-amber-600",
    leftIdle: "border-l-accent-amber-600",
    leftHover: "group-hover:border-l-accent-amber-600",
    pill: "bg-accent-amber-50 text-accent-amber-600",
    actionHover: "hover:bg-accent-amber-50",
    selectedRing: "ring-2 ring-accent-amber-600/45 shadow-md",
  },
  pink: {
    topBar: "bg-accent-pink-600",
    softBg: "bg-accent-pink-50",
    strongText: "text-accent-pink-600",
    leftIdle: "border-l-accent-pink-600",
    leftHover: "group-hover:border-l-accent-pink-600",
    pill: "bg-accent-pink-50 text-accent-pink-600",
    actionHover: "hover:bg-accent-pink-50",
    selectedRing: "ring-2 ring-accent-pink-600/45 shadow-md",
  },
  indigo: {
    topBar: "bg-accent-indigo-600",
    softBg: "bg-accent-indigo-50",
    strongText: "text-accent-indigo-600",
    leftIdle: "border-l-accent-indigo-600",
    leftHover: "group-hover:border-l-accent-indigo-600",
    pill: "bg-accent-indigo-50 text-accent-indigo-600",
    actionHover: "hover:bg-accent-indigo-50",
    selectedRing: "ring-2 ring-accent-indigo-600/45 shadow-md",
  },
};

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export default function BaseCard({
  variant = "metric",
  title,
  value,
  icon,
  hint,
  status,
  /** React node no lugar do badge de status (ex.: select editável). */
  statusElement,
  metadata = [],
  colorTheme = "primary",
  onClick,
  children,
  /** Conteúdo à esquerda do título (ex.: avatar), só em variant="entity". */
  leading,
  /** Destaque visual do card ativo (ex.: filtro selecionado). */
  selected = false,
}) {
  const palette = THEME_STYLES[colorTheme] || THEME_STYLES.primary;
  const isInteractive = typeof onClick === "function";
  const useDivAsInteractive = isInteractive && Boolean(children);
  const WrapperTag = useDivAsInteractive ? "div" : isInteractive ? "button" : "div";

  const interactiveProps = isInteractive
    ? {
        onClick,
        ...(useDivAsInteractive
          ? {
              role: "button",
              tabIndex: 0,
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick(e);
                }
              },
            }
          : { type: "button" }),
        ...(selected ? { "aria-pressed": true } : {}),
      }
    : {};

  if (variant === "action") {
    return (
      <WrapperTag
        {...interactiveProps}
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

  if (variant === "metricCompact") {
    return (
      <WrapperTag
        {...interactiveProps}
        className={joinClasses(
          "group relative h-full w-full overflow-hidden rounded-2xl bg-white px-4 py-2.5 text-left tracking-tight ring-1 ring-slate-900/5 shadow-sm transition-all duration-200",
          isInteractive && "cursor-pointer hover:shadow-md",
        )}
      >
        <span
          className={joinClasses("absolute inset-x-0 top-0 h-1", palette.topBar)}
        />
        <div className="flex items-center gap-2.5 pt-1">
          {icon ? (
            <span
              className={joinClasses(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                palette.softBg,
                palette.strongText,
              )}
            >
              {icon}
            </span>
          ) : null}
          {title ? (
            <p
              className="min-w-0 flex-1 truncate text-xs font-medium text-text-muted tracking-tight md:text-sm"
              title={typeof title === "string" ? title : undefined}
            >
              {title}
            </p>
          ) : null}
          {value !== undefined && value !== null ? (
            <p className="shrink-0 text-lg font-semibold text-text-primary tracking-tight">
              {value}
            </p>
          ) : null}
        </div>
        {children ? <div className="mt-2">{children}</div> : null}
      </WrapperTag>
    );
  }

  if (variant === "entity") {
    return (
      <WrapperTag
        {...interactiveProps}
        className={joinClasses(
          "group h-full w-full flex flex-col rounded-2xl border-l-4 bg-white p-5 text-left ring-1 ring-slate-900/5 shadow-sm transition-all duration-200",
          palette.leftIdle,
          palette.leftHover,
          isInteractive && "cursor-pointer hover:shadow-md",
        )}
      >
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              {leading ? (
                <div className="shrink-0 pt-0.5">{leading}</div>
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
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
              </div>
            </div>
            {statusElement ? (
              <div
                className="shrink-0"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
              >
                {statusElement}
              </div>
            ) : status ? (
              // Satatus
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
          {metadata?.length ? (
            <div className="mt-4 w-full border-t border-slate-100 pt-4 text-left">
              <div className="flex w-full flex-col items-start gap-2">
                {metadata.map((item, index) => (
                  <div
                    key={`${item?.label || "metadata"}-${index}`}
                    className={[
                      "flex w-full max-w-full items-center justify-start gap-2 text-left text-sm text-slate-600",
                      item?.color,
                      item?.textClass,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {item?.icon ? (
                      <span className="inline-flex shrink-0">{item.icon}</span>
                    ) : null}
                    <span
                      className="min-w-0 flex-1 truncate text-left"
                      title={String(item?.label || "")}
                    >
                      {item?.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {children ? <div className="mt-auto pt-4">{children}</div> : null}
      </WrapperTag>
    );
  }

  return (
    <WrapperTag
      {...interactiveProps}
      className={joinClasses(
        "group relative h-full w-full flex flex-col overflow-hidden rounded-2xl bg-white p-5 text-left tracking-tight ring-1 ring-slate-900/5 shadow-sm transition-all duration-200",
        isInteractive && "cursor-pointer hover:shadow-md",
        selected && palette.selectedRing,
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
            {hint ? (
              <p className="text-xs leading-snug text-text-muted">{hint}</p>
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
