"use client";

import { useEffect, type ReactNode } from "react";

export const ksh = (n: number) => `${n < 0 ? "−" : ""}KSh ${Math.abs(Math.round(n)).toLocaleString("en-KE")}`;

export function duration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function Card({ title, right, children, className = "" }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-card p-4 ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h3 className="font-display text-lg font-bold">{title}</h3>}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function Meter({ label, value, max = 100, tone, display }: { label: ReactNode; value: number; max?: number; tone?: "auto" | "neutral"; display?: ReactNode }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color = tone === "neutral" ? "bg-foreground/70" : pct < 20 ? "bg-kred" : pct < 45 ? "bg-sun" : "bg-kgreen";
  return (
    <div>
      <div className="flex justify-between gap-2 text-[11px] text-muted">
        <span className="truncate">{label}</span>
        <span className="font-mono">{display ?? Math.floor(value)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Btn({
  children,
  onClick,
  disabled,
  variant = "solid",
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "solid" | "ghost" | "danger";
  className?: string;
  title?: string;
}) {
  const styles = {
    solid: "bg-foreground text-background enabled:hover:bg-kgreen",
    ghost: "border border-line bg-card enabled:hover:border-foreground",
    danger: "border border-kred/40 text-kred enabled:hover:bg-kred/10",
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-40 ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ className = "", children }: { className?: string; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: ReactNode }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-line/60 p-1">
      {items.map((i) => (
        <button
          key={i.id}
          onClick={() => onChange(i.id)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${value === i.id ? "bg-card shadow-sm" : "text-muted hover:text-foreground"}`}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}

export function Sheet({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-foreground/50 sm:items-center sm:p-4" onClick={onClose} role="dialog" aria-modal>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="stripe h-1.5" />
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-card px-4 py-3">
          <h2 className="font-display text-xl font-extrabold">{title}</h2>
          <button onClick={onClose} className="rounded-full px-2 text-xl text-muted hover:text-foreground" aria-label="Close">
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-muted">{children}</p>;
}

export function Row({ left, right, sub }: { left: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-background/50 px-3 py-2">
      <div className="min-w-0">
        <div className="truncate font-semibold">{left}</div>
        {sub && <div className="text-xs text-muted">{sub}</div>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
