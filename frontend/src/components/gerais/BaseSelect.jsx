/**
 * BaseSelect — combobox customizado com busca opcional e dropdown no padrão do site.
 *
 * API compatível com `<select>`: `onChange` recebe event com `event.target.value`.
 *
 * Props extras:
 * - searchable: true | false | omitido (auto: busca quando options.length > 8)
 * - searchPlaceholder, emptyMessage, size ("default" | "compact"), loading
 * - wrapperClassName, triggerClassName, hideChevron, optionsCentered (badges/status)
 * - variant: "default" | "escritorio" | "escritorioBar" (tema dos escritórios)
 * - onCreateOption: async (query) => value — cadastro rápido quando a busca não encontra resultado
 * - createOptionLabel: (query) => string — rótulo da linha de criação (default: Cadastrar "query")
 *
 * StatusSelectBadge reutiliza este componente para dropdown customizado com trigger colorido.
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import ModalPortal from "./ModalPortal";
import {
  filterSelectOptions,
  normalizeSelectSearch,
} from "../../utils/selectUtils";
import {
  escSelectDropdown,
  escSelectEmpty,
  escSelectList,
  escSelectOptionActive,
  escSelectOptionBase,
  escSelectOptionIdle,
  escSelectSearchInput,
  escSelectSearchWrap,
  escSelectTriggerBar,
  escSelectTriggerCompact,
  escSelectTriggerModal,
} from "../../constants/escritorioUi";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const SEARCH_AUTO_THRESHOLD = 8;

function resolveEscritorioPortalTheme(triggerEl) {
  if (triggerEl?.closest(".theme-vogelkop")) return "theme-vogelkop";
  if (triggerEl?.closest(".theme-ybyoca")) return "theme-ybyoca";
  return "theme-ybyoca";
}

const TRIGGER_DEFAULT =
  "h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 pr-9 text-left text-sm tracking-tight text-text-primary ring-1 ring-slate-900/5 outline-none transition-all duration-200 focus:border-accent-primary focus:ring-accent-primary/20";

const TRIGGER_COMPACT =
  "h-auto w-full rounded-xl border border-border-primary/55 bg-white px-2 py-1.5 pr-7 text-left text-[13px] uppercase tracking-tight text-text-primary outline-none transition-all focus:border-accent-primary/45 focus:ring-2 focus:ring-accent-primary/20";

function createSyntheticChangeEvent(value) {
  return {
    target: { value },
    currentTarget: { value },
  };
}

function resolveOptions(options, placeholder) {
  const list = Array.isArray(options) ? options : [];
  const hasEmpty = list.some((opt) => opt.value === "" || opt.value === null);

  if (placeholder && !hasEmpty) {
    return [{ value: "", label: placeholder }, ...list];
  }

  return list;
}

function getSelectableOptions(allOptions) {
  return allOptions.filter(
    (opt) => opt.value !== "" && opt.value !== null && opt.value !== undefined,
  );
}

function useDropdownPosition(isOpen, triggerRef) {
  const [style, setStyle] = useState(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const maxHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;

    setStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
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

export default function BaseSelect({
  options = [],
  placeholder,
  className = "",
  value = "",
  onChange,
  disabled = false,
  loading = false,
  searchable,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado",
  size = "default",
  wrapperClassName = "",
  triggerClassName,
  hideChevron = false,
  optionsCentered = false,
  variant = "default",
  id,
  "aria-label": ariaLabel,
  required,
  autoFocus,
  onClick: externalOnClick,
  onMouseDown: externalOnMouseDown,
  onCreateOption,
  createOptionLabel,
  ...rest
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const listboxId = `${selectId}-listbox`;
  const triggerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [portalThemeClass, setPortalThemeClass] = useState("theme-ybyoca");

  const allOptions = useMemo(
    () => resolveOptions(options, placeholder),
    [options, placeholder],
  );

  const selectableOptions = useMemo(
    () => getSelectableOptions(allOptions),
    [allOptions],
  );

  const placeholderOption = allOptions.find((opt) => opt.value === "");

  const isSearchable =
    searchable ?? selectableOptions.length > SEARCH_AUTO_THRESHOLD;

  const filteredOptions = useMemo(() => {
    const base =
      !isSearchable || !query.trim()
        ? selectableOptions
        : filterSelectOptions(selectableOptions, query);

    if (!placeholderOption) return base;

    const matchesPlaceholder =
      !query.trim() ||
      filterSelectOptions([placeholderOption], query).length > 0;

    return matchesPlaceholder ? [placeholderOption, ...base] : base;
  }, [isSearchable, placeholderOption, query, selectableOptions]);

  const trimmedQuery = query.trim();

  const showCreateOption = useMemo(() => {
    if (!onCreateOption || !isSearchable || !trimmedQuery) return false;

    const normalizedQuery = normalizeSelectSearch(trimmedQuery);
    const hasExactMatch = selectableOptions.some(
      (opt) => normalizeSelectSearch(opt.label) === normalizedQuery,
    );

    return !hasExactMatch;
  }, [onCreateOption, isSearchable, trimmedQuery, selectableOptions]);

  const createRowLabel = showCreateOption
    ? createOptionLabel?.(trimmedQuery) ?? `Cadastrar "${trimmedQuery}"`
    : "";

  const dropdownStyle = useDropdownPosition(isOpen, triggerRef);

  const selectedOption = allOptions.find(
    (opt) => String(opt.value) === String(value),
  );

  const displayLabel =
    selectedOption?.label ||
    placeholderOption?.label ||
    placeholder ||
    "Selecione...";

  const isDisabled = disabled || loading;
  const isPlaceholder = !selectedOption || selectedOption.value === "";

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setHighlightIndex(0);
  }, []);

  const open = useCallback(() => {
    if (isDisabled) return;
    if (variant === "escritorio" || variant === "escritorioBar") {
      setPortalThemeClass(
        resolveEscritorioPortalTheme(triggerRef.current),
      );
    }
    setIsOpen(true);
    setQuery("");
    setHighlightIndex(0);
  }, [isDisabled, variant]);

  const selectValue = useCallback(
    (nextValue) => {
      onChange?.(createSyntheticChangeEvent(String(nextValue)));
      close();
      triggerRef.current?.focus();
    },
    [close, onChange],
  );

  const handleCreateOption = useCallback(async () => {
    if (!onCreateOption || creating || !trimmedQuery) return;

    try {
      setCreating(true);
      const novoValue = await onCreateOption(trimmedQuery);
      if (novoValue !== undefined && novoValue !== null && novoValue !== "") {
        selectValue(novoValue);
      }
    } catch (error) {
      console.error("Erro ao criar opção:", error);
      alert("Não foi possível cadastrar o item.");
    } finally {
      setCreating(false);
    }
  }, [creating, onCreateOption, selectValue, trimmedQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [close, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      if (isSearchable) {
        searchRef.current?.focus();
      } else {
        listRef.current?.focus();
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isOpen, isSearchable]);

  const activeHighlightIndex = Math.min(
    highlightIndex,
    Math.max(0, filteredOptions.length - 1),
  );

  const handleTriggerKeyDown = (event) => {
    if (isDisabled) return;

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

  const handleListKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }

    if (event.key === "Tab") {
      close();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[activeHighlightIndex];
      if (option) selectValue(option.value);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      listRef.current?.focus();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      triggerRef.current?.focus();
      return;
    }
    handleListKeyDown(event);
  };

  const triggerCenterClasses = optionsCentered
    ? "flex items-center justify-center text-center"
    : "";

  const isEscritorioVariant =
    variant === "escritorio" || variant === "escritorioBar";

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
        triggerCenterClasses,
        "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
        isEscritorioVariant &&
          isOpen &&
          "border-esc-destaque ring-1 ring-esc-destaque/30",
      )
    : joinClasses(
        resolveTriggerBase(),
        className,
        "relative w-full",
        triggerCenterClasses,
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

  const searchWrapClass = isEscritorioVariant
    ? escSelectSearchWrap
    : "border-b border-slate-100 p-2";

  const searchInputClass = isEscritorioVariant
    ? escSelectSearchInput
    : "h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20";

  const searchIconClass = isEscritorioVariant
    ? "pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-esc-muted"
    : "pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted";

  const chevronClass = isEscritorioVariant ? "text-esc-muted" : "text-text-muted";

  const handleTriggerClick = (event) => {
    externalOnClick?.(event);
    if (event.defaultPrevented) return;
    if (isOpen) close();
    else open();
  };

  const handleTriggerMouseDown = (event) => {
    externalOnMouseDown?.(event);
  };

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
        id={selectId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        disabled={isDisabled}
        autoFocus={autoFocus}
        onClick={handleTriggerClick}
        onMouseDown={handleTriggerMouseDown}
        onKeyDown={handleTriggerKeyDown}
        className={triggerClasses}
      >
        <span
          className={joinClasses(
            "block min-w-0 truncate",
            optionsCentered ? "w-full text-center" : "pr-1",
          )}
        >
          {loading ? "Carregando..." : displayLabel}
        </span>
        <ChevronDown
          className={joinClasses(
            hideChevron && "hidden",
            "pointer-events-none absolute top-1/2 -translate-y-1/2 transition-transform duration-200",
            chevronClass,
            size === "compact" ? "right-2 h-3.5 w-3.5" : "right-3 h-4 w-4",
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
              ref={listRef}
              id={listboxId}
              role="listbox"
              tabIndex={-1}
              onKeyDown={handleListKeyDown}
              className={dropdownPanelClass}
            >
            {isSearchable ? (
              <div className={searchWrapClass}>
                <div className="relative">
                  <Search className={searchIconClass} />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setHighlightIndex(0);
                    }}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={searchPlaceholder}
                    className={searchInputClass}
                  />
                </div>
              </div>
            ) : null}

            <ul
              className={
                isEscritorioVariant
                  ? escSelectList
                  : "max-h-60 overflow-y-auto p-1.5"
              }
            >
              {filteredOptions.length === 0 ? (
                <li className={isEscritorioVariant ? escSelectEmpty : "px-3 py-2 text-sm text-text-muted"}>
                  {emptyMessage}
                </li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = String(option.value) === String(value);
                  const isHighlighted = index === activeHighlightIndex;

                  return (
                    <li key={String(option.value)} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => selectValue(option.value)}
                        className={joinClasses(
                          isEscritorioVariant
                            ? escSelectOptionBase
                            : "flex w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-sm transition-colors",
                          optionsCentered && "justify-center text-center",
                          size === "compact" && "text-[13px] uppercase",
                          isHighlighted || isSelected
                            ? isEscritorioVariant
                              ? escSelectOptionActive
                              : "bg-accent-primary/10 text-accent-primary"
                            : isEscritorioVariant
                              ? escSelectOptionIdle
                              : "text-text-primary hover:bg-slate-50",
                        )}
                      >
                        <span className="truncate">{option.label}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {showCreateOption ? (
              <div
                className={
                  isEscritorioVariant
                    ? "border-t border-esc-border/60 p-1.5"
                    : "border-t border-slate-100 p-1.5"
                }
              >
                <button
                  type="button"
                  disabled={creating}
                  onClick={handleCreateOption}
                  className={joinClasses(
                    isEscritorioVariant
                      ? escSelectOptionBase
                      : "flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    size === "compact" && "text-[13px] uppercase",
                    creating
                      ? "cursor-not-allowed opacity-60"
                      : isEscritorioVariant
                        ? escSelectOptionIdle
                        : "text-accent-primary hover:bg-accent-primary/10",
                  )}
                >
                  <Plus
                    className={joinClasses(
                      "h-3.5 w-3.5 shrink-0",
                      creating && "animate-pulse",
                    )}
                    aria-hidden
                  />
                  <span className="truncate">
                    {creating ? "Cadastrando..." : createRowLabel}
                  </span>
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
