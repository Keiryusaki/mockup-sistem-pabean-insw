import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ACCESS_KEY } from "./AccessGate";
import { IconButton } from "./Button";
import { DocumentsIcon, LogoutIcon, UserIcon } from "./Icons";

type HeaderMenu = "notifications" | "updates" | "profile" | null;

type HeaderNotice = {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  href: string;
};

const NOTIFICATION_STORAGE_KEY = "insw-header-notifications";

const DEFAULT_NOTICES: HeaderNotice[] = [
  {
    id: "notif-dashboard",
    title: "Dashboard lebih ringkas",
    description: "Shortcut pengajuan dan filter status sudah disesuaikan biar lebih cepat dipakai.",
    time: "Baru saja",
    unread: true,
    href: "/data",
  },
  {
    id: "notif-entitas",
    title: "Entitas sudah berbentuk profil pelaku usaha",
    description: "Step entitas sekarang memakai card dan accordion supaya lebih mudah dibaca.",
    time: "10 menit lalu",
    unread: true,
    href: "/form",
  },
  {
    id: "notif-icon",
    title: "Icon library bisa dicari lebih cepat",
    description: "Halaman `/icon` sekarang mendukung search dan copy nama icon.",
    time: "Hari ini",
    unread: true,
    href: "/icon",
  },
  {
    id: "notif-hub",
    title: "Root sekarang jadi pilih aplikasi",
    description: "Buka `/` untuk pilih Smart Form atau Client App. Dashboard Smart Form pindah ke `/dashboard`.",
    time: "Baru saja",
    unread: true,
    href: "/",
  },
];

const CHANGELOG_PREVIEW = [
  {
    id: "changelog-1",
    title: "Perubahan kedua",
    description: "Checkpoint kedua yang menata feedback, avatar shortcut, mirror inbox, dan service Discord.",
  },
];

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Zm7-6v-5a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Zm-2 1H7v-6a5 5 0 1 1 10 0v6Z" />
    </svg>
  );
}

function LogoMark() {
  const baseUrl = (((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/").replace(/\/$/, "") || "/");
  const logoSrc = baseUrl === "/" ? "/lnswlogo-BtrvXW6X.png" : `${baseUrl}/lnswlogo-BtrvXW6X.png`;

  return <img src={logoSrc} alt="Indonesia National Single Window" className="h-9 w-auto object-contain" />;
}

function ChangelogIcon({ className = "h-4 w-4" }: { className?: string } = {}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`fill-none stroke-current ${className}`}>
      <path d="M6 7h12" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 12h12" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 17h8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 15.5l1.5 1.5 2.5-2.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LaporIcon({ className = "h-4 w-4" }: { className?: string } = {}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`fill-none stroke-current ${className}`}>
      <path
        d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v8A1.5 1.5 0 0 1 20 16.5H9l-4.5 4v-4.5H4A1.5 1.5 0 0 1 2.5 14V7A1.5 1.5 0 0 1 4 5.5Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 9h10" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 12h7" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuItem({
  children,
  href,
  onClick,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const baseClass =
    "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-background-primary/50";

  if (href) {
    return (
      <Link to={href} className={baseClass} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {children}
    </button>
  );
}

function MenuPanel({
  title,
  description,
  footer,
  children,
  onViewAll,
}: {
  title: string;
  description: string;
  footer?: ReactNode;
  children: ReactNode;
  onViewAll?: string;
}) {
  return (
    <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-border-primary bg-white shadow-[0_20px_60px_rgba(15,23,42,0.24)]">
      <div className="border-b border-border-primary px-4 py-3">
        <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-primary-600">{title}</div>
        <div className="mt-1 text-[12px] leading-5 text-neutral-600">{description}</div>
      </div>
      <div className="max-h-[320px] overflow-auto p-2">{children}</div>
      {(footer || onViewAll) && (
        <div className="flex items-center justify-between gap-3 border-t border-border-primary px-4 py-3">
          <div className="min-w-0 text-[11px] leading-5 text-neutral-500">{footer}</div>
          {onViewAll ? (
            <ButtonLink to={onViewAll}>View all</ButtonLink>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ButtonLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex h-9 items-center justify-center rounded-full border border-brand-primary-200 bg-brand-primary-50 px-3 text-[12px] font-semibold text-brand-primary-700 transition-colors hover:border-brand-primary-300 hover:bg-brand-primary-100"
    >
      {children}
    </Link>
  );
}

export function ShellHeader({
  breadcrumb,
  action,
  homeTo = "/dashboard",
  onLogout,
  logoutDescription,
  showSwitchRole = false,
}: {
  breadcrumb: string;
  action?: ReactNode;
  homeTo?: "/dashboard" | "/client/pengajuan" | "/penyedia" | "/";
  onLogout?: () => void;
  logoutDescription?: string;
  showSwitchRole?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  const [menu, setMenu] = useState<HeaderMenu>(null);
  const [notifications, setNotifications] = useState<HeaderNotice[]>(DEFAULT_NOTICES);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadNotifications = () => {
      try {
        const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
        if (!raw) {
          window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(DEFAULT_NOTICES));
          setNotifications(DEFAULT_NOTICES);
          return;
        }

        const parsed = JSON.parse(raw) as HeaderNotice[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
          return;
        }
      } catch {
        window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(DEFAULT_NOTICES));
      }

      setNotifications(DEFAULT_NOTICES);
    };

    loadNotifications();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_STORAGE_KEY) loadNotifications();
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) {
        setMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const dateText = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);
  const timeText = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const unreadCount = useMemo(() => notifications.filter((item) => item.unread).length, [notifications]);
  const unreadPreview = notifications.slice(0, 3);

  const markAllAsRead = () => {
    const next = notifications.map((item) => ({ ...item, unread: false }));
    setNotifications(next);
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
  };

  const markOneAsRead = (id: string) => {
    const next = notifications.map((item) => (item.id === id ? { ...item, unread: false } : item));
    setNotifications(next);
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setMenu(null);
    if (onLogout) {
      onLogout();
      return;
    }

    window.localStorage.removeItem(ACCESS_KEY);
    window.location.reload();
  };

  return (
    <header ref={shellRef} className="sticky top-0 z-40 border-b border-brand-primary-800 bg-brand-primary-800 text-white shadow-[0_2px_10px_rgba(1,33,78,0.22)]">
      <div className="shell-header-top mx-auto flex h-[50px] w-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to={homeTo}
          search={homeTo === "/client/pengajuan" ? { status: undefined } : undefined}
          aria-label="Beranda"
          className="shrink-0"
        >
          <LogoMark />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden min-w-0 flex-col items-end sm:flex">
            <div className="border-b border-white/80 pb-1 text-[14px] font-medium leading-none whitespace-nowrap">
              {dateText} pukul {timeText}
            </div>
          </div>

          <div className="relative">
            <IconButton
              type="button"
              aria-label="Notifikasi"
              size="sm"
              className="relative bg-white/10 text-white hover:bg-white/20"
              onClick={() => setMenu((current) => (current === "notifications" ? null : "notifications"))}
            >
              <BellIcon />
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[11px] font-bold leading-none text-white shadow-sm">
                {unreadCount}
              </span>
            </IconButton>

            {menu === "notifications" ? (
              <MenuPanel
                title="Notifikasi"
                description="Informasi terbaru terkait mockup dan perubahan penting yang perlu dilihat."
                footer={<button type="button" className="font-semibold text-brand-primary-700 hover:underline" onClick={markAllAsRead}>Tandai semua dibaca</button>}
                onViewAll="/changelog"
              >
                <div className="space-y-2">
                  {unreadPreview.map((item) => (
                    <MenuItem
                      key={item.id}
                      href={item.href}
                      onClick={() => markOneAsRead(item.id)}
                    >
                      <span className="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-brand-primary-500" />
                      <span className="min-w-0">
                        <span className="block text-[12px] font-semibold text-neutral-800">{item.title}</span>
                        <span className="mt-1 block text-[11px] leading-5 text-neutral-600">{item.description}</span>
                        <span className="mt-1 block text-[10px] text-neutral-500">{item.time}</span>
                      </span>
                    </MenuItem>
                  ))}
                  {unreadPreview.length === 0 ? (
                    <div className="px-3 py-4 text-[12px] text-neutral-600">Tidak ada notifikasi baru.</div>
                  ) : null}
                </div>
              </MenuPanel>
            ) : null}
          </div>
          <div className="relative">
            <IconButton
              type="button"
              aria-label="Profil pengguna"
              size="sm"
              className="h-10 w-10 rounded-full bg-[#7d8794] text-base font-bold text-white shadow-sm hover:bg-[#6f7783]"
              onClick={() => setMenu((current) => (current === "profile" ? null : "profile"))}
            >
              A
            </IconButton>

            {menu === "profile" ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,280px)] overflow-hidden rounded-2xl border border-border-primary bg-white shadow-[0_20px_60px_rgba(15,23,42,0.24)]">
                <div className="border-b border-border-primary px-4 py-3">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-brand-primary-600">Akun</div>
                  <div className="mt-1 text-[12px] leading-5 text-neutral-600">Akses cepat ke komponen lokal dan keluar dari sesi aktif.</div>
                </div>
                <div className="p-2">
                  <MenuItem href="/">
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-600">
                      <DocumentsIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-neutral-800">Pilih Aplikasi</span>
                      <span className="mt-1 block text-[11px] leading-5 text-neutral-600">Pindah ke Smart Form atau Client App.</span>
                    </span>
                  </MenuItem>
                  {showSwitchRole ? (
                    <MenuItem href="/smart-form">
                      <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-600">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[12px] font-semibold text-neutral-800">Ganti Role</span>
                        <span className="mt-1 block text-[11px] leading-5 text-neutral-600">Pilih ulang Pengaju atau Penyedia.</span>
                      </span>
                    </MenuItem>
                  ) : null}
                  <MenuItem href="/feedback">
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-error-50 text-error-600">
                      <LaporIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-neutral-800">Lapor Pak !!</span>
                      <span className="mt-1 block text-[11px] leading-5 text-neutral-600">Masukan atau perbaikan untuk tim TW.</span>
                    </span>
                  </MenuItem>
                  <MenuItem href="/changelog">
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-600">
                      <ChangelogIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-neutral-800">Change Log</span>
                      <span className="mt-1 block text-[11px] leading-5 text-neutral-600">Buka catatan perubahan dan checkpoint terbaru.</span>
                    </span>
                  </MenuItem>
                  <MenuItem href="/component">
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50 text-brand-primary-600">
                      <DocumentsIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-neutral-800">Komponen Lokal</span>
                      <span className="mt-1 block text-[11px] leading-5 text-neutral-600">Buka live docs komponen yang dipakai di project ini.</span>
                    </span>
                  </MenuItem>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-error-500/5"
                  >
                    <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-error-50 text-error-600">
                      <LogoutIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-semibold text-neutral-800">Logout</span>
                      <span className="mt-1 block text-[11px] leading-5 text-neutral-600">
                        {logoutDescription ?? "Hapus passkey lokal dan kembali ke mode terkunci."}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-[#011B42] px-4 py-2 text-[13px] text-white sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="font-medium">INSW</span>
            <span className="mx-2 text-white/65">/</span>
            <span className="text-white/85">{breadcrumb}</span>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </header>
  );
}
