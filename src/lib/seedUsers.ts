import { AREA_HEADS, type Area, type User, type UserRole, type SyncLog, type LaborState, type Turno, type ContractType, type WorkHistoryEntry, type UserActivity, type RoleAssignment } from "./types";

const COLORS = ["#14814a", "#2c7be0", "#d99520", "#8a6fd6", "#d23a2c", "#0f6b3e", "#5fb4d4", "#c79a3e"];
const SEDES = ["Centro de Control", "Patio Taller Villa el Salvador", "Depósito Atocongo", "Sede Administrativa Lima"];
const SUBAREAS: Record<Area, string> = {
  mantenimiento: "Mecánica",
  subestaciones: "Eléctrica",
  operaciones: "Operación de Trenes",
  comunicaciones: "Sistemas",
  infraestructura: "Obras Civiles",
  material_rodante: "Taller",
  limpieza: "Sanitización",
  seguridad_fisica: "Vigilancia",
};

function hist(field: string, oldValue: string, newValue: string, daysAgo: number, source: "excel" | "manual" = "excel"): WorkHistoryEntry {
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  return { id: `wh_${field}_${daysAgo}_${Math.random().toString(36).slice(2, 6)}`, at: d.toISOString(), field, oldValue, newValue, source };
}

function act(type: UserActivity["type"], title: string, detail: string, daysAgo: number, hour: number): UserActivity {
  const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 0, 0, 0);
  return { id: `act_${type}_${daysAgo}_${Math.random().toString(36).slice(2, 6)}`, at: d.toISOString(), type, title, detail };
}

function mk(
  code: string,
  dni: string,
  name: string,
  userRole: UserRole,
  area: Area,
  cargo: string,
  email: string,
  phone: string,
  hiredAt: string,
  opts: {
    status?: "activo" | "inactivo";
    laborState?: LaborState;
    turno?: Turno;
    contractType?: ContractType;
    sede?: string;
    station?: string;
    extraRoles?: UserRole[];
  } = {}
): User {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const colorIndex = parseInt(code.replace(/\D/g, "")) % COLORS.length;
  const sede = opts.sede ?? SEDES[parseInt(code.replace(/\D/g, "")) % SEDES.length];
  const allRoles: RoleAssignment[] = [
    { role: userRole, assignedBy: "Marcela Falcón", assignedAt: hiredAt },
    ...(opts.extraRoles ?? []).map((r) => ({ role: r, assignedBy: "Marcela Falcón", assignedAt: hiredAt })),
  ];
  const yearsAgo = Math.floor((Date.now() - new Date(hiredAt).getTime()) / (365 * 86400000));
  return {
    id: `usr_${code.toLowerCase().replace(/-/g, "")}`,
    code, dni, name,
    role: userRole === "jefe_area" ? "jefe" : userRole === "consulta" ? "reportante" : "seguridad",
    userRole,
    roles: allRoles,
    area, subarea: SUBAREAS[area], cargo, email, phone, initials,
    status: opts.status ?? "activo",
    laborState: opts.laborState ?? "activo",
    turno: opts.turno ?? (parseInt(code.replace(/\D/g, "")) % 4 === 0 ? "mañana" : parseInt(code.replace(/\D/g, "")) % 4 === 1 ? "tarde" : parseInt(code.replace(/\D/g, "")) % 4 === 2 ? "noche" : "rotativo"),
    contractType: opts.contractType ?? (yearsAgo > 3 ? "indefinido" : "plazo_fijo"),
    sede,
    station: opts.station,
    hiredAt,
    lastSyncAt: "2026-07-15T08:00:00.000Z",
    lastSyncBy: "Sistema",
    avatarColor: COLORS[colorIndex],
    workHistory: [
      hist("alta", "—", "Ingreso a la empresa", Math.floor((Date.now() - new Date(hiredAt).getTime()) / 86400000)),
      hist("cargo", cargo, `${cargo} (actualizado)`, 30, "excel"),
      hist("area", "—", area, 15, "excel"),
    ],
    activity: [
      act("login", "Ingreso al sistema", "Sesión iniciada desde Lima", 1, 8),
      act("caso_revisado", "Caso revisado", "EXP-2026-0014 — revisión de evidencias", 2, 10),
      act("cambio", "Perfil actualizado", "Datos de contacto actualizados", 5, 14),
    ],
  };
}

export const SEED_USERS: User[] = [
  mk("EMP-0001", "45891234", "Marcela Falcón", "administrador", "seguridad_fisica", "Jefa de Seguridad Operativa", "m.falcon@metrolinea1.pe", "+51 999 111 222", "2018-03-15", { turno: "mañana", sede: "Centro de Control", extraRoles: ["investigador", "auditor"] }),
  mk("EMP-0002", "45891235", "Jorge Salazar", "jefe_area", "mantenimiento", "Jefe de Mantenimiento", "j.salazar@metrolinea1.pe", "+51 999 222 333", "2017-08-20", { turno: "mañana", sede: "Patio Taller Villa el Salvador" }),
  mk("EMP-0003", "45891236", "Ingrid Quispe", "jefe_area", "subestaciones", "Jefa de Subestaciones", "i.quispe@metrolinea1.pe", "+51 999 333 444", "2019-01-10", { turno: "mañana", sede: "Depósito Atocongo" }),
  mk("EMP-0004", "45891237", "Raúl Mendoza", "jefe_area", "operaciones", "Jefe de Operaciones", "r.mendoza@metrolinea1.pe", "+51 999 444 555", "2016-05-12", { turno: "rotativo", sede: "Centro de Control" }),
  mk("EMP-0005", "45891238", "Cecilia Tapia", "jefe_area", "comunicaciones", "Jefa de Comunicaciones", "c.tapia@metrolinea1.pe", "+51 999 555 666", "2020-02-18", { turno: "mañana", sede: "Centro de Control" }),
  mk("EMP-0006", "45891239", "Luis Bravo", "jefe_area", "infraestructura", "Jefe de Infraestructura", "l.bravo@metrolinea1.pe", "+51 999 666 777", "2018-11-05", { turno: "tarde", sede: "Patio Taller Villa el Salvador" }),
  mk("EMP-0007", "45891240", "Ana Villanueva", "jefe_area", "material_rodante", "Jefa de Material Rodante", "a.villanueva@metrolinea1.pe", "+51 999 777 888", "2019-07-22", { turno: "mañana", sede: "Depósito Atocongo" }),
  mk("EMP-0008", "45891241", "Mario Chávez", "jefe_area", "limpieza", "Jefe de Limpieza", "m.chavez@metrolinea1.pe", "+51 999 888 999", "2021-04-03", { turno: "rotativo", sede: "Patio Taller Villa el Salvador" }),
  mk("EMP-0009", "45891242", "Patricia Ríos", "jefe_area", "seguridad_fisica", "Jefa de Seguridad Física", "p.rios@metrolinea1.pe", "+51 999 999 000", "2017-09-14", { turno: "noche", sede: "Centro de Control" }),
  mk("EMP-0010", "45891243", "Carlos Núñez", "consulta", "mantenimiento", "Técnico de Mantenimiento", "c.nunez@metrolinea1.pe", "+51 988 111 222", "2022-03-01", { turno: "tarde", sede: "Patio Taller Villa el Salvador", contractType: "plazo_fijo" }),
  mk("EMP-0011", "45891244", "Lucía Ramírez", "supervisor", "operaciones", "Supervisora de Operaciones", "l.ramirez@metrolinea1.pe", "+51 988 222 333", "2020-06-15", { turno: "mañana", sede: "Centro de Control" }),
  mk("EMP-0012", "45891245", "Fernando Quispe", "consulta", "infraestructura", "Operario de Infraestructura", "f.quispe@metrolinea1.pe", "+51 988 333 444", "2021-08-10", { turno: "noche", sede: "Patio Taller Villa el Salvador", contractType: "contratista" }),
  mk("EMP-0013", "45891246", "Sofía Erazo", "supervisor", "operaciones", "Supervisora de Turno", "s.erazo@metrolinea1.pe", "+51 988 444 555", "2019-11-20", { turno: "noche", sede: "Centro de Control" }),
  mk("EMP-0014", "45891247", "Diego Salas", "consulta", "material_rodante", "Técnico de Material Rodante", "d.salas@metrolinea1.pe", "+51 988 555 666", "2022-01-18", { turno: "tarde", sede: "Depósito Atocongo", contractType: "plazo_fijo" }),
  mk("EMP-0015", "45891248", "Pedrio Aparicio", "consulta", "subestaciones", "Electricista de Subestaciones", "p.aparicio@metrolinea1.pe", "+51 988 666 777", "2021-05-22", { turno: "rotativo", sede: "Depósito Atocongo" }),
  mk("EMP-0016", "45891249", "Hugo Reyna", "supervisor", "subestaciones", "Supervisor Eléctrico", "h.reyna@metrolinea1.pe", "+51 988 777 888", "2018-12-03", { turno: "mañana", sede: "Depósito Atocongo" }),
  mk("EMP-0017", "45891250", "Carmen Loayza", "analista_so", "seguridad_fisica", "Analista de Seguridad", "c.loayza@metrolinea1.pe", "+51 988 888 999", "2020-09-14", { turno: "mañana", sede: "Centro de Control", extraRoles: ["investigador"] }),
  mk("EMP-0018", "45891251", "José Fernández", "analista_so", "seguridad_fisica", "Analista Senior SO", "j.fernandez@metrolinea1.pe", "+51 988 999 000", "2019-04-25", { turno: "mañana", sede: "Centro de Control", extraRoles: ["investigador", "auditor"] }),
  mk("EMP-0019", "45891252", "María López", "responsable_plan", "mantenimiento", "Responsable de Plan Preventivo", "m.lopez@metrolinea1.pe", "+51 977 111 222", "2021-02-08", { turno: "tarde", sede: "Patio Taller Villa el Salvador" }),
  mk("EMP-0020", "45891253", "Roberto Silva", "responsable_plan", "infraestructura", "Responsable de Plan Correctivo", "r.silva@metrolinea1.pe", "+51 977 222 333", "2020-12-15", { turno: "tarde", sede: "Patio Taller Villa el Salvador" }),
  mk("EMP-0021", "45891254", "Elena Torres", "consulta", "comunicaciones", "Operadora de Comunicaciones", "e.torres@metrolinea1.pe", "+51 977 333 444", "2022-06-30", { turno: "rotativo", sede: "Centro de Control", contractType: "practicante" }),
  mk("EMP-0022", "45891255", "Manuel Rojas", "consulta", "limpieza", "Coordinador de Limpieza", "m.rojas@metrolinea1.pe", "+51 977 444 555", "2021-10-11", { turno: "noche", sede: "Patio Taller Villa el Salvador" }),
  mk("EMP-0023", "45891256", "Patricia Vega", "supervisor", "material_rodante", "Supervisora de Taller", "p.vega@metrolinea1.pe", "+51 977 555 666", "2019-03-28", { turno: "mañana", sede: "Depósito Atocongo" }),
  mk("EMP-0024", "45891257", "Carlos Mendoza", "consulta", "operaciones", "Operador de Trenes", "c.mendoza@metrolinea1.pe", "+51 977 666 777", "2022-04-05", { turno: "rotativo", sede: "Centro de Control", contractType: "plazo_fijo" }),
  mk("EMP-0025", "45891258", "Rosa Flores", "consulta", "seguridad_fisica", "Agente de Seguridad", "r.flores@metrolinea1.pe", "+51 977 777 888", "2021-07-19", { turno: "noche", sede: "Centro de Control", laborState: "licencia" }),
  mk("EMP-0026", "45891259", "Alberto Díaz", "consulta", "mantenimiento", "Mecánico de Mantenimiento", "a.diaz@metrolinea1.pe", "+51 977 888 999", "2020-08-24", { turno: "tarde", sede: "Patio Taller Villa el Salvador" }),
  mk("EMP-0027", "45891260", "Sandra Castro", "analista_so", "seguridad_fisica", "Analista de Cumplimiento", "s.castro@metrolinea1.pe", "+51 977 999 000", "2018-10-30", { turno: "mañana", sede: "Centro de Control", extraRoles: ["auditor"] }),
  mk("EMP-0028", "45891261", "Víctor Ramos", "consulta", "infraestructura", "Técnico de Obras", "v.ramos@metrolinea1.pe", "+51 966 111 222", "2022-02-14", { turno: "noche", sede: "Patio Taller Villa el Salvador", contractType: "contratista" }),
  mk("EMP-0029", "45891262", "Tania Vargas", "supervisor", "comunicaciones", "Supervisora de Sistemas", "t.vargas@metrolinea1.pe", "+51 966 222 333", "2021-03-09", { turno: "tarde", sede: "Centro de Control" }),
  mk("EMP-0030", "45891263", "Felipe Castillo", "consulta", "subestaciones", "Técnico Electrónico", "f.castillo@metrolinea1.pe", "+51 966 333 444", "2020-11-02", { turno: "rotativo", sede: "Depósito Atocongo" }),
  mk("EMP-0031", "45891264", "Old Employee One", "consulta", "operaciones", "Ex Operador", "old1@metrolinea1.pe", "+51 900 000 001", "2015-01-01", { status: "inactivo", laborState: "baja_definitiva", sede: "Centro de Control" }),
  mk("EMP-0032", "45891265", "Old Employee Two", "consulta", "mantenimiento", "Ex Técnico", "old2@metrolinea1.pe", "+51 900 000 002", "2014-06-15", { status: "inactivo", laborState: "baja_definitiva", sede: "Patio Taller Villa el Salvador" }),
  mk("EMP-0033", "45891266", "Daniela Mejía", "analista_so", "seguridad_fisica", "Analista de Incidentes", "d.mejia@metrolinea1.pe", "+51 955 111 222", "2026-07-01", { turno: "mañana", sede: "Centro de Control", contractType: "plazo_fijo", extraRoles: ["investigador"] }),
  mk("EMP-0034", "45891267", "Fernando Paz", "consulta", "mantenimiento", "Técnico Electromecánico", "f.paz@metrolinea1.pe", "+51 955 222 333", "2026-07-05", { turno: "tarde", sede: "Patio Taller Villa el Salvador", contractType: "plazo_fijo" }),
  mk("EMP-0035", "45891268", "Gabriela Soto", "consulta", "operaciones", "Operadora de Estación", "g.soto@metrolinea1.pe", "+51 955 333 444", "2026-07-08", { turno: "rotativo", sede: "Centro de Control", contractType: "practicante" }),
];

// Trabajadores "nuevos" que aparecerán en la próxima sincronización
export const NEW_USERS_FROM_EXCEL: Array<Omit<User, "id" | "initials" | "lastSyncAt" | "avatarColor" | "roles" | "workHistory" | "activity">> = [
  { code: "EMP-0036", dni: "45891269", name: "Ricardo Paredes", role: "reportante" as const, userRole: "consulta" as UserRole, area: "mantenimiento" as Area, subarea: "Mecánica", cargo: "Técnico Senior", email: "r.paredes@metrolinea1.pe", phone: "+51 944 111 222", status: "activo" as const, laborState: "activo" as LaborState, turno: "mañana" as Turno, contractType: "indefinido" as ContractType, sede: "Patio Taller Villa el Salvador", hiredAt: "2026-07-18", lastSyncBy: "Sistema" },
  { code: "EMP-0037", dni: "45891270", name: "Lucía Mendoza", role: "seguridad" as const, userRole: "investigador" as UserRole, area: "seguridad_fisica" as Area, subarea: "Vigilancia", cargo: "Investigadora SO", email: "l.mendoza@metrolinea1.pe", phone: "+51 944 222 333", status: "activo" as const, laborState: "activo" as LaborState, turno: "mañana" as Turno, contractType: "indefinido" as ContractType, sede: "Centro de Control", hiredAt: "2026-07-18", lastSyncBy: "Sistema" },
];

export const SEED_SYNC_LOGS: SyncLog[] = [
  { id: "sync_1", at: "2026-07-10T08:00:00.000Z", triggeredBy: "Sistema", newUsers: 5, updatedUsers: 2, deactivatedUsers: 0, durationSec: 6, status: "completada" },
  { id: "sync_2", at: "2026-07-12T08:00:00.000Z", triggeredBy: "Sistema", newUsers: 0, updatedUsers: 4, deactivatedUsers: 1, durationSec: 5, status: "completada" },
  { id: "sync_3", at: "2026-07-15T08:00:00.000Z", triggeredBy: "Sistema", newUsers: 2, updatedUsers: 1, deactivatedUsers: 0, durationSec: 4, status: "completada" },
];
