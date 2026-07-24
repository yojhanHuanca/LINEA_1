// SIGMA L1 — Domain types
// Sistema de Gestión de Seguridad Operativa · Línea 1 del Metro de Lima
// Campos alineados con planilla SOP oficial de Seguridad Operativa

export type Role = "reportante" | "seguridad" | "jefe";

// ─── Matriz de Riesgo 5×5 (reemplaza prioridad) ───
// 1A-1E = Inaceptable (rojo) · 2A-2E = No deseable (naranja)
// 3A-3E = Aceptable con revisión (amarillo) · 4A-4E = Aceptable (verde)
export type RiskLevel =
  | "1A" | "1B" | "1C" | "1D" | "1E"
  | "2A" | "2B" | "2C" | "2D" | "2E"
  | "3A" | "3B" | "3C" | "3D" | "3E"
  | "4A" | "4B" | "4C" | "4D" | "4E";

export type RiskCategory = "inaceptable" | "no_deseable" | "aceptable_revision" | "aceptable";

export const RISK_LABELS: Record<RiskLevel, string> = {
  "1A": "1A — Inaceptable", "1B": "1B — Inaceptable", "1C": "1C — Inaceptable",
  "1D": "1D — Inaceptable", "1E": "1E — Inaceptable",
  "2A": "2A — Inaceptable", "2B": "2B — Inaceptable",
  "2C": "2C — No deseable", "2D": "2D — Aceptable c/revisión", "2E": "2E — Aceptable c/revisión",
  "3A": "3A — No deseable", "3B": "3B — No deseable",
  "3C": "3C — Aceptable c/revisión", "3D": "3D — Aceptable c/revisión", "3E": "3E — Aceptable c/revisión",
  "4A": "4A — Aceptable c/revisión", "4B": "4B — Aceptable",
  "4C": "4C — Aceptable", "4D": "4D — Aceptable", "4E": "4E — Aceptable",
};

export function riskCategory(r: RiskLevel): RiskCategory {
  const n = parseInt(r[0]);
  if (n === 1) return "inaceptable";
  if (n === 2) return r[1] <= "B" ? "inaceptable" : r[1] === "C" ? "no_deseable" : "aceptable_revision";
  if (n === 3) return r[1] <= "B" ? "no_deseable" : "aceptable_revision";
  return r[1] === "A" ? "aceptable_revision" : "aceptable";
}

export const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  inaceptable: "Inaceptable",
  no_deseable: "No deseable",
  aceptable_revision: "Aceptable con revisión",
  aceptable: "Aceptable",
};

export const RISK_CATEGORY_TONE: Record<RiskCategory, "critical" | "warning" | "info" | "brand"> = {
  inaceptable: "critical",
  no_deseable: "warning",
  aceptable_revision: "info",
  aceptable: "brand",
};

export const RISK_CATEGORY_COLOR: Record<RiskCategory, string> = {
  inaceptable: "#ef4444",
  no_deseable: "#f97316",
  aceptable_revision: "#eab308",
  aceptable: "#22c55e",
};

// SLA basado en categoría de riesgo
export const RISK_SLA_DAYS: Record<RiskCategory, number> = {
  inaceptable: 3,
  no_deseable: 7,
  aceptable_revision: 14,
  aceptable: 21,
};

export function slaDaysForRisk(r: RiskLevel): number {
  return RISK_SLA_DAYS[riskCategory(r)];
}

// Compatibilidad: mapear RiskLevel a Priority interna para no romper código viejo
export type Priority = "critica" | "alta" | "media" | "baja";

export function riskToPriority(r: RiskLevel): Priority {
  const cat = riskCategory(r);
  if (cat === "inaceptable") return "critica";
  if (cat === "no_deseable") return "alta";
  if (cat === "aceptable_revision") return "media";
  return "baja";
}

export const SLA_DAYS: Record<Priority, number> = {
  critica: 3,
  alta: 7,
  media: 14,
  baja: 21,
};

export function slaDaysFor(priority: Priority): number {
  return SLA_DAYS[priority];
}

// ─── Tipo de SOP ───
export type TipoSOP = "hallazgo" | "incidente" | "reporte_voluntario" | "accidente";

export const TIPO_SOP_LABELS: Record<TipoSOP, string> = {
  hallazgo: "Hallazgo",
  incidente: "Incidente",
  reporte_voluntario: "Reporte Voluntario",
  accidente: "Accidente",
};

// ─── Subtipo SOP ───
export type SubtipoSOP =
  | "atrapamiento" | "caida" | "caida_rotura_linea" | "condiciones_entorno"
  | "descarrilamiento" | "ejecucion_inadecuada" | "error_sistemas_tren"
  | "falta_control_herramientas" | "falta_mantenimiento" | "falta_instrucciones"
  | "falta_comunicacion" | "incumplimiento_operativo" | "indisponibilidad_equipos"
  | "instalaciones_deficientes" | "movimiento_equipos_aux" | "objeto_extraño"
  | "talonamiento" | "otro";

export const SUBTIPO_SOP_LABELS: Record<SubtipoSOP, string> = {
  atrapamiento: "Atrapamiento",
  caida: "Caída",
  caida_rotura_linea: "Caída o rotura de línea de contacto",
  condiciones_entorno: "Condiciones del entorno",
  descarrilamiento: "Descarrilamiento",
  ejecucion_inadecuada: "Ejecución inadecuada de procedimiento",
  error_sistemas_tren: "Error en funcionamiento de sistemas de tren",
  falta_control_herramientas: "Falta/deficiente control de herramientas y equipos",
  falta_mantenimiento: "Falta/deficientes programas de mantenimiento",
  falta_instrucciones: "Falta/inadecuadas instrucciones de equipamientos",
  falta_comunicacion: "Falta o deficiencia de comunicación",
  incumplimiento_operativo: "Incumplimiento Operativo",
  indisponibilidad_equipos: "Indisponibilidad/mal funcionamiento de equipos",
  instalaciones_deficientes: "Instalaciones deficientes",
  movimiento_equipos_aux: "Movimiento de equipos auxiliares",
  objeto_extraño: "Objeto extraño en vía",
  talonamiento: "Talonamiento",
  otro: "Otro",
};

// ─── Procedencia ───
export type Procedencia = "auditoria_ssoma" | "incidencias" | "reporte_voluntario" | "otro";

export const PROCEDENCIA_LABELS: Record<Procedencia, string> = {
  auditoria_ssoma: "Auditoría SSOMA",
  incidencias: "Incidencias",
  reporte_voluntario: "Reporte Voluntario",
  otro: "Otro",
};

// ─── Estado de Hallazgo ───
export type EstadoHallazgo = "cerrado" | "en_proceso";

export const ESTADO_HALLAZGO_LABELS: Record<EstadoHallazgo, string> = {
  cerrado: "Cerrado",
  en_proceso: "En Proceso",
};

// ─── Tipo (No conformidad / Observación) ───
export type TipoHallazgo = "no_conformidad" | "observacion";

export const TIPO_HALLAZGO_LABELS: Record<TipoHallazgo, string> = {
  no_conformidad: "No conformidad",
  observacion: "Observación",
};

// ─── Áreas SOP (15 áreas reales del Excel) ───
export type AreaSOP =
  | "capacitacion" | "control_calidad" | "gh" | "gi" | "ingenieria"
  | "mantenimiento" | "mr" | "operaciones" | "pco" | "proyectos"
  | "seguridad_operativa" | "ssoma" | "teq" | "vias_obras";

export const AREA_SOP_LABELS: Record<AreaSOP, string> = {
  capacitacion: "Capacitación",
  control_calidad: "Control de Calidad",
  gh: "GH",
  gi: "GI",
  ingenieria: "Ingeniería",
  mantenimiento: "Mantenimiento",
  mr: "MR",
  operaciones: "Operaciones",
  pco: "PCO",
  proyectos: "Proyectos",
  seguridad_operativa: "Seguridad Operativa",
  ssoma: "SSOMA",
  teq: "TEQ",
  vias_obras: "Vías y Obras",
};

// ─── Responsables de Hallazgo/Investigación/RSO (17 personas) ───
export const RESPONSABLES_INVESTIGACION: string[] = [
  "Antonio Rebaza Lizaraso",
  "Carlos Barreda Torres",
  "Emerson Navarrete Sotelo",
  "Gabriel Ferreira Acosta",
  "Hector Hinostroza Mansilla",
  "Jesus Alejandro Vielma Ochoa",
  "Jorge Arévalo Angeles",
  "Jose Pacombia Pocohuanca",
  "Juan Castro Velazco",
  "Karen Peralta Canchis",
  "Louana Martel Ramos",
  "Maximo Jesús Alvarez Garcia",
  "Roberto Pomar Roman",
  "Ruben Francisco Luque Carbajal",
  "Teófilo De La Mata Luque",
  "Victor Ruiz Micha",
  "Anderson Sandoval Ramirez",
];

// ─── Responsables de Plan de Acción (6 personas) ───
export const RESPONSABLES_PLAN: string[] = [
  "Alejandro Vielma",
  "Amanda Ridoutt Orozco",
  "Antonio Rebaza Lizaraso",
  "Carlos Barreda Torres",
  "Cesar Malca Yañez",
  "Christian Oliva",
];

// ─── Tipo de Incidente Operativo (20 tipos) ───
export type TipoIncidenteOperativo =
  | "amenaza_suicida" | "arrollamiento" | "atrapamiento" | "atrapamiento_dj"
  | "atropello" | "caida_estacion" | "caida_estacion_dj" | "colision_mr_obstaculo"
  | "desalojo" | "descarrilamiento" | "impacto_fisico" | "impacto_fisico_dj"
  | "ingreso_via" | "intento_suicidio" | "no_abre_puertas" | "no_para_estacion"
  | "otro_incidente" | "parada_incorrecta" | "rotura_catenaria" | "talonamiento";

export const TIPO_INCIDENTE_LABELS: Record<TipoIncidenteOperativo, string> = {
  amenaza_suicida: "Amenaza suicida",
  arrollamiento: "Arrollamiento",
  atrapamiento: "Atrapamiento",
  atrapamiento_dj: "Atrapamiento-DJ",
  atropello: "Atropello",
  caida_estacion: "Caída en estación",
  caida_estacion_dj: "Caída en estación-DJ",
  colision_mr_obstaculo: "Colisión MR-Obstáculo",
  desalojo: "Desalojo",
  descarrilamiento: "Descarrilamiento",
  impacto_fisico: "Impacto físico",
  impacto_fisico_dj: "Impacto físico-DJ",
  ingreso_via: "Ingreso a la vía",
  intento_suicidio: "Intento de suicidio",
  no_abre_puertas: "No abre puertas",
  no_para_estacion: "No para en estación",
  otro_incidente: "Otro",
  parada_incorrecta: "Parada incorrecta",
  rotura_catenaria: "Rotura de catenaria",
  talonamiento: "Talonamiento",
};

// ─── Ubicación ───
export type Ubicacion =
  | "andén" | "ascensor" | "escalera_electrica" | "escalera_fija" | "escalera_interna"
  | "estación" | "explanada" | "hall" | "interestacional" | "pasarela"
  | "patio" | "sshh" | "tren" | "zona_no_paga";

export const UBICACION_LABELS: Record<Ubicacion, string> = {
  andén: "ANDEN",
  ascensor: "ASCENSOR",
  escalera_electrica: "ESCALERA ELÉCTRICA",
  escalera_fija: "ESCALERA FIJA",
  escalera_interna: "ESCALERA INTERNA",
  estación: "ESTACIÓN",
  explanada: "EXPLANADA",
  hall: "HALL",
  interestacional: "INTERESTACIONAL",
  pasarela: "PASARELA",
  patio: "PATIO",
  sshh: "SERVICIOS HIGIÉNICOS",
  tren: "TREN",
  zona_no_paga: "ZONA NO PAGA",
};

// ─── Lugar de Incidente (códigos de estación del Excel) ───
export type LugarIncidente =
  | "VES" | "PIN" | "PUM" | "VMA" | "MAU" | "SJU" | "ATO" | "JCH"
  | "AYA" | "CAB" | "ANG" | "SBS" | "CUL" | "NAR" | "GAM" | "MIG"
  | "ELA" | "PRE" | "CAA" | "PIR" | "JAR" | "POS" | "SCA" | "SMA"
  | "SRO" | "BAY" | "EXTERIORES";

export const LUGAR_INCIDENTE_LABELS: Record<LugarIncidente, string> = {
  VES: "Villa El Salvador", PIN: "Pueblo Nuevo", PUM: "Pumacahua",
  VMA: "Villa María", MAU: "María Auxiliadora", SJU: "San Juan",
  ATO: "Atocongo", JCH: "Jorge Chávez", AYA: "Ayacucho",
  CAB: "Cabitos", ANG: "El Ángel", SBS: "San Borja Sur",
  CUL: "Culebras", NAR: "Naranjal", GAM: "Gamarra", MIG: "Miguel Grau",
  ELA: "El Ángel", PRE: "Presbítero", CAA: "Caja de Agua",
  PIR: "Pirámide del Sol", JAR: "Jardín", POS: "Posta",
  SCA: "San Carlos", SMA: "Santa María", SRO: "San Roque",
  BAY: "Bayóvar", EXTERIORES: "Exteriores",
};

// ─── Modelo MR ───
export type ModeloMR = "ALSTOM" | "ANSALDO" | "N/A" | "VFA";

export const MODELO_MR_LABELS: Record<ModeloMR, string> = {
  ALSTOM: "ALSTOM",
  ANSALDO: "ANSALDO",
  "N/A": "N/A",
  VFA: "VFA",
};

// ─── Nro. MR (T1-T44 + vehículos auxiliares) ───
export const NRRO_MR_OPTIONS: string[] = [
  "N/A",
  ...Array.from({ length: 44 }, (_, i) => `T${i + 1}`),
  "V-BIVIAL", "V-DRESINA", "V-GRECO", "V-GRUA", "VH-PLATAFORMA", "V-PLATAFORMA",
];

// ─── Personal o Falla Involucrado ───
export type PersonalFalla =
  | "agente_estación" | "conductor" | "falla_tren" | "ios" | "jr_abierto_acat"
  | "jr_acat_frenos" | "jr_acat_ventilacion" | "mr" | "otro_personal" | "pasajero"
  | "limpieza" | "tecnico" | "tercero" | "transeunte" | "avp";

export const PERSONAL_FALLA_LABELS: Record<PersonalFalla, string> = {
  agente_estación: "Agente de estación",
  conductor: "Conductor",
  falla_tren: "Falla de tren",
  ios: "IOS",
  jr_abierto_acat: "JR abierto y/o ACAT",
  jr_acat_frenos: "JR, ACAT y/o frenos cerrados",
  jr_acat_ventilacion: "JR, ACAT y/o falta de ventilación",
  mr: "MR",
  otro_personal: "Otro",
  pasajero: "Pasajero",
  limpieza: "Personal de limpieza",
  tecnico: "Técnico",
  tercero: "Tercero",
  transeunte: "Transeúnte",
  avp: "AVP",
};

// ─── Tipo Causa ───
export type TipoCausa =
  | "carrera_comercial_bay" | "factor_externo" | "falla_operacional" | "falla_tecnica";

export const TIPO_CAUSA_LABELS: Record<TipoCausa, string> = {
  carrera_comercial_bay: "Carrera comercial a bay",
  factor_externo: "Factor externo",
  falla_operacional: "Falla operacional",
  falla_tecnica: "Falla técnica",
};

// ─── Posible Causa (40+ opciones) ───
export const POSIBLE_CAUSA_OPTIONS: string[] = [
  "Actos delictivos", "Amenaza suicida", "Caída", "Confusión", "Cruzar",
  "Distracción", "Eléctrico", "Empujado", "En investigación", "Error de humano",
  "Errores de manejo u operación", "Estado etílico",
  "Estrés térmico en el punto de contacto", "Falla de tren, pedido de Trabajo 656150",
  "Fatiga y somnolencia", "Incumplimiento Videa", "Intento de suicidio",
  "IOS 225, 245", "JR ABIERTO y/o ACAT", "JR abierto, ACAT y falta de ventilación",
  "Lubricación", "Lubricación de curvas", "Mala comunicación",
  "Manejo o conducción", "Mécanico", "Miccionar",
  "No cumplió procedimiento o método establecido", "No identificada",
  "No se cumplió procedimiento", "Obstrucción", "Omisión de procedimientos",
  "Otro", "Problemas mentales", "Problemas mentales, enfermedades",
  "Recoger objeto", "Retiro de animal en la vía",
  "Salida/entrada a destiempo", "Salir", "Suicidio",
  "Transeúnte en la vía", "Tropiezo", "Uso de celular/distraído",
];

// ─── Rango Horario ───
export const RANGO_HORARIO_OPTIONS: string[] = [
  "00:00 - 01:59", "02:00 - 03:59", "04:00 - 05:59",
  "06:00 - 07:59", "08:00 - 09:59", "10:00 - 11:59",
  "12:00 - 13:59", "14:00 - 15:59", "16:00 - 17:59",
  "18:00 - 19:59", "20:00 - 21:59", "22:00 - 23:59",
];

// ─── Tipo de Vía ───
export type TipoVia = "impar" | "par";

// ─── Dirección de Vía ───
export type DireccionVia = "legal" | "N/A";

// ─── Estado Plan de Acción ───
export type EstadoPlan = "cerrado" | "pendiente";

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
  id: string; // SOP-01-2026
  type: EventType;
  title: string;
  description: string;
  observations: string;
  area: Area;
  station: string;
  location: string;
  date: string; // ISO date
  time: string;
  priority: Priority; // derivado de riskLevel (compatibilidad)
  riskLevel: RiskLevel; // matriz 1A-4E (reemplaza prioridad)
  stage: Stage;
  reporter: string;
  reporterRole: Role;
  anonymous?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  investigator?: string;
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

  // ─── Campos SOP (planilla oficial) ───
  sop?: {
    fechaHallazgo: string;
    fechaEvento: string;
    estadoHallazgo: EstadoHallazgo;
    procedencia: Procedencia;
    tipoHallazgo: TipoHallazgo;
    responsableInvestigacion: string;
    tipoSOP: TipoSOP;
    subtipoSOP: SubtipoSOP;
    peligro: string;
    consecuencia: string;
    analisisRiesgo: RiskLevel;
    acr: string;
    anexos?: string;
    // Plan de acción
    planCodigo?: string;
    planDescripcion?: string;
    planArea?: AreaSOP;
    planResponsable?: string;
    planEstado?: EstadoPlan;
    planFecha?: string;
    planFechaProgramada?: string;
    planDiasAbierto?: string;
  };
  // ─── Evento operativo ───
  evento?: {
    rangoHorario?: string;
    tipoIncidenteOperativo?: TipoIncidenteOperativo;
    descripcionEvento?: string;
    ubicacion?: Ubicacion;
    tipoVia?: TipoVia;
    direccionVia?: DireccionVia;
    lugarIncidente?: LugarIncidente;
    modeloMR?: ModeloMR;
    nroMR?: string;
    nroCarrera?: string;
    personalFalla?: PersonalFalla;
    tipoCausa?: TipoCausa;
    posibleCausa?: string;
    informacionAdicional?: string;
    camaraMonitoreada?: string;
    demora?: string;
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

// ─── Catálogo de Cargos (estructura organizacional) ───
export type Cargo =
  | "gerente"
  | "jefe_area"
  | "supervisor"
  | "analista_so"
  | "tecnico"
  | "inspector"
  | "operador"
  | "auditor";

export const CARGO_LABELS: Record<Cargo, string> = {
  gerente: "Gerente",
  jefe_area: "Jefe de Área",
  supervisor: "Supervisor",
  analista_so: "Analista de Seguridad Operativa",
  tecnico: "Técnico",
  inspector: "Inspector",
  operador: "Operador",
  auditor: "Auditor",
};

// ─── Roles del Sistema (permisos de acceso) ───
// Solo 4 roles: controlan qué puede hacer el usuario en la plataforma
export type SystemRole = "administrador" | "seguridad_operativa" | "auditor" | "consulta";

export const SYSTEM_ROLE_LABELS: Record<SystemRole, string> = {
  administrador: "Administrador",
  seguridad_operativa: "Seguridad Operativa",
  auditor: "Auditor",
  consulta: "Consulta",
};

export const SYSTEM_ROLE_DESCRIPTIONS: Record<SystemRole, string> = {
  administrador: "Acceso total al sistema, gestión de usuarios, sincronización y configuración",
  seguridad_operativa: "Gestión de casos, investigación, planes de acción y cierre del expediente",
  auditor: "Revisión de cumplimiento, auditorías y trazabilidad de procesos (solo lectura)",
  consulta: "Acceso de solo lectura a expedientes y reportes",
};

export const SYSTEM_ROLE_TONE: Record<SystemRole, "critical" | "brand" | "info" | "neutral"> = {
  administrador: "critical",
  seguridad_operativa: "brand",
  auditor: "info",
  consulta: "neutral",
};

// Mantener compatibilidad hacia atrás (UserRole se mantiene para no romper otros módulos)
export type UserRole = SystemRole;
export const USER_ROLE_LABELS = SYSTEM_ROLE_LABELS;
export const USER_ROLE_DESCRIPTIONS = SYSTEM_ROLE_DESCRIPTIONS;
export const USER_ROLE_TONE = SYSTEM_ROLE_TONE;

export type LaborState = "activo" | "vacaciones" | "licencia" | "suspendido" | "baja_temporal" | "baja_definitiva";

export const LABOR_STATE_LABELS: Record<LaborState, string> = {
  activo: "Activo",
  vacaciones: "Vacaciones",
  licencia: "Licencia",
  suspendido: "Suspendido",
  baja_temporal: "Baja Temporal",
  baja_definitiva: "Baja Definitiva",
};

export const LABOR_STATE_TONE: Record<LaborState, "brand" | "info" | "warning" | "critical" | "neutral"> = {
  activo: "brand",
  vacaciones: "info",
  licencia: "info",
  suspendido: "warning",
  baja_temporal: "warning",
  baja_definitiva: "critical",
};

export type Turno = "mañana" | "tarde" | "noche" | "rotativo";

export const TURNO_LABELS: Record<Turno, string> = {
  mañana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
  rotativo: "Rotativo",
};

export type ContractType = "indefinido" | "plazo_fijo" | "contratista" | "practicante";

export const CONTRACT_LABELS: Record<ContractType, string> = {
  indefinido: "Indefinido",
  plazo_fijo: "Plazo Fijo",
  contratista: "Contratista",
  practicante: "Practicante",
};

export interface WorkHistoryEntry {
  id: string;
  at: string;
  field: string; // "area", "cargo", "jefe", "correo", "estado", "alta"
  oldValue: string;
  newValue: string;
  source: "excel" | "manual";
}

export interface UserActivity {
  id: string;
  at: string;
  type: "login" | "caso_revisado" | "plan_aceptado" | "investigacion" | "archivo_cargado" | "correo_enviado" | "cambio";
  title: string;
  detail?: string;
}

export interface RoleAssignment {
  role: SystemRole;
  assignedBy: string;
  assignedAt: string;
}

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
  firstName: string; // Nombres
  lastName: string; // Apellidos
  name: string; // Nombre completo (computed: firstName + lastName)
  role: Role; // Role interno del prototipo (reportante/seguridad/jefe)
  userRole: SystemRole; // Mantener compatibilidad
  systemRole: SystemRole; // Rol del sistema (permisos)
  roles: RoleAssignment[]; // roles asignados con historial
  area?: Area;
  subarea?: string;
  cargo: string; // Cargo como texto libre (compatibilidad)
  cargoType: Cargo; // Cargo del catálogo organizacional
  email: string;
  phone?: string;
  initials: string;
  status: "activo" | "inactivo";
  laborState: LaborState;
  turno: Turno;
  contractType: ContractType;
  sede: string; // Centro de trabajo
  station?: string; // Estación asignada
  hiredAt: string; // Fecha de ingreso
  lastSyncAt: string; // Última sincronización
  lastSyncBy: string; // Usuario que realizó la última sincronización
  lastAccessAt?: string; // Último acceso al sistema
  avatarColor?: string;
  workHistory: WorkHistoryEntry[];
  activity: UserActivity[];
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

export const STATIONS: string[] = [
  "Villa El Salvador",
  "Parque Industrial",
  "Pumacahua",
  "Villa Maria",
  "Maria Auxiliadora",
  "San Juan",
  "Cabitos",
  "Atocongo",
  "Jorge Chavez",
  "Ayacucho",
  "Angamos",
  "San Borja Sur",
  "La Cultura",
  "Arriola",
  "Gamarra",
  "Miguel Grau",
  "El Angel",
  "Presbitero Maestro",
  "Caja de Agua",
  "Piramide del Sol",
  "Los Jardines",
  "Los Postes",
  "San Carlos",
  "San Martin",
  "Santa Rosa",
  "Bayovar",
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
