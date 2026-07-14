/**
 * BaseDatePicker — seletor de data customizado no padrão BaseSelect.
 *
 * API compatível com `<input type="date">`:
 * - value: `YYYY-MM-DD` ou `""`
 * - onChange recebe event sintético com `event.target.value` em ISO
 *
 * Props:
 * - variant: "default" | "escritorio" | "escritorioBar"
 * - size: "default" | "compact"
 * - placeholder, disabled, min, max, required, clearable (default true se não required)
 * - wrapperClassName, triggerClassName, className, hideChevron
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ModalPortal from "./ModalPortal";
import {
  escSelectDropdown,
  escSelectTriggerBar,
  escSelectTriggerCompact,
  escSelectTriggerModal,
} from "../../constants/escritorioUi";
import {
  addMonths,
  addYears,
  formatISODateBR,
  formatMonthYear,
  formatYearRange,
  getMonth,
  getMonthCalendarDays,
  getMonthShortLabels,
  getWeekdayLabels,
  getYear,
  getYearOptions,
  isDateDisabled,
  isDateOutsideMonth,
  isSameISODate,
  isToday,
  parseISODate,
  setMonth,
  setYear,
  startOfMonth,
  toISODate,
} from "../../utils/datePickerUtils";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const VIEW_DAYS = "days";
const VIEW_MONTHS = "months";
const VIEW_YEARS = "years";

function resolveEscritorioPortalTheme(triggerEl) {
  if (triggerEl?.closest(".theme-vogelkop")) return "theme-vogelkop";
  if (triggerEl?.closest(".theme-ybyoca")) return "theme-ybyoca";
  return "theme-ybyoca";
}

const TRIGGER_DEFAULT =
  "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 pr-9 text-left text-sm tracking-tight text-text-primary ring-1 ring-slate-900/5 outline-none transition-all duration-200 focus:border-accent-primary focus:ring-accent-primary/20";

const TRIGGER_COMPACT =
  "h-auto w-full rounded-xl border border-border-primary/55 bg-white px-2 py-1.5 pr-7 text-left text-[13px] tracking-tight text-text-primary outline-none transition-all focus:border-accent-primary/45 focus:ring-2 focus:ring-accent-primary/20";

function createSyntheticChangeEvent(value) {
  return {
    target: { value },
    currentTarget: { value },
  };
}

function useDropdownPosition(isOpen, triggerRef) {
  const [style, setStyle] = useState(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const panelWidth = Math.max(rect.width, 280);
    const maxHeight = 360;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8);
    }

    setStyle({
      position: "fixed",
      left,
      width: panelWidth,
      top: openUpward ? undefined : rect.bottom + gap,
      bottom: openUpward ? window.innerHeight - rect.top + gap : undefined,
      zIndex: 10050,
    });
  }, [triggerRef]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleReposition = () => updatePosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isOpen, updatePosition]);

  return isOpen ? style : null;
}

export default function BaseDatePicker({
  value = "",
  onChange,
  placeholder = "Selecione a data",
  className = "",
  disabled = false,
  size = "default",
  wrapperClassName = "",
  triggerClassName,
  hideChevron = false,
  variant = "default",
  id,
  "aria-label": ariaLabel,
  required,
  clearable,
  autoFocus,
  min,
  max,
  onClick: externalOnClick,
  onMouseDown: externalOnMouseDown,
  ...rest
}) {
  const generatedId = useId();
  const pickerId = id || generatedId;
  const dialogId = `${pickerId}-dialog`;
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const selectedDate = useMemo(() => parseISODate(value), [value]);
  const canClear = clearable ?? !required;

  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selectedDate || new Date()),
  );
  const [viewMode, setViewMode] = useState(VIEW_DAYS);
  const [portalThemeClass, setPortalThemeClass] = useState("theme-ybyoca");

  const dropdownStyle = useDropdownPosition(isOpen, triggerRef);
  const isEscritorioVariant =
    variant === "escritorio" || variant === "escritorioBar";
  const isPlaceholder = !selectedDate;
  const displayLabel = selectedDate
    ? formatISODateBR(selectedDate)
    : placeholder;

  const calendarDays = useMemo(
    () => getMonthCalendarDays(viewMonth),
    [viewMonth],
  );
  const weekdayLabels = useMemo(() => getWeekdayLabels(), []);
  const monthLabels = useMemo(() => getMonthShortLabels(), []);
  const yearOptions = useMemo(
    () => getYearOptions(getYear(viewMonth)),
    [viewMonth],
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setViewMode(VIEW_DAYS);
  }, []);

  const open = useCallback(() => {
    if (disabled) return;
    if (isEscritorioVariant) {
      setPortalThemeClass(resolveEscritorioPortalTheme(triggerRef.current));
    }
    setViewMonth(startOfMonth(selectedDate || new Date()));
    setViewMode(VIEW_DAYS);
    setIsOpen(true);
  }, [disabled, isEscritorioVariant, selectedDate]);

  const selectISO = useCallback(
    (iso) => {
      onChange?.(createSyntheticChangeEvent(iso));
      close();
      triggerRef.current?.focus();
    },
    [close, onChange],
  );

  const clearValue = useCallback(() => {
    onChange?.(createSyntheticChangeEvent(""));
    close();
    triggerRef.current?.focus();
  }, [close, onChange]);

  const selectDay = useCallback(
    (day) => {
      if (isDateDisabled(day, min, max)) return;
      selectISO(toISODate(day));
    },
    [max, min, selectISO],
  );

  const selectToday = useCallback(() => {
    const today = new Date();
    if (isDateDisabled(today, min, max)) return;
    selectISO(toISODate(today));
  }, [max, min, selectISO]);

  const selectMonthIndex = useCallback((monthIndex) => {
    setViewMonth((prev) => startOfMonth(setMonth(prev, monthIndex)));
    setViewMode(VIEW_DAYS);
  }, []);

  const selectYearValue = useCallback((year) => {
    setViewMonth((prev) => startOfMonth(setYear(prev, year)));
    setViewMode(VIEW_MONTHS);
  }, []);

  const stepView = useCallback(
    (direction) => {
      if (viewMode === VIEW_YEARS) {
        setViewMonth((prev) => addYears(prev, direction * 12));
        return;
      }
      if (viewMode === VIEW_MONTHS) {
        setViewMonth((prev) => addYears(prev, direction));
        return;
      }
      setViewMonth((prev) => addMonths(prev, direction));
    },
    [viewMode],
  );

  const drillUp = useCallback(() => {
    if (viewMode === VIEW_DAYS) {
      setViewMode(VIEW_MONTHS);
      return;
    }
    if (viewMode === VIEW_MONTHS) {
      setViewMode(VIEW_YEARS);
    }
  }, [viewMode]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [close, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const handleTriggerKeyDown = (event) => {
    if (disabled) return;

    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      if (!isOpen) open();
      return;
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      close();
    }
  };

  const handlePanelKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      if (viewMode !== VIEW_DAYS) {
        setViewMode(viewMode === VIEW_YEARS ? VIEW_MONTHS : VIEW_DAYS);
        return;
      }
      close();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Tab") {
      close();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepView(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepView(1);
    }
  };

  const resolveTriggerBase = () => {
    if (variant === "escritorioBar") return escSelectTriggerBar;
    if (variant === "escritorio") {
      return size === "compact"
        ? escSelectTriggerCompact
        : escSelectTriggerModal;
    }
    return size === "compact" ? TRIGGER_COMPACT : TRIGGER_DEFAULT;
  };

  const triggerClasses = triggerClassName
    ? joinClasses(
        triggerClassName,
        className,
        "relative w-full",
        size === "compact" ? "pl-7" : "pl-9",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        isEscritorioVariant &&
          isOpen &&
          "border-esc-destaque ring-1 ring-esc-destaque/30",
      )
    : joinClasses(
        resolveTriggerBase(),
        className,
        "relative w-full",
        size === "compact" ? "pl-7" : "pl-9",
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        isPlaceholder
          ? isEscritorioVariant
            ? "text-esc-muted/70"
            : "text-text-muted"
          : isEscritorioVariant
            ? "text-esc-text"
            : "text-text-primary",
        isOpen &&
          (isEscritorioVariant
            ? "border-esc-destaque ring-1 ring-esc-destaque/30"
            : size === "default"
              ? "border-accent-primary ring-accent-primary/20"
              : size === "compact"
                ? "border-accent-primary/45 ring-2 ring-accent-primary/20"
                : ""),
      );

  const dropdownPanelClass = isEscritorioVariant
    ? escSelectDropdown
    : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-900/5";

  const mutedClass = isEscritorioVariant ? "text-esc-muted" : "text-text-muted";
  const textClass = isEscritorioVariant ? "text-esc-text" : "text-text-primary";
  const borderClass = isEscritorioVariant
    ? "border-esc-border/60"
    : "border-slate-100";
  const navBtnClass = isEscritorioVariant
    ? "rounded-lg p-1.5 text-esc-muted transition-colors hover:bg-esc-bg hover:text-esc-text"
    : "rounded-lg p-1.5 text-text-muted transition-colors hover:bg-slate-100 hover:text-text-primary";
  const titleBtnClass = isEscritorioVariant
    ? "min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-center text-sm font-medium capitalize text-esc-text transition-colors hover:bg-esc-bg"
    : "min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-center text-sm font-medium capitalize text-text-primary transition-colors hover:bg-slate-100";
  const footerBtnClass = isEscritorioVariant
    ? "flex-1 rounded-xl px-3 py-2 text-sm transition-colors"
    : "flex-1 rounded-xl px-3 py-2 text-sm transition-colors";
  const todayBtnClass = isEscritorioVariant
    ? `${footerBtnClass} text-esc-destaque hover:bg-esc-destaque/15`
    : `${footerBtnClass} text-accent-primary hover:bg-accent-primary/10`;
  const clearBtnClass = isEscritorioVariant
    ? `${footerBtnClass} text-esc-muted hover:bg-esc-bg hover:text-esc-text`
    : `${footerBtnClass} text-text-muted hover:bg-slate-100 hover:text-text-primary`;
  const cellIdleHover = isEscritorioVariant
    ? "hover:bg-esc-bg"
    : "hover:bg-slate-100";
  const cellSelected = isEscritorioVariant
    ? "bg-esc-destaque/25 font-medium text-esc-destaque"
    : "bg-accent-primary/15 font-medium text-accent-primary";

  const headerTitle =
    viewMode === VIEW_YEARS
      ? formatYearRange(yearOptions)
      : viewMode === VIEW_MONTHS
        ? String(getYear(viewMonth))
        : formatMonthYear(viewMonth);

  const headerAriaLabel =
    viewMode === VIEW_DAYS
      ? "Selecionar mês"
      : viewMode === VIEW_MONTHS
        ? "Selecionar ano"
        : "Intervalo de anos";

  const navPrevLabel =
    viewMode === VIEW_YEARS
      ? "Anos anteriores"
      : viewMode === VIEW_MONTHS
        ? "Ano anterior"
        : "Mês anterior";

  const navNextLabel =
    viewMode === VIEW_YEARS
      ? "Próximos anos"
      : viewMode === VIEW_MONTHS
        ? "Próximo ano"
        : "Próximo mês";

  const handleTriggerClick = (event) => {
    externalOnClick?.(event);
    if (event.defaultPrevented) return;
    if (isOpen) close();
    else open();
  };

  const handleTriggerMouseDown = (event) => {
    externalOnMouseDown?.(event);
  };

  const calendarIconSize =
    size === "compact" ? "left-2 h-3.5 w-3.5" : "left-3 h-4 w-4";
  const chevronSize =
    size === "compact" ? "right-2 h-3.5 w-3.5" : "right-3 h-4 w-4";

  const currentMonthIndex = getMonth(viewMonth);
  const currentYear = getYear(viewMonth);
  const selectedMonthIndex = selectedDate ? getMonth(selectedDate) : -1;
  const selectedYear = selectedDate ? getYear(selectedDate) : -1;

  return (
    <div
      className={joinClasses(
        "relative min-w-0",
        wrapperClassName || "w-full",
      )}
    >
      {required ? (
        <input
          type="text"
          tabIndex={-1}
          aria-hidden
          value={value ?? ""}
          required
          onChange={() => {}}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      ) : null}
      <button
        {...rest}
        ref={triggerRef}
        id={pickerId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-label={ariaLabel}
        disabled={disabled}
        autoFocus={autoFocus}
        onClick={handleTriggerClick}
        onMouseDown={handleTriggerMouseDown}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClasses}
      >
        <Calendar
          className={joinClasses(
            "pointer-events-none absolute top-1/2 -translate-y-1/2",
            calendarIconSize,
            mutedClass,
          )}
          aria-hidden
        />
        <span className="block min-w-0 truncate pl-1 pr-1">{displayLabel}</span>
        <ChevronDown
          className={joinClasses(
            hideChevron && "hidden",
            "pointer-events-none absolute top-1/2 -translate-y-1/2 transition-transform duration-200",
            mutedClass,
            chevronSize,
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && dropdownStyle ? (
        <ModalPortal>
          <div
            className={isEscritorioVariant ? portalThemeClass : undefined}
            style={dropdownStyle}
          >
            <div
              ref={panelRef}
              id={dialogId}
              role="dialog"
              aria-label="Calendário"
              tabIndex={-1}
              onKeyDown={handlePanelKeyDown}
              className={dropdownPanelClass}
            >
              <div
                className={joinClasses(
                  "flex items-center justify-between gap-1 border-b px-2 py-2.5",
                  borderClass,
                )}
              >
                <button
                  type="button"
                  onClick={() => stepView(-1)}
                  className={navBtnClass}
                  aria-label={navPrevLabel}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={drillUp}
                  disabled={viewMode === VIEW_YEARS}
                  className={joinClasses(
                    titleBtnClass,
                    viewMode === VIEW_YEARS && "cursor-default hover:bg-transparent",
                  )}
                  aria-label={headerAriaLabel}
                >
                  {headerTitle}
                </button>
                <button
                  type="button"
                  onClick={() => stepView(1)}
                  className={navBtnClass}
                  aria-label={navNextLabel}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="p-2.5">
                {viewMode === VIEW_DAYS ? (
                  <>
                    <div className="mb-1.5 grid grid-cols-7 gap-0.5">
                      {weekdayLabels.map((label) => (
                        <div
                          key={label}
                          className={joinClasses(
                            "py-1 text-center text-[11px] font-medium uppercase tracking-wide",
                            mutedClass,
                          )}
                        >
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarDays.map((day) => {
                        const iso = toISODate(day);
                        const outside = isDateOutsideMonth(day, viewMonth);
                        const disabledDay = isDateDisabled(day, min, max);
                        const selected = isSameISODate(day, value);
                        const today = isToday(day);

                        return (
                          <button
                            key={iso}
                            type="button"
                            disabled={disabledDay}
                            onClick={() => selectDay(day)}
                            className={joinClasses(
                              "relative flex h-8 w-full items-center justify-center rounded-lg text-sm transition-colors",
                              disabledDay && "cursor-not-allowed opacity-35",
                              !disabledDay && !selected && cellIdleHover,
                              outside && !selected ? mutedClass : textClass,
                              selected && cellSelected,
                              today &&
                                !selected &&
                                (isEscritorioVariant
                                  ? "ring-1 ring-esc-destaque/40"
                                  : "ring-1 ring-accent-primary/30"),
                            )}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : null}

                {viewMode === VIEW_MONTHS ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {monthLabels.map((label, monthIndex) => {
                      const isCurrent = monthIndex === currentMonthIndex;
                      const isSelected =
                        selectedYear === currentYear &&
                        monthIndex === selectedMonthIndex;

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => selectMonthIndex(monthIndex)}
                          className={joinClasses(
                            "rounded-xl px-2 py-2.5 text-sm capitalize transition-colors",
                            isSelected
                              ? cellSelected
                              : joinClasses(textClass, cellIdleHover),
                            isCurrent &&
                              !isSelected &&
                              (isEscritorioVariant
                                ? "ring-1 ring-esc-destaque/40"
                                : "ring-1 ring-accent-primary/30"),
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {viewMode === VIEW_YEARS ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {yearOptions.map((year) => {
                      const isCurrent = year === currentYear;
                      const isSelected = year === selectedYear;

                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => selectYearValue(year)}
                          className={joinClasses(
                            "rounded-xl px-2 py-2.5 text-sm transition-colors",
                            isSelected
                              ? cellSelected
                              : joinClasses(textClass, cellIdleHover),
                            isCurrent &&
                              !isSelected &&
                              (isEscritorioVariant
                                ? "ring-1 ring-esc-destaque/40"
                                : "ring-1 ring-accent-primary/30"),
                          )}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {viewMode === VIEW_DAYS ? (
                <div
                  className={joinClasses(
                    "flex items-center gap-1 border-t px-2 pb-2 pt-1",
                    borderClass,
                  )}
                >
                  {canClear && value ? (
                    <button
                      type="button"
                      onClick={clearValue}
                      className={clearBtnClass}
                    >
                      Limpar
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={selectToday}
                    className={todayBtnClass}
                  >
                    Hoje
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </div>
  );
}
