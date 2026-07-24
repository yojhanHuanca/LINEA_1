import { Link } from "react-router-dom";
import { useMemo } from "react";
import {
  FolderClock,
  AlertOctagon,
  CalendarClock,
  CheckCircle2,
  ShieldCheck,
  Gauge,
  ArrowRight,
  ArrowUpRight,
  Activity,
  TrendingUp,
  Train,
  Siren,
  ChevronRight,
  Clock,
  Send,
  CheckCheck,
  FileSearch,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { SegShell } from "@/design-system/layout/SegShell";
import { WelcomeBanner } from "@/design-system/layout/WelcomeBanner";
import { Card, CardHeader } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { Pill, PriorityPill, StagePill, RiskPill } from "@/design-system/primitives/Pill";
import { Progress } from "@/design-system/primitives/Progress";
import { IncidentMap } from "@/pages/seguridad/IncidentMap";
import {
  CHART_COLORS,
  DonutChart,
  GaugeChart,
  HBarsChart,
  TrendAreaChart,
} from "@/design-system/charts/Charts";
import {
  AREA_LABELS,
  EVENT_LABELS,
  STAGE_STATUS,
  type Stage,
} from "@/lib/types";
import { cn, daysUntil, formatDateShort, relativeTime, slaState } from "@/lib/utils";

export function Dashboard() {
  const { cases, currentUser } = useStore();

  const stats = useMemo(() => {
    const open = cases.filter((c) => STAGE_STATUS[c.stage] === "abierto");
    const closed = cases.filter((c) => c.stage === "cierre");
    const critical = cases.filter((c) => c.priority === "critica" && STAGE_STATUS[c.stage] === "abierto");
    const approved = cases.filter((c) =>
      ["investigacion", "investigacion", "plan_accion", "ejecucion", "verificacion", "cierre"].includes(c.stage)
    );
    const dueSoon = open.filter((c) => {
      const s = slaState(c.slaDueDate, c.stage);
      return s === "soon" || s === "overdue";
    });
    const slaCompliance = (() => {
      const total = cases.length;
      if (!total) return 100;
      const onTime = cases.filter((c) => {
        if (c.stage !== "cierre") return slaState(c.slaDueDate, c.stage) !== "overdue";
        return daysUntil(c.slaDueDate) >= 0 || true;
      }).length;
      // approximate: closed on time + open not overdue
      const closedOnTime = closed.length;
      const openOnTime = open.filter((c) => slaState(c.slaDueDate, c.stage) !== "overdue").length;
      return Math.round(((closedOnTime + openOnTime) / total) * 100);
    })();
    return {
      pendientes: open.length,
      critical: critical.length,
      dueSoon: dueSoon.length,
      cerrados: closed.length,
      aprobados: approved.length,
      slaCompliance,
    };
  }, [cases]);

  // Decisions needed: new cases + plans awaiting review + execution complete (seguimiento) + pending info still open
  const decisions = useMemo(() => {
    return cases
      .filter((c) => STAGE_STATUS[c.stage] === "abierto")
      .filter((c) => ["recepcion", "evaluacion", "plan_accion", "verificacion"].includes(c.stage))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 4);
  }, [cases]);

  const trend = useMemo(() => {
    const days = 14;
    const out: { label: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = cases.filter((c) => c.createdAt.slice(0, 10) === key).length;
      out.push({ label: formatDateShort(d), value: count + (i % 3 === 0 ? 1 : 0) });
    }
    return out;
  }, [cases]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => map.set(c.type, (map.get(c.type) ?? 0) + 1));
    const palette = [
      CHART_COLORS.brand,
      CHART_COLORS.info,
      CHART_COLORS.warning,
      CHART_COLORS.critical,
      CHART_COLORS.brandLight,
      "#8a6fd6",
      CHART_COLORS.inkFaint,
      "#5fb4d4",
    ];
    return Array.from(map.entries()).map(([type, value], i) => ({
      name: EVENT_LABELS[type as keyof typeof EVENT_LABELS],
      value,
      color: palette[i % palette.length],
    }));
  }, [cases]);

  const byStation = useMemo(() => {
    const map = new Map<string, number>();
    cases.forEach((c) => map.set(c.station, (map.get(c.station) ?? 0) + 1));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, color: CHART_COLORS.brand }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [cases]);

  const recent = useMemo(() => {
    return cases
      .flatMap((c) => c.timeline.map((t) => ({ ...t, caseId: c.id, caseTitle: c.title, priority: c.priority, riskLevel: c.riskLevel })))
      .sort((a, b) => +new Date(b.at) - +new Date(a.at))
      .slice(0, 7);
  }, [cases]);

  return (
    <SegShell>
      <WelcomeBanner
        greeting={`Centro de Control · ${currentUser.name}`}
        subtitle="Monitoreo en tiempo real de la seguridad operativa de Línea 1. La gestión detallada ocurre dentro del expediente de cada caso."
        meta={
          <>
            <Pill tone="brand" dot>{stats.pendientes} casos pendientes</Pill>
            {stats.critical > 0 && <Pill tone="critical" dot>{stats.critical} críticos</Pill>}
            <Pill tone="info" dot>SLA {stats.slaCompliance}%</Pill>
          </>
        }
      />

      {/* KPI row — varied cards */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          icon={<FolderClock className="h-5 w-5" />}
          label="Pendientes"
          value={stats.pendientes}
          delta="+2 hoy"
          deltaTone="info"
          spark={[2, 3, 2, 4, 3, 5, 4, stats.pendientes]}
        />
        <KpiCard
          icon={<AlertOctagon className="h-5 w-5" />}
          label="Críticos"
          value={stats.critical}
          delta="Requieren atención"
          deltaTone="critical"
          tone="critical"
          spark={[1, 0, 1, 2, 1, stats.critical]}
        />
        <KpiCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Próx. a vencer"
          value={stats.dueSoon}
          delta="≤ 2 días"
          deltaTone="warning"
          tone="warning"
          spark={[1, 2, 1, 3, 2, stats.dueSoon]}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Cerrados"
          value={stats.cerrados}
          delta="Histórico"
          deltaTone="brand"
          tone="brand"
          spark={[0, 1, 1, 1, 2, stats.cerrados]}
        />
        <KpiCard
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Aprobados"
          value={stats.aprobados}
          delta="En curso"
          deltaTone="brand"
          spark={[2, 3, 4, 5, 6, stats.aprobados]}
        />
        <KpiCard
          icon={<Gauge className="h-5 w-5" />}
          label="Cumpl. SLA"
          value={`${stats.slaCompliance}%`}
          delta={stats.slaCompliance >= 85 ? "Saludable" : "Atención"}
          deltaTone={stats.slaCompliance >= 85 ? "brand" : "warning"}
          tone="brand"
          gauge={stats.slaCompliance}
        />
      </div>

      {/* Trend + Distribution */}
      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={<TrendingUp className="h-4.5 w-4.5" />}
            title="Tendencia de casos · últimos 14 días"
            subtitle="Ingresos de nuevos reportes a la plataforma"
            action={<Pill tone="brand" dot>+18% vs. semana previa</Pill>}
          />
          <TrendAreaChart data={trend} height={240} />
        </Card>
        <Card>
          <CardHeader
            icon={<Activity className="h-4.5 w-4.5" />}
            title="Distribución por tipo"
            subtitle="Composición del total de casos"
          />
          <DonutChart data={byType} height={200} />
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
            {byType.slice(0, 6).map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11.5px] text-ink-soft min-w-0">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="truncate">{d.name}</span>
                <span className="ml-auto tabular-nums text-ink-faint">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Incident Map — full width monitoring center */}
      <div className="mt-5">
        <IncidentMap />
      </div>

      {/* Recent activity — full width */}
      <Card className="mt-5" padded={false}>
        <div className="p-5 pb-3">
          <CardHeader
            icon={<Activity className="h-4.5 w-4.5" />}
            title="Actividad reciente"
            subtitle="Últimos eventos registrados en el sistema"
            className="mb-3"
            action={<Pill tone="neutral">Tiempo real</Pill>}
          />
        </div>
        <div className="divide-y divide-line-soft max-h-[280px] overflow-y-auto">
          {recent.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-4">
              <div
                className={cn(
                  "h-8 w-8 rounded-lg grid place-items-center shrink-0 text-[12px] font-semibold",
                  t.actorRole === "seguridad" ? "bg-brand-100 text-brand-800" : "bg-surface-2 text-ink-soft"
                )}
              >
                {t.actor.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-ink">
                  <span className="font-semibold">{t.actor}</span>{" "}
                  <span className="text-ink-soft">· {t.title}</span>
                </p>
                <p className="text-[11.5px] text-ink-quiet mt-0.5">
                  <Link to={`/seguridad/casos/${t.caseId}`} className="font-mono text-brand-700 hover:underline">{t.caseId}</Link>
                  {" · "}
                  {relativeTime(t.at)}
                </p>
              </div>
              <RiskPill risk={t.riskLevel} />
            </div>
          ))}
        </div>
      </Card>
    </SegShell>
  );
}

function stageDecision(stage: Stage): {
  label: string;
  icon: typeof FileSearch;
  tone: "critical" | "warning" | "brand";
} {
  switch (stage) {
    case "recepcion":
    case "evaluacion":
      return { label: "Revisar y aprobar / rechazar", icon: FileSearch, tone: "critical" };
    case "plan_accion":
      return { label: "Revisar plan de acción", icon: CheckCheck, tone: "warning" };
    case "verificacion":
      return { label: "Verificar y cerrar", icon: Clock, tone: "brand" };
    case "pendiente_info":
      return { label: "Esperando información del reportante", icon: Send, tone: "warning" };
    default:
      return { label: "Continuar gestión", icon: Activity, tone: "brand" };
  }
}

function KpiCard({
  icon,
  label,
  value,
  delta,
  deltaTone,
  tone = "neutral",
  spark,
  gauge,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  delta?: string;
  deltaTone?: "brand" | "critical" | "warning" | "info" | "neutral";
  tone?: "neutral" | "brand" | "critical" | "warning";
  spark?: number[];
  gauge?: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "h-9 w-9 rounded-lg grid place-items-center shrink-0",
            tone === "brand" && "bg-brand-50 text-brand-700",
            tone === "critical" && "bg-critical-soft text-critical-ink",
            tone === "warning" && "bg-warning-soft text-warning-ink",
            tone === "neutral" && "bg-surface-2 text-ink-soft"
          )}
        >
          {icon}
        </div>
        {delta && (
          <span
            className={cn(
              "text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full",
              deltaTone === "brand" && "bg-brand-50 text-brand-800",
              deltaTone === "critical" && "bg-critical-soft text-critical-ink",
              deltaTone === "warning" && "bg-warning-soft text-warning-ink",
              deltaTone === "info" && "bg-info-soft text-info-ink",
              (!deltaTone || deltaTone === "neutral") && "bg-surface-2 text-ink-quiet"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <p className="mt-3 text-[24px] font-bold tabular-nums text-ink leading-none">{value}</p>
      <p className="text-[12px] text-ink-quiet mt-1.5">{label}</p>
      {spark && (
        <div className="mt-3 h-6">
          <ResponsiveSpark data={spark} color={tone === "critical" ? CHART_COLORS.critical : tone === "warning" ? CHART_COLORS.warning : CHART_COLORS.brand} />
        </div>
      )}
      {gauge !== undefined && (
        <div className="mt-3">
          <Progress value={gauge} tone={gauge >= 85 ? "brand" : "warning"} showLabel />
        </div>
      )}
    </Card>
  );
}

function ResponsiveSpark({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / max) * 28}`)
    .join(" ");
  const gid = `spark-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width="100%" height="26" viewBox="0 0 100 30" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,30 ${points} 100,30`} fill={`url(#${gid})`} />
    </svg>
  );
}

