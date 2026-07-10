import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";

type TooltipPlacement = "top" | "right" | "bottom" | "left";

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  placement?: TooltipPlacement;
  offset?: number;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
};

type TooltipPosition = {
  top: number;
  left: number;
  transform: string;
};

export function Tooltip({
  children,
  content,
  placement = "right",
  offset = 12,
  className,
  contentClassName,
  disabled = false,
}: TooltipProps) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  const tooltipClassName = useMemo(
    () =>
      [
        "fixed z-[80] max-w-[280px] rounded-xl border border-border-primary bg-white px-3 py-2 text-left text-[11px] leading-5 text-neutral-700 shadow-xl",
        contentClassName ?? "",
      ].join(" "),
    [contentClassName],
  );

  const updatePosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const gap = offset;

    switch (placement) {
      case "left":
        setPosition({
          top: rect.top + rect.height / 2,
          left: rect.left - gap,
          transform: "translate(-100%, -50%)",
        });
        break;
      case "top":
        setPosition({
          top: rect.top - gap,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, -100%)",
        });
        break;
      case "bottom":
        setPosition({
          top: rect.bottom + gap,
          left: rect.left + rect.width / 2,
          transform: "translate(-50%, 0)",
        });
        break;
      case "right":
      default:
        setPosition({
          top: rect.top + rect.height / 2,
          left: rect.right + gap,
          transform: "translate(0, -50%)",
        });
        break;
    }
  };

  useEffect(() => {
    if (!open || disabled) return;

    updatePosition();

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, disabled, placement, offset]);

  useEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    if (!anchor) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open]);

  if (disabled) {
    return <>{children}</>;
  }

  const showTooltip = open && position && typeof document !== "undefined";

  return (
    <>
      <span
        ref={anchorRef}
        className={className}
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children}
      </span>
      {showTooltip
        ? createPortal(
            <div
              id={id}
              role="tooltip"
              className={tooltipClassName}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: position.transform,
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
