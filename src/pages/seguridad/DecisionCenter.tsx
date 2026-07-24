import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon, ClipboardList, Timer, FileSearch, RefreshCw, Bell,
  ChevronRight, Check, X, ArrowRight, AlertTriangle, Activity,
  TrendingUp, Inbox, ShieldCheck, Clock, Flag, Building2, User as UserIcon,
  ArrowUpDown, Eye, Zap, Lock, AlertCircle, Info,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { SegShell } from "@/design-system/layout/SegShell";
import { Card } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { Modal } from "@/design-system/primitives/Modal";
import { Pill, PriorityPill, RiskPill } from "@/design-system/primitives/Pill";
import { Textarea } from "@/design-system/primitives/Input";
import {
  AREA_LABELS, EVENT_LABELS, STAGE_LABELS,
  type CaseFile, riskCategory,
} from "@/lib/types";
import { cn, formatDate, relativeTime, daysUntil, slaState } from "@/lib/utils";

type SectionId = "all" | "aprobaciones" | "planes" | "prorrogas" | "criticos" | "reaperturas" | "alertas";

export function DecisionCenter() {
  const store = useStore();
  const { cases } = store;
  const [section, setSection] = useState<SectionId>("all");

  // ─── Calcular elementos pendientes por categoría ───
  const data = useMemo(() => {
    // 1. Solicitudes de aprobación: casos en recepcion o evaluacion
    const aprobaciones = cases.filter((c) => c.stage === "recepcion" || c.stage === "evaluacion");

    // 2. Planes pendientes de aprobación: casos en plan_accion sin reviewDecision
    const planes = cases.filter((c) => c.stage === "plan_accion" && c.actionPlan && !c.actionPlan.reviewDecision);

    // 3. Solicitudes de prórroga: casos con extensionRequest sin decisión
    const prorrogas = cases.filter((c) => c.extensionRequest && !c.extensionRequest.decision);

    // 4. Casos críticos: prioridad critica y abiertos
    const criticos = cases.filter((c) => riskCategory(c.riskLevel) === "inaceptable" && c.stage !== "cierre" && c.stage !== "rechazado");

    // 5. Solicitudes de reapertura: casos cerrados (simulamos que hay solicitudes)
    // Por ahora no hay un mecanismo de solicitud de reapertura desde reportante, así que mostramos los cerrados recientemente
    const reaperturas: CaseFile[] = []; // se llena cuando haya solicitudes

    // 6. Alertas: SLA vencido, plan vencido, sin movimiento, críticos sin responsable
    const alertas = cases.filter((c) => {
      if (c.stage === "cierre" || c.stage === "rechazado") return false;
      const sla = slaState(c.slaDueDate, c.stage);
      if (sla === "overdue") return true;
      // Casos sin movimiento: más de 5 días sin timeline
      const lastActivity = c.timeline[c.timeline.length - 1];
      if (lastActivity) {
        const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity.at).getTime()) / 86400000);
        if (daysSinceActivity > 5) return true;
      }
      // Críticos sin responsable
      if (riskCategory(c.riskLevel) === "inaceptable" && !c.assignee && c.stage !== "recepcion" && c.stage !== "evaluacion") return true;
      return false;
    });

    return { aprobaciones, planes, prorrogas, criticos, reaperturas, alertas };
  }, [cases]);

  const counts = {
    aprobaciones: data.aprobaciones.length,
    planes: data.planes.length,
    prorrogas: data.prorrogas.length,
    criticos: data.criticos.length,
    reaperturas: data.reaperturas.length,
    alertas: data.alertas.length,
  };

  const totalPendientes = counts.aprobaciones + counts.planes + counts.prorrogas + counts.criticos + counts.reaperturas + counts.alertas;

  const indicators = [
    { id: "all" as const, label: "Todo", count: totalPendientes, color: "#14814a", bg: "bg-brand-50", text: "text-brand-800", icon: Inbox },
    { id: "criticos" as const, label: "Casos críticos", count: counts.criticos, color: "#d23a2c", bg: "bg-critical-soft", text: "text-critical-ink", icon: AlertOctagon },
    { id: "planes" as const, label: "Planes pendientes", count: counts.planes, color: "#d99520", bg: "bg-warning-soft", text: "text-warning-ink", icon: ClipboardList },
    { id: "prorrogas" as const, label: "Prórrogas", count: counts.prorrogas, color: "#d99520", bg: "bg-warning-soft", text: "text-warning-ink", icon: Timer },
    { id: "aprobaciones" as const, label: "Aprobaciones", count: counts.aprobaciones, color: "#2c7be0", bg: "bg-info-soft", text: "text-info-ink", icon: FileSearch },
    { id: "reaperturas" as const, label: "Reaperturas", count: counts.reaperturas, color: "#14814a", bg: "bg-brand-50", text: "text-brand-800", icon: RefreshCw },
    { id: "alertas" as const, label: "Alertas", count: counts.alertas, color: "#767f79", bg: "bg-surface-2", text: "text-ink-soft", icon: Bell },
  ];

  return (
    <SegShell>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-ink tracking-tight">Centro de Decisiones</h1>
          <p className="text-[13px] text-ink-quiet mt-1">Bandeja de aprobaciones y autorizaciones · {totalPendientes} elementos pendientes de decisión</p>
        </div>
        <Pill tone={totalPendientes > 0 ? "critical" : "brand"} dot>
          {totalPendientes > 0 ? `${totalPendientes} pendientes` : "Al día"}
        </Pill>
      </div>

      {/* Panel resumen con indicadores */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {indicators.map((ind) => (
          <button
            key={ind.id}
            onClick={() => setSection(ind.id)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5",
              section === ind.id ? "border-2 ring-2 ring-offset-2 ring-offset-white" : "border-line bg-white",
              section === ind.id && ind.id === "all" && "ring-brand/20 border-brand/30",
              section === ind.id && ind.id === "criticos" && "ring-critical/20 border-critical/30",
              section === ind.id && (ind.id === "planes" || ind.id === "prorrogas") && "ring-warning/20 border-warning/30",
              section === ind.id && ind.id === "aprobaciones" && "ring-info/20 border-info/30",
              section === ind.id && ind.id === "reaperturas" && "ring-brand/20 border-brand/30",
              section === ind.id && ind.id === "alertas" && "ring-ink-faint/20",
            )}
            style={section === ind.id ? { borderColor: ind.color, boxShadow: `0 0 0 2px ${ind.color}20` } : undefined}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn("h-8 w-8 rounded-lg grid place-items-center", ind.bg, ind.text)}>
                <ind.icon className="h-4.5 w-4.5" />
              </div>
              {ind.count > 0 && (
                <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color: ind.color }}>{ind.count}</span>
              )}
            </div>
            <p className="text-[12px] font-semibold text-ink leading-tight">{ind.label}</p>
            {ind.count === 0 && <p className="text-[10.5px] text-ink-faint mt-0.5">Sin pendientes</p>}
          </button>
        ))}
      </div>

      {/* Contenido — tarjetas de decisión */}
      <div className="mt-5 space-y-6">
        {(section === "all" || section === "criticos") && data.criticos.length > 0 && (
          <DecisionSection title="Casos Críticos" subtitle="Requieren atención inmediata" icon={AlertOctagon} tone="critical" items={data.criticos} type="criticos" store={store} />
        )}
        {(section === "all" || section === "aprobaciones") && data.aprobaciones.length > 0 && (
          <DecisionSection title="Solicitudes de Aprobación" subtitle="Casos que necesitan ser aprobados para continuar" icon={FileSearch} tone="info" items={data.aprobaciones} type="aprobaciones" store={store} />
        )}
        {(section === "all" || section === "planes") && data.planes.length > 0 && (
          <DecisionSection title="Planes de Acción Pendientes" subtitle="Planes enviados por jefes de área, requieren revisión" icon={ClipboardList} tone="warning" items={data.planes} type="planes" store={store} />
        )}
        {(section === "all" || section === "prorrogas") && data.prorrogas.length > 0 && (
          <DecisionSection title="Solicitudes de Prórroga" subtitle="Responsables que solicitan ampliación de plazo" icon={Timer} tone="warning" items={data.prorrogas} type="prorrogas" store={store} />
        )}
        {(section === "all" || section === "reaperturas") && data.reaperturas.length > 0 && (
          <DecisionSection title="Solicitudes de Reapertura" subtitle="Casos cerrados que necesitan volver a abrirse" icon={RefreshCw} tone="brand" items={data.reaperturas} type="reaperturas" store={store} />
        )}
        {(section === "all" || section === "alertas") && data.alertas.length > 0 && (
          <DecisionSection title="Alertas Importantes" subtitle="SLA vencido, planes vencidos, casos sin movimiento" icon={Bell} tone="neutral" items={data.alertas} type="alertas" store={store} />
        )}

        {/* Empty state */}
        {totalPendientes === 0 && (
          <Card className="p-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-700 grid place-items-center mx-auto">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="mt-4 text-[16px] font-bold text-ink">No hay decisiones pendientes</p>
            <p className="text-[13px] text-ink-quiet mt-1">Todas las aprobaciones, planes y solicitudes están al día.</p>
          </Card>
        )}

        {/* Empty state por sección */}
        {totalPendientes > 0 && section !== "all" && (
          (section === "criticos" && data.criticos.length === 0) ||
          (section === "aprobaciones" && data.aprobaciones.length === 0) ||
          (section === "planes" && data.planes.length === 0) ||
          (section === "prorrogas" && data.prorrogas.length === 0) ||
          (section === "reaperturas" && data.reaperturas.length === 0) ||
          (section === "alertas" && data.alertas.length === 0)
        ) && (
          <Card className="p-10 text-center">
            <p className="text-[14px] font-semibold text-ink">Sin elementos en esta categoría</p>
            <p className="text-[13px] text-ink-quiet mt-1">No hay decisiones pendientes en esta bandeja.</p>
          </Card>
        )}
      </div>
    </SegShell>
  );
}

/* ═══ Sección de decisiones ═══ */
function DecisionSection({
  title, subtitle, icon: Icon, tone, items, type, store,
}: {
  title: string;
  subtitle: string;
  icon: typeof AlertOctagon;
  tone: "critical" | "warning" | "info" | "brand" | "neutral";
  items: CaseFile[];
  type: SectionId;
  store: ReturnType<typeof useStore>;
}) {
  const toneClasses = {
    critical: { bg: "bg-critical-soft", text: "text-critical-ink", border: "border-critical/20", dot: "bg-critical" },
    warning: { bg: "bg-warning-soft", text: "text-warning-ink", border: "border-warning/25", dot: "bg-warning" },
    info: { bg: "bg-info-soft", text: "text-info-ink", border: "border-info/20", dot: "bg-info" },
    brand: { bg: "bg-brand-50", text: "text-brand-800", border: "border-brand-200", dot: "bg-brand-600" },
    neutral: { bg: "bg-surface-2", text: "text-ink-soft", border: "border-line", dot: "bg-ink-faint" },
  };
  const tc = toneClasses[tone];

  return (
    <div>
      {/* Header de sección */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={cn("h-9 w-9 rounded-lg grid place-items-center", tc.bg, tc.text)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-ink">{title}</h2>
            <span className={cn("text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full", tc.bg, tc.text)}>{items.length}</span>
          </div>
          <p className="text-[12px] text-ink-quiet">{subtitle}</p>
        </div>
      </div>

      {/* Grid de tarjetas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((c) => (
          <DecisionCard key={c.id} c={c} type={type} tone={tone} store={store} />
        ))}
      </div>
    </div>
  );
}

/* ═══ Tarjeta de decisión ═══ */
function DecisionCard({
  c, type, tone, store,
}: {
  c: CaseFile;
  type: SectionId;
  tone: "critical" | "warning" | "info" | "brand" | "neutral";
  store: ReturnType<typeof useStore>;
}) {
  const [actionModal, setActionModal] = useState<{ action: string; note: string } | null>(null);
  const [note, setNote] = useState("");

  const days = daysUntil(c.slaDueDate);
  const sla = slaState(c.slaDueDate, c.stage);
  const isCritical = riskCategory(c.riskLevel) === "inaceptable";

  const cardBorder = isCritical ? "border-critical/30" : tone === "warning" ? "border-warning/25" : tone === "info" ? "border-info/20" : "border-line";
  const cardBg = isCritical ? "bg-critical-soft/30" : "bg-white";

  const executeAction = (action: string) => {
    if (action === "aprobar_caso") {
      store.approveCase(c.id);
    } else if (action === "rechazar_caso") {
      if (note.trim()) { store.rejectCase(c.id, note.trim()); setActionModal(null); setNote(""); }
    } else if (action === "solicitar_info") {
      if (note.trim()) { store.requestInfo(c.id, note.trim()); setActionModal(null); setNote(""); }
    } else if (action === "aprobar_plan") {
      store.reviewActionPlan(c.id, "aprobado", note.trim() || undefined);
      setActionModal(null); setNote("");
    } else if (action === "devolver_plan") {
      store.reviewActionPlan(c.id, "rechazado", note.trim() || undefined);
      setActionModal(null); setNote("");
    } else if (action === "aprobar_prorroga") {
      if (c.extensionRequest) {
        store.reviewExtension(c.id, "aprobada", note.trim() || undefined);
      }
      setActionModal(null); setNote("");
    } else if (action === "rechazar_prorroga") {
      store.reviewExtension(c.id, "rechazada", note.trim() || undefined);
      setActionModal(null); setNote("");
    } else if (action === "aprobar_reapertura") {
      store.reopenCaseWithReason(c.id, "verificacion", note.trim() || "Reapertura aprobada desde Centro de Decisiones");
      setActionModal(null); setNote("");
    } else if (action === "mantener_cerrado") {
      store.addTimelineComment(c.id, `Solicitud de reapertura rechazada: ${note.trim() || "Se mantiene el caso cerrado"}`);
      setActionModal(null); setNote("");
    }
  };

  return (
    <Card className={cn("p-4 border", cardBorder, cardBg, isCritical && "ring-1 ring-critical/10")}>
      {/* Header de tarjeta */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] font-bold text-brand-700">{c.id}</span>
            {isCritical && <span className="h-2 w-2 rounded-full bg-critical animate-[pulseSoft_2s_ease-in-out_infinite]" />}
          </div>
          <p className="text-[13px] font-semibold text-ink leading-snug line-clamp-2">{c.title}</p>
        </div>
        <RiskPill risk={c.riskLevel} />
      </div>

      {/* Info específica por tipo */}
      <div className="space-y-1.5 mb-3">
        {type === "aprobaciones" && (
          <>
            <CardMeta icon={<Flag className="h-3 w-3" />} label="Tipo" value={EVENT_LABELS[c.type]} />
            <CardMeta icon={<Building2 className="h-3 w-3" />} label="Estación" value={c.station} />
            <CardMeta icon={<Clock className="h-3 w-3" />} label="Estado" value={STAGE_LABELS[c.stage]} />
          </>
        )}
        {type === "planes" && c.actionPlan && (
          <>
            <CardMeta icon={<Building2 className="h-3 w-3" />} label="Área" value={c.assigneeArea ? AREA_LABELS[c.assigneeArea] : "—"} />
            <CardMeta icon={<UserIcon className="h-3 w-3" />} label="Responsable" value={c.assignee ?? "—"} />
            <CardMeta icon={<Calendar className="h-3 w-3" />} label="Fecha límite" value={formatDate(c.slaDueDate)} />
            <CardMeta icon={<Activity className="h-3 w-3" />} label="Actividades" value={`${c.actionPlan.items.length}`} />
          </>
        )}
        {type === "prorrogas" && c.extensionRequest && (
          <>
            <CardMeta icon={<UserIcon className="h-3 w-3" />} label="Responsable" value={c.assignee ?? "—"} />
            <CardMeta icon={<Building2 className="h-3 w-3" />} label="Área" value={c.assigneeArea ? AREA_LABELS[c.assigneeArea] : "—"} />
            <CardMeta icon={<Clock className="h-3 w-3" />} label="Fecha original" value={formatDate(c.slaDueDate)} />
            <CardMeta icon={<Calendar className="h-3 w-3" />} label="Nueva fecha" value={formatDate(c.extensionRequest.nuevaFecha)} />
            <div className="pt-1">
              <p className="text-[10.5px] font-medium text-ink-faint">Motivo</p>
              <p className="text-[11.5px] text-ink-soft mt-0.5 line-clamp-2">{c.extensionRequest.motivo}</p>
            </div>
          </>
        )}
        {type === "criticos" && (
          <>
            <CardMeta icon={<Flag className="h-3 w-3" />} label="Tipo" value={EVENT_LABELS[c.type]} />
            <CardMeta icon={<Building2 className="h-3 w-3" />} label="Estación" value={c.station} />
            <CardMeta icon={<Clock className="h-3 w-3" />} label="Estado" value={STAGE_LABELS[c.stage]} />
            <CardMeta icon={<UserIcon className="h-3 w-3" />} label="Responsable" value={c.assignee ?? "Sin asignar"} />
            {sla === "overdue" && (
              <div className="rounded-md bg-critical-soft border border-critical/20 px-2 py-1 text-[11px] text-critical-ink flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> SLA vencido {Math.abs(days)} días
              </div>
            )}
          </>
        )}
        {type === "reaperturas" && (
          <>
            <CardMeta icon={<Clock className="h-3 w-3" />} label="Cerrado" value={formatDate(c.closedAt ?? "")} />
            <CardMeta icon={<UserIcon className="h-3 w-3" />} label="Responsable" value={c.assignee ?? "—"} />
          </>
        )}
        {type === "alertas" && (
          <>
            <CardMeta icon={<Clock className="h-3 w-3" />} label="Estado" value={STAGE_LABELS[c.stage]} />
            {sla === "overdue" && (
              <div className="rounded-md bg-critical-soft border border-critical/20 px-2 py-1 text-[11px] text-critical-ink flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> SLA vencido {Math.abs(days)} días
              </div>
            )}
            {!c.assignee && riskCategory(c.riskLevel) !== "inaceptable" && (
              <div className="rounded-md bg-warning-soft border border-warning/20 px-2 py-1 text-[11px] text-warning-ink flex items-center gap-1.5">
                <AlertCircle className="h-3 w-3" /> Sin responsable asignado
              </div>
            )}
          </>
        )}
      </div>

      {/* Botones de acción según tipo */}
      <div className="pt-3 border-t border-line-soft space-y-2">
        {type === "aprobaciones" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" onClick={() => executeAction("aprobar_caso")}><Check className="h-3.5 w-3.5" /> Aprobar</Button>
            <Button variant="outline" size="sm" onClick={() => setActionModal({ action: "solicitar_info", note: "" })}><Info className="h-3.5 w-3.5" /> Solicitar cambios</Button>
            <Button variant="ghost" size="sm" className="text-critical hover:bg-critical-soft" onClick={() => setActionModal({ action: "rechazar_caso", note: "" })}><X className="h-3.5 w-3.5" /> Rechazar</Button>
          </div>
        )}
        {type === "planes" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" onClick={() => executeAction("aprobar_plan")}><Check className="h-3.5 w-3.5" /> Aprobar</Button>
            <Button variant="outline" size="sm" onClick={() => setActionModal({ action: "devolver_plan", note: "" })}><ArrowUpDown className="h-3.5 w-3.5" /> Devolver</Button>
            <Link to={`/seguridad/casos/${c.id}`} className="ml-auto"><Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /> Ver</Button></Link>
          </div>
        )}
        {type === "prorrogas" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" onClick={() => executeAction("aprobar_prorroga")}><Check className="h-3.5 w-3.5" /> Aprobar</Button>
            <Button variant="ghost" size="sm" className="text-critical hover:bg-critical-soft" onClick={() => setActionModal({ action: "rechazar_prorroga", note: "" })}><X className="h-3.5 w-3.5" /> Rechazar</Button>
            <Link to={`/seguridad/casos/${c.id}`} className="ml-auto"><Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /> Ver</Button></Link>
          </div>
        )}
        {type === "criticos" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/seguridad/casos/${c.id}`}><Button size="sm" variant="danger"><Eye className="h-3.5 w-3.5" /> Ver expediente</Button></Link>
            <Button variant="outline" size="sm" onClick={() => store.addTimelineComment(c.id, "Caso escalado a gerencia por prioridad crítica")}><Zap className="h-3.5 w-3.5" /> Escalar</Button>
            <Button variant="ghost" size="sm" onClick={() => store.addTimelineComment(c.id, "Caso priorizado por Centro de Decisiones")}><Flag className="h-3.5 w-3.5" /> Priorizar</Button>
          </div>
        )}
        {type === "reaperturas" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" onClick={() => setActionModal({ action: "aprobar_reapertura", note: "" })}><RefreshCw className="h-3.5 w-3.5" /> Aprobar reapertura</Button>
            <Button variant="ghost" size="sm" className="text-critical hover:bg-critical-soft" onClick={() => setActionModal({ action: "mantener_cerrado", note: "" })}><Lock className="h-3.5 w-3.5" /> Mantener cerrado</Button>
          </div>
        )}
        {type === "alertas" && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/seguridad/casos/${c.id}`}><Button variant="outline" size="sm"><Eye className="h-3.5 w-3.5" /> Ver expediente</Button></Link>
            {isCritical && <Button variant="ghost" size="sm" onClick={() => store.addTimelineComment(c.id, "Alerta revisada desde Centro de Decisiones")}><Check className="h-3.5 w-3.5" /> Revisar</Button>}
          </div>
        )}
      </div>

      {/* Modal de acción con nota */}
      <Modal
        open={!!actionModal}
        onClose={() => { setActionModal(null); setNote(""); }}
        title={
          actionModal?.action === "rechazar_caso" ? "Rechazar caso" :
          actionModal?.action === "solicitar_info" ? "Solicitar cambios / información" :
          actionModal?.action === "devolver_plan" ? "Devolver plan para corrección" :
          actionModal?.action === "rechazar_prorroga" ? "Rechazar prórroga" :
          actionModal?.action === "aprobar_reapertura" ? "Aprobar reapertura" :
          actionModal?.action === "mantener_cerrado" ? "Mantener caso cerrado" : "Acción"
        }
        subtitle={`${c.id} · ${c.title}`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setActionModal(null); setNote(""); }}>Cancelar</Button>
            <Button
              variant={actionModal?.action === "rechazar_caso" || actionModal?.action === "rechazar_prorroga" || actionModal?.action === "mantener_cerrado" ? "danger" : "primary"}
              onClick={() => actionModal && executeAction(actionModal.action)}
              disabled={actionModal?.action === "rechazar_caso" && !note.trim()}
            >
              <Check className="h-4 w-4" /> Confirmar
            </Button>
          </>
        }
      >
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={
            actionModal?.action === "rechazar_caso" ? "Motivo del rechazo (obligatorio)…" :
            actionModal?.action === "solicitar_info" ? "Qué información o cambios necesita…" :
            actionModal?.action === "devolver_plan" ? "Qué debe corregir el jefe del área…" :
            actionModal?.action === "rechazar_prorroga" ? "Por qué se rechaza la prórroga…" :
            actionModal?.action === "aprobar_reapertura" ? "Motivo de la reapertura (opcional)…" :
            actionModal?.action === "mantener_cerrado" ? "Por qué se mantiene cerrado…" : "Nota…"
          }
        />
      </Modal>
    </Card>
  );
}

function CardMeta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11.5px]">
      <span className="text-ink-faint shrink-0">{icon}</span>
      <span className="text-ink-faint">{label}:</span>
      <span className="text-ink-soft font-medium truncate">{value}</span>
    </div>
  );
}

function Calendar({ className }: { className?: string }) {
  return <Clock className={className} />;
}
