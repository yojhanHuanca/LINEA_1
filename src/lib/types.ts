// SIGMA L1 — Domain types
// Sistema de Gestión de Seguridad Operativa · Línea 1 del Metro de Lima

export type Role = "reportante" | "seguridad" | "jefe";

export type EventType =
  | "accidente"
  | "incidente"
  | "observacion"
  | "condicion_insegura"
  | "acto_inseguro"
  | "falla_operativa"
  | "riesgo"
  | "hallazgo"
  | "incumplimiento"
  | "otro";

export type Priority = "critica" | "alta" | "media" | "baja";

export type Area =
  | "mantenimiento"
  | "subestaciones"
  | "operaciones"
  | "comunicaciones"
  | "infraestructura"
  | "material_rodante"
  | "limpieza"
  | "seguridad_fisica";

export type Stage =
  | "recepcion"
  | "evaluacion"
  | "investigacion"
  | "plan_accion"
  | "ejecucion"
  | "verificacion"
  | "cierre"
  | "rechazado"
  | "pendiente_info";

export type EvidenceKind = "foto" | "video" | "documento";

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  name: string;
  size: string;
  at: string;
}

export interface TimelineEvent {
  id: string;
  kind:
    | "creado"
    | "info_solicitada"
    | "info_recibida"
    | "aprobado"
    | "rechazado"
    | "derivado"
    | "investigacion"
    | "plan_propuesto"
    | "plan_aprobado"
    | "plan_ajustado"
    | "ejecucion"
    | "ampliacion"
    | "seguimiento"
    | "cierre"
    | "reapertura"
    | "comentario"
    | "sancion";
  at: string;
  actor: string;
  actorRole: Role;
  title: string;
  detail?: string;
}

export interface ActionItem {
  id: string;
  name: string;
  description: string;
  owner: string;
  priority: Priority;
  startDate: string;
  dueDate: string;
  progress: number; // 0..100
  status: "pendiente" | "en_progreso" | "completado";
  comments: string[];
}

export interface Investigation {
  findings: string;
  rootCause: string;
  technicalDescription: string;
  observations: string;
  conclusions: string;
  updatedAt: string;
}

export interface ExecutionUpdate {
  id: string;
  at: string;
  author: string;
  progress: number;
  comment: string;
}

export interface CaseFile {
  id: string; // CASO-2026-001
  type: EventType;
  title: string;
  description: string;
  observations: string;
  area: Area;
  station: string;
  location: string;
  date: string; // ISO date
  time: string;
  priority: Priority;
  stage: Stage;
  reporter: string;
  reporterRole: Role;
  anonymous?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  investigator?: string; // Analista SO asignado a la investigación
  assignee?: string;
  assigneeArea?: Area;
  assignmentPriority?: Priority;
  assignmentDueDate?: string;
  assignmentNote?: string;
  involvedWorkers?: InvolvedWorker[];
  evidence: Evidence[];
  timeline: TimelineEvent[];
  evaluation?: {
    gravity: "critica" | "alta" | "media" | "baja";
    classification: string;
    requiresInvestigation: boolean;
    observations: string;
    updatedAt: string;
  };
  investigation?: Investigation;
  actionPlan?: {
    elaboratedBy: string;
    actionType: string;
    description: string;
    startDate: string;
    dueDate: string;
    estimatedTime: string;
    priority: Priority;
    observations: string;
    items: ActionItem[];
    submittedAt?: string;
    sentToArea?: Area;
    reviewedAt?: string;
    reviewDecision?: "aprobado" | "rechazado";
    reviewNote?: string;
  };
  extensionRequest?: {
    motivo: string;
    nuevaFecha: string;
    justificacion: string;
    requestedAt: string;
    decision?: "aprobada" | "rechazada";
    decidedAt?: string;
  };
  execution?: {
    progress: number;
    updates: ExecutionUpdate[];
    acceptedByAreaAt?: string;
  };
  slaDueDate: string;
  createdAt: string;
  closedAt?: string;
  pendingInfoRequest?: {
    question: string;
    requestedAt: string;
  };
}

export interface Notification {
  id: string;
  caseId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  audience: Role | "both";
  kind: "info" | "warning" | "critical" | "success";
}

export type UserRole =
  | "administrador"
  | "analista_so"
  | "supervisor"
  | "jefe_area"
  | "responsable_plan"
  | "consulta";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  administrador: "Administrador",
  analista_so: "Analista Seguridad Operativa",
  supervisor: "Supervisor",
  jefe_area: "Jefe de Área",
  responsable_plan: "Responsable del Plan",
  consulta: "Consulta",
};

export type LaborState = "activo" | "licencia" | "suspendido" | "baja_definitiva";

export const LABOR_STATE_LABELS: Record<LaborState, string> = {
  activo: "Activo",
  licencia: "Licencia",
  suspendido: "Suspendido",
  baja_definitiva: "Baja Definitiva",
};

export type ImplicationType =
  | "afectado"
  | "presunto_responsable"
  | "testigo"
  | "operador_involucrado"
  | "personal_apoyo"
  | "supervisor_participante"
  | "responsable_operativo"
  | "otro";

export const IMPLICATION_LABELS: Record<ImplicationType, string> = {
  afectado: "Afectado",
  presunto_responsable: "Presunto responsable",
  testigo: "Testigo",
  operador_involucrado: "Operador involucrado",
  personal_apoyo: "Personal de apoyo",
  supervisor_participante: "Supervisor participante",
  responsable_operativo: "Responsable operativo",
  otro: "Otro",
};

export interface User {
  id: string;
  code: string; // Código del trabajador (EMP-0001)
  dni: string; // DNI del trabajador
  name: string;
  role: Role;
  userRole: UserRole;
  area?: Area;
  cargo: string;
  email: string;
  phone?: string;
  initials: string;
  status: "activo" | "inactivo";
  laborState: LaborState;
  hiredAt: string; // Fecha de ingreso
  lastSyncAt: string; // Última sincronización
  avatarColor?: string;
}

// Trabajador involucrado en un caso (snapshot inmutable de los datos al momento de agregarlo)
export interface InvolvedWorker {
  id: string;
  userId: string;
  code: string;
  dni: string;
  name: string;
  cargo: string;
  area: Area;
  initials: string;
  avatarColor?: string;
  laborState: LaborState; // puede cambiar a baja_definitiva tras sincronización
  immediateBoss: string; // Jefe inmediato
  implication: ImplicationType; // Tipo de implicación en el caso
  statement?: string; // Declaración
  observations?: string; // Observaciones
  addedAt: string;
  removedAt?: string; // si fue retirado del caso
}

export interface SyncLog {
  id: string;
  at: string;
  triggeredBy: string; // "Sistema" o nombre del admin
  newUsers: number;
  updatedUsers: number;
  deactivatedUsers: number;
  durationSec: number;
  status: "completada" | "en_proceso";
}

export const USER_ROLE_TONE: Record<UserRole, "brand" | "info" | "warning" | "neutral" | "critical" | "success"> = {
  administrador: "critical",
  analista_so: "brand",
  supervisor: "info",
  jefe_area: "warning",
  responsable_plan: "success",
  consulta: "neutral",
};

export const STATIONS: string[] = [
  "San Juan",
  "Atocongo",
  "Pamplona",
  "Matellini",
  "Puno",
  "Parque Industrial",
  "Pueblo Libre",
  "Oscar R. Benavides",
  "Cabitos",
  "Ayacucho",
  "Javier Prado",
  "El Ángel",
  "Gamarra",
  "Caja de Agua",
  "Pirámide del Sol",
  "Estación Central",
];

export const AREA_LABELS: Record<Area, string> = {
  mantenimiento: "Mantenimiento",
  subestaciones: "Subestaciones",
  operaciones: "Operaciones",
  comunicaciones: "Comunicaciones",
  infraestructura: "Infraestructura",
  material_rodante: "Material Rodante",
  limpieza: "Limpieza y Sanitización",
  seguridad_fisica: "Seguridad Física",
};

export const AREA_HEADS: Record<Area, string> = {
  mantenimiento: "Jorge Salazar",
  subestaciones: "Ingrid Quispe",
  operaciones: "Raúl Mendoza",
  comunicaciones: "Cecilia Tapia",
  infraestructura: "Luis Bravo",
  material_rodante: "Ana Villanueva",
  limpieza: "Mario Chávez",
  seguridad_fisica: "Patricia Ríos",
};

export const EVENT_LABELS: Record<EventType, string> = {
  accidente: "Accidente",
  incidente: "Incidente",
  observacion: "Observación",
  condicion_insegura: "Condición Insegura",
  acto_inseguro: "Acto Inseguro",
  falla_operativa: "Falla Operativa",
  riesgo: "Riesgo",
  hallazgo: "Hallazgo",
  incumplimiento: "Incumplimiento",
  otro: "Otro evento",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const STAGE_LABELS: Record<Stage, string> = {
  recepcion: "Recepción",
  evaluacion: "Evaluación",
  investigacion: "Investigación",
  plan_accion: "Plan de Acción",
  ejecucion: "Ejecución",
  verificacion: "Verificación",
  cierre: "Cierre",
  rechazado: "Rechazado",
  pendiente_info: "Pendiente de Información",
};

export const STAGE_ORDER: Stage[] = [
  "recepcion",
  "evaluacion",
  "investigacion",
  "plan_accion",
  "ejecucion",
  "verificacion",
  "cierre",
];

export const STAGE_STATUS: Record<Stage, "abierto" | "cerrado" | "rechazado"> = {
  recepcion: "abierto",
  evaluacion: "abierto",
  investigacion: "abierto",
  plan_accion: "abierto",
  ejecucion: "abierto",
  verificacion: "abierto",
  cierre: "cerrado",
  rechazado: "rechazado",
  pendiente_info: "abierto",
};
