import { cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";

type ButtonVariant = "primary" | "brand" | "secondary" | "accent" | "info" | "warning" | "outline" | "ghost" | "error";
type ButtonSize = "sm" | "md" | "lg";

type BaseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  asChild?: boolean;
};

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const variantClasses: Record<ButtonVariant, string> = {
  primary: "insw-btn--primary-solid",
  brand: "insw-btn--brand-solid",
  secondary: "insw-btn--secondary-neutral",
  accent: "insw-btn--accent-solid",
  info: "insw-btn--info",
  warning: "insw-btn--warning",
  outline: "insw-btn--outline",
  ghost: "insw-btn--ghost",
  error: "insw-btn--error",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "insw-btn--sm",
  md: "insw-btn--md",
  lg: "insw-btn--lg",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  startIcon,
  endIcon,
  className,
  type = "button",
  children,
  asChild,
  ...props
}: BaseButtonProps) {
  const classes = cn("insw-btn", variantClasses[variant], sizeClasses[size], fullWidth && "insw-btn--full", className);

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      ...child.props,
      className: cn(classes, child.props.className),
    });
  }

  return (
    <button
      type={type}
      className={classes}
      {...props}
    >
      {startIcon ? <span className="inline-flex shrink-0 items-center justify-center">{startIcon}</span> : null}
      <span className="min-w-0">{children}</span>
      {endIcon ? <span className="inline-flex shrink-0 items-center justify-center">{endIcon}</span> : null}
    </button>
  );
}

type IconButtonProps = Omit<BaseButtonProps, "children"> & {
  "aria-label": string;
  children: ReactNode;
};

export function IconButton({ className, size = "md", variant = "ghost", children, ...props }: IconButtonProps) {
  const iconSize: Record<ButtonSize, string> = {
    sm: "insw-icon-btn--sm",
    md: "insw-icon-btn--md",
    lg: "insw-icon-btn--lg",
  };
  const iconVariant: Record<ButtonVariant, string> = {
    primary: "insw-icon-btn--primary-solid",
    brand: "insw-icon-btn--primary-solid",
    secondary: "insw-icon-btn--secondary-neutral",
    accent: "insw-icon-btn--accent-solid",
    info: "insw-icon-btn--info",
    warning: "insw-icon-btn--warning",
    outline: "insw-icon-btn--outline",
    ghost: "insw-icon-btn--ghost",
    error: "insw-icon-btn--error",
  };

  return (
    <button
      type={props.type ?? "button"}
      className={cn(
        "insw-icon-btn",
        iconVariant[variant],
        iconSize[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
