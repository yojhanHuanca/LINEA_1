import { Link } from "react-router-dom";
import { Plus, FileText, Clock, CheckCircle2, Bell, ArrowRight, Mail, MapPin, AlertCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { ReportanteShell } from "@/design-system/layout/ReportanteShell";
import { WelcomeBanner } from "@/design-system/layout/WelcomeBanner";
import { Card } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { StagePill, PriorityPill, Pill, RiskPill } from "@/design-system/primitives/Pill";
import { EmptyState } from "@/design-system/primitives/Progress";
import { EVENT_LABELS, STAGE_STATUS } from "@/lib/types";
import { cn, formatDate, relativeTime, slaState } from "@/lib/utils";

export function ReportanteHome() {
  const { cases, notifications, currentUser } = useStore();
  const myCases = cases.filter((c) => c.reporter === "Carlos Núñez" || c.reporterRole === "reportante" && c.reporter === currentUser.name);
  const myPending = myCases.filter((c) => STAGE_STATUS[c.stage] === "abierto");
  const myClosed = myCases.filter((c) => STAGE_STATUS[c.stage] === "cerrado");
  const pendingInfo = myCases.filter((c) => c.pendingInfoRequest);
  const unread = notifications.filter((n) => !n.read && n.audience !== "seguridad");

  const quickStats = [
    { label: "Reportes activos", value: myPending.length, icon: Clock, tone: "brand" },
    { label: "Casos cerrados", value: myClosed.length, icon: CheckCircle2, tone: "neutral" },
    { label: "Solicitudes pendientes", value: pendingInfo.length, icon: Mail, tone: "warning" },
    { label: "Sin leer", value: unread.length, icon: Bell, tone: "info" },
  ] as const;

  return (
    <ReportanteShell>
      <WelcomeBanner
        greeting={`Hola, ${currentUser.name.split(" ")[0]}`}
        subtitle="Registre una nueva incidencia o siga el estado de sus reportes. Su aporte mantiene la operación segura."
        meta={
          <>
            <Pill tone="brand" dot>{myPending.length} casos en seguimiento</Pill>
            {pendingInfo.length > 0 && <Pill tone="warning" dot>{pendingInfo.length} solicitud de información</Pill>}
          </>
        }
      />

      {/* Quick action + stats */}
      <div className="mt-6 grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 bg-brand-gradient text-white border-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh opacity-70" />
          <div className="relative">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/70">
              Acción rápida
            </p>
            <h3 className="mt-2 text-[20px] font-bold leading-tight font-display">
              ¿Detectó una situación de riesgo?
            </h3>
            <p className="mt-2 text-[13px] text-white/80">
              Registre un nuevo reporte en menos de un minuto con el asistente guiado.
            </p>
            <Link to="/reportante/nuevo" className="mt-5 inline-block">
              <span className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-white text-brand-800 font-semibold text-[13px] hover:bg-white/90 transition-colors">
                <Plus className="h-4 w-4" /> Registrar reporte
              </span>
            </Link>
          </div>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {quickStats.map((s) => (
            <Card key={s.label} className="flex items-center gap-4 p-5">
              <div
                className={cn(
                  "h-11 w-11 rounded-xl grid place-items-center shrink-0",
                  s.tone === "brand" && "bg-brand-50 text-brand-700",
                  s.tone === "neutral" && "bg-surface-2 text-ink-soft",
                  s.tone === "warning" && "bg-warning-soft text-warning-ink",
                  s.tone === "info" && "bg-info-soft text-info-ink"
                )}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[26px] font-bold tabular-nums text-ink leading-none">{s.value}</p>
                <p className="text-[12px] text-ink-quiet mt-1">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Pending info requests */}
      {pendingInfo.length > 0 && (
        <Card className="mt-5 border-warning/25 bg-warning-soft/40">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-warning/15 text-warning-ink grid place-items-center shrink-0">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
            <div className="flex-1">
              <p className="text-[13.5px] font-semibold text-ink">Seguridad Operativa le solicita información</p>
              <p className="text-[12.5px] text-ink-soft mt-0.5">
                Responda a las solicitudes para que su caso continúe su flujo.
              </p>
              <div className="mt-3 space-y-2">
                {pendingInfo.map((c) => (
                  <Link
                    key={c.id}
                    to="/reportante/notificaciones"
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-line hover:border-warning/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-ink truncate">{c.id} · {c.title}</p>
                      <p className="text-[11.5px] text-ink-quiet truncate mt-0.5">{c.pendingInfoRequest?.question}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-warning-ink shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent reports */}
      <div className="mt-7 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-bold text-ink tracking-tight">Mis reportes recientes</h2>
          <p className="text-[12.5px] text-ink-quiet mt-0.5">Estado actual de sus últimos casos registrados</p>
        </div>
        <Link to="/reportante/mis-reportes">
          <Button variant="outline" size="sm">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {myCases.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<FileText className="h-5 w-5" />}
          title="Aún no ha registrado reportes"
          description="Cuando registre una incidencia, aparecerá aquí con su código de caso y estado."
          action={
            <Link to="/reportante/nuevo">
              <Button size="sm"><Plus className="h-4 w-4" /> Registrar mi primer reporte</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-4 space-y-3">
          {myCases.slice(0, 5).map((c) => {
            const sla = slaState(c.slaDueDate, c.stage);
            return (
              <Card key={c.id} hover className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-mono font-semibold text-brand-700">{c.id}</span>
                    <span className="text-[12px] text-ink-faint">·</span>
                    <span className="text-[12px] text-ink-soft">{EVENT_LABELS[c.type]}</span>
                  </div>
                  <p className="text-[13.5px] font-semibold text-ink truncate mt-0.5">{c.title}</p>
                  <p className="text-[11.5px] text-ink-quiet mt-0.5 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {c.station} · {formatDate(c.createdAt)}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0">
                  <StagePill stage={c.stage} />
                  <RiskPill risk={c.riskLevel} />
                </div>
                <Link to="/reportante/mis-reportes" className="shrink-0">
                  <Button variant="ghost" size="sm">Detalle <ArrowRight className="h-3.5 w-3.5" /></Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </ReportanteShell>
  );
}

