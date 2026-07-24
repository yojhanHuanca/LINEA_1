import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Priority, Stage } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

export function caseCodeFromSeq(seq: number): string {
  return `SOP-${String(seq).padStart(2, "0")}-2026`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateShort(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

export function formatTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  return `${formatDate(d)} · ${formatTime(d)}`;
}

export function relativeTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "hace instantes";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.round(hr / 24);
  if (day < 30) return `hace ${day} d`;
  return formatDate(d);
}

export function daysUntil(iso: string): number {
  const d = new Date(iso);
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const PRIORITY_RANK: Record<Priority, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baja: 3,
};

export const PRIORITY_DOT: Record<Priority, string> = {
  critica: "bg-critical",
  alta: "bg-warning",
  media: "bg-info",
  baja: "bg-ink-faint",
};

export function slaState(dueISO: string, stage: Stage): "ok" | "soon" | "overdue" | "done" {
  if (stage === "cierre" || stage === "rechazado") return "done";
  const days = daysUntil(dueISO);
  if (days < 0) return "overdue";
  if (days <= 2) return "soon";
  return "ok";
}
