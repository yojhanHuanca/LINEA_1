import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  Send,
  FileText,
  Image as ImageIcon,
  Video,
  Check,
  X,
  AlertCircle,
  ShieldCheck,
  Shield,
  Mail,
  Microscope,
  ClipboardList,
  Rocket,
  Activity,
  CheckCircle2,
  CornerUpLeft,
  Plus,
  Download,
  Paperclip,
  Flag,
  Building2,
  ChevronRight,
  AlertTriangle,
  AlertOctagon,
  Timer,
  FileSearch,
  Gavel,
  Inbox,
  Search,
  StickyNote,
  UserPlus,
  UserX,
  UserCheck,
  Briefcase,
  Info,
  Train,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { SegShell } from "@/design-system/layout/SegShell";
import { Card } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { Field, Input, Select, Textarea } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { Pill, PriorityPill, StagePill, RiskPill } from "@/design-system/primitives/Pill";
import { Progress } from "@/design-system/primitives/Progress";
import {
  AREA_HEADS,
  AREA_LABELS,
  EVENT_LABELS,
  IMPLICATION_LABELS,
  LABOR_STATE_LABELS,
  PRIORITY_LABELS,
  RISK_LABELS,
  riskToPriority,
  TIPO_SOP_LABELS,
  SUBTIPO_SOP_LABELS,
  PROCEDENCIA_LABELS,
  ESTADO_HALLAZGO_LABELS,
  TIPO_HALLAZGO_LABELS,
  AREA_SOP_LABELS,
  TIPO_INCIDENTE_LABELS,
  UBICACION_LABELS,
  LUGAR_INCIDENTE_LABELS,
  MODELO_MR_LABELS,
  PERSONAL_FALLA_LABELS,
  TIPO_CAUSA_LABELS,
  RESPONSABLES_INVESTIGACION,
  RESPONSABLES_PLAN,
  STAGE_LABELS,
  STAGE_STATUS,
  type Area,
  type Evidence,
  type ImplicationType,
  type InvolvedWorker,
  type Investigation,
  type Priority,
  type RiskLevel,
  type Stage,
  type SubtipoSOP,
  type TipoIncidenteOperativo,
  type User,
} from "@/lib/types";
import { cn, formatDate, formatDateTime, relativeTime, slaState, daysUntil, uid } from "@/lib/utils";

// ─── Workflow de 7 etapas ──────────────────────────────────────────────
const STAGE_STEP: { stage: Stage; label: string; icon: typeof FileSearch }[] = [
  { stage: "recepcion", label: "Recepción", icon: Inbox },
  { stage: "evaluacion", label: "Evaluación", icon: FileSearch },
  { stage: "investigacion", label: "Investigación", icon: Microscope },
  { stage: "plan_accion", label: "Plan de Acción", icon: ClipboardList },
  { stage: "ejecucion", label: "Ejecución", icon: Rocket },
  { stage: "verificacion", label: "Verificación", icon: Activity },
  { stage: "cierre", label: "Cierre", icon: CheckCircle2 },
];

function stageStepIndex(stage: Stage): number {
  if (stage === "pendiente_info") return 0;
  if (stage === "rechazado") return -1;
  return STAGE_STEP.findIndex((s) => s.stage === stage);
}

export function CaseFile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const c = store.getCase(id ?? "");

  if (!c) {
    return (
      <SegShell>
        <Card className="text-center py-16">
          <p className="text-[16px] font-semibold text-ink">Expediente no encontrado</p>
          <p className="text-[13px] text-ink-quiet mt-1">El expediente {id} no existe o fue eliminado.</p>
          <Link to="/seguridad/casos" className="mt-4 inline-block">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Volver a casos</Button>
          </Link>
        </Card>
      </SegShell>
    );
  }

  const stepIdx = stageStepIndex(c.stage);
  const sla = slaState(c.slaDueDate, c.stage);
  const days = daysUntil(c.slaDueDate);

  return (
    <SegShell
      right={
        <Link to="/seguridad/casos">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /> Casos</Button>
        </Link>
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[14px] font-bold text-brand-700">{c.id}</span>
            <span className="text-ink-faint">·</span>
            <Pill tone="neutral">{EVENT_LABELS[c.type]}</Pill>
            <RiskPill risk={c.riskLevel} showCategory />
            <StagePill stage={c.stage} />
          </div>
          <h1 className="mt-2 text-[22px] font-bold text-ink tracking-tight leading-tight max-w-3xl">{c.title}</h1>
          <p className="text-[12.5px] text-ink-quiet mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {c.station} · {c.location}</span>
            <span className="text-ink-faint">·</span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {formatDate(c.date)} · {c.time}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sla !== "done" && sla !== "ok" && (
            <Pill tone={sla === "overdue" ? "critical" : "warning"} dot>
              <Timer className="h-3 w-3" /> SLA {sla === "overdue" ? `vencido ${Math.abs(days)}d` : `${days}d`}
            </Pill>
          )}
          <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Exportar PDF</Button>
        </div>
      </div>

      {/* Workflow visual superior */}
      <Card className="mt-5 p-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {STAGE_STEP.map((s, i) => {
            const done = i < stepIdx;
            const active = i === stepIdx;
            const rejected = c.stage === "rechazado" && i === 0;
            const pendingInfo = c.stage === "pendiente_info" && i === 0;
            return (
              <div key={s.stage} className="flex items-center shrink-0">
                <div className="flex items-center gap-2.5 px-2">
                  <div
                    className={cn(
                      "h-9 w-9 rounded-full grid place-items-center shrink-0 transition-all",
                      done && "bg-brand-700 text-white",
                      active && !pendingInfo && "bg-info-soft text-info-ink ring-2 ring-info/30 ring-offset-2 ring-offset-white",
                      pendingInfo && "bg-warning text-warning-ink ring-2 ring-warning/40 ring-offset-2 ring-offset-white",
                      rejected && "bg-critical text-white",
                      !done && !active && !rejected && !pendingInfo && "bg-surface-2 text-ink-faint"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : rejected ? <X className="h-4 w-4" /> : pendingInfo ? <AlertCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                  </div>
                  <div className="hidden md:block">
                    <p className={cn(
                      "text-[10px] font-semibold tracking-wide uppercase",
                      active && !pendingInfo ? "text-info-ink" : pendingInfo ? "text-warning-ink" : done ? "text-brand-700" : "text-ink-faint"
                    )}>
                      Etapa {i + 1}
                    </p>
                    <p className={cn(
                      "text-[12.5px] font-medium leading-tight",
                      active && !pendingInfo ? "text-info-ink" : pendingInfo ? "text-warning-ink" : done ? "text-ink" : "text-ink-quiet"
                    )}>
                      {s.label}
                    </p>
                  </div>
                </div>
                {i < STAGE_STEP.length - 1 && (
                  <div className={cn("h-0.5 w-6 sm:w-12 rounded-full mx-0.5", done ? "bg-brand-700" : "bg-line")} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Tres columnas */}
      <div className="mt-5 grid lg:grid-cols-[280px_1fr_320px] gap-5 items-start">
        <LeftPanel c={c} />
        <CenterPanel c={c} store={store} />
        <RightPanel c={c} />
      </div>
    </SegShell>
  );
}

/* ─── Panel izquierdo — Información general + evidencias ─── */
function LeftPanel({ c }: { c: ReturnType<typeof useStore>["cases"][number] }) {
  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <Card padded={false}>
        <div className="p-4 border-b border-line-soft">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Información general</p>
        </div>
        <div className="p-4 space-y-3.5">
          <InfoRow icon={<Flag className="h-3.5 w-3.5" />} label="Tipo de evento" value={EVENT_LABELS[c.type]} />
          <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Área" value={AREA_LABELS[c.area]} />
          <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Estación" value={c.station} />
          <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Ubicación" value={c.location} />
          <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha" value={formatDate(c.date)} />
          <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="Hora" value={c.time} />
          <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} label="Reportante" value={c.reporter} />
          {c.assignee && <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} label="Asignado a" value={c.assignee} />}
          <InfoRow icon={<Timer className="h-3.5 w-3.5" />} label="SLA vence" value={formatDate(c.slaDueDate)} />
          <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Creado" value={formatDateTime(c.createdAt)} />
          {c.closedAt && <InfoRow icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Cerrado" value={formatDateTime(c.closedAt)} />}
        </div>
      </Card>

      {/* Datos SOP */}
      {c.sop && (
        <Card padded={false}>
          <div className="p-4 border-b border-line-soft flex items-center justify-between">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Registro SOP</p>
            <Pill tone={c.sop.estadoHallazgo === "cerrado" ? "brand" : "warning"} dot>{ESTADO_HALLAZGO_LABELS[c.sop.estadoHallazgo]}</Pill>
          </div>
          <div className="p-4 space-y-3.5">
            <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Tipo de SOP" value={TIPO_SOP_LABELS[c.sop.tipoSOP]} />
            <InfoRow icon={<Flag className="h-3.5 w-3.5" />} label="Subtipo" value={SUBTIPO_SOP_LABELS[c.sop.subtipoSOP]} />
            <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Procedencia" value={PROCEDENCIA_LABELS[c.sop.procedencia]} />
            <InfoRow icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Tipo hallazgo" value={TIPO_HALLAZGO_LABELS[c.sop.tipoHallazgo]} />
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha hallazgo" value={formatDate(c.sop.fechaHallazgo)} />
            <InfoRow icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha evento" value={formatDate(c.sop.fechaEvento)} />
            <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} label="Responsable investigación" value={c.sop.responsableInvestigacion} />
            {c.sop.peligro && <InfoRow icon={<AlertOctagon className="h-3.5 w-3.5" />} label="Peligro" value={c.sop.peligro} />}
            {c.sop.consecuencia && <InfoRow icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Consecuencia" value={c.sop.consecuencia} />}
            <InfoRow icon={<Shield className="h-3.5 w-3.5" />} label="Análisis de riesgo" value={RISK_LABELS[c.sop.analisisRiesgo]} />
            {c.sop.acr && <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="ACR" value={c.sop.acr} />}
            {c.sop.planCodigo && (
              <>
                <div className="h-px bg-line-soft my-1" />
                <InfoRow icon={<ClipboardList className="h-3.5 w-3.5" />} label="Plan de acción" value={c.sop.planCodigo} />
                {c.sop.planResponsable && <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} label="Responsable plan" value={c.sop.planResponsable} />}
                {c.sop.planArea && <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Área plan" value={AREA_SOP_LABELS[c.sop.planArea]} />}
                {c.sop.planEstado && <InfoRow icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Estado plan" value={c.sop.planEstado === "cerrado" ? "Cerrado" : "Pendiente"} />}
              </>
            )}
          </div>
        </Card>
      )}

      {/* Evento operativo */}
      {c.evento?.tipoIncidenteOperativo && (
        <Card padded={false}>
          <div className="p-4 border-b border-line-soft">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Evento operativo</p>
          </div>
          <div className="p-4 space-y-3.5">
            <InfoRow icon={<AlertOctagon className="h-3.5 w-3.5" />} label="Tipo incidente" value={TIPO_INCIDENTE_LABELS[c.evento.tipoIncidenteOperativo]} />
            {c.evento.ubicacion && <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Ubicación" value={UBICACION_LABELS[c.evento.ubicacion]} />}
            {c.evento.lugarIncidente && <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="Lugar" value={LUGAR_INCIDENTE_LABELS[c.evento.lugarIncidente]} />}
            {c.evento.rangoHorario && <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="Rango horario" value={c.evento.rangoHorario} />}
            {c.evento.tipoVia && <InfoRow icon={<Flag className="h-3.5 w-3.5" />} label="Tipo vía" value={c.evento.tipoVia} />}
            {c.evento.modeloMR && <InfoRow icon={<Train className="h-3.5 w-3.5" />} label="Modelo MR" value={MODELO_MR_LABELS[c.evento.modeloMR]} />}
            {c.evento.nroMR && <InfoRow icon={<Train className="h-3.5 w-3.5" />} label="Nro. MR" value={c.evento.nroMR} />}
            {c.evento.nroCarrera && <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Nro. carrera" value={c.evento.nroCarrera} />}
            {c.evento.personalFalla && <InfoRow icon={<UserIcon className="h-3.5 w-3.5" />} label="Personal/Falla" value={PERSONAL_FALLA_LABELS[c.evento.personalFalla]} />}
            {c.evento.tipoCausa && <InfoRow icon={<Search className="h-3.5 w-3.5" />} label="Tipo causa" value={TIPO_CAUSA_LABELS[c.evento.tipoCausa]} />}
            {c.evento.posibleCausa && <InfoRow icon={<Search className="h-3.5 w-3.5" />} label="Posible causa" value={c.evento.posibleCausa} />}
            {c.evento.descripcionEvento && <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Descripción" value={c.evento.descripcionEvento} />}
            {c.evento.informacionAdicional && <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Info adicional" value={c.evento.informacionAdicional} />}
          </div>
        </Card>
      )}

      <Card padded={false}>
        <div className="p-4 border-b border-line-soft flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Evidencias</p>
          <span className="text-[11px] text-ink-quiet tabular-nums">{c.evidence.length}</span>
        </div>
        <div className="p-3 space-y-1.5">
          {c.evidence.length === 0 && <p className="text-[12px] text-ink-faint p-2">Sin evidencias adjuntas.</p>}
          {c.evidence.map((ev) => (
            <div key={ev.id} className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-surface transition-colors group cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-surface-2 text-ink-soft grid place-items-center shrink-0">
                {ev.kind === "foto" ? <ImageIcon className="h-4 w-4" /> : ev.kind === "video" ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-ink truncate">{ev.name}</p>
                <p className="text-[10.5px] text-ink-quiet">{ev.size}</p>
              </div>
              <Download className="h-3.5 w-3.5 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-ink-faint mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-ink-faint">{label}</p>
        <p className="text-[12.5px] text-ink font-medium leading-snug mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ─── Panel central — contenido por etapa ─── */
type Store = ReturnType<typeof useStore>;

function CenterPanel({ c, store }: { c: Store["cases"][number]; store: Store }) {
  switch (c.stage) {
    case "recepcion":
    case "evaluacion":
      return <ReceptionStage c={c} store={store} />;
    case "pendiente_info":
      return <PendingInfoStage c={c} />;
    case "investigacion":
      return <InvestigationStage c={c} store={store} />;
    case "plan_accion":
      return <PlanStage c={c} store={store} />;
    case "ejecucion":
      return <ExecutionStage c={c} store={store} />;
    case "verificacion":
      return <VerificationStage c={c} store={store} />;
    case "cierre":
      return <ClosedStage c={c} store={store} />;
    case "rechazado":
      return <RejectedStage c={c} />;
    default:
      return null;
  }
}

function StageSection({ title, subtitle, icon, children, action }: {
  title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0">{icon}</div>
          <div>
            <h2 className="text-[16px] font-bold text-ink leading-tight">{title}</h2>
            <p className="text-[12.5px] text-ink-quiet mt-0.5">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function DescriptionBlock({ c }: { c: Store["cases"][number] }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-1.5">Descripción del evento</p>
        <p className="text-[13.5px] text-ink-soft leading-relaxed">{c.description}</p>
      </div>
      {c.observations && (
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-1.5">Observaciones del reportante</p>
          <p className="text-[13.5px] text-ink-soft leading-relaxed">{c.observations}</p>
        </div>
      )}
    </div>
  );
}

/* ─── ETAPA 1 — Recepción y Revisión ─── */
function ReceptionStage({ c, store }: { c: Store["cases"][number]; store: Store }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [obsOpen, setObsOpen] = useState(false);
  const [observation, setObservation] = useState("");
  const isRecepcion = c.stage === "recepcion";

  return (
    <div className="space-y-4">
      <StageSection
        title={isRecepcion ? "Recepción y Revisión del Reporte" : "Evaluación del Caso"}
        subtitle={isRecepcion
          ? "Revise toda la información del reporte, evidencias y descripción. Apruebe para avanzar a Evaluación."
          : "Analice la gravedad, defina prioridad y clasifique el caso. Determine si requiere investigación."}
        icon={isRecepcion ? <Inbox className="h-5 w-5" /> : <FileSearch className="h-5 w-5" />}
        action={<Pill tone="info" dot>{isRecepcion ? "Pendiente de aprobación" : "En evaluación"}</Pill>}
      >
        <DescriptionBlock c={c} />

        {isRecepcion ? (
          <div className="mt-5 pt-5 border-t border-line-soft flex items-center gap-2 flex-wrap">
            <Button onClick={() => store.approveCase(c.id)} size="sm"><Check className="h-4 w-4" /> Aprobar reporte</Button>
            <Button variant="outline" size="sm" onClick={() => setInfoOpen(true)}><Mail className="h-4 w-4" /> Solicitar información</Button>
            <Button variant="outline" size="sm" onClick={() => setObsOpen(true)}><StickyNote className="h-4 w-4" /> Registrar observación</Button>
            <Button variant="ghost" size="sm" onClick={() => setRejectOpen(true)} className="text-critical hover:bg-critical-soft"><X className="h-4 w-4" /> Rechazar</Button>
          </div>
        ) : (
          <EvaluationForm c={c} store={store} />
        )}
      </StageSection>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Rechazar reporte" subtitle={`${c.id} · indique el motivo (obligatorio)`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancelar</Button><Button variant="danger" onClick={() => { if (reason.trim()) { store.rejectCase(c.id, reason.trim()); setRejectOpen(false); } }} disabled={!reason.trim()}><X className="h-4 w-4" /> Confirmar rechazo</Button></>}>
        <Field label="Motivo del rechazo" required>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explique por qué el reporte no procede…" rows={4} />
        </Field>
      </Modal>

      <Modal open={infoOpen} onClose={() => setInfoOpen(false)} title="Solicitar información al reportante" subtitle={`${c.id} · el caso queda en pausa hasta recibir respuesta`}
        footer={<><Button variant="ghost" onClick={() => setInfoOpen(false)}>Cancelar</Button><Button onClick={() => { if (question.trim()) { store.requestInfo(c.id, question.trim()); setInfoOpen(false); setQuestion(""); } }} disabled={!question.trim()}><Send className="h-4 w-4" /> Enviar solicitud</Button></>}>
        <Field label="¿Qué información necesita?" required>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ej. Detallar personal involucrado y adjuntar copia del permiso de trabajo…" rows={4} />
        </Field>
      </Modal>

      <Modal open={obsOpen} onClose={() => setObsOpen(false)} title="Registrar observación de revisión" subtitle={`${c.id} · queda en la bitácora del expediente`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setObsOpen(false)}>Cancelar</Button><Button onClick={() => { if (observation.trim()) { store.addReviewObservation(c.id, observation.trim()); setObsOpen(false); setObservation(""); } }} disabled={!observation.trim()}><StickyNote className="h-4 w-4" /> Guardar observación</Button></>}>
        <Field label="Observación" required>
          <Textarea value={observation} onChange={(e) => setObservation(e.target.value)} rows={4} placeholder="Anote sus observaciones de la revisión…" />
        </Field>
      </Modal>
    </div>
  );
}

/* ─── ETAPA 2 — Evaluación ─── */
const PRESET_CLASSIFICATIONS: string[] = [
  "Reporte Voluntario",
  "Accidente",
  "No conformidad",
  "Observación",
  ...Object.values(SUBTIPO_SOP_LABELS).map((s) => `Hallazgo · ${s}`),
  ...Object.values(TIPO_INCIDENTE_LABELS).map((s) => `Incidente · ${s}`),
];

function EvaluationForm({ c, store }: { c: Store["cases"][number]; store: Store }) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(c.riskLevel);
  const [classification, setClassification] = useState(c.evaluation?.classification ?? "");
  const [requiresInvestigation, setRequiresInvestigation] = useState(c.evaluation?.requiresInvestigation ?? true);
  const [observations, setObservations] = useState(c.evaluation?.observations ?? "");

  // Valor limpio para guardar (sin el prefijo __otro__:)
  const cleanClassification = classification.startsWith("__otro__:")
    ? classification.slice(8).trim()
    : classification.trim();
  const canSave = cleanClassification.length > 0;
  const gravityFromRisk = riskToPriority(riskLevel);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-info-soft border border-info/20 p-3.5 flex items-start gap-2.5">
        <FileSearch className="h-4 w-4 text-info-ink shrink-0 mt-0.5" />
        <p className="text-[12.5px] text-info-ink">
          <span className="font-semibold">Análisis del caso.</span> Defina el análisis de riesgo (matriz 1A-4E), clasificación y si requiere investigación. Al guardar, el caso pasa a Investigación o directamente a Plan de Acción.
        </p>
      </div>

      <Field label="Análisis de riesgo (matriz 5×5)" required>
        <Select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}>
          {(Object.keys(RISK_LABELS) as RiskLevel[]).map((r) => (
            <option key={r} value={r}>{RISK_LABELS[r]}</option>
          ))}
        </Select>
        <div className="mt-2 flex items-center gap-2">
          <RiskPill risk={riskLevel} showCategory />
          <span className="text-[11px] text-ink-quiet">Gravedad derivada: {PRIORITY_LABELS[gravityFromRisk]}</span>
        </div>
      </Field>

      <Field label="Clasificación del caso" required>
        <Select
          value={classification.startsWith("__otro__:") ? "__otro__" : classification === "" || PRESET_CLASSIFICATIONS.includes(classification) ? classification : "__otro__"}
          onChange={(e) => {
            if (e.target.value === "__otro__") {
              setClassification("__otro__:");
            } else {
              setClassification(e.target.value);
            }
          }}
        >
          <option value="">Seleccionar clasificación…</option>
          <optgroup label="Hallazgo">
            {(Object.keys(SUBTIPO_SOP_LABELS) as SubtipoSOP[]).map((s) => (
              <option key={s} value={`Hallazgo · ${SUBTIPO_SOP_LABELS[s]}`}>Hallazgo · {SUBTIPO_SOP_LABELS[s]}</option>
            ))}
          </optgroup>
          <optgroup label="Incidente">
            {(Object.keys(TIPO_INCIDENTE_LABELS) as TipoIncidenteOperativo[]).map((s) => (
              <option key={s} value={`Incidente · ${TIPO_INCIDENTE_LABELS[s]}`}>Incidente · {TIPO_INCIDENTE_LABELS[s]}</option>
            ))}
          </optgroup>
          <option value="Reporte Voluntario">Reporte Voluntario</option>
          <option value="Accidente">Accidente</option>
          <option value="No conformidad">No conformidad</option>
          <option value="Observación">Observación</option>
          <option value="__otro__">Otro (escribir…) </option>
        </Select>
        {classification.startsWith("__otro__:") && (
          <Input
            className="mt-2"
            value={classification.slice(8)}
            onChange={(e) => setClassification(`__otro__:${e.target.value}`)}
            placeholder="Escriba la clasificación personalizada…"
            autoFocus
          />
        )}
      </Field>

      <Field label="¿Requiere investigación?">
        <div className="flex gap-2">
          <button onClick={() => setRequiresInvestigation(true)}
            className={cn("flex-1 h-10 rounded-lg text-[12.5px] font-medium border transition-all", requiresInvestigation ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line bg-white text-ink-soft hover:bg-surface/50")}>
            Sí, requiere investigación
          </button>
          <button onClick={() => setRequiresInvestigation(false)}
            className={cn("flex-1 h-10 rounded-lg text-[12.5px] font-medium border transition-all", !requiresInvestigation ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line bg-white text-ink-soft hover:bg-surface/50")}>
            No, pasa directo a Plan
          </button>
        </div>
      </Field>

      <Field label="Observaciones de la evaluación">
        <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={3} placeholder="Análisis, antecedentes, criterios considerados…" />
      </Field>

      <div className="pt-3 border-t border-line-soft flex items-center justify-end gap-2">
        <Button size="sm" disabled={!canSave} onClick={() => store.saveEvaluation(c.id, { gravity: gravityFromRisk, riskLevel, classification: cleanClassification, requiresInvestigation, observations: observations.trim() })}>
          <Check className="h-4 w-4" /> {requiresInvestigation ? "Guardar y pasar a Investigación" : "Guardar y pasar a Plan de Acción"}
        </Button>
      </div>
    </div>
  );
}

function PendingInfoStage({ c }: { c: Store["cases"][number] }) {
  return (
    <StageSection title="Esperando información del reportante" subtitle="El caso está pausado hasta que el reportante responda la solicitud." icon={<Mail className="h-5 w-5" />} action={<Pill tone="warning" dot>Pausado</Pill>}>
      <div className="rounded-lg bg-warning-soft border border-warning/25 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning-ink shrink-0 mt-0.5" />
          <div>
            <p className="text-[13.5px] font-semibold text-ink">Solicitud enviada</p>
            <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">{c.pendingInfoRequest?.question}</p>
            <p className="text-[11.5px] text-ink-quiet mt-2">Solicitada {relativeTime(c.pendingInfoRequest?.requestedAt ?? "")}</p>
          </div>
        </div>
      </div>
      <DescriptionBlock c={c} />
    </StageSection>
  );
}

/* ─── ETAPA 3 — Investigación (SO) ─── */
function InvestigationStage({ c, store }: { c: Store["cases"][number]; store: Store }) {
  const [editMode, setEditMode] = useState(!c.investigation);
  const [inv, setInv] = useState<Investigation>(
    c.investigation ?? { findings: "", rootCause: "", technicalDescription: "", conclusions: "", observations: "", updatedAt: "" }
  );
  const set = (k: keyof Investigation, v: string) => setInv((p) => ({ ...p, [k]: v }));
  const canSave = inv.findings.trim() && inv.rootCause.trim() && inv.conclusions.trim();

  const addEvidence = (kind: Evidence["kind"]) => {
    const names: Record<typeof kind, [string, string]> = {
      foto: ["investigacion.jpg", "2.4 MB"], video: ["investigacion.mp4", "14.8 MB"], documento: ["informe_investigacion.pdf", "640 KB"],
    };
    const [name, size] = names[kind];
    store.addInvestigationEvidence(c.id, { id: `ev_${Math.random().toString(36).slice(2, 9)}`, kind, name: name.replace(/(\.\w+)$/, `_${c.evidence.length + 1}$1`), size, at: new Date().toISOString() });
  };

  if (c.investigation && !editMode) {
    return (
      <div className="space-y-4">
        <StageSection title="Investigación registrada" subtitle="Hallazgos, causa raíz y conclusiones registrados por Seguridad Operativa." icon={<Microscope className="h-5 w-5" />} action={
          <div className="flex items-center gap-2">
            <Pill tone="brand" dot>Completado</Pill>
            <Button variant="outline" size="sm" onClick={() => { setInv(c.investigation!); setEditMode(true); }}>
              <FileSearch className="h-4 w-4" /> Editar
            </Button>
          </div>
        }>
          <InvDisplay inv={c.investigation} />
        </StageSection>
        <ResponsiblesAndWorkers c={c} store={store} readOnly />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 3 tarjetas: Investigador, Jefe Responsable, Trabajadores Involucrados */}
      <ResponsiblesAndWorkers c={c} store={store} />

      <StageSection title="Investigación del caso" subtitle="Seguridad Operativa registra hallazgos, causa raíz, análisis, conclusiones y evidencias." icon={<Microscope className="h-5 w-5" />} action={<Pill tone="info" dot>En curso</Pill>}>
        <div className="rounded-lg bg-brand-50 border border-brand-200 p-3.5 flex items-start gap-2.5 mb-4">
          <ShieldCheck className="h-4 w-4 text-brand-700 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-brand-800"><span className="font-semibold">Investigación por Seguridad Operativa.</span> El análisis lo realiza el analista SO asignado, no el jefe del área.</p>
        </div>
        <div className="space-y-4">
          <Field label="Hallazgos" required>
            <Textarea value={inv.findings} onChange={(e) => set("findings", e.target.value)} placeholder="¿Qué se encontró durante la inspección?" rows={3} />
          </Field>
          <Field label="Causa raíz" required>
            <Textarea value={inv.rootCause} onChange={(e) => set("rootCause", e.target.value)} placeholder="¿Cuál es la causa originaria del evento?" rows={2} />
          </Field>
          <Field label="Conclusiones" required>
            <Textarea value={inv.conclusions} onChange={(e) => set("conclusions", e.target.value)} placeholder="Conclusiones del análisis…" rows={2} />
          </Field>
          <Field label="Observaciones">
            <Textarea value={inv.observations} onChange={(e) => set("observations", e.target.value)} placeholder="Recomendaciones o información complementaria…" rows={2} />
          </Field>

          <div className="pt-3 border-t border-line-soft">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2">Evidencias de la investigación</p>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Button variant="outline" size="sm" onClick={() => addEvidence("foto")}><ImageIcon className="h-4 w-4" /> Adjuntar foto</Button>
              <Button variant="outline" size="sm" onClick={() => addEvidence("video")}><Video className="h-4 w-4" /> Adjuntar video</Button>
              <Button variant="outline" size="sm" onClick={() => addEvidence("documento")}><FileText className="h-4 w-4" /> Adjuntar documento</Button>
            </div>
          </div>

          <div className="pt-3 border-t border-line-soft flex items-center justify-end gap-2">
            <Button onClick={() => canSave && store.saveInvestigation(c.id, inv)} disabled={!canSave}>
              <Check className="h-4 w-4" /> Guardar investigación y pasar a Plan de Acción
            </Button>
          </div>
        </div>
      </StageSection>
    </div>
  );
}

/* ─── Tarjetas: Investigador + Jefe Responsable + Trabajadores Involucrados ─── */
function ResponsiblesAndWorkers({ c, store, readOnly }: { c: Store["cases"][number]; store: Store; readOnly?: boolean }) {
  const investigatorName = c.investigator ?? "Marcela Falcón";
  const jefeArea = c.assignee ?? (c.assigneeArea ? AREA_HEADS[c.assigneeArea] : "Por asignar");
  const jefeAreaLabel = c.assigneeArea ? AREA_LABELS[c.assigneeArea] : "—";
  const involved = (c.involvedWorkers ?? []).filter((w) => !w.removedAt);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* 1. Investigador SO */}
      <Card className="p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-9 w-9 rounded-lg bg-brand-50 text-brand-700 grid place-items-center"><ShieldCheck className="h-4.5 w-4.5" /></div>
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Investigador SO</p>
            <p className="text-[13px] font-bold text-ink leading-tight">Quien conduce la investigación</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-brand-700 text-white grid place-items-center text-[14px] font-bold shrink-0">
            {investigatorName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-ink truncate">{investigatorName}</p>
            <p className="text-[12px] text-ink-quiet mt-0.5">Analista de Seguridad Operativa</p>
            <div className="mt-1.5"><Pill tone="brand" dot>Asignado</Pill></div>
          </div>
        </div>
      </Card>

      {/* 2. Jefe Responsable del Plan */}
      <Card className="p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="h-9 w-9 rounded-lg bg-info-soft text-info-ink grid place-items-center"><Briefcase className="h-4.5 w-4.5" /></div>
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Jefe Responsable del Plan</p>
            <p className="text-[13px] font-bold text-ink leading-tight">Quien ejecutará el plan</p>
          </div>
        </div>
        {c.assignee ? (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-info text-white grid place-items-center text-[14px] font-bold shrink-0">
              {c.assignee.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-ink truncate">{c.assignee}</p>
              <p className="text-[12px] text-ink-quiet mt-0.5">Jefe de {jefeAreaLabel}</p>
              <div className="mt-1.5"><Pill tone="info" dot>Responsable del plan</Pill></div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-surface border border-dashed border-line p-4 text-center">
            <p className="text-[12.5px] text-ink-quiet">Se asignará al crear el Plan de Acción</p>
          </div>
        )}
      </Card>

      {/* 3. Trabajadores Involucrados */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-warning-soft text-warning-ink grid place-items-center"><UserCheck className="h-4.5 w-4.5" /></div>
            <div>
              <p className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Trabajadores Involucrados</p>
              <p className="text-[13px] font-bold text-ink leading-tight">Personas relacionadas</p>
            </div>
          </div>
          <Pill tone="neutral">{involved.length}</Pill>
        </div>
        {involved.length === 0 ? (
          <div className="rounded-lg bg-surface border border-dashed border-line p-4 text-center">
            <p className="text-[12px] text-ink-quiet mb-3">No hay trabajadores involucrados registrados.</p>
            {!readOnly && <WorkerSearchButton c={c} store={store} />}
          </div>
        ) : (
          <div className="space-y-2">
            {involved.map((w) => (
              <InvolvedWorkerCard key={w.id} worker={w} c={c} store={store} readOnly={readOnly} />
            ))}
            {!readOnly && <WorkerSearchButton c={c} store={store} />}
          </div>
        )}
      </Card>
    </div>
  );
}

function WorkerSearchButton({ c, store }: { c: Store["cases"][number]; store: Store }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" /> Agregar trabajador involucrado
      </Button>
      <WorkerSearchModal open={open} onClose={() => setOpen(false)} c={c} store={store} />
    </>
  );
}

function WorkerSearchModal({ open, onClose, c, store }: { open: boolean; onClose: () => void; c: Store["cases"][number]; store: Store }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [implication, setImplication] = useState<ImplicationType>("afectado");

  const search = (q: string) => {
    setQuery(q);
    setResults(store.searchWorkers(q));
  };

  const add = () => {
    if (selected) {
      store.addInvolvedWorker(c.id, selected, implication);
      setSelected(null); setQuery(""); setResults([]);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar trabajador involucrado"
      subtitle="Buscar por DNI o código de trabajador en la base de datos sincronizada"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={add} disabled={!selected}><UserPlus className="h-4 w-4" /> Agregar al caso</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Buscar por DNI o Código de Trabajador" required>
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-white border border-line-strong focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/15">
            <Search className="h-4 w-4 text-ink-faint shrink-0" />
            <input
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder="Escriba el DNI (ej. 45891234) o código (ej. EMP-0010)…"
              className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-ink-faint"
              autoFocus
            />
          </div>
        </Field>

        {/* Resultados */}
        {query.trim() && !selected && (
          <div className="rounded-lg border border-line max-h-[240px] overflow-y-auto">
            {results.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-ink-quiet">
                No se encontraron trabajadores. Verifique el DNI o código.
              </div>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelected(u); setQuery(""); setResults([]); }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-surface transition-colors border-b border-line-soft last:border-0 text-left"
                >
                  <div className="h-10 w-10 rounded-full grid place-items-center text-white text-[12px] font-semibold shrink-0" style={{ background: u.avatarColor ?? "#14814a" }}>
                    {u.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">{u.name}</p>
                    <p className="text-[11.5px] text-ink-quiet">{u.code} · DNI {u.dni} · {u.cargo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-ink-soft">{u.area ? AREA_LABELS[u.area] : "—"}</p>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 inline-block",
                      u.laborState === "activo" ? "bg-brand-50 text-brand-800" :
                      u.laborState === "baja_definitiva" ? "bg-critical-soft text-critical-ink" :
                      "bg-surface-2 text-ink-quiet")}>
                      {LABOR_STATE_LABELS[u.laborState]}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Trabajador seleccionado */}
        {selected && (
          <div className="rounded-xl bg-brand-50 border border-brand-200 p-4 animate-[riseUp_0.25s_ease-out]">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 rounded-full grid place-items-center text-white text-[15px] font-bold shrink-0" style={{ background: selected.avatarColor ?? "#14814a" }}>
                {selected.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[15px] font-bold text-ink">{selected.name}</p>
                  {selected.laborState === "baja_definitiva" && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-critical text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" /> Baja Definitiva
                    </span>
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                  <p><span className="text-ink-faint">Código:</span> <span className="text-ink font-medium">{selected.code}</span></p>
                  <p><span className="text-ink-faint">DNI:</span> <span className="text-ink font-medium">{selected.dni}</span></p>
                  <p><span className="text-ink-faint">Cargo:</span> <span className="text-ink font-medium">{selected.cargo}</span></p>
                  <p><span className="text-ink-faint">Área:</span> <span className="text-ink font-medium">{selected.area ? AREA_LABELS[selected.area] : "—"}</span></p>
                  <p><span className="text-ink-faint">Jefe inmediato:</span> <span className="text-ink font-medium">{selected.area ? AREA_HEADS[selected.area] : "—"}</span></p>
                  <p><span className="text-ink-faint">Estado:</span> <span className="text-ink font-medium">{LABOR_STATE_LABELS[selected.laborState]}</span></p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="shrink-0 h-7 w-7 grid place-items-center rounded-md text-ink-quiet hover:bg-white/60">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <Field label="Tipo de implicación" required className="mt-4">
              <Select value={implication} onChange={(e) => setImplication(e.target.value as ImplicationType)}>
                {(Object.keys(IMPLICATION_LABELS) as ImplicationType[]).map((k) => (
                  <option key={k} value={k}>{IMPLICATION_LABELS[k]}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

function InvolvedWorkerCard({ worker, c, store, readOnly }: { worker: InvolvedWorker; c: Store["cases"][number]; store: Store; readOnly?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [statement, setStatement] = useState(worker.statement ?? "");
  const [observations, setObservations] = useState(worker.observations ?? "");
  const [implication, setImplication] = useState<ImplicationType>(worker.implication);

  const save = () => {
    store.updateInvolvedWorker(c.id, worker.id, { statement: statement.trim() || undefined, observations: observations.trim() || undefined, implication });
    setEditing(false);
  };

  return (
    <div className={cn("rounded-lg border p-3", worker.laborState === "baja_definitiva" ? "border-critical/30 bg-critical-soft/30" : "border-line bg-white")}>
      <div className="flex items-start gap-2.5">
        <div className="h-9 w-9 rounded-full grid place-items-center text-white text-[11px] font-semibold shrink-0" style={{ background: worker.avatarColor ?? "#14814a" }}>
          {worker.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[13px] font-semibold text-ink truncate">{worker.name}</p>
            {worker.laborState === "baja_definitiva" && (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-critical text-white">
                <span className="h-1 w-1 rounded-full bg-white" /> Baja Definitiva
              </span>
            )}
          </div>
          <p className="text-[11px] text-ink-quiet mt-0.5">{worker.code} · {worker.cargo}</p>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <Pill tone="warning" dot>{IMPLICATION_LABELS[worker.implication]}</Pill>
            <Pill tone="neutral">{worker.area ? AREA_LABELS[worker.area] : "—"}</Pill>
          </div>
        </div>
        {!readOnly && !editing && (
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => setEditing(true)} className="text-[11px] text-brand-700 hover:underline">Editar</button>
            <button onClick={() => store.removeInvolvedWorker(c.id, worker.id)} className="text-[11px] text-critical hover:underline">Retirar</button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-line-soft space-y-2.5 animate-[riseUp_0.2s_ease-out]">
          <Field label="Tipo de implicación">
            <Select value={implication} onChange={(e) => setImplication(e.target.value as ImplicationType)}>
              {(Object.keys(IMPLICATION_LABELS) as ImplicationType[]).map((k) => (
                <option key={k} value={k}>{IMPLICATION_LABELS[k]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Declaración">
            <Textarea value={statement} onChange={(e) => setStatement(e.target.value)} rows={2} placeholder="Declaración del trabajador sobre el incidente…" />
          </Field>
          <Field label="Observaciones">
            <Textarea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} placeholder="Observaciones relacionadas al caso…" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button size="sm" onClick={save}><Check className="h-4 w-4" /> Guardar</Button>
          </div>
        </div>
      )}

      {!editing && (worker.statement || worker.observations) && (
        <div className="mt-2 pt-2 border-t border-line-soft space-y-1">
          {worker.statement && <p className="text-[11.5px] text-ink-soft"><span className="font-semibold text-ink">Declaración:</span> {worker.statement}</p>}
          {worker.observations && <p className="text-[11.5px] text-ink-soft"><span className="font-semibold text-ink">Observaciones:</span> {worker.observations}</p>}
        </div>
      )}
    </div>
  );
}

function InvDisplay({ inv }: { inv: Investigation }) {
  return (
    <div className="space-y-4">
      <InvBlock label="Hallazgos" value={inv.findings} />
      <InvBlock label="Causa raíz" value={inv.rootCause} tone="critical" />
      {inv.technicalDescription && <InvBlock label="Análisis técnico" value={inv.technicalDescription} />}
      <InvBlock label="Conclusiones" value={inv.conclusions} />
      {inv.observations && <InvBlock label="Observaciones" value={inv.observations} />}
      <p className="text-[11px] text-ink-faint pt-2 border-t border-line-soft">Actualizado {formatDateTime(inv.updatedAt)}</p>
    </div>
  );
}

function InvBlock({ label, value, tone }: { label: string; value: string; tone?: "critical" }) {
  return (
    <div>
      <p className={cn("text-[11px] font-semibold tracking-wide uppercase mb-1.5", tone === "critical" ? "text-critical-ink" : "text-ink-faint")}>{label}</p>
      <p className="text-[13.5px] text-ink-soft leading-relaxed">{value}</p>
    </div>
  );
}

/* ─── ETAPA 4 — Plan de Acción (SO) ─── */
interface PlanFormItem { name: string; description: string; owner: string; priority: Priority; startDate: string; dueDate: string; }

function PlanStage({ c, store }: { c: Store["cases"][number]; store: Store }) {
  const plan = c.actionPlan;
  const [formOpen, setFormOpen] = useState(!plan);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [decision, setDecision] = useState<"aprobado" | "rechazado">("aprobado");
  const [note, setNote] = useState("");
  const [editPlanMode, setEditPlanMode] = useState(false);

  if (plan?.reviewDecision === "aprobado" && !editPlanMode) {
    return (
      <div className="space-y-4">
        {c.investigation && (
          <StageSection title="Investigación" subtitle="Hallazgos y causa raíz." icon={<Microscope className="h-5 w-5" />}>
            <InvDisplay inv={c.investigation} />
          </StageSection>
        )}
        <StageSection title="Plan de Acción aprobado" subtitle="El plan fue aprobado por Seguridad Operativa. Inicie la ejecución." icon={<ClipboardList className="h-5 w-5" />} action={
          <div className="flex items-center gap-2">
            <Pill tone="brand" dot>Aprobado</Pill>
            <Button variant="outline" size="sm" onClick={() => setEditPlanMode(true)}>
              <FileSearch className="h-4 w-4" /> Editar plan
            </Button>
          </div>
        }>
          <PlanDisplay c={c} />
          <div className="mt-4 pt-4 border-t border-line-soft rounded-xl bg-brand-50 border border-brand-200 p-4 flex items-center justify-between gap-3 -mx-1">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-brand-700 shrink-0" />
              <p className="text-[12.5px] text-brand-800"><span className="font-semibold">Plan aprobado.</span> La etapa de Ejecución está habilitada.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadPlan(c)}>
                <Download className="h-4 w-4" /> Descargar Plan
              </Button>
              <Button size="sm" onClick={() => store.startExecution(c.id)}><Rocket className="h-4 w-4" /> Iniciar ejecución</Button>
            </div>
          </div>
        </StageSection>
      </div>
    );
  }

  // Modo edición del plan (reabrió un caso con plan aprobado)
  if (editPlanMode && plan) {
    return (
      <div className="space-y-4">
        {c.investigation && (
          <StageSection title="Investigación" subtitle="Hallazgos y causa raíz." icon={<Microscope className="h-5 w-5" />}>
            <InvDisplay inv={c.investigation} />
          </StageSection>
        )}
        <StageSection title="Editar Plan de Acción" subtitle="Modifique el plan y vuelva a enviarlo al jefe del área." icon={<ClipboardList className="h-5 w-5" />} action={
          <Button variant="ghost" size="sm" onClick={() => setEditPlanMode(false)}>
            <X className="h-4 w-4" /> Cancelar edición
          </Button>
        }>
          <PlanForm c={c} store={store} onSubmitted={() => setEditPlanMode(false)} />
        </StageSection>
        <ResponsiblesAndWorkers c={c} store={store} readOnly />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {c.investigation && (
        <StageSection title="Investigación" subtitle="Hallazgos y causa raíz." icon={<Microscope className="h-5 w-5" />}>
          <InvDisplay inv={c.investigation} />
        </StageSection>
      )}
      <StageSection
        title="Plan de Acción"
        subtitle={plan ? "Plan enviado al jefe del área. Pendiente de aprobación por Seguridad Operativa." : "Seguridad Operativa crea el Plan de Acción y lo envía al jefe del área."}
        icon={<ClipboardList className="h-5 w-5" />}
        action={plan ? <Pill tone="warning" dot>Para aprobar</Pill> : <Pill tone="info" dot>Por crear</Pill>}
      >
        {plan && !formOpen ? (
          <>
            <PlanDisplay c={c} />
            <div className="mt-4 rounded-xl bg-warning-soft border border-warning/30 p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-warning-ink shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-warning-ink">Aprobación de Seguridad Operativa</p>
                  <p className="text-[12.5px] text-ink-soft mt-0.5">El plan fue enviado al jefe del área. Apruébelo para habilitar la Ejecución, o rechácelo si necesita ajustes.</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <Button variant="ghost" size="sm" className="text-critical hover:bg-critical-soft" onClick={() => { setDecision("rechazado"); setReviewOpen(true); }}><X className="h-4 w-4" /> Rechazar plan</Button>
                <Button size="sm" onClick={() => { setDecision("aprobado"); setReviewOpen(true); }}><Check className="h-4 w-4" /> Aprobar plan</Button>
              </div>
            </div>
          </>
        ) : (
          <PlanForm c={c} store={store} onSubmitted={() => setFormOpen(false)} />
        )}
      </StageSection>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={decision === "aprobado" ? "Aprobar Plan de Acción" : "Rechazar Plan de Acción"} subtitle={`${c.id} · decisión de Seguridad Operativa`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setReviewOpen(false)}>Cancelar</Button><Button variant={decision === "rechazado" ? "danger" : "primary"} onClick={() => { store.reviewActionPlan(c.id, decision, note.trim() || undefined); setReviewOpen(false); }}>{decision === "aprobado" ? "Confirmar aprobación" : "Confirmar rechazo"}</Button></>}>
        <Field label={decision === "aprobado" ? "Comentario (opcional)" : "Justificación del rechazo"} required={decision === "rechazado"}>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={decision === "aprobado" ? "Observaciones sobre la aprobación…" : "Explique por qué se rechaza el plan…"} />
        </Field>
      </Modal>
    </div>
  );
}

function PlanForm({ c, store, onSubmitted }: { c: Store["cases"][number]; store: Store; onSubmitted: () => void }) {
  const [elaboratedBy, setElaboratedBy] = useState("Marcela Falcón");
  const [actionType, setActionType] = useState("Correctiva");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [estimatedTime, setEstimatedTime] = useState("7 días");
  const [priority, setPriority] = useState<Priority>(c.priority);
  const [observations, setObservations] = useState("");
  const [sentToArea, setSentToArea] = useState<Area | "">(c.area ?? "");
  const [items, setItems] = useState<PlanFormItem[]>([{ name: "", description: "", owner: "", priority: "media", startDate: new Date().toISOString().slice(0, 10), dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) }]);

  const update = (i: number, key: keyof PlanFormItem, v: string) => setItems((p) => p.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  const add = () => setItems((p) => [...p, { name: "", description: "", owner: "", priority: "media", startDate: new Date().toISOString().slice(0, 10), dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) }]);
  const remove = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));

  const canSend = sentToArea && description.trim() && items.every((it) => it.name.trim() && it.owner.trim());

  const send = () => {
    if (!canSend) return;
    store.submitActionPlan(c.id, {
      elaboratedBy, actionType, description: description.trim(), startDate, dueDate, estimatedTime, priority,
      observations: observations.trim(), sentToArea: sentToArea as Area,
      items: items.map((it) => ({ name: it.name.trim(), description: it.description.trim(), owner: it.owner.trim(), priority: it.priority, startDate: it.startDate, dueDate: it.dueDate })),
    });
    onSubmitted();
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Responsable que elaboró el plan" required>
          <Input value={elaboratedBy} onChange={(e) => setElaboratedBy(e.target.value)} />
        </Field>
        <Field label="Tipo de acción" required>
          <Select value={actionType} onChange={(e) => setActionType(e.target.value)}>
            <option>Correctiva</option><option>Preventiva</option><option>Mitigación</option><option>Compensatoria</option>
          </Select>
        </Field>
        <Field label="Área responsable (envío)" required>
          <Select value={sentToArea} onChange={(e) => setSentToArea(e.target.value as Area)}>
            <option value="">Seleccione un área…</option>
            {(Object.keys(AREA_LABELS) as Area[]).map((a) => <option key={a} value={a}>{AREA_LABELS[a]} · Jefe: {AREA_HEADS[a]}</option>)}
          </Select>
        </Field>
        <Field label="Prioridad del plan" required>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {(["critica", "alta", "media", "baja"] as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </Select>
        </Field>
        <Field label="Descripción detallada" required className="sm:col-span-2">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Resumen del plan de acción…" />
        </Field>
        <Field label="Fecha de inicio" required>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Fecha límite" required>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Tiempo estimado">
          <Input value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="Ej. 7 días" />
        </Field>
        <Field label="Observaciones">
          <Input value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Indicaciones para el área…" />
        </Field>
      </div>

      <div className="pt-3 border-t border-line-soft">
        <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2.5">Actividades del plan</p>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border border-line p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-ink-faint">Actividad {i + 1}</span>
                {items.length > 1 && <button onClick={() => remove(i)} className="text-[11px] text-critical hover:underline">Eliminar</button>}
              </div>
              <Field label="Nombre" required>
                <Input value={it.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="Ej. Reemplazo de actuador" />
              </Field>
              <Field label="Descripción">
                <Textarea value={it.description} onChange={(e) => update(i, "description", e.target.value)} rows={2} placeholder="Detalle de la actividad…" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Responsable" required>
                  <Input value={it.owner} onChange={(e) => update(i, "owner", e.target.value)} />
                </Field>
                <Field label="Prioridad" required>
                  <Select value={it.priority} onChange={(e) => update(i, "priority", e.target.value)}>
                    {(["critica", "alta", "media", "baja"] as Priority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </Select>
                </Field>
                <Field label="Fecha inicio" required>
                  <Input type="date" value={it.startDate} onChange={(e) => update(i, "startDate", e.target.value)} />
                </Field>
                <Field label="Fecha fin" required>
                  <Input type="date" value={it.dueDate} onChange={(e) => update(i, "dueDate", e.target.value)} />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={add}><Plus className="h-4 w-4" /> Agregar actividad</Button>
        </div>
      </div>

      <div className="pt-3 border-t border-line-soft">
        <Button size="sm" disabled={!canSend} onClick={send}><Send className="h-4 w-4" /> Enviar Plan de Acción al jefe del área</Button>
        {sentToArea && (
          <p className="text-[11.5px] text-ink-quiet mt-2">Se enviará correo a {AREA_HEADS[sentToArea as Area].toLowerCase().replace(" ", ".")}@metrolinea1.pe y se registrará en la bitácora.</p>
        )}
      </div>
    </div>
  );
}

function PlanDisplay({ c }: { c: Store["cases"][number] }) {
  const plan = c.actionPlan!;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2 -mb-1">
        <Button variant="outline" size="sm" onClick={() => downloadPlan(c)}>
          <Download className="h-4 w-4" /> Descargar Plan de Acción
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 rounded-lg bg-surface border border-line p-4">
        <PlanMeta label="Elaborado por" value={plan.elaboratedBy} />
        <PlanMeta label="Tipo de acción" value={plan.actionType} />
        <PlanMeta label="Área responsable" value={AREA_LABELS[plan.sentToArea ?? c.assigneeArea ?? c.area]} />
        <PlanMeta label="Prioridad" value={PRIORITY_LABELS[plan.priority]} />
        <PlanMeta label="Fecha inicio" value={formatDate(plan.startDate)} />
        <PlanMeta label="Fecha límite" value={formatDate(plan.dueDate)} />
        <PlanMeta label="Tiempo estimado" value={plan.estimatedTime} />
        <PlanMeta label="Enviado" value={plan.submittedAt ? relativeTime(plan.submittedAt) : "—"} />
      </div>
      {plan.description && (
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-1.5">Descripción del plan</p>
          <p className="text-[13px] text-ink-soft leading-relaxed">{plan.description}</p>
        </div>
      )}
      {plan.observations && (
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-1.5">Observaciones</p>
          <p className="text-[13px] text-ink-soft leading-relaxed">{plan.observations}</p>
        </div>
      )}
      <div>
        <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2.5">Actividades ({plan.items.length})</p>
        <div className="space-y-2">
          {plan.items.map((it, i) => (
            <div key={it.id} className="rounded-lg border border-line p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-ink-faint">Actividad {i + 1}</p>
                  <p className="text-[13.5px] font-semibold text-ink mt-0.5">{it.name}</p>
                  {it.description && <p className="text-[12px] text-ink-soft mt-1 leading-relaxed">{it.description}</p>}
                </div>
                <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                  it.status === "completado" ? "bg-brand-50 text-brand-800" : it.status === "en_progreso" ? "bg-info-soft text-info-ink" : "bg-surface-2 text-ink-quiet")}>
                  {it.status === "completado" ? "Finalizada" : it.status === "en_progreso" ? "En proceso" : "Pendiente"}
                </span>
              </div>
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11.5px] text-ink-quiet">
                <span className="flex items-center gap-1.5"><UserIcon className="h-3 w-3" /> {it.owner}</span>
                <span className="flex items-center gap-1.5"><Flag className="h-3 w-3" /> {PRIORITY_LABELS[it.priority]}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatDate(it.startDate)} → {formatDate(it.dueDate)}</span>
              </div>
              {it.status !== "pendiente" && <div className="mt-2.5"><Progress value={it.progress} showLabel /></div>}
            </div>
          ))}
        </div>
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

/* ─── ETAPA 5 — Ejecución (jefe del área) ─── */
function ExecutionStage({ c, store }: { c: Store["cases"][number]; store: Store }) {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [itemComment, setItemComment] = useState("");
  const [extOpen, setExtOpen] = useState(false);
  const [extMotivo, setExtMotivo] = useState("");
  const [extFecha, setExtFecha] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [extJustificacion, setExtJustificacion] = useState("");
  const items = c.actionPlan?.items ?? [];
  const accepted = !!c.execution?.acceptedByAreaAt;
  const allComplete = items.length > 0 && items.every((it) => it.status === "completado");

  const addEvidence = (kind: Evidence["kind"]) => {
    const names: Record<typeof kind, [string, string]> = {
      foto: ["evidencia_ejecucion.jpg", "2.4 MB"], video: ["evidencia_ejecucion.mp4", "14.8 MB"], documento: ["avance_ejecucion.pdf", "640 KB"],
    };
    const [name, size] = names[kind];
    store.addExecutionEvidence(c.id, { id: `ev_${Math.random().toString(36).slice(2, 9)}`, kind, name: name.replace(/(\.\w+)$/, `_${c.evidence.length + 1}$1`), size, at: new Date().toISOString() });
  };

  return (
    <div className="space-y-4">
      {c.investigation && (
        <StageSection title="Investigación" subtitle="Hallazgos y causa raíz." icon={<Microscope className="h-5 w-5" />}>
          <InvDisplay inv={c.investigation} />
        </StageSection>
      )}
      <StageSection title="Ejecución del Plan de Acción" subtitle="El jefe del área acepta el plan, registra avances, adjunta evidencias y marca actividades como finalizadas." icon={<Rocket className="h-5 w-5" />} action={<Pill tone="brand" dot>{c.execution?.progress ?? 0}%</Pill>}>
        <div className="rounded-xl bg-surface border border-line p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12.5px] font-semibold text-ink">Avance general</p>
            <span className="text-[20px] font-bold tabular-nums text-brand-700">{c.execution?.progress ?? 0}%</span>
          </div>
          <Progress value={c.execution?.progress ?? 0} className="h-2.5" />
        </div>

        {!accepted && (
          <div className="rounded-lg bg-brand-50 border border-brand-200 p-4 flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-brand-700" />
              <p className="text-[12.5px] text-brand-800"><span className="font-semibold">Plan recibido.</span> El jefe del área debe aceptar el plan para iniciar la ejecución.</p>
            </div>
            <Button size="sm" onClick={() => store.acceptPlan(c.id)}><Check className="h-4 w-4" /> Aceptar Plan</Button>
          </div>
        )}

        {/* Solicitud de ampliación pendiente */}
        {c.extensionRequest && !c.extensionRequest.decision && (
          <div className="rounded-lg bg-warning-soft border border-warning/30 p-4 mb-4">
            <p className="text-[12.5px] font-semibold text-warning-ink">Solicitud de ampliación pendiente de decisión de SO</p>
            <p className="text-[12px] text-ink-soft mt-1">{c.extensionRequest.motivo} · nueva fecha: {formatDate(c.extensionRequest.nuevaFecha)}</p>
          </div>
        )}
        {c.extensionRequest?.decision === "aprobada" && (
          <div className="rounded-lg bg-brand-50 border border-brand-200 p-3 mb-4 text-[12.5px] text-brand-800">Ampliación aprobada — nuevo plazo: {formatDate(c.extensionRequest.nuevaFecha)}</div>
        )}
        {c.extensionRequest?.decision === "rechazada" && (
          <div className="rounded-lg bg-critical-soft border border-critical/20 p-3 mb-4 text-[12.5px] text-critical-ink">Ampliación rechazada — se mantiene el plazo original.</div>
        )}

        {/* Actividades */}
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2.5">Actividades del plan</p>
          <div className="space-y-2.5">
            {items.map((it, i) => (
              <div key={it.id} className="rounded-lg border border-line p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-ink-faint">#{i + 1}</span>
                      <p className="text-[13px] font-semibold text-ink truncate">{it.name}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-ink-quiet">
                      <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> {it.owner}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(it.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {(["pendiente", "en_progreso", "completado"] as const).map((st) => (
                      <button key={st} onClick={() => store.updateActionItem(c.id, it.id, { status: st })}
                        className={cn("h-7 px-2.5 rounded-md text-[11px] font-medium transition-all",
                          it.status === st ? st === "completado" ? "bg-brand-700 text-white" : st === "en_progreso" ? "bg-info text-white" : "bg-surface-3 text-ink" : "bg-surface text-ink-quiet hover:bg-surface-2")}>
                        {st === "completado" ? "Finalizada" : st === "en_progreso" ? "En proceso" : "Pendiente"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-2.5"><Progress value={it.progress} showLabel /></div>
                <div className="mt-2.5 flex items-center gap-2">
                  <Input value={activeItem === it.id ? itemComment : ""} onChange={(e) => { setActiveItem(it.id); setItemComment(e.target.value); }} placeholder="Agregar comentario…" className="h-8 text-[12px]" />
                  <Button variant="outline" size="sm" disabled={activeItem !== it.id || !itemComment.trim()} onClick={() => { if (itemComment.trim()) { store.updateActionItem(c.id, it.id, { comment: itemComment.trim() }); setItemComment(""); setActiveItem(null); } }}>Agregar</Button>
                </div>
                {it.comments.length > 0 && (
                  <div className="mt-2 space-y-1">{it.comments.map((cm, ci) => <p key={ci} className="text-[11.5px] text-ink-soft">· {cm}</p>)}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Evidencias y acciones */}
        <div className="mt-5 pt-4 border-t border-line-soft">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2.5">Evidencias de ejecución</p>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Button variant="outline" size="sm" onClick={() => addEvidence("foto")}><ImageIcon className="h-4 w-4" /> Adjuntar foto</Button>
            <Button variant="outline" size="sm" onClick={() => addEvidence("video")}><Video className="h-4 w-4" /> Adjuntar video</Button>
            <Button variant="outline" size="sm" onClick={() => addEvidence("documento")}><FileText className="h-4 w-4" /> Adjuntar documento</Button>
            <Button variant="outline" size="sm" onClick={() => setExtOpen(true)} className="ml-auto"><Timer className="h-4 w-4" /> Solicitar ampliación</Button>
          </div>
        </div>

        {allComplete && (
          <div className="pt-4 border-t border-line-soft rounded-xl bg-brand-50 border border-brand-200 p-4 flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-brand-800"><span className="font-semibold">Todas las actividades finalizadas.</span> Finalice la ejecución para devolver el caso a Seguridad Operativa.</p>
            <Button size="sm" onClick={() => store.completeExecution(c.id)}><CheckCircle2 className="h-4 w-4" /> Finalizar ejecución</Button>
          </div>
        )}
      </StageSection>

      <Modal open={extOpen} onClose={() => setExtOpen(false)} title="Solicitar ampliación de plazo" subtitle={`${c.id} · complete los campos obligatorios`}
        footer={<><Button variant="ghost" onClick={() => setExtOpen(false)}>Cancelar</Button><Button onClick={() => { if (extMotivo.trim() && extJustificacion.trim()) { store.requestExtension(c.id, { motivo: extMotivo.trim(), nuevaFecha: extFecha, justificacion: extJustificacion.trim() }); setExtOpen(false); setExtMotivo(""); setExtJustificacion(""); } }} disabled={!extMotivo.trim() || !extJustificacion.trim()}><Send className="h-4 w-4" /> Enviar solicitud a SO</Button></>}>
        <div className="space-y-4">
          <Field label="Motivo" required><Input value={extMotivo} onChange={(e) => setExtMotivo(e.target.value)} placeholder="Razón de la solicitud…" /></Field>
          <Field label="Nueva fecha propuesta" required><Input type="date" value={extFecha} onChange={(e) => setExtFecha(e.target.value)} /></Field>
          <Field label="Justificación" required><Textarea value={extJustificacion} onChange={(e) => setExtJustificacion(e.target.value)} rows={3} placeholder="Justifique la ampliación…" /></Field>
        </div>
      </Modal>
    </div>
  );
}

/* ─── ETAPA 6 — Verificación (SO) ─── */
function VerificationStage({ c, store }: { c: Store["cases"][number]; store: Store }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [extDecision, setExtDecision] = useState<"aprobada" | "rechazada" | null>(null);
  const [extNote, setExtNote] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const [closeNote, setCloseNote] = useState("");

  const pendingExt = c.extensionRequest && !c.extensionRequest.decision;

  return (
    <div className="space-y-4">
      {c.investigation && (
        <StageSection title="Investigación" subtitle="Hallazgos y causa raíz." icon={<Microscope className="h-5 w-5" />}>
          <InvDisplay inv={c.investigation} />
        </StageSection>
      )}
      {c.actionPlan && (
        <StageSection title="Plan de Acción ejecutado" subtitle="Revise el cumplimiento de las actividades." icon={<ClipboardList className="h-5 w-5" />}>
          <PlanDisplay c={c} />
        </StageSection>
      )}
      <StageSection title="Verificación y Cierre" subtitle="Seguridad Operativa revisa evidencias, verifica el cumplimiento y decide el cierre." icon={<Activity className="h-5 w-5" />} action={<Pill tone="warning" dot>En verificación</Pill>}>
        {pendingExt && (
          <div className="rounded-xl bg-warning-soft border border-warning/30 p-4 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="h-5 w-5 text-warning-ink shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-warning-ink">Solicitud de ampliación pendiente</p>
                <p className="text-[12.5px] text-ink-soft mt-0.5">{c.extensionRequest?.motivo} · nueva fecha: {formatDate(c.extensionRequest?.nuevaFecha ?? "")}</p>
                <p className="text-[12px] text-ink-soft mt-1">{c.extensionRequest?.justificacion}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" className="text-critical hover:bg-critical-soft" onClick={() => setExtDecision("rechazada")}><X className="h-4 w-4" /> Rechazar ampliación</Button>
              <Button size="sm" onClick={() => setExtDecision("aprobada")}><Check className="h-4 w-4" /> Aprobar ampliación</Button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap mb-4">
          <Button variant="outline" size="sm" onClick={() => setNoteOpen(true)}><StickyNote className="h-4 w-4" /> Registrar observación final</Button>
        </div>

        <div className="pt-4 border-t border-line-soft">
          <p className="text-[12.5px] text-ink-soft mb-3">Decisión final — elija una opción:</p>
          <div className="grid sm:grid-cols-3 gap-2">
            <button onClick={() => setCloseOpen(true)} className="rounded-xl border-2 border-brand-200 bg-brand-50 p-4 text-left hover:border-brand-400 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-brand-700 mb-2" />
              <p className="text-[13px] font-semibold text-brand-900">Cerrar Caso</p>
              <p className="text-[11.5px] text-brand-800/70 mt-0.5">Genera historial completo.</p>
            </button>
            <button onClick={() => store.keepPending(c.id)} className="rounded-xl border-2 border-warning/30 bg-warning-soft p-4 text-left hover:border-warning/50 transition-colors">
              <Timer className="h-5 w-5 text-warning-ink mb-2" />
              <p className="text-[13px] font-semibold text-warning-ink">Mantener Pendiente</p>
              <p className="text-[11.5px] text-ink-soft mt-0.5">Sigue en verificación.</p>
            </button>
            <button onClick={() => store.reopenCase(c.id)} className="rounded-xl border-2 border-info/20 bg-info-soft p-4 text-left hover:border-info/40 transition-colors">
              <CornerUpLeft className="h-5 w-5 text-info-ink mb-2" />
              <p className="text-[13px] font-semibold text-info-ink">Reabrir Caso</p>
              <p className="text-[11.5px] text-ink-soft mt-0.5">Vuelve a verificación.</p>
            </button>
          </div>
        </div>
      </StageSection>

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Registrar observación de verificación" subtitle={`${c.id} · queda en la bitácora`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancelar</Button><Button onClick={() => { if (note.trim()) { store.addVerificationNote(c.id, note.trim()); setNoteOpen(false); setNote(""); } }} disabled={!note.trim()}><StickyNote className="h-4 w-4" /> Guardar</Button></>}>
        <Field label="Observación" required><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} /></Field>
      </Modal>

      <Modal open={extDecision !== null} onClose={() => setExtDecision(null)} title={extDecision === "aprobada" ? "Aprobar ampliación" : "Rechazar ampliación"} subtitle={`${c.id} · decisión de SO`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setExtDecision(null)}>Cancelar</Button><Button variant={extDecision === "rechazada" ? "danger" : "primary"} onClick={() => { if (extDecision) store.reviewExtension(c.id, extDecision, extNote.trim() || undefined); setExtDecision(null); setExtNote(""); }}>Confirmar</Button></>}>
        <Field label="Nota (opcional)"><Textarea value={extNote} onChange={(e) => setExtNote(e.target.value)} rows={3} /></Field>
      </Modal>

      <Modal open={closeOpen} onClose={() => setCloseOpen(false)} title="Cerrar caso" subtitle={`${c.id} · se generará el historial completo`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setCloseOpen(false)}>Cancelar</Button><Button onClick={() => { store.closeCase(c.id, closeNote.trim() || undefined); setCloseOpen(false); }}><CheckCircle2 className="h-4 w-4" /> Confirmar cierre</Button></>}>
        <Field label="Nota de cierre (opcional)"><Textarea value={closeNote} onChange={(e) => setCloseNote(e.target.value)} rows={3} /></Field>
      </Modal>
    </div>
  );
}

/* ─── ETAPA 7 — Cierre ─── */
function ClosedStage({ c, store }: { c: Store["cases"][number]; store: Store }) {
  const createdAt = new Date(c.createdAt);
  const closedAt = new Date(c.closedAt ?? c.createdAt);
  const totalDays = Math.max(1, Math.round((closedAt.getTime() - createdAt.getTime()) / 86400000));
  const totalHours = Math.round((closedAt.getTime() - createdAt.getTime()) / 3600000);
  const participants = Array.from(new Set([c.reporter, c.assignee, ...c.timeline.map((t) => t.actor)].filter(Boolean)));
  const activityCount = c.actionPlan?.items.length ?? 0;
  const evidenceCount = c.evidence.length;
  const commentCount = c.timeline.filter((t) => t.kind === "comentario").length
    + (c.actionPlan?.items.reduce((acc, it) => acc + it.comments.length, 0) ?? 0)
    + (c.execution?.updates.length ?? 0);

  const [reopenOpen, setReopenOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<Stage>("verificacion");
  const [reason, setReason] = useState("");

  const summary = [
    { label: "Tiempo total de atención", value: totalDays >= 1 ? `${totalDays} días` : `${totalHours} h`, icon: Clock },
    { label: "Área responsable", value: AREA_LABELS[c.assigneeArea ?? c.area], icon: Building2 },
    { label: "Responsables participantes", value: `${participants.length}`, icon: UserIcon, detail: participants.join(", ") },
    { label: "Actividades del plan", value: `${activityCount}`, icon: ClipboardList },
    { label: "Evidencias adjuntas", value: `${evidenceCount}`, icon: FileText },
    { label: "Comentarios registrados", value: `${commentCount}`, icon: Activity },
  ];

  const canReopen = reason.trim().length >= 5;

  const doReopen = () => {
    if (canReopen) {
      store.reopenCaseWithReason(c.id, targetStage, reason.trim());
      setReopenOpen(false);
      setReason("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner de alerta — Reabrir caso */}
      <Card className="border-warning/30 bg-warning-soft/40 p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-warning/15 text-warning-ink grid place-items-center shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold text-ink">¿El caso fue cerrado incorrectamente?</p>
            <p className="text-[12.5px] text-ink-soft mt-0.5">
              Si la investigación, el plan de acción o cualquier información del caso no fue elaborada de manera correcta,
              puede reabrir el expediente y editarlo. Seleccione a qué etapa desea volver.
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-warning/40 text-warning-ink hover:bg-warning-soft shrink-0" onClick={() => setReopenOpen(true)}>
            <CornerUpLeft className="h-4 w-4" /> Reabrir y Editar
          </Button>
        </div>
      </Card>

      <StageSection title="Caso cerrado" subtitle="El expediente completo fue archivado por Seguridad Operativa." icon={<CheckCircle2 className="h-5 w-5" />} action={<Pill tone="neutral" dot>Cerrado {formatDate(c.closedAt ?? "")}</Pill>}>
        <div className="rounded-xl bg-brand-50 border border-brand-200 p-5 text-center">
          <div className="h-12 w-12 rounded-full bg-brand-700 text-white grid place-items-center mx-auto"><CheckCircle2 className="h-6 w-6" /></div>
          <p className="mt-3 text-[14px] font-semibold text-brand-900">Caso resuelto y archivado</p>
          <p className="text-[12.5px] text-brand-800/80 mt-1 max-w-md mx-auto">Toda la gestión quedó registrada en la línea de tiempo. El expediente está disponible para auditoría y reportes.</p>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-3">Resumen final del expediente</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {summary.map((s) => (
              <div key={s.label} className="rounded-xl bg-surface border border-line p-4">
                <div className="flex items-center gap-2 text-ink-faint"><s.icon className="h-4 w-4" /><span className="text-[11px] font-medium uppercase tracking-wide">{s.label}</span></div>
                <p className="mt-2 text-[18px] font-bold text-ink tabular-nums leading-none">{s.value}</p>
                {s.detail && <p className="text-[11px] text-ink-quiet mt-1.5 line-clamp-2">{s.detail}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-3">Historial completo del caso</p>
          <div className="rounded-xl border border-line overflow-hidden max-h-[280px] overflow-y-auto">
            {[...c.timeline].reverse().map((t) => (
              <div key={t.id} className="px-4 py-2.5 border-b border-line-soft last:border-0 flex items-start gap-3 text-[12px]">
                <span className="text-ink-faint tabular-nums shrink-0 w-28">{formatDateTime(t.at)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink font-medium">{t.title}</p>
                  <p className="text-ink-quiet mt-0.5">{t.actor}</p>
                  {t.detail && <p className="text-ink-soft mt-1 leading-relaxed">{t.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {c.investigation && (
          <div className="mt-5">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-3">Resumen de la investigación</p>
            <InvDisplay inv={c.investigation} />
          </div>
        )}
      </StageSection>

      {/* Modal: Reabrir caso */}
      <Modal
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reabrir caso para edición"
        subtitle={`${c.id} · seleccione la etapa a la que desea volver`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReopenOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={doReopen} disabled={!canReopen}>
              <CornerUpLeft className="h-4 w-4" /> Reabrir caso
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-warning-soft border border-warning/30 p-4 flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-warning-ink shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-ink">Reapertura de expediente</p>
              <p className="text-[12.5px] text-ink-soft mt-1">
                Al reabrir el caso, el estado cambiará de "Cerrado" a la etapa que seleccione.
                Se registrará en el historial quién reabrió el caso, cuándo y por qué motivo.
                Toda la información anterior se conserva.
              </p>
            </div>
          </div>

          <Field label="Etapa a la que desea volver" required>
            <Select value={targetStage} onChange={(e) => setTargetStage(e.target.value as Stage)}>
              <option value="verificacion">Verificación — corregir la verificación final</option>
              <option value="ejecucion">Ejecución — corregir avances o actividades</option>
              <option value="plan_accion">Plan de Acción — corregir o ajustar el plan</option>
              <option value="investigacion">Investigación — corregir hallazgos o causa raíz</option>
              <option value="evaluacion">Evaluación — corregir la evaluación del caso</option>
              <option value="recepcion">Recepción — revisar desde el inicio</option>
            </Select>
          </Field>

          <Field label="Motivo de la reapertura" required hint="Mínimo 5 caracteres — este motivo quedará registrado en el historial">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Explique por qué reabre el caso. Ej: La investigación no identificó la causa raíz correcta. El plan de acción no contempló todas las acciones necesarias. Se detectó información incompleta en el expediente…"
            />
          </Field>

          <div className="rounded-lg bg-info-soft border border-info/20 p-3 text-[12px] text-info-ink flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>El caso volverá a la etapa seleccionada y podrá editar la información correspondiente. El historial completo se conserva y la reapertura queda registrada con fecha, usuario y motivo.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function RejectedStage({ c }: { c: Store["cases"][number] }) {
  const reject = c.timeline.find((t) => t.kind === "rechazado");
  return (
    <StageSection title="Reporte rechazado" subtitle="El caso no procedió tras la revisión de Seguridad Operativa." icon={<X className="h-5 w-5" />} action={<Pill tone="critical" dot>Rechazado</Pill>}>
      <div className="rounded-xl bg-critical-soft border border-critical/20 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-critical-ink shrink-0 mt-0.5" />
        <div>
          <p className="text-[13.5px] font-semibold text-critical-ink">Motivo del rechazo</p>
          <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">{reject?.detail ?? "Sin detalle."}</p>
          <p className="text-[11.5px] text-ink-quiet mt-2">Registrado {relativeTime(reject?.at ?? "")}</p>
        </div>
      </div>
      <DescriptionBlock c={c} />
    </StageSection>
  );
}

/* ─── Panel derecho — Timeline ─── */
function RightPanel({ c }: { c: Store["cases"][number] }) {
  const events = [...c.timeline].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const [comment, setComment] = useState("");
  const { addTimelineComment } = useStore();

  return (
    <div className="lg:sticky lg:top-24">
      <Card padded={false}>
        <div className="p-4 border-b border-line-soft flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Línea de tiempo</p>
          <span className="text-[11px] text-ink-quiet tabular-nums">{c.timeline.length} eventos</span>
        </div>
        <div className="p-4 max-h-[600px] overflow-y-auto scrollbar-none">
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-line" />
            <div className="space-y-4">
              {events.map((t) => (
                <div key={t.id} className="relative pl-10">
                  <div className={cn("absolute left-0 top-1 h-8 w-8 rounded-full grid place-items-center border-2 border-white shrink-0",
                    t.actorRole === "seguridad" ? "bg-brand-100 text-brand-800" : "bg-surface-2 text-ink-soft")}>
                    <TimelineIcon kind={t.kind} />
                  </div>
                  <p className="text-[12.5px] font-semibold text-ink leading-tight">{t.title}</p>
                  <p className="text-[11px] text-ink-quiet mt-0.5">{t.actor} · {relativeTime(t.at)}</p>
                  {t.detail && <p className="text-[12px] text-ink-soft mt-1.5 leading-relaxed bg-surface/60 rounded-md p-2">{t.detail}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-line-soft">
          <Field label="Agregar comentario al expediente">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Comentario interno…" />
          </Field>
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="secondary" disabled={!comment.trim()} onClick={() => { if (comment.trim()) { addTimelineComment(c.id, comment.trim()); setComment(""); } }}>
              <Paperclip className="h-3.5 w-3.5" /> Agregar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TimelineIcon({ kind }: { kind: string }) {
  const map: Record<string, typeof FileSearch> = {
    creado: FileText, aprobado: Check, rechazado: X, info_solicitada: Mail, info_recibida: CornerUpLeft,
    derivado: Send, investigacion: Microscope, plan_propuesto: ClipboardList, plan_aprobado: CheckCircle2,
    plan_ajustado: AlertCircle, ejecucion: Rocket, ampliacion: Timer, seguimiento: Activity,
    cierre: CheckCircle2, reapertura: CornerUpLeft, comentario: FileText, sancion: Gavel,
  };
  const Icon = map[kind] ?? FileText;
  return <Icon className="h-4 w-4" />;
}

/* ─── Descargar Plan de Acción (PDF imprimible) ─── */
function downloadPlan(c: Store["cases"][number]) {
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
      <div><b>Análisis de riesgo</b><br/>${RISK_LABELS[c.riskLevel]}</div>
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

