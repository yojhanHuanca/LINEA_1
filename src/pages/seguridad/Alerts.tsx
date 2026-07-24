import { Link } from "react-router-dom";
import { useMemo } from "react";
import { AlertTriangle, AlertOctagon, Info, CheckCircle2, Bell, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { SegShell } from "@/design-system/layout/SegShell";
import { Card, CardHeader } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { Pill, PriorityPill, RiskPill } from "@/design-system/primitives/Pill";
import { EVENT_LABELS, STAGE_LABELS, STAGE_STATUS, type CaseFile, type Priority, riskCategory } from "@/lib/types";
import { cn, daysUntil, formatDate, relativeTime, slaState } from "@/lib/utils";

type AlertKind = "critical" | "warning" | "info";

const TONE_STYLES: Record<AlertKind, string> = {
  critical: "bg-critical-soft text-critical-ink",
  warning: "bg-warning-soft text-warning-ink",
  info: "bg-info-soft text-info-ink",
};

const KIND_META: Record<AlertKind, { icon: typeof AlertOctagon; label: string }> = {
  critical: { icon: AlertOctagon, label: "Crítica" },
  warning: { icon: AlertTriangle, label: "Advertencia" },
  info: { icon: Info, label: "Informativa" },
};

interface AlertItem {
  id: string;
  caseId: string;
  title: string;
  detail: string;
  at: string;
  kind: AlertKind;
  priority: Priority;
  c: CaseFile;
}

type AlertRule = (c: CaseFile) => Omit<AlertItem, "caseId" | "priority" | "c"> | null;

const ALERT_RULES: AlertRule[] = [
  (c) =>
    riskCategory(c.riskLevel) === "inaceptable"
      ? { id: `crit-${c.id}`, title: `Caso crítico sin cerrar · ${c.id}`, detail: `${EVENT_LABELS[c.type]} en ${c.station}. Riesgo inaceptable requiere atención inmediata.`, at: c.createdAt, kind: "critical" }
      : null,
  (c) => {
    const sla = slaState(c.slaDueDate, c.stage);
    const days = daysUntil(c.slaDueDate);
    if (sla === "overdue")
      return { id: `over-${c.id}`, title: `SLA vencido · ${c.id}`, detail: `Vencido hace ${Math.abs(days)} días. Estado actual: ${STAGE_LABELS[c.stage]}.`, at: c.slaDueDate, kind: "critical" };
    if (sla === "soon")
      return { id: `soon-${c.id}`, title: `SLA próximo a vencer · ${c.id}`, detail: `Vence en ${days} días. Verificar avance.`, at: c.slaDueDate, kind: "warning" };
    return null;
  },
  (c) =>
    c.pendingInfoRequest
      ? { id: `info-${c.id}`, title: `Información pendiente · ${c.id}`, detail: c.pendingInfoRequest.question, at: c.pendingInfoRequest.requestedAt, kind: "warning" }
      : null,
];

const KIND_ORDER: Record<AlertKind, number> = { critical: 0, warning: 1, info: 2 };

export function Alerts() {
  const { cases } = useStore();

  const alerts = useMemo<AlertItem[]>(() => {
    return cases
      .filter((c) => STAGE_STATUS[c.stage] === "abierto")
      .flatMap((c) =>
        ALERT_RULES.map((rule) => rule(c))
          .filter(Boolean)
          .map((a) => ({ ...a!, caseId: c.id, priority: c.priority, c }))
      )
      .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || +new Date(b.at) - +new Date(a.at));
  }, [cases]);

  const summary = useMemo(
    () => ({
      critical: alerts.filter((a) => a.kind === "critical").length,
      warning: alerts.filter((a) => a.kind === "warning").length,
      info: alerts.filter((a) => a.kind === "info").length,
    }),
    [alerts]
  );

  return (
    <SegShell>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-ink tracking-tight">Alertas operativas</h1>
          <p className="text-[13px] text-ink-quiet mt-1">Condiciones que requieren atención inmediata de Seguridad Operativa.</p>
        </div>
        <Button variant="outline" size="sm"><Bell className="h-4 w-4" /> Configurar alertas</Button>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {(Object.keys(KIND_META) as AlertKind[]).map((kind) => (
          <SummaryCard key={kind} kind={kind} label={KIND_META[kind].label + (kind === "critical" ? "s" : kind === "warning" ? "es" : "s")} value={summary[kind]} />
        ))}
      </div>

      <Card className="mt-5" padded={false}>
        <div className="p-5 pb-3">
          <CardHeader icon={<Bell className="h-4.5 w-4.5" />} title="Centro de alertas" subtitle="Ordenadas por severidad y fecha" className="mb-3" />
        </div>
        <div className="divide-y divide-line-soft">
          {alerts.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-brand-600 mx-auto" />
              <p className="text-[14px] font-semibold text-ink mt-3">Sin alertas activas</p>
              <p className="text-[12.5px] text-ink-quiet mt-1">Todos los casos están dentro de control.</p>
            </div>
          ) : (
            alerts.map((a) => {
              const meta = KIND_META[a.kind];
              const Icon = meta.icon;
              return (
                <Link key={a.id} to={`/seguridad/casos/${a.caseId}`} className="flex items-start gap-3 p-4 hover:bg-surface/50 transition-colors group">
                  <div className={cn("h-9 w-9 rounded-lg grid place-items-center shrink-0", TONE_STYLES[a.kind])}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13.5px] font-semibold text-ink">{a.title}</p>
                      <Pill tone={a.kind} dot>{meta.label}</Pill>
                      <RiskPill risk={a.c.riskLevel} />
                    </div>
                    <p className="text-[12.5px] text-ink-soft mt-1 leading-relaxed">{a.detail}</p>
                    <p className="text-[11px] text-ink-faint mt-1.5 flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> {relativeTime(a.at)} · {formatDate(a.at)}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </Card>
    </SegShell>
  );
}

function SummaryCard({ kind, label, value }: { kind: AlertKind; label: string; value: number }) {
  const Icon = KIND_META[kind].icon;
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0", TONE_STYLES[kind])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[26px] font-bold tabular-nums text-ink leading-none">{value}</p>
        <p className="text-[12px] text-ink-quiet mt-1.5">{label}</p>
      </div>
    </Card>
  );
}
