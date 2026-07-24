import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Priority, Stage, RiskLevel } from "@/lib/types";
import { PRIORITY_LABELS, STAGE_LABELS, STAGE_STATUS, RISK_LABELS, riskCategory, RISK_CATEGORY_TONE, RISK_CATEGORY_LABELS } from "@/lib/types";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "brand" | "critical" | "warning" | "info" | "success";
  dot?: boolean;
  children: ReactNode;
}

const TONES: Record<NonNullable<PillProps["tone"]>, string> = {
  neutral: "bg-surface-2 text-ink-soft border-line",
  brand: "bg-brand-50 text-brand-800 border-brand-200",
  critical: "bg-critical-soft text-critical-ink border-critical/20",
  warning: "bg-warning-soft text-warning-ink border-warning/25",
  info: "bg-info-soft text-info-ink border-info/20",
  success: "bg-brand-50 text-brand-800 border-brand-200",
};

const DOT_COLOR: Record<NonNullable<PillProps["tone"]>, string> = {
  neutral: "bg-ink-faint",
  brand: "bg-brand-600",
  critical: "bg-critical",
  warning: "bg-warning",
  info: "bg-info",
  success: "bg-brand-600",
};

export function Pill({ className, tone = "neutral", dot, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-none whitespace-nowrap",
        TONES[tone],
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", DOT_COLOR[tone])} />}
      {children}
    </span>
  );
}

const PRIORITY_TONE: Record<Priority, PillProps["tone"]> = {
  critica: "critical",
  alta: "warning",
  media: "info",
  baja: "neutral",
};

export function PriorityPill({ priority }: { priority: Priority }) {
  return (
    <Pill tone={PRIORITY_TONE[priority]} dot>
      {PRIORITY_LABELS[priority]}
    </Pill>
  );
}

export function RiskPill({ risk, showCategory = false, className }: { risk: RiskLevel; showCategory?: boolean; className?: string }) {
  const cat = riskCategory(risk);
  const tone = RISK_CATEGORY_TONE[cat];
  const label = showCategory ? `${risk} · ${RISK_CATEGORY_LABELS[cat]}` : risk;
  return (
    <Pill tone={tone} dot className={className}>
      {label}
    </Pill>
  );
}

const STAGE_TONE: Record<Stage, PillProps["tone"]> = {
  recepcion: "info",
  evaluacion: "info",
  pendiente_info: "warning",
  investigacion: "brand",
  plan_accion: "brand",
  ejecucion: "brand",
  verificacion: "warning",
  cierre: "neutral",
  rechazado: "critical",
};

export function StagePill({ stage, className }: { stage: Stage; className?: string }) {
  const status = STAGE_STATUS[stage];
  if (status === "cerrado") {
    return (
      <Pill tone="neutral" dot className={className}>
        {STAGE_LABELS[stage]}
      </Pill>
    );
  }
  return (
    <Pill tone={STAGE_TONE[stage]} dot className={className}>
      {STAGE_LABELS[stage]}
    </Pill>
  );
}
