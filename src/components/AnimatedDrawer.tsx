import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type AnimatedDrawerProps = {
  open: boolean;
  onClose: () => void;
  renderContent: () => ReactNode;
  ariaLabel: string;
  panelClassName?: string;
  dismissible?: boolean;
  busy?: boolean;
  duration?: number;
  overflowVisible?: boolean;
  deferContent?: boolean;
  onExited?: () => void;
};

function DrawerSkeleton() {
  return (
    <div className="flex h-full flex-col bg-white" role="status" aria-label="Menyiapkan drawer">
      <div className="flex items-center justify-between border-b border-border-primary px-5 py-5">
        <div className="space-y-2">
          <div className="h-3 w-36 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-6 w-64 max-w-[55vw] animate-pulse rounded-lg bg-neutral-200" />
        </div>
        <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(180px,28%)_minmax(0,1fr)]">
        <div className="space-y-3 border-r border-border-primary p-5">
          {[72, 88, 64, 82, 70].map((width, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-neutral-100" style={{ width: `${width}%` }} />)}
        </div>
        <div className="grid content-start gap-4 p-5 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-neutral-100" />)}
        </div>
      </div>
    </div>
  );
}

export function AnimatedDrawer({
  open,
  onClose,
  renderContent,
  ariaLabel,
  panelClassName = "max-w-[1120px]",
  dismissible = true,
  busy = false,
  duration = 340,
  overflowVisible = false,
  deferContent = true,
  onExited,
}: AnimatedDrawerProps) {
  const [rendered, setRendered] = useState(open);
  const [contentReady, setContentReady] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backdropRef = useRef<HTMLButtonElement | null>(null);
  const panelAnimationRef = useRef<Animation | null>(null);
  const backdropAnimationRef = useRef<Animation | null>(null);
  const animationCycleRef = useRef(0);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;

  useLayoutEffect(() => {
    if (open && !rendered) {
      setContentReady(false);
      setRendered(true);
    }
  }, [open, rendered]);

  useLayoutEffect(() => {
    if (!rendered) return;
    const panel = panelRef.current;
    const backdrop = backdropRef.current;
    if (!panel || !backdrop) return;

    const cycle = ++animationCycleRef.current;
    panelAnimationRef.current?.cancel();
    backdropAnimationRef.current?.cancel();
    if (open && deferContent) setContentReady(false);

    const panelFrames = open
      ? [{ transform: "translate3d(100%, 0, 0)" }, { transform: "translate3d(0, 0, 0)" }]
      : [{ transform: "translate3d(0, 0, 0)" }, { transform: "translate3d(100%, 0, 0)" }];
    const backdropFrames = open ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
    const timing: KeyframeAnimationOptions = {
      duration,
      easing: open ? "cubic-bezier(0.22, 1, 0.36, 1)" : "cubic-bezier(0.4, 0, 0.7, 0.2)",
      fill: "forwards",
    };

    const panelAnimation = panel.animate(panelFrames, timing);
    const backdropAnimation = backdrop.animate(backdropFrames, { ...timing, easing: "ease-out" });
    panelAnimationRef.current = panelAnimation;
    backdropAnimationRef.current = backdropAnimation;

    void Promise.allSettled([panelAnimation.finished, backdropAnimation.finished]).then(() => {
      if (animationCycleRef.current !== cycle) return;
      panelAnimation.cancel();
      backdropAnimation.cancel();
      if (open) {
        setContentReady(true);
      } else {
        setRendered(false);
        setContentReady(false);
        onExitedRef.current?.();
      }
    });

    return () => {
      if (animationCycleRef.current === cycle) animationCycleRef.current += 1;
      panelAnimation.cancel();
      backdropAnimation.cancel();
    };
  }, [deferContent, duration, open, rendered]);

  useEffect(() => {
    if (!rendered || !dismissible || busy) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [busy, dismissible, onClose, rendered]);

  if (!rendered || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex justify-end" role="dialog" aria-modal="true" aria-label={ariaLabel} aria-busy={busy}>
      <button
        ref={backdropRef}
        type="button"
        className="absolute inset-0 bg-slate-950/30"
        style={{ opacity: open ? 1 : 0 }}
        aria-label={`Tutup ${ariaLabel}`}
        disabled={!dismissible || busy}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative h-full w-full transform-gpu border-l border-border-primary bg-white shadow-[0_24px_70px_rgba(15,23,42,0.3)] will-change-transform [contain:layout] ${overflowVisible ? "overflow-visible" : "overflow-hidden"} ${panelClassName}`}
        style={{ transform: open ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)" }}
      >
        {!deferContent || contentReady ? renderContent() : <DrawerSkeleton />}
      </div>
    </div>,
    document.body,
  );
}
