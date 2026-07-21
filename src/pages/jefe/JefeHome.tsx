import { useMemo, useState } from "react";
import {
  Rocket,
  FileText,
  MapPin,
  Calendar,
  Clock,
  User,
  Flag,
  Building2,
  Timer,
  Download,
  Send,
  Check,
  X,
  AlertCircle,
  Image as ImageIcon,
  Video,
  Paperclip,
  ChevronRight,
  CheckCircle2,
  Activity,
  ClipboardList,
  ShieldCheck,
  Mail,
  StickyNote,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { JefeShell } from "@/design-system/layout/JefeShell";
import { Card } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { Field, Input, Textarea } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { Pill, PriorityPill } from "@/design-system/primitives/Pill";
import { Progress, EmptyState } from "@/design-system/primitives/Progress";
import {
  AREA_HEADS,
  AREA_LABELS,
  EVENT_LABELS,
  PRIORITY_LABELS,
  type ActionItem,
  type CaseFile,
  type Evidence,
} from "@/lib/types";
import { cn, formatDate, formatDateTime, relativeTime, daysUntil } from "@/lib/utils";

export function JefeHome() {
  const s = useStore();
  const { cases, currentUser } = s;

  // Casos asignados al jefe: cualquier caso en ejecucion/verificacion asignado a mantenimiento
  const myCases = useMemo(
    () => cases.filter(
      (c) => (c.stage === "ejecucion" || c.stage === "verificacion") &&
             (c.assigneeArea === "mantenimiento" || c.assignee === currentUser.name || c.area === "mantenimiento")
    ),
    [cases, currentUser.name]
  );

  const activeCase: CaseFile | undefined = myCases.find((c) => c.stage === "ejecucion") ?? myCases[0];

  return (
    <JefeShell>
      {activeCase ? (
        <PlanExecutionView c={activeCase} s={s} />
      ) : (
        <NoPlanAssigned />
      )}
    </JefeShell>
  );
}

/* ─── Sin plan asignado ─── */
function NoPlanAssigned() {
  const { currentUser } = useStore();
  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl bg-brand-gradient text-white p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="relative">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/70">Portal del Jefe de Área</p>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight font-display">Hola, {currentUser.name.split(" ")[0]}</h1>
          <p className="text-[13.5px] text-white/80 mt-2">No tiene Planes de Acción asignados pendientes de ejecución en este momento.</p>
        </div>
      </div>
      <EmptyState
        className="mt-6"
        icon={<ClipboardList className="h-5 w-5" />}
        title="Sin planes activos"
        description="Cuando Seguridad Operativa apruebe y asigne un Plan de Acción a su área, aparecerá aquí para su ejecución."
      />
      <Card className="mt-6 p-5">
        <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-3">¿Qué puede hacer aquí?</p>
        <ul className="space-y-2.5">
          {[
            { icon: Rocket, text: "Ejecutar las actividades del Plan de Acción asignado" },
            { icon: Activity, text: "Registrar avances, comentarios y evidencias" },
            { icon: Timer, text: "Solicitar ampliación de plazo si necesita más tiempo" },
            { icon: Send, text: "Enviar el plan a verificación al finalizar" },
          ].map((it, i) => (
            <li key={i} className="flex items-center gap-3 text-[13px] text-ink-soft">
              <span className="h-8 w-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0"><it.icon className="h-4 w-4" /></span>
              {it.text}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ─── Vista principal de ejecución ─── */
function PlanExecutionView({ c, s }: { c: CaseFile; s: ReturnType<typeof useStore> }) {
  const [extOpen, setExtOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  if (!c.actionPlan) {
    return <EmptyState icon={<FileText className="h-5 w-5" />} title="Plan no disponible" description="El plan de acción no está disponible." />;
  }

  const plan = c.actionPlan;
  const items = plan.items;
  const completed = items.filter((it) => it.status === "completado").length;
  const inProgress = items.filter((it) => it.status === "en_progreso").length;
  const overallProgress = c.execution?.progress ?? 0;
  const allComplete = items.length > 0 && items.every((it) => it.status === "completado");
  const days = daysUntil(c.slaDueDate);
  const accepted = !!c.execution?.acceptedByAreaAt;
  const isVerification = c.stage === "verificacion";

  const counts = {
    fotos: c.evidence.filter((e) => e.kind === "foto").length,
    videos: c.evidence.filter((e) => e.kind === "video").length,
    documentos: c.evidence.filter((e) => e.kind === "documento").length,
    comentarios: items.reduce((acc, it) => acc + it.comments.length, 0) + (c.execution?.updates.length ?? 0),
  };

  return (
    <div className="space-y-5">
      {/* Banner de bienvenida */}
      <div className="rounded-2xl bg-brand-gradient text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-70" />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/70">Plan de Acción asignado</p>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight font-display leading-tight">Ejecute su Plan de Acción</h1>
          <p className="text-[13.5px] text-white/80 mt-2 max-w-xl">Tiene un plan asignado por Seguridad Operativa. Registre avances, adjunte evidencias y envíe a verificación al finalizar.</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-2.5 py-1 text-[11.5px] font-medium text-white">{c.id}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-2.5 py-1 text-[11.5px] font-medium text-white">{EVENT_LABELS[c.type]}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 border border-white/20 px-2.5 py-1 text-[11.5px] font-medium text-white">Área {AREA_LABELS[c.assigneeArea ?? c.area]}</span>
          </div>
        </div>
      </div>

      {/* Tarjeta destacada + countdown */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Expediente asignado</p>
              <h2 className="mt-1 text-[18px] font-bold text-ink tracking-tight leading-tight">{c.title}</h2>
            </div>
            {isVerification ? <Pill tone="warning" dot>Pendiente de Verificación</Pill> : <Pill tone="brand" dot>En Ejecución</Pill>}
          </div>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            <InfoCell icon={<FileText className="h-3.5 w-3.5" />} label="Código" value={c.id} />
            <InfoCell icon={<Flag className="h-3.5 w-3.5" />} label="Tipo de incidencia" value={EVENT_LABELS[c.type]} />
            <InfoCell icon={<MapPin className="h-3.5 w-3.5" />} label="Estación" value={c.station} />
            <InfoCell icon={<Building2 className="h-3.5 w-3.5" />} label="Área responsable" value={AREA_LABELS[c.assigneeArea ?? c.area]} />
            <InfoCell icon={<User className="h-3.5 w-3.5" />} label="Jefe asignado" value={c.assignee ?? "—"} />
            <div className="flex items-center gap-2.5">
              <span className="text-ink-faint"><Flag className="h-3.5 w-3.5" /></span>
              <div>
                <p className="text-[10.5px] text-ink-faint">Prioridad</p>
                <div className="mt-0.5"><PriorityPill priority={c.priority} /></div>
              </div>
            </div>
            <InfoCell icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha de asignación" value={formatDate(plan.submittedAt ?? c.createdAt)} />
            <InfoCell icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha límite" value={formatDate(c.slaDueDate)} />
          </div>
        </Card>

        {/* Countdown */}
        <CountdownCard days={days} isVerification={isVerification} />
      </div>

      {/* Barra de progreso general */}
      <Card className="p-5">
        <div className="flex items-end justify-between gap-4 mb-3 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint">Avance general del plan</p>
            <p className="text-[26px] font-bold text-ink tabular-nums leading-none mt-1">{overallProgress}%</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Indicator label="Actividades" value={items.length} icon={<ClipboardList className="h-4 w-4" />} />
            <Indicator label="Completadas" value={completed} icon={<CheckCircle2 className="h-4 w-4" />} tone="brand" />
            <Indicator label="En proceso" value={inProgress} icon={<Activity className="h-4 w-4" />} tone="info" />
            <Indicator label="Comentarios" value={counts.comentarios} icon={<StickyNote className="h-4 w-4" />} />
          </div>
        </div>
        <Progress value={overallProgress} className="h-3" showLabel />
      </Card>

      {/* Plan de Acción + sidebar */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 space-y-5">
          {/* Plan de Acción */}
          <Card padded={false}>
            <div className="p-5 border-b border-line-soft flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center"><ClipboardList className="h-4.5 w-4.5" /></div>
                <div>
                  <h3 className="text-[15px] font-bold text-ink leading-tight">Plan de Acción</h3>
                  <p className="text-[12px] text-ink-quiet">Información enviada por Seguridad Operativa</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadPlan(c)}>
                <Download className="h-4 w-4" /> Descargar Plan
              </Button>
            </div>
            <div className="p-5">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-4">
                <PlanMeta label="Objetivo" value={plan.actionType} />
                <PlanMeta label="Responsable que elaboró" value={plan.elaboratedBy} />
                <PlanMeta label="Fecha de creación" value={formatDate(plan.submittedAt ?? c.createdAt)} />
                <PlanMeta label="Nivel de prioridad" value={PRIORITY_LABELS[plan.priority]} />
                <PlanMeta label="Tiempo estimado" value={plan.estimatedTime} />
                <PlanMeta label="Fecha límite" value={formatDate(plan.dueDate)} />
              </div>
              <div className="space-y-3 pt-3 border-t border-line-soft">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">Descripción general</p>
                  <p className="text-[13px] text-ink-soft leading-relaxed mt-1">{plan.description || "—"}</p>
                </div>
                {plan.observations && (
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">Observaciones generales</p>
                    <p className="text-[13px] text-ink-soft leading-relaxed mt-1">{plan.observations}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Tabla de actividades */}
          <Card padded={false}>
            <div className="p-5 border-b border-line-soft">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center"><Activity className="h-4.5 w-4.5" /></div>
                <div>
                  <h3 className="text-[15px] font-bold text-ink leading-tight">Actividades del Plan</h3>
                  <p className="text-[12px] text-ink-quiet">{items.length} actividades · {completed} completadas</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface/60 border-b border-line">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Actividad</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint w-[130px]">Responsable</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint w-[110px]">Inicio</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint w-[110px]">Límite</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint w-[100px]">Estado</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint w-[120px]">Avance</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint w-[80px] text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-surface/40 transition-colors">
                      <td className="px-4 py-3.5 max-w-[260px]">
                        <p className="text-[13px] font-semibold text-ink truncate">{it.name}</p>
                        {it.description && <p className="text-[11.5px] text-ink-quiet truncate mt-0.5">{it.description}</p>}
                      </td>
                      <td className="px-4 py-3.5"><span className="text-[12px] text-ink-soft truncate block">{it.owner}</span></td>
                      <td className="px-4 py-3.5"><span className="text-[12px] text-ink-soft tabular-nums">{formatDate(it.startDate)}</span></td>
                      <td className="px-4 py-3.5"><span className="text-[12px] text-ink-soft tabular-nums">{formatDate(it.dueDate)}</span></td>
                      <td className="px-4 py-3.5">
                        <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full",
                          it.status === "completado" ? "bg-brand-50 text-brand-800" : it.status === "en_progreso" ? "bg-info-soft text-info-ink" : "bg-surface-2 text-ink-quiet")}>
                          {it.status === "completado" ? "Finalizada" : it.status === "en_progreso" ? "En proceso" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Progress value={it.progress} className="w-[60px]" />
                          <span className="text-[11px] tabular-nums text-ink-quiet w-8">{it.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button variant="outline" size="sm" onClick={() => setActiveItemId(it.id)} disabled={isVerification}>
                          Registrar <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Cronograma visual */}
          <Card padded={false}>
            <div className="p-5 border-b border-line-soft">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center"><TrendingUp className="h-4.5 w-4.5" /></div>
                <div>
                  <h3 className="text-[15px] font-bold text-ink leading-tight">Cronograma de actividades</h3>
                  <p className="text-[12px] text-ink-quiet">Línea de tiempo de ejecución</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="relative">
                <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-line" />
                <div className="space-y-4">
                  {items.map((it, i) => {
                    const done = it.status === "completado";
                    const active = it.status === "en_progreso";
                    return (
                      <div key={it.id} className="relative pl-10">
                        <div className={cn("absolute left-0 top-0.5 h-6 w-6 rounded-full grid place-items-center border-2 border-white shrink-0",
                          done ? "bg-brand-700 text-white" : active ? "bg-info text-white" : "bg-surface-2 text-ink-faint border-line")}>
                          {done ? <Check className="h-3 w-3" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink leading-tight">{it.name}</p>
                          <span className="text-[11px] tabular-nums text-ink-quiet shrink-0">{formatDate(it.startDate)} → {formatDate(it.dueDate)}</span>
                        </div>
                        <p className="text-[11.5px] text-ink-quiet mt-0.5">{it.owner} · {it.progress}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar de acciones */}
        <div className="space-y-5 lg:sticky lg:top-24">
          {!accepted && !isVerification && (
            <Card className="border-brand-200 bg-brand-50/40">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-brand-700 text-white grid place-items-center shrink-0"><ShieldCheck className="h-4.5 w-4.5" /></div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-ink">Plan recibido</p>
                  <p className="text-[12px] text-ink-soft mt-0.5 mb-3">Acepte el plan para iniciar la ejecución.</p>
                  <Button size="sm" className="w-full" onClick={() => s.acceptPlan(c.id)}><Check className="h-4 w-4" /> Aceptar Plan</Button>
                </div>
              </div>
            </Card>
          )}

          {c.extensionRequest && !c.extensionRequest.decision && (
            <Card className="border-warning/30 bg-warning-soft/40">
              <div className="flex items-start gap-3">
                <Timer className="h-5 w-5 text-warning-ink shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-ink">Ampliación solicitada</p>
                  <p className="text-[12px] text-ink-soft mt-0.5">{c.extensionRequest.motivo}</p>
                  <p className="text-[11px] text-ink-quiet mt-1">Pendiente de decisión de SO.</p>
                </div>
              </div>
            </Card>
          )}

          {!isVerification && (
            <Card>
              <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-3">Acciones del jefe</p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setExtOpen(true)}>
                  <Timer className="h-4 w-4" /> Solicitar ampliación de plazo
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => downloadPlan(c)}>
                  <Download className="h-4 w-4" /> Descargar Plan de Acción
                </Button>
              </div>
            </Card>
          )}

          {!isVerification && (
            <Card className={cn(allComplete ? "border-brand-300 bg-brand-50/50" : "")}>
              <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-3">Finalización</p>
              {allComplete ? (
                <>
                  <div className="rounded-lg bg-brand-50 border border-brand-200 p-3 mb-3 flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-brand-700 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-brand-800">Todas las actividades están completadas. Puede enviar el plan a verificación.</p>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => setSendOpen(true)}>
                    <Send className="h-4 w-4" /> Enviar para Verificación
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[12px] text-ink-soft mb-3">Complete todas las actividades para habilitar el envío a verificación.</p>
                  <Button size="sm" className="w-full" disabled>
                    <Send className="h-4 w-4" /> Enviar para Verificación
                  </Button>
                  <p className="text-[11px] text-ink-faint mt-2 text-center">{completed} de {items.length} actividades completadas</p>
                </>
              )}
            </Card>
          )}

          {isVerification && (
            <Card className="border-warning/30">
              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-warning-ink shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-ink">En verificación</p>
                  <p className="text-[12px] text-ink-soft mt-0.5">El plan fue enviado a Seguridad Operativa. Espere la decisión de cierre.</p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-3">Evidencias registradas</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <EvStat icon={<ImageIcon className="h-4 w-4" />} value={counts.fotos} label="Fotos" />
              <EvStat icon={<Video className="h-4 w-4" />} value={counts.videos} label="Videos" />
              <EvStat icon={<FileText className="h-4 w-4" />} value={counts.documentos} label="Docs" />
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: Solicitar ampliación */}
      <ExtensionModal open={extOpen} onClose={() => setExtOpen(false)} caseId={c.id} />

      {/* Modal: Enviar a verificación */}
      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title="Enviar plan para verificación"
        subtitle={`${c.id} · el expediente vuelve a Seguridad Operativa`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSendOpen(false)}>Cancelar</Button>
            <Button onClick={() => { s.completeExecution(c.id); setSendOpen(false); }}>
              <Send className="h-4 w-4" /> Confirmar envío
            </Button>
          </>
        }
      >
        <div className="rounded-lg bg-brand-50 border border-brand-200 p-3.5 flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-brand-700 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-brand-800">
            Al enviar, el caso pasa a <span className="font-semibold">Pendiente de Verificación</span>. Se notificará a Seguridad Operativa y se enviará un correo confirmando la ejecución.
          </p>
        </div>
      </Modal>

      {/* Panel lateral: registro de avances */}
      {activeItemId && (
        <ActivityDrawer
          caseId={c.id}
          item={items.find((it) => it.id === activeItemId)!}
          onClose={() => setActiveItemId(null)}
        />
      )}
    </div>
  );
}

/* ─── Countdown card ─── */
function CountdownCard({ days, isVerification }: { days: number; isVerification: boolean }) {
  const isOverdue = days < 0;
  const isSoon = days >= 0 && days <= 2;
  const bg = isOverdue ? "bg-critical-soft border-critical/20" : isSoon ? "bg-warning-soft border-warning/25" : "bg-brand-gradient border-transparent";

  return (
    <Card className={cn("p-5 text-white border-0 relative overflow-hidden", bg)}>
      <div className="relative">
        <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-white/70">{isVerification ? "Caso en verificación" : "Tiempo restante"}</p>
        {isVerification ? (
          <>
            <p className="mt-3 text-[28px] font-bold tabular-nums leading-none">—</p>
            <p className="text-[12.5px] text-white/80 mt-2">Pendiente de decisión de Seguridad Operativa.</p>
          </>
        ) : (
          <>
            <p className="mt-3 text-[44px] font-bold tabular-nums leading-none">
              {isOverdue ? Math.abs(days) : days}
              <span className="text-[18px] font-semibold ml-1.5">{isOverdue ? "d vencido" : "d"}</span>
            </p>
            <p className="text-[12.5px] text-white/80 mt-2">{isOverdue ? "El plazo del plan está vencido." : isSoon ? "El plazo vence pronto." : "Días restantes antes del vencimiento."}</p>
            <div className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, Math.max(15, isOverdue ? 100 : (days / 14) * 100))}%` }} />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ─── Extension modal ─── */
function ExtensionModal({ open, onClose, caseId }: { open: boolean; onClose: () => void; caseId: string }) {
  const s = useStore();
  const c = s.getCase(caseId);
  const [motivo, setMotivo] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [evidencias, setEvidencias] = useState<Evidence[]>([]);

  const addEv = (kind: Evidence["kind"]) => {
    const names: Record<typeof kind, [string, string]> = {
      foto: ["ampliacion.jpg", "2.4 MB"], video: ["ampliacion.mp4", "14.8 MB"], documento: ["ampliacion.pdf", "640 KB"],
    };
    const [name, size] = names[kind];
    setEvidencias((p) => [...p, { id: `ev_${Math.random().toString(36).slice(2, 9)}`, kind, name: name.replace(/(\.\w+)$/, `_${p.length + 1}$1`), size, at: new Date().toISOString() }]);
  };

  const canSend = motivo.trim() && justificacion.trim() && nuevaFecha;

  const submit = () => {
    if (!canSend) return;
    s.requestExtension(caseId, { motivo: motivo.trim(), justificacion: justificacion.trim(), nuevaFecha });
    evidencias.forEach((ev) => s.addExecutionEvidence(caseId, ev));
    setMotivo(""); setJustificacion(""); setEvidencias([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Solicitar ampliación de plazo"
      subtitle="Para el Plan de Acción asignado"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSend}><Send className="h-4 w-4" /> Enviar solicitud a SO</Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Contexto del caso */}
        <div className="rounded-xl bg-surface border border-line p-4">
          <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-2">Plan de Acción al que solicita ampliación</p>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-mono text-[13px] font-bold text-brand-700">{caseId}</span>
            {c && <span className="text-[12.5px] text-ink-soft">·</span>}
            {c && <span className="text-[12.5px] text-ink-soft truncate">{c.title}</span>}
          </div>
          {c?.actionPlan && (
            <div className="mt-2 pt-2 border-t border-line-soft grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              <div><span className="text-ink-faint">Fecha límite actual:</span> <span className="text-ink font-medium">{formatDate(c.slaDueDate)}</span></div>
              <div><span className="text-ink-faint">Días restantes:</span> <span className="text-ink font-medium">{Math.max(0, Math.ceil((new Date(c.slaDueDate).getTime() - Date.now()) / 86400000))} días</span></div>
              <div><span className="text-ink-faint">Actividades:</span> <span className="text-ink font-medium">{c.actionPlan.items.length}</span></div>
              <div><span className="text-ink-faint">Avance:</span> <span className="text-ink font-medium">{c.execution?.progress ?? 0}%</span></div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-info-soft border border-info/20 p-3.5 flex items-start gap-2.5">
          <Mail className="h-4 w-4 text-info-ink shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-info-ink">La solicitud se notificará a Seguridad Operativa y se enviará un correo. Quedará registrada en el historial del expediente.</p>
        </div>
        <Field label="Motivo de la solicitud" required>
          <Input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Razón principal por la que necesita más tiempo para ejecutar el plan…" />
        </Field>
        <Field label="Justificación" required>
          <Textarea value={justificacion} onChange={(e) => setJustificacion(e.target.value)} rows={3} placeholder="Justifique detalladamente por qué no podrá completar el plan en el plazo asignado…" />
        </Field>
        <Field label="Nueva fecha propuesta" required>
          <Input type="date" value={nuevaFecha} onChange={(e) => setNuevaFecha(e.target.value)} />
        </Field>
        <div className="pt-3 border-t border-line-soft">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2">Evidencias (opcional)</p>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Button variant="outline" size="sm" onClick={() => addEv("foto")}><ImageIcon className="h-4 w-4" /> Foto</Button>
            <Button variant="outline" size="sm" onClick={() => addEv("documento")}><FileText className="h-4 w-4" /> Documento</Button>
            <Button variant="outline" size="sm" onClick={() => addEv("video")}><Video className="h-4 w-4" /> Video</Button>
          </div>
          {evidencias.length > 0 && (
            <div className="space-y-1.5">
              {evidencias.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 p-2 rounded-md bg-surface text-[12px]">
                  <Paperclip className="h-3.5 w-3.5 text-ink-faint" /> {ev.name} <span className="text-ink-faint">· {ev.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Panel lateral: registro de avances ─── */
function ActivityDrawer({ caseId, item, onClose }: { caseId: string; item: ActionItem; onClose: () => void }) {
  const s = useStore();
  const [progress, setProgress] = useState(item.progress);
  const [comment, setComment] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const addEv = (kind: Evidence["kind"]) => {
    const names: Record<typeof kind, [string, string]> = {
      foto: ["avance.jpg", "2.4 MB"], video: ["avance.mp4", "14.8 MB"], documento: ["avance.pdf", "640 KB"],
    };
    const [name, size] = names[kind];
    s.addExecutionEvidence(caseId, { id: `ev_${Math.random().toString(36).slice(2, 9)}`, kind, name: name.replace(/(\.\w+)$/, `_${Date.now() % 1000}$1`), size, at: new Date().toISOString() });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px] animate-[fadeIn_0.2s_ease-out]" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-[var(--shadow-pop)] animate-[riseUp_0.25s_ease-out] flex flex-col">
        <div className="p-5 border-b border-line-soft flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Actividad</p>
            <h3 className="mt-1 text-[16px] font-bold text-ink leading-tight">{item.name}</h3>
            {item.description && <p className="text-[12px] text-ink-soft mt-1 leading-relaxed">{item.description}</p>}
          </div>
          <button onClick={onClose} className="shrink-0 h-8 w-8 grid place-items-center rounded-lg text-ink-quiet hover:bg-surface-2 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-surface border border-line p-3 text-[12px]">
            <div><p className="text-ink-faint">Responsable</p><p className="text-ink font-medium mt-0.5">{item.owner}</p></div>
            <div><p className="text-ink-faint">Prioridad</p><p className="text-ink font-medium mt-0.5">{PRIORITY_LABELS[item.priority]}</p></div>
            <div><p className="text-ink-faint">Inicio</p><p className="text-ink font-medium mt-0.5">{formatDate(item.startDate)}</p></div>
            <div><p className="text-ink-faint">Límite</p><p className="text-ink font-medium mt-0.5">{formatDate(item.dueDate)}</p></div>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2">Estado actual</p>
            <div className="flex gap-2">
              {(["pendiente", "en_progreso", "completado"] as const).map((st) => (
                <button key={st} onClick={() => s.updateActionItem(caseId, item.id, { status: st })}
                  className={cn("flex-1 h-9 rounded-lg text-[11.5px] font-medium transition-all",
                    item.status === st ? st === "completado" ? "bg-brand-700 text-white" : st === "en_progreso" ? "bg-info text-white" : "bg-surface-3 text-ink" : "bg-surface text-ink-soft hover:bg-surface-2")}>
                  {st === "completado" ? "Finalizada" : st === "en_progreso" ? "En proceso" : "Pendiente"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint">Porcentaje de avance</p>
              <span className="text-[13px] tabular-nums font-semibold text-ink">{progress}%</span>
            </div>
            <input type="range" min={0} max={100} step={10} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-brand-700" />
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => s.updateActionItem(caseId, item.id, { progress })}>
              <Check className="h-4 w-4" /> Guardar porcentaje
            </Button>
          </div>

          <Field label="Fecha de ejecución">
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </Field>

          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2">Registrar comentario</p>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Describa el avance realizado…" />
            <Button size="sm" variant="secondary" className="w-full mt-2" disabled={!comment.trim()}
              onClick={() => { if (comment.trim()) { s.updateActionItem(caseId, item.id, { comment: comment.trim() }); setComment(""); } }}>
              <StickyNote className="h-4 w-4" /> Agregar comentario
            </Button>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2">Adjuntar evidencias</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => addEv("foto")}><ImageIcon className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => addEv("video")}><Video className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => addEv("documento")}><FileText className="h-4 w-4" /></Button>
            </div>
          </div>

          {item.comments.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2">Comentarios registrados</p>
              <div className="space-y-1.5">
                {item.comments.map((cm, i) => <div key={i} className="rounded-md bg-surface p-2.5 text-[12px] text-ink-soft">{cm}</div>)}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-line-soft bg-surface/50">
          {item.status !== "completado" ? (
            <Button className="w-full" onClick={() => { s.updateActionItem(caseId, item.id, { status: "completado", progress: 100 }); onClose(); }}>
              <CheckCircle2 className="h-4 w-4" /> Marcar actividad como finalizada
            </Button>
          ) : (
            <div className="rounded-lg bg-brand-50 border border-brand-200 p-3 flex items-center gap-2 text-[12.5px] text-brand-800">
              <CheckCircle2 className="h-4 w-4" /> Actividad finalizada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="text-ink-faint shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10.5px] text-ink-faint">{label}</p>
        <p className="text-[12.5px] text-ink font-medium leading-snug mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}

function Indicator({ label, value, icon, tone = "neutral" }: { label: string; value: number; icon: React.ReactNode; tone?: "neutral" | "brand" | "info" }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-7 w-7 rounded-lg grid place-items-center", tone === "brand" ? "bg-brand-50 text-brand-700" : tone === "info" ? "bg-info-soft text-info-ink" : "bg-surface-2 text-ink-soft")}>{icon}</span>
      <div>
        <p className="text-[15px] font-bold tabular-nums text-ink leading-none">{value}</p>
        <p className="text-[10.5px] text-ink-quiet mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function PlanMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="text-[13px] text-ink font-medium mt-0.5">{value}</p>
    </div>
  );
}

function EvStat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-lg bg-surface p-2.5">
      <div className="flex items-center justify-center text-ink-soft">{icon}</div>
      <p className="text-[16px] font-bold tabular-nums text-ink mt-1">{value}</p>
      <p className="text-[10.5px] text-ink-quiet">{label}</p>
    </div>
  );
}

/* ─── Descargar plan (PDF) ─── */
function downloadPlan(c: CaseFile) {
  if (!c.actionPlan) return;
  const plan = c.actionPlan;
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = plan.items.map((it, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${escapeHtml(it.name)}</strong><br/><span style="color:#666;font-size:11px">${escapeHtml(it.description)}</span></td>
      <td>${escapeHtml(it.owner)}</td>
      <td>${formatDate(it.startDate)}</td>
      <td>${formatDate(it.dueDate)}</td>
      <td>${it.status === "completado" ? "Finalizada" : it.status === "en_progreso" ? "En proceso" : "Pendiente"}</td>
      <td>${it.progress}%</td>
    </tr>`).join("");
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Plan de Acción ${c.id}</title>
    <style>
      body { font-family: 'Inter', -apple-system, sans-serif; color: #182621; margin: 40px; }
      .head { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #14814a; padding-bottom: 16px; margin-bottom: 24px; }
      .logo { width: 44px; height: 44px; background: #0F6B3E; border-radius: 10px; display: grid; place-items: center; color: #fff; font-weight: 700; }
      h1 { font-size: 22px; margin: 0; } h2 { font-size: 15px; margin: 20px 0 10px; color: #0F6B3E; border-bottom: 1px solid #e3e8e5; padding-bottom: 6px; }
      .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 12.5px; margin-bottom: 12px; }
      .meta div { border-left: 2px solid #14814a; padding-left: 8px; } .meta b { color: #767f79; font-weight: 600; font-size: 10.5px; text-transform: uppercase; }
      table { width: 100%; border-collapse: collapse; font-size: 11.5px; } th, td { border: 1px solid #e3e8e5; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: #f6f8f7; font-weight: 600; color: #41504a; } .foot { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e3e8e5; font-size: 10.5px; color: #767f79; }
    </style></head><body>
    <div class="head"><div class="logo">S1</div><div><h1>Plan de Acción — SIGMA L1</h1><div style="color:#767f79;font-size:12px">Línea 1 del Metro de Lima · Seguridad Operativa</div></div></div>
    <h2>Información del expediente</h2>
    <div class="meta">
      <div><b>Código</b><br/>${c.id}</div>
      <div><b>Tipo de incidencia</b><br/>${EVENT_LABELS[c.type]}</div>
      <div><b>Estación</b><br/>${escapeHtml(c.station)}</div>
      <div><b>Área responsable</b><br/>${AREA_LABELS[c.assigneeArea ?? c.area]}</div>
      <div><b>Prioridad</b><br/>${PRIORITY_LABELS[c.priority]}</div>
      <div><b>Fecha límite</b><br/>${formatDate(c.slaDueDate)}</div>
    </div>
    <h2>Objetivo del Plan de Acción</h2>
    <p style="font-size:12.5px">${escapeHtml(plan.actionType)} — ${escapeHtml(plan.description)}</p>
    <div class="meta">
      <div><b>Elaborado por</b><br/>${escapeHtml(plan.elaboratedBy)}</div>
      <div><b>Fecha de creación</b><br/>${formatDate(plan.submittedAt ?? c.createdAt)}</div>
      <div><b>Tiempo estimado</b><br/>${escapeHtml(plan.estimatedTime)}</div>
      <div><b>Prioridad del plan</b><br/>${PRIORITY_LABELS[plan.priority]}</div>
    </div>
    ${plan.observations ? `<h2>Observaciones generales</h2><p style="font-size:12.5px">${escapeHtml(plan.observations)}</p>` : ""}
    <h2>Actividades</h2>
    <table><thead><tr><th>#</th><th>Actividad</th><th>Responsable</th><th>Inicio</th><th>Límite</th><th>Estado</th><th>Avance</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="foot">Documento generado por SIGMA L1 · ${formatDateTime(new Date().toISOString())}</div>
    </body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 400);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]!));
}
