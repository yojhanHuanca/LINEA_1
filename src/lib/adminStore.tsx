import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AdminArea,
  AdminRole,
  AdminStation,
  AuditEntry,
  AuditAction,
  AuxiliaryVehicle,
  CatalogItem,
  CatalogKey,
  RollingStockUnit,
  RollingStockSeries,
  SystemConfig,
} from "./adminTypes";
import { FULL_PERMISSIONS, DEFAULT_PERMISSIONS } from "./adminTypes";
import { uid, nowISO } from "./utils";
import type { Area } from "./types";

// ─── localStorage keys ───
const AREAS_KEY = "sigma_l1_admin_areas_v1";
const STATIONS_KEY = "sigma_l1_admin_stations_v1";
const ROLLING_KEY = "sigma_l1_admin_rolling_v1";
const AUXILIARY_KEY = "sigma_l1_admin_auxiliary_v1";
const CATALOGS_KEY = "sigma_l1_admin_catalogs_v1";
const CONFIG_KEY = "sigma_l1_admin_config_v1";
const ROLES_KEY = "sigma_l1_admin_roles_v1";
const AUDIT_KEY = "sigma_l1_admin_audit_v1";
const ADMIN_AUTH_KEY = "sigma_l1_admin_auth_v1";

function loadLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveLS(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

// ─── Seed Data ───
const SEED_AREAS: AdminArea[] = [
  { id: "ar_01", key: "mantenimiento", name: "Mantenimiento", head: "Jorge Salazar", active: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: "ar_02", key: "subestaciones", name: "Subestaciones", head: "Ingrid Quispe", active: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: "ar_03", key: "operaciones", name: "Operaciones", head: "Raúl Mendoza", active: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: "ar_04", key: "comunicaciones", name: "Comunicaciones", head: "Cecilia Tapia", active: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: "ar_05", key: "infraestructura", name: "Infraestructura", head: "Luis Bravo", active: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: "ar_06", key: "material_rodante", name: "Material Rodante", head: "Ana Villanueva", active: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: "ar_07", key: "limpieza", name: "Limpieza y Sanitización", head: "Mario Chávez", active: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
  { id: "ar_08", key: "seguridad_fisica", name: "Seguridad Física", head: "Patricia Ríos", active: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z" },
];

const SEED_STATIONS: AdminStation[] = [
  "Villa El Salvador", "Parque Industrial", "Pumacahua", "Villa Maria", "Maria Auxiliadora",
  "San Juan", "Atocongo", "Jorge Chavez", "Ayacucho", "Cabitos", "Angamos",
  "San Borja Sur", "La Cultura", "Arriola", "Gamarra", "Miguel Grau", "El Angel",
  "Presbitero Maestro", "Caja de Agua", "Piramide del Sol", "Los Jardines",
  "Los Postes", "San Carlos", "San Martin", "Santa Rosa", "Bayovar",
].map((name, i) => ({
  id: `st_${String(i + 1).padStart(2, "0")}`,
  name,
  order: i + 1,
  active: true,
  createdAt: "2025-01-15T08:00:00Z",
  updatedAt: "2025-01-15T08:00:00Z",
}));

const SEED_ROLLING: RollingStockUnit[] = Array.from({ length: 22 }, (_, i) => ({
  id: `rs_a_${String(i + 1).padStart(2, "0")}`,
  code: `T${String(i + 1).padStart(2, "0")}`,
  series: "alstom" as RollingStockSeries,
  active: true,
  createdAt: "2025-01-15T08:00:00Z",
})).concat(
  Array.from({ length: 22 }, (_, i) => ({
    id: `rs_b_${String(i + 1).padStart(2, "0")}`,
    code: `T${String(i + 23).padStart(2, "0")}`,
    series: "ansaldo" as RollingStockSeries,
    active: true,
    createdAt: "2025-01-15T08:00:00Z",
  }))
);

const SEED_AUXILIARY: AuxiliaryVehicle[] = [
  { id: "aux_01", code: "D-01", type: "dresina", active: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: "aux_02", code: "G-01", type: "grua", active: true, createdAt: "2025-01-15T08:00:00Z" },
  { id: "aux_03", code: "P-01", type: "plataforma", active: true, createdAt: "2025-01-15T08:00:00Z" },
];

const SEED_CATALOGS: CatalogItem[] = [
  { id: "cat_01", catalogKey: "tipo_sop", value: "accidente_laboral", label: "Accidente Laboral", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_02", catalogKey: "tipo_sop", value: "incidente_operativo", label: "Incidente Operativo", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_03", catalogKey: "tipo_sop", value: "condicion_insegura", label: "Condición Insegura", active: true, order: 3, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_04", catalogKey: "tipo_sop", value: "falla_tecnica", label: "Falla Técnica", active: true, order: 4, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_05", catalogKey: "subtipo_sop", value: "lesiones", label: "Lesiones Personales", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_06", catalogKey: "subtipo_sop", value: "danos_materiales", label: "Daños Materiales", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_07", catalogKey: "subtipo_sop", value: "casi_choque", label: "Casi Choque", active: true, order: 3, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_08", catalogKey: "procedencia", value: "interna", label: "Interna", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_09", catalogKey: "procedencia", value: "externa", label: "Externa", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_10", catalogKey: "tipo_evento", value: "accidente", label: "Accidente", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_11", catalogKey: "tipo_evento", value: "incidente", label: "Incidente", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_12", catalogKey: "tipo_evento", value: "observacion", label: "Observación", active: true, order: 3, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_13", catalogKey: "nivel_riesgo", value: "critico", label: "Crítico", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_14", catalogKey: "nivel_riesgo", value: "alto", label: "Alto", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_15", catalogKey: "nivel_riesgo", value: "medio", label: "Medio", active: true, order: 3, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_16", catalogKey: "nivel_riesgo", value: "bajo", label: "Bajo", active: true, order: 4, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_17", catalogKey: "tipo_causa", value: "humana", label: "Humana", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_18", catalogKey: "tipo_causa", value: "tecnica", label: "Técnica", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_19", catalogKey: "tipo_causa", value: "organizacional", label: "Organizacional", active: true, order: 3, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_20", catalogKey: "tipo_via", value: "principal", label: "Vía Principal", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_21", catalogKey: "tipo_via", value: "lateral", label: "Vía Lateral", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_22", catalogKey: "tipo_via", value: "senalamiento", label: "Señalamiento", active: true, order: 3, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_23", catalogKey: "estados", value: "activo", label: "Activo", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_24", catalogKey: "estados", value: "inactivo", label: "Inactivo", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_25", catalogKey: "modelo_mr", value: "metro_2000", label: "Metro 2000", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_26", catalogKey: "modelo_mr", value: "metro_2015", label: "Metro 2015", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_27", catalogKey: "ubicaciones", value: "andén", label: "Andén", active: true, order: 1, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_28", catalogKey: "ubicaciones", value: "andén_opuesto", label: "Andén Opuesto", active: true, order: 2, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_29", catalogKey: "ubicaciones", value: "vía", label: "Vía", active: true, order: 3, createdAt: "2025-01-15T08:00:00Z" },
  { id: "cat_30", catalogKey: "ubicaciones", value: "sala_operaciones", label: "Sala de Operaciones", active: true, order: 4, createdAt: "2025-01-15T08:00:00Z" },
];

const SEED_CONFIG: SystemConfig = {
  caseNumberPrefix: "EXP-2026-",
  caseNumberSeq: 15,
  planNumberPrefix: "PDA-2026-",
  planNumberSeq: 8,
  maxInvestigationDays: 14,
  planResponseDays: 7,
  extensionRequestDays: 3,
  systemName: "SIGMA L1",
  systemVersion: "1.0.0",
  updatedAt: "2025-01-15T08:00:00Z",
};

const SEED_ROLES: AdminRole[] = [
  {
    id: "role_admin", key: "administrador", name: "Administrador", description: "Acceso total al sistema", color: "#d23a2c",
    permissions: { ...FULL_PERMISSIONS }, isSystem: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z",
  },
  {
    id: "role_so", key: "seguridad_operativa", name: "Seguridad Operativa", description: "Gestión de casos, investigación y cierre", color: "#14814a",
    permissions: {
      ...FULL_PERMISSIONS,
      adminAccess: false, configEdit: false, catalogEdit: false, areaEdit: false,
      stationEdit: false, rollingStockEdit: false, userCreate: false, userDelete: false,
    },
    isSystem: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z",
  },
  {
    id: "role_auditor", key: "auditor", name: "Auditor", description: "Revisión de cumplimiento (solo lectura)", color: "#2c7be0",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      caseView: true, investigationView: true, planView: true, executionView: true,
      reportView: true, reportExport: true, kpiView: true, auditView: true, userView: true,
    },
    isSystem: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z",
  },
  {
    id: "role_consulta", key: "consulta", name: "Consulta", description: "Acceso de solo lectura", color: "#767f79",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      caseView: true, reportView: true, kpiView: true,
    },
    isSystem: true, createdAt: "2025-01-15T08:00:00Z", updatedAt: "2025-01-15T08:00:00Z",
  },
  {
    id: "role_investigador", key: "investigador", name: "Investigador", description: "Investigación de casos asignados", color: "#d99520",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      caseView: true, investigationView: true, investigationEdit: true,
      reportView: true, kpiView: true,
    },
    isSystem: false, createdAt: "2025-06-01T08:00:00Z", updatedAt: "2025-06-01T08:00:00Z",
  },
  {
    id: "role_supervisor", key: "supervisor", name: "Supervisor", description: "Supervisión operativa de áreas", color: "#7c3aed",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      caseView: true, caseCreate: true, caseAssign: true,
      investigationView: true, planView: true, executionView: true, executionEdit: true,
      reportView: true, kpiView: true,
    },
    isSystem: false, createdAt: "2025-06-01T08:00:00Z", updatedAt: "2025-06-01T08:00:00Z",
  },
  {
    id: "role_jefe_area", key: "jefe_area", name: "Jefe de Área", description: "Ejecución de planes de acción asignados", color: "#0891b2",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      caseView: true, planView: true, executionView: true, executionEdit: true,
      reportView: true, kpiView: true,
    },
    isSystem: false, createdAt: "2025-06-01T08:00:00Z", updatedAt: "2025-06-01T08:00:00Z",
  },
  {
    id: "role_trabajador", key: "trabajador", name: "Trabajador", description: "Reporte de incidentes y consulta", color: "#059669",
    permissions: {
      ...DEFAULT_PERMISSIONS,
      caseCreate: true, caseView: true, reportView: true,
    },
    isSystem: false, createdAt: "2025-06-01T08:00:00Z", updatedAt: "2025-06-01T08:00:00Z",
  },
];

const SEED_AUDIT: AuditEntry[] = [
  { id: "aud_01", action: "login", actor: "Marcela Falcón", actorRole: "Seguridad Operativa", target: "Sistema", at: new Date(Date.now() - 3600000).toISOString() },
  { id: "aud_02", action: "case_approved", actor: "Marcela Falcón", actorRole: "Seguridad Operativa", target: "EXP-2026-00008", detail: "Caso aprobado para investigación", at: new Date(Date.now() - 7200000).toISOString() },
  { id: "aud_03", action: "plan_approved", actor: "Marcela Falcón", actorRole: "Seguridad Operativa", target: "EXP-2026-00009", detail: "Plan de acción aprobado", at: new Date(Date.now() - 10800000).toISOString() },
  { id: "aud_04", action: "user_created", actor: "Administrador", actorRole: "Administrador", target: "EMP-0034", detail: "Nuevo usuario sincronizado desde Excel", at: new Date(Date.now() - 86400000).toISOString() },
  { id: "aud_05", action: "config_updated", actor: "Administrador", actorRole: "Administrador", target: "Configuración General", detail: "Días máximos de investigación: 14", at: new Date(Date.now() - 172800000).toISOString() },
];

// ─── Context Type ───
interface AdminStoreValue {
  // Auth
  isAuthenticated: boolean;
  authenticate: (code: string) => boolean;
  logout: () => void;

  // Areas
  areas: AdminArea[];
  createArea: (data: Omit<AdminArea, "id" | "createdAt" | "updatedAt">) => void;
  updateArea: (id: string, patch: Partial<AdminArea>) => void;
  toggleArea: (id: string) => void;

  // Stations
  stations: AdminStation[];
  createStation: (name: string) => void;
  updateStation: (id: string, name: string) => void;
  toggleStation: (id: string) => void;
  reorderStations: (ids: string[]) => void;

  // Rolling Stock
  rollingStock: RollingStockUnit[];
  createRollingStock: (code: string, series: RollingStockSeries) => void;
  toggleRollingStock: (id: string) => void;

  // Auxiliary Vehicles
  auxiliaries: AuxiliaryVehicle[];
  createAuxiliary: (code: string, type: AuxiliaryVehicle["type"]) => void;
  toggleAuxiliary: (id: string) => void;

  // Catalogs
  catalogs: CatalogItem[];
  getCatalogItems: (key: CatalogKey) => CatalogItem[];
  createCatalogItem: (key: CatalogKey, value: string, label: string) => void;
  updateCatalogItem: (id: string, patch: Partial<CatalogItem>) => void;
  toggleCatalogItem: (id: string) => void;

  // Config
  config: SystemConfig;
  updateConfig: (patch: Partial<SystemConfig>) => void;

  // Roles
  roles: AdminRole[];
  createRole: (data: Omit<AdminRole, "id" | "createdAt" | "updatedAt">) => void;
  updateRole: (id: string, patch: Partial<AdminRole>) => void;
  deleteRole: (id: string) => boolean;
  updatePermissions: (roleId: string, permissions: Partial<RolePermissions>) => void;

  // Audit
  auditLog: AuditEntry[];
  addAuditEntry: (action: AuditAction, target: string, detail?: string) => void;

  // Reset
  resetAdmin: () => void;
}

const AdminStoreContext = createContext<AdminStoreValue | null>(null);

export function useAdminStore(): AdminStoreValue {
  const ctx = useContext(AdminStoreContext);
  if (!ctx) throw new Error("useAdminStore must be used within AdminStoreProvider");
  return ctx;
}

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadLS(ADMIN_AUTH_KEY, false));
  const [areas, setAreas] = useState<AdminArea[]>(() => loadLS(AREAS_KEY, SEED_AREAS));
  const [stations, setStations] = useState<AdminStation[]>(() => loadLS(STATIONS_KEY, SEED_STATIONS));
  const [rollingStock, setRollingStock] = useState<RollingStockUnit[]>(() => loadLS(ROLLING_KEY, SEED_ROLLING));
  const [auxiliaries, setAuxiliaries] = useState<AuxiliaryVehicle[]>(() => loadLS(AUXILIARY_KEY, SEED_AUXILIARY));
  const [catalogs, setCatalogs] = useState<CatalogItem[]>(() => loadLS(CATALOGS_KEY, SEED_CATALOGS));
  const [config, setConfig] = useState<SystemConfig>(() => loadLS(CONFIG_KEY, SEED_CONFIG));
  const [roles, setRoles] = useState<AdminRole[]>(() => loadLS(ROLES_KEY, SEED_ROLES));
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => loadLS(AUDIT_KEY, SEED_AUDIT));

  // Persist
  useEffect(() => saveLS(ADMIN_AUTH_KEY, isAuthenticated), [isAuthenticated]);
  useEffect(() => saveLS(AREAS_KEY, areas), [areas]);
  useEffect(() => saveLS(STATIONS_KEY, stations), [stations]);
  useEffect(() => saveLS(ROLLING_KEY, rollingStock), [rollingStock]);
  useEffect(() => saveLS(AUXILIARY_KEY, auxiliaries), [auxiliaries]);
  useEffect(() => saveLS(CATALOGS_KEY, catalogs), [catalogs]);
  useEffect(() => saveLS(CONFIG_KEY, config), [config]);
  useEffect(() => saveLS(ROLES_KEY, roles), [roles]);
  useEffect(() => saveLS(AUDIT_KEY, auditLog), [auditLog]);

  // ─── Auth ───
  const authenticate = useCallback((code: string): boolean => {
    if (code === "ADMIN-SIGMA-2026") {
      setIsAuthenticated(true);
      setAuditLog((prev) => [
        { id: uid("aud"), action: "login", actor: "Administrador", actorRole: "Administrador", target: "Centro de Administración", at: nowISO() },
        ...prev,
      ]);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setAuditLog((prev) => [
      { id: uid("aud"), action: "logout", actor: "Administrador", actorRole: "Administrador", target: "Centro de Administración", at: nowISO() },
      ...prev,
    ]);
  }, []);

  // ─── Areas ───
  const createArea = useCallback((data: Omit<AdminArea, "id" | "createdAt" | "updatedAt">) => {
    const now = nowISO();
    setAreas((prev) => [...prev, { ...data, id: uid("ar"), createdAt: now, updatedAt: now }]);
  }, []);

  const updateArea = useCallback((id: string, patch: Partial<AdminArea>) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: nowISO() } : a)));
  }, []);

  const toggleArea = useCallback((id: string) => {
    setAreas((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active, updatedAt: nowISO() } : a)));
  }, []);

  // ─── Stations ───
  const createStation = useCallback((name: string) => {
    setStations((prev) => [
      ...prev,
      { id: uid("st"), name, order: prev.length + 1, active: true, createdAt: nowISO(), updatedAt: nowISO() },
    ]);
  }, []);

  const updateStation = useCallback((id: string, name: string) => {
    setStations((prev) => prev.map((s) => (s.id === id ? { ...s, name, updatedAt: nowISO() } : s)));
  }, []);

  const toggleStation = useCallback((id: string) => {
    setStations((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active, updatedAt: nowISO() } : s)));
  }, []);

  const reorderStations = useCallback((ids: string[]) => {
    setStations((prev) => {
      const map = new Map(prev.map((s) => [s.id, s]));
      return ids.map((id, i) => {
        const s = map.get(id)!;
        return { ...s, order: i + 1, updatedAt: nowISO() };
      });
    });
  }, []);

  // ─── Rolling Stock ───
  const createRollingStock = useCallback((code: string, series: RollingStockSeries) => {
    setRollingStock((prev) => [...prev, { id: uid("rs"), code, series, active: true, createdAt: nowISO() }]);
  }, []);

  const toggleRollingStock = useCallback((id: string) => {
    setRollingStock((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  }, []);

  // ─── Auxiliary ───
  const createAuxiliary = useCallback((code: string, type: AuxiliaryVehicle["type"]) => {
    setAuxiliaries((prev) => [...prev, { id: uid("aux"), code, type, active: true, createdAt: nowISO() }]);
  }, []);

  const toggleAuxiliary = useCallback((id: string) => {
    setAuxiliaries((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  }, []);

  // ─── Catalogs ───
  const getCatalogItems = useCallback((key: CatalogKey) => catalogs.filter((c) => c.catalogKey === key).sort((a, b) => a.order - b.order), [catalogs]);

  const createCatalogItem = useCallback((key: CatalogKey, value: string, label: string) => {
    const items = catalogs.filter((c) => c.catalogKey === key);
    setCatalogs((prev) => [
      ...prev,
      { id: uid("cat"), catalogKey: key, value, label, active: true, order: items.length + 1, createdAt: nowISO() },
    ]);
  }, [catalogs]);

  const updateCatalogItem = useCallback((id: string, patch: Partial<CatalogItem>) => {
    setCatalogs((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const toggleCatalogItem = useCallback((id: string) => {
    setCatalogs((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  }, []);

  // ─── Config ───
  const updateConfig = useCallback((patch: Partial<SystemConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch, updatedAt: nowISO() }));
  }, []);

  // ─── Roles ───
  const createRole = useCallback((data: Omit<AdminRole, "id" | "createdAt" | "updatedAt">) => {
    const now = nowISO();
    setRoles((prev) => [...prev, { ...data, id: uid("role"), createdAt: now, updatedAt: now }]);
  }, []);

  const updateRole = useCallback((id: string, patch: Partial<AdminRole>) => {
    setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: nowISO() } : r)));
  }, []);

  const deleteRole = useCallback((id: string): boolean => {
    const role = roles.find((r) => r.id === id);
    if (!role || role.isSystem) return false;
    setRoles((prev) => prev.filter((r) => r.id !== id));
    return true;
  }, [roles]);

  const updatePermissions = useCallback((roleId: string, permissions: Partial<RolePermissions>) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, permissions: { ...r.permissions, ...permissions }, updatedAt: nowISO() } : r))
    );
  }, []);

  // ─── Audit ───
  const addAuditEntry = useCallback((action: AuditAction, target: string, detail?: string) => {
    setAuditLog((prev) => [
      { id: uid("aud"), action, actor: "Administrador", actorRole: "Administrador", target, detail, at: nowISO() },
      ...prev,
    ]);
  }, []);

  // ─── Reset ───
  const resetAdmin = useCallback(() => {
    setAreas(SEED_AREAS);
    setStations(SEED_STATIONS);
    setRollingStock(SEED_ROLLING);
    setAuxiliaries(SEED_AUXILIARY);
    setCatalogs(SEED_CATALOGS);
    setConfig(SEED_CONFIG);
    setRoles(SEED_ROLES);
    setAuditLog(SEED_AUDIT);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AdminStoreValue>(() => ({
    isAuthenticated, authenticate, logout,
    areas, createArea, updateArea, toggleArea,
    stations, createStation, updateStation, toggleStation, reorderStations,
    rollingStock, createRollingStock, toggleRollingStock,
    auxiliaries, createAuxiliary, toggleAuxiliary,
    catalogs, getCatalogItems, createCatalogItem, updateCatalogItem, toggleCatalogItem,
    config, updateConfig,
    roles, createRole, updateRole, deleteRole, updatePermissions,
    auditLog, addAuditEntry,
    resetAdmin,
  }), [
    isAuthenticated, authenticate, logout,
    areas, createArea, updateArea, toggleArea,
    stations, createStation, updateStation, toggleStation, reorderStations,
    rollingStock, createRollingStock, toggleRollingStock,
    auxiliaries, createAuxiliary, toggleAuxiliary,
    catalogs, getCatalogItems, createCatalogItem, updateCatalogItem, toggleCatalogItem,
    config, updateConfig,
    roles, createRole, updateRole, deleteRole, updatePermissions,
    auditLog, addAuditEntry,
    resetAdmin,
  ]);

  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>;
}
