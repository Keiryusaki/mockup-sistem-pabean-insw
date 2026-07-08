import type { HTMLAttributes, ReactNode } from "react";

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

export type BadgeVariant = "brand" | "primary" | "secondary" | "accent" | "info" | "warning" | "success" | "error";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  startIcon?: ReactNode;
};

export function Badge({ className, variant = "secondary", startIcon, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn("insw-badge", `insw-badge--${variant}`, className)}
      {...props}
    >
      {startIcon ? <span className="inline-flex shrink-0 items-center justify-center">{startIcon}</span> : null}
      <span className="whitespace-nowrap">{children}</span>
    </span>
  );
}
