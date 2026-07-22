// SIGMA L1 — Admin Center Types
// Centro de Administración Institucional · Línea 1 del Metro de Lima

import type { Area, Cargo, SystemRole } from "./types";

// ─── Admin Area (extends core Area with admin metadata) ───
export interface AdminArea {
  id: string;
  key: Area;
  name: string;
  head: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Admin Station ───
export interface AdminStation {
  id: string;
  name: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Rolling Stock ───
export type RollingStockSeries = "alstom" | "ansaldo";

export const SERIES_LABELS: Record<RollingStockSeries, string> = {
  alstom: "ALSTOM",
  ansaldo: "ANSALDO",
};

export type RollingStockUnit = {
  id: string;
  code: string; // T01, T02, ...
  series: RollingStockSeries;
  active: boolean;
  createdAt: string;
};

export type AuxiliaryVehicleType = "dresina" | "grua" | "plataforma" | "otros";

export const AUXILIARY_LABELS: Record<AuxiliaryVehicleType, string> = {
  dresina: "Dresina",
  grua: "Grúa",
  plataforma: "Plataforma",
  otros: "Otros",
};

export interface AuxiliaryVehicle {
  id: string;
  code: string;
  type: AuxiliaryVehicleType;
  active: boolean;
  createdAt: string;
}

// ─── Catalogs ───
export type CatalogKey =
  | "tipo_sop"
  | "subtipo_sop"
  | "procedencia"
  | "tipo_evento"
  | "estados"
  | "nivel_riesgo"
  | "tipo_causa"
  | "modelo_mr"
  | "tipo_via"
  | "ubicaciones";

export const CATALOG_LABELS: Record<CatalogKey, string> = {
  tipo_sop: "Tipo SOP",
  subtipo_sop: "Subtipo SOP",
  procedencia: "Procedencia",
  tipo_evento: "Tipo de Evento",
  estados: "Estados",
  nivel_riesgo: "Nivel de Riesgo",
  tipo_causa: "Tipo de Causa",
  modelo_mr: "Modelo Material Rodante",
  tipo_via: "Tipo de Vía",
  ubicaciones: "Ubicaciones",
};

export const CATALOG_ICONS: Record<CatalogKey, string> = {
  tipo_sop: "FileText",
  subtipo_sop: "Files",
  procedencia: "MapPin",
  tipo_evento: "AlertTriangle",
  estados: "CircleDot",
  nivel_riesgo: "Shield",
  tipo_causa: "Search",
  modelo_mr: "Train",
  tipo_via: "Route",
  ubicaciones: "Navigation",
};

export interface CatalogItem {
  id: string;
  catalogKey: CatalogKey;
  value: string;
  label: string;
  active: boolean;
  order: number;
  createdAt: string;
}

// ─── System Config ───
export interface SystemConfig {
  caseNumberPrefix: string;
  caseNumberSeq: number;
  planNumberPrefix: string;
  planNumberSeq: number;
  maxInvestigationDays: number;
  planResponseDays: number;
  extensionRequestDays: number;
  systemName: string;
  systemVersion: string;
  updatedAt: string;
}

// ─── Admin Role (extends SystemRole with granular permissions) ───
export interface AdminRole {
  id: string;
  key: string;
  name: string;
  description: string;
  color: string;
  permissions: RolePermissions;
  isSystem: boolean; // built-in roles can't be deleted
  createdAt: string;
  updatedAt: string;
}

export interface RolePermissions {
  // Cases
  caseView: boolean;
  caseCreate: boolean;
  caseEdit: boolean;
  caseDelete: boolean;
  caseAssign: boolean;
  caseClose: boolean;
  caseReopen: boolean;

  // Investigation
  investigationView: boolean;
  investigationEdit: boolean;

  // Plans
  planView: boolean;
  planCreate: boolean;
  planApprove: boolean;
  planReject: boolean;

  // Execution
  executionView: boolean;
  executionEdit: boolean;

  // Users
  userView: boolean;
  userCreate: boolean;
  userEdit: boolean;
  userDelete: boolean;
  userAssignRole: boolean;

  // Admin
  adminAccess: boolean;
  configEdit: boolean;
  auditView: boolean;
  catalogEdit: boolean;
  areaEdit: boolean;
  stationEdit: boolean;
  rollingStockEdit: boolean;

  // Reports
  reportView: boolean;
  reportExport: boolean;
  kpiView: boolean;
}

export const DEFAULT_PERMISSIONS: RolePermissions = {
  caseView: true,
  caseCreate: false,
  caseEdit: false,
  caseDelete: false,
  caseAssign: false,
  caseClose: false,
  caseReopen: false,
  investigationView: false,
  investigationEdit: false,
  planView: false,
  planCreate: false,
  planApprove: false,
  planReject: false,
  executionView: false,
  executionEdit: false,
  userView: false,
  userCreate: false,
  userEdit: false,
  userDelete: false,
  userAssignRole: false,
  adminAccess: false,
  configEdit: false,
  auditView: false,
  catalogEdit: false,
  areaEdit: false,
  stationEdit: false,
  rollingStockEdit: false,
  reportView: false,
  reportExport: false,
  kpiView: false,
};

export const FULL_PERMISSIONS: RolePermissions = Object.fromEntries(
  Object.keys(DEFAULT_PERMISSIONS).map((k) => [k, true])
) as RolePermissions;

// ─── Audit Log ───
export type AuditAction =
  | "login"
  | "logout"
  | "user_created"
  | "user_updated"
  | "user_deleted"
  | "user_deactivated"
  | "user_activated"
  | "role_changed"
  | "password_reset"
  | "user_blocked"
  | "user_unblocked"
  | "area_created"
  | "area_updated"
  | "area_deleted"
  | "station_created"
  | "station_updated"
  | "station_deleted"
  | "rolling_stock_created"
  | "rolling_stock_updated"
  | "rolling_stock_deactivated"
  | "catalog_created"
  | "catalog_updated"
  | "catalog_deleted"
  | "config_updated"
  | "case_approved"
  | "case_rejected"
  | "case_closed"
  | "case_reopened"
  | "plan_approved"
  | "plan_rejected"
  | "permission_changed";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  login: "Inicio de sesión",
  logout: "Cierre de sesión",
  user_created: "Usuario creado",
  user_updated: "Usuario modificado",
  user_deleted: "Usuario eliminado",
  user_deactivated: "Usuario desactivado",
  user_activated: "Usuario activado",
  role_changed: "Rol cambiado",
  password_reset: "Contraseña restablecida",
  user_blocked: "Usuario bloqueado",
  user_unblocked: "Usuario desbloqueado",
  area_created: "Área creada",
  area_updated: "Área modificada",
  area_deleted: "Área eliminada",
  station_created: "Estación creada",
  station_updated: "Estación modificada",
  station_deleted: "Estación eliminada",
  rolling_stock_created: "Material rodante creado",
  rolling_stock_updated: "Material rodante modificado",
  rolling_stock_deactivated: "Material rodante desactivado",
  catalog_created: "Elemento de catálogo creado",
  catalog_updated: "Elemento de catálogo modificado",
  catalog_deleted: "Elemento de catálogo eliminado",
  config_updated: "Configuración del sistema modificada",
  case_approved: "Caso aprobado",
  case_rejected: "Caso rechazado",
  case_closed: "Caso cerrado",
  case_reopened: "Caso reabierto",
  plan_approved: "Plan aprobado",
  plan_rejected: "Plan rechazado",
  permission_changed: "Permisos modificados",
};

export const AUDIT_ACTION_TONE: Record<AuditAction, "brand" | "info" | "warning" | "critical" | "neutral"> = {
  login: "neutral",
  logout: "neutral",
  user_created: "brand",
  user_updated: "info",
  user_deleted: "critical",
  user_deactivated: "warning",
  user_activated: "brand",
  role_changed: "warning",
  password_reset: "info",
  user_blocked: "critical",
  user_unblocked: "brand",
  area_created: "brand",
  area_updated: "info",
  area_deleted: "critical",
  station_created: "brand",
  station_updated: "info",
  station_deleted: "critical",
  rolling_stock_created: "brand",
  rolling_stock_updated: "info",
  rolling_stock_deactivated: "warning",
  catalog_created: "brand",
  catalog_updated: "info",
  catalog_deleted: "critical",
  config_updated: "warning",
  case_approved: "brand",
  case_rejected: "warning",
  case_closed: "brand",
  case_reopened: "info",
  plan_approved: "brand",
  plan_rejected: "warning",
  permission_changed: "critical",
};

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actor: string;
  actorRole: string;
  target: string;
  detail?: string;
  at: string;
}
