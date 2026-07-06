import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

type FieldState = "default" | "warning" | "error";

type FieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  warning?: string;
  className?: string;
  state?: FieldState;
  requiredMark?: boolean;
};

const inputBase =
  "h-10 w-full rounded-md border bg-white px-3 text-[12px] text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const inputStateClasses: Record<FieldState, string> = {
  default: "border-border-primary focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100",
  warning: "border-warning-500 focus:border-warning-500 focus:ring-2 focus:ring-warning-500/15",
  error: "border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/15",
};

function fieldStateFromProps(error?: string, warning?: string, state?: FieldState): FieldState {
  if (state) return state;
  if (error) return "error";
  if (warning) return "warning";
  return "default";
}

function FieldShell({
  label,
  hint,
  error,
  warning,
  className,
  requiredMark,
  children,
}: FieldProps & { children: ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <span className="text-[12px] font-medium text-neutral-700">
          {label}
          {requiredMark || error || warning ? <span className="ml-1 text-error-500">*</span> : null}
        </span>
      ) : null}
      {children}
      {error ? (
        <span className="text-[11px] leading-5 text-error-600">{error}</span>
      ) : warning ? (
        <span className="text-[11px] leading-5 text-warning-600">{warning}</span>
      ) : hint ? (
        <span className="text-[11px] leading-5 text-neutral-600">{hint}</span>
      ) : null}
    </label>
  );
}

export function Input({
  label,
  hint,
  error,
  warning,
  state,
  className,
  prefixIcon,
  suffixIcon,
  ...props
}: InputHTMLAttributes<HTMLInputElement> &
  FieldProps & {
    prefixIcon?: ReactNode;
    suffixIcon?: ReactNode;
  }) {
  const currentState = fieldStateFromProps(error, warning, state);
  const hasPrefix = Boolean(prefixIcon);
  const hasSuffix = Boolean(suffixIcon);

  return (
    <FieldShell label={label} hint={hint} error={error} warning={warning} className={className}>
      <div className="relative">
        {hasPrefix ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 inline-flex w-10 items-center justify-center text-neutral-500">
            {prefixIcon}
          </span>
        ) : null}
        <input
          className={cn(
            inputBase,
            inputStateClasses[currentState],
            hasPrefix && "pl-10",
            hasSuffix && "pr-10",
          )}
          {...props}
        />
        {hasSuffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-neutral-500">
            {suffixIcon}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
}

export function Textarea({
  label,
  hint,
  error,
  warning,
  state,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const currentState = fieldStateFromProps(error, warning, state);
  return (
    <FieldShell label={label} hint={hint} error={error} warning={warning} className={className}>
      <textarea
        className={cn(
          "min-h-24 w-full rounded-md border bg-white px-3 py-2 text-[12px] text-neutral-800 outline-none transition-colors placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500",
          inputStateClasses[currentState],
        )}
        {...props}
      />
    </FieldShell>
  );
}

type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
};

type SelectProps = FieldProps & {
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  clearable?: boolean;
  searchPlaceholder?: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={cn("h-4 w-4 fill-none stroke-current transition-transform", open && "rotate-180")}>
      <path d="m6 9 6 6 6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
      <path d="M7.05 5.64 5.64 7.05 10.59 12l-4.95 4.95 1.41 1.41L12 13.41l4.95 4.95 1.41-1.41L13.41 12l4.95-4.95-1.41-1.41L12 10.59 7.05 5.64Z" />
    </svg>
  );
}

export function Select({
  label,
  hint,
  error,
  warning,
  state,
  options,
  placeholder = "Choose an option",
  value,
  defaultValue,
  onValueChange,
  name,
  disabled,
  required,
  className,
  searchable,
  clearable,
  searchPlaceholder = "Search option...",
}: SelectProps) {
  const currentState = fieldStateFromProps(error, warning, state);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = isControlled ? value ?? "" : internalValue;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  const visibleOptions = useMemo(() => {
    if (!searchable) return options;
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) => `${option.label} ${option.description ?? ""}`.toLowerCase().includes(normalized));
  }, [options, query, searchable]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const commitValue = (nextValue: string) => {
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setQuery("");
    setOpen(false);
  };

  return (
    <FieldShell label={label} hint={hint} error={error} warning={warning} className={className}>
      <div ref={rootRef} className="relative">
        {name ? <input type="hidden" name={name} value={selectedValue} /> : null}
        <div
          className={cn(
            "flex h-11 w-full overflow-hidden rounded-md border bg-white text-[12px] text-neutral-800 outline-none transition-colors",
            inputStateClasses[currentState],
            disabled && "cursor-not-allowed bg-neutral-50 text-neutral-500",
          )}
        >
          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              setOpen((current) => {
                const next = !current;
                if (next) setQuery("");
                return next;
              });
            }}
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("flex min-w-0 flex-1 items-center px-3 text-left", !selectedOption && "text-neutral-400")}
          >
            <span className="truncate">{selectedOption?.label || placeholder}</span>
          </button>

          {clearable && selectedValue ? (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => commitValue("")}
              className="inline-flex w-8 shrink-0 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-800"
            >
              <CloseIcon />
            </button>
          ) : null}

          <span className="my-2 w-px shrink-0 self-stretch bg-border-primary/80" aria-hidden="true" />

          <button
            type="button"
            onClick={() => {
              if (disabled) return;
              setOpen((current) => {
                const next = !current;
                if (next) setQuery("");
                return next;
              });
            }}
            aria-label={open ? "Tutup dropdown" : "Buka dropdown"}
            disabled={disabled}
            className="inline-flex w-11 shrink-0 items-center justify-center text-neutral-700 disabled:text-neutral-400"
          >
            <ChevronIcon open={open} />
          </button>
        </div>

        {open ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 w-[min(100%,288px)] overflow-hidden rounded-md border border-border-primary bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
            {searchable ? (
              <div className="border-b border-border-primary bg-white p-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-9 w-full rounded-md border border-border-primary bg-white px-3 text-[12px] outline-none transition-colors placeholder:text-neutral-400 focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-100"
                />
              </div>
            ) : null}
            <div className="py-1">
              <button
                type="button"
                onClick={() => commitValue("")}
                className={cn(
                  "group relative flex w-full items-center px-4 py-3 text-left text-[12px] transition-colors duration-150",
                  !selectedValue ? "bg-brand-primary-50 text-brand-primary-700" : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100",
                )}
              >
                <span
                  className={cn(
                    "absolute left-0 top-0 h-full w-[3px] bg-brand-primary-300/70 opacity-0 transition-opacity duration-150",
                    !selectedValue && "opacity-100",
                  )}
                />
                {placeholder}
              </button>
              {visibleOptions.length > 0 ? visibleOptions.map((option) => {
                const active = option.value === selectedValue;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => commitValue(option.value)}
                  className={cn(
                    "group relative flex w-full flex-col items-start px-4 py-3 text-left text-[12px] transition-colors duration-150",
                    active ? "bg-brand-primary-50 text-brand-primary-700" : "text-brand-primary-700 hover:bg-brand-primary-50",
                    option.disabled && "cursor-not-allowed text-neutral-400 hover:bg-white",
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-0 h-full w-[3px] bg-brand-primary-300/70 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                      active && "opacity-100",
                    )}
                  />
                    <span className="block">{option.label}</span>
                    {option.description ? <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{option.description}</span> : null}
                  </button>
                );
              }) : (
                <div className="px-4 py-3 text-[12px] text-neutral-600">No options found.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </FieldShell>
  );
}

export function Checkbox({
  label,
  hint,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  return (
    <label className={cn("flex items-start gap-3 rounded-md border border-border-primary bg-white px-3 py-2", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-border-primary text-brand-primary-600 focus:ring-brand-primary-300"
        {...props}
      />
      <span className="min-w-0 flex-1">
        {label ? <span className="block text-[12px] font-medium text-neutral-700">{label}</span> : null}
        {error ? (
          <span className="mt-1 block text-[11px] leading-5 text-error-600">{error}</span>
        ) : hint ? (
          <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{hint}</span>
        ) : null}
      </span>
    </label>
  );
}

export function Switch({
  label,
  hint,
  checked,
  onChange,
  className,
  disabled,
}: {
  label?: string;
  hint?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-md border border-border-primary bg-white px-3 py-2 text-left transition-colors hover:bg-background-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      disabled={disabled}
    >
      <span className="min-w-0">
        {label ? <span className="block text-[12px] font-medium text-neutral-700">{label}</span> : null}
        {hint ? <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{hint}</span> : null}
      </span>
      <span
        className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-brand-primary-500" : "bg-neutral-300")}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
