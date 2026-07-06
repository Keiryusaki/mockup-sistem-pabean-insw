import { createPortal } from "react-dom";
import type { ReactNode } from "react";

const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-border-primary bg-white shadow-sm", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-3 border-b border-border-primary px-4 py-3", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-end gap-2 border-t border-border-primary px-4 py-3", className)} {...props} />;
}

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
  panelClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
};

export function Modal({ open, title, description, onClose, children, footer, widthClassName, panelClassName, bodyClassName, footerClassName }: ModalProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      />
      <div className={cn("absolute inset-x-0 top-1/2 mx-auto w-[min(92vw,560px)] -translate-y-1/2 px-4", widthClassName)}>
        <div className={cn("overflow-hidden rounded-2xl border border-border-primary bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]", panelClassName)}>
          <div className="flex items-start justify-between gap-4 border-b border-border-primary px-5 py-4">
            <div className="min-w-0">
              <h3 className="text-[18px] font-semibold tracking-[-0.03em] text-neutral-800">{title}</h3>
              {description ? <p className="mt-1 text-[12px] leading-6 text-neutral-600">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-primary bg-white text-neutral-700 transition-colors hover:bg-neutral-50"
              aria-label="Dismiss modal"
            >
              ×
            </button>
          </div>
          <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
          {footer ? <div className={cn("border-t border-border-primary px-5 py-4", footerClassName)}>{footer}</div> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
