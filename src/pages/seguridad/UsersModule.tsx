import { useMemo, useState } from "react";
import {
  Users as UsersIcon, UserCheck, UserX, UserPlus, Building2, RefreshCw, Search, Download,
  ArrowUpDown, ChevronRight, X, Check, Mail, Phone, Calendar, ShieldCheck, FileText,
  ClipboardList, Activity, Loader2, CheckCircle2, History, LayoutDashboard, Briefcase,
  Clock, TrendingUp, Sparkles, AlertTriangle, ArrowLeft, Filter, Eye, Wrench, Flag,
  Lightbulb, HelpCircle, AlertCircle, Lock, User as UserIcon, Star, BarChart3,
  MapPin, IdCard, FileSpreadsheet, FileDown, Award, ArrowRight, FileSearch, Info,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { SegShell } from "@/design-system/layout/SegShell";
import { Card } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { Field, Input, Select, Textarea } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { Pill } from "@/design-system/primitives/Pill";
import { Progress } from "@/design-system/primitives/Progress";
import {
  AREA_HEADS, AREA_LABELS, USER_ROLE_LABELS, USER_ROLE_DESCRIPTIONS, USER_ROLE_TONE,
  LABOR_STATE_LABELS, LABOR_STATE_TONE, TURNO_LABELS, CONTRACT_LABELS,
  type User, type UserRole, type LaborState, type Turno, type ContractType,
} from "@/lib/types";
import { cn, formatDate, formatDateTime, relativeTime } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const CHART = {
  brand: "#14814a", brandLight: "#6fbd86", critical: "#d23a2c",
  warning: "#d99520", info: "#2c7be0", ink: "#41504a", inkFaint: "#a4aba6", surface: "#eef2f1",
};
const PALETTE = [CHART.brand, CHART.info, CHART.warning, CHART.critical, CHART.brandLight, "#8a6fd6", "#5fb4d4", "#c79a3e"];

type Tab = "dashboard" | "personal" | "sincronizacion";

export function UsersModule() {
  const { users, syncLogs, cases } = useStore();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ newCount: number; updatedCount: number; deactivatedCount: number; durationSec: number } | null>(null);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const store = useStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const runSync = async () => {
    setSyncing(true); setSyncModalOpen(true);
    const result = await store.syncFromExcel();
    setSyncing(false); setSyncResult(result);
  };

  if (selectedUser) {
    return <WorkerProfile user={selectedUser} onClose={() => setSelectedUser(null)} />;
  }

  return (
    <SegShell>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-ink tracking-tight">Centro de Administración del Personal</h1>
          <p className="text-[13px] text-ink-quiet mt-1">Gestión integral de trabajadores · Sincronización con Excel corporativo</p>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone="neutral" dot>Última sync: {users[0] ? relativeTime(users[0].lastSyncAt) : "—"}</Pill>
          <Button onClick={runSync} disabled={syncing} size="sm">
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            {syncing ? "Sincronizando…" : "Sincronizar Excel"}
          </Button>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-1 p-1 rounded-lg bg-white border border-line w-fit">
        {[
          { id: "dashboard" as const, label: "Dashboard Ejecutivo", icon: LayoutDashboard },
          { id: "personal" as const, label: "Gestión del Personal", icon: UsersIcon },
          { id: "sincronizacion" as const, label: "Sincronización", icon: History },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("h-9 px-3.5 rounded-md text-[12.5px] font-medium transition-colors flex items-center gap-2",
              tab === t.id ? "bg-brand-700 text-white shadow-sm" : "text-ink-soft hover:bg-surface")}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <DashboardTab users={users} cases={cases} onSync={runSync} syncing={syncing} />}
      {tab === "personal" && <PersonalTab users={users} cases={cases} onSelectUser={setSelectedUser} />}
      {tab === "sincronizacion" && <SyncTab syncLogs={syncLogs} />}

      <SyncModal open={syncModalOpen} onClose={() => { if (!syncing) { setSyncModalOpen(false); setSyncResult(null); } }} syncing={syncing} result={syncResult} />
    </SegShell>
  );
}

/* ═══ DASHBOARD EJECUTIVO ═══ */
function DashboardTab({ users, cases, onSync, syncing }: { users: User[]; cases: import("@/lib/types").CaseFile[]; onSync: () => void; syncing: boolean }) {
  const stats = useMemo(() => {
    const active = users.filter((u) => u.laborState === "activo").length;
    const inactive = users.filter((u) => u.laborState === "baja_definitiva" || u.laborState === "baja_temporal").length;
    const jefes = users.filter((u) => u.userRole === "jefe_area").length;
    const analistas = users.filter((u) => u.userRole === "analista_so").length;
    const supervisores = users.filter((u) => u.userRole === "supervisor").length;
    const responsables = users.filter((u) => u.userRole === "responsable_plan").length;
    const bajados = users.filter((u) => u.laborState === "baja_definitiva").length;
    const withCases = users.filter((u) => cases.some((c) => c.assignee === u.name || c.reporter === u.name)).length;
    const withInvestigations = users.filter((u) => cases.some((c) => c.investigator === u.name)).length;
    const withPendingPlans = users.filter((u) => cases.some((c) => c.assignee === u.name && (c.stage === "ejecucion" || c.stage === "plan_accion"))).length;
    return { total: users.length, active, inactive, jefes, analistas, supervisores, responsables, bajados, withCases, withInvestigations, withPendingPlans };
  }, [users, cases]);

  const byArea = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => map.set(u.area ? AREA_LABELS[u.area] : "—", (map.get(u.area ? AREA_LABELS[u.area] : "—") ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [users]);

  const byRole = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => map.set(u.userRole, (map.get(u.userRole) ?? 0) + 1));
    return Array.from(map.entries()).map(([role, value], i) => ({ name: USER_ROLE_LABELS[role as UserRole], value, color: PALETTE[i % PALETTE.length] }));
  }, [users]);

  const byLaborState = useMemo(() => {
    const map = new Map<LaborState, number>();
    users.forEach((u) => map.set(u.laborState, (map.get(u.laborState) ?? 0) + 1));
    const colors: Record<LaborState, string> = { activo: CHART.brand, vacaciones: CHART.info, licencia: "#5fb4d4", suspendido: CHART.warning, baja_temporal: "#d99520", baja_definitiva: CHART.critical };
    return Array.from(map.entries()).map(([state, value]) => ({ name: LABOR_STATE_LABELS[state], value, color: colors[state] }));
  }, [users]);

  const bySede = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => map.set(u.sede, (map.get(u.sede) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name: name.replace("Patio Taller ", "PT ").replace("Depósito ", "Dep. "), value }));
  }, [users]);

  const byTurno = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => map.set(TURNO_LABELS[u.turno], (map.get(TURNO_LABELS[u.turno]) ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [users]);

  const newByMonth = useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"];
    return months.map((m, i) => ({ name: m, value: i < 3 ? 1 + (i % 2) : i === 6 ? 3 : 2 }));
  }, []);

  const kpis = [
    { label: "Total trabajadores", value: stats.total, icon: UsersIcon, tone: "neutral" as const },
    { label: "Activos", value: stats.active, icon: UserCheck, tone: "brand" as const },
    { label: "Inactivos", value: stats.inactive, icon: UserX, tone: "neutral" as const },
    { label: "Nuevos sincronizados", value: 3, icon: UserPlus, tone: "info" as const },
    { label: "Áreas registradas", value: 8, icon: Building2, tone: "brand" as const },
    { label: "Jefes de Área", value: stats.jefes, icon: Briefcase, tone: "warning" as const },
    { label: "Analistas SO", value: stats.analistas, icon: ShieldCheck, tone: "brand" as const },
    { label: "Supervisores", value: stats.supervisores, icon: Eye, tone: "info" as const },
    { label: "Responsables de Plan", value: stats.responsables, icon: ClipboardList, tone: "brand" as const },
    { label: "Con investigaciones", value: stats.withInvestigations, icon: FileSearch, tone: "info" as const },
    { label: "Con casos activos", value: stats.withCases, icon: Activity, tone: "warning" as const },
    { label: "Con planes pendientes", value: stats.withPendingPlans, icon: Clock, tone: "warning" as const },
    { label: "Dados de baja", value: stats.bajados, icon: UserX, tone: "critical" as const },
  ];

  return (
    <div className="mt-5 space-y-5">
      {/* KPIs grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <Card key={k.label} className="p-4">
            <div className={cn("h-9 w-9 rounded-lg grid place-items-center shrink-0",
              k.tone === "brand" ? "bg-brand-50 text-brand-700" : k.tone === "info" ? "bg-info-soft text-info-ink" :
              k.tone === "warning" ? "bg-warning-soft text-warning-ink" : k.tone === "critical" ? "bg-critical-soft text-critical-ink" : "bg-surface-2 text-ink-soft")}>
              <k.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-[22px] font-bold tabular-nums text-ink leading-none">{k.value}</p>
            <p className="text-[11.5px] text-ink-quiet mt-1.5 leading-tight">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <ChartHeader title="Distribución por área" subtitle="Trabajadores por área operativa" badge={`${byArea.length} áreas`} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byArea} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }} barCategoryGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.surface} horizontal={false} />
              <XAxis type="number" tick={{ fill: CHART.inkFaint, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: CHART.ink, fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e3e8e5", fontSize: 12 }} cursor={{ fill: CHART.surface, fillOpacity: 0.5 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16} fill={CHART.brand} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <ChartHeader title="Activos vs Inactivos" subtitle="Estado laboral del personal" />
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byLaborState} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                {byLaborState.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e3e8e5", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {byLaborState.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name}
                <span className="ml-auto tabular-nums text-ink-faint">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Gráficos fila 2 */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <ChartHeader title="Distribución por cargo" subtitle="Roles asignados" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byRole} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.surface} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: CHART.inkFaint, fontSize: 9.5 }} tickLine={false} axisLine={false} dy={6} />
              <YAxis tick={{ fill: CHART.inkFaint, fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e3e8e5", fontSize: 12 }} cursor={{ fill: CHART.surface, fillOpacity: 0.4 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={26}>
                {byRole.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <ChartHeader title="Por sede" subtitle="Centro de trabajo" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bySede} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART.surface} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: CHART.inkFaint, fontSize: 10 }} tickLine={false} axisLine={false} dy={6} />
              <YAxis tick={{ fill: CHART.inkFaint, fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e3e8e5", fontSize: 12 }} cursor={{ fill: CHART.surface, fillOpacity: 0.4 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={28} fill={CHART.info} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <ChartHeader title="Por turno" subtitle="Distribución de turnos" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byTurno} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                {byTurno.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e3e8e5", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {byTurno.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} /> {d.name}
                <span className="ml-auto tabular-nums text-ink-faint">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Nuevos por mes */}
      <Card>
        <ChartHeader title="Nuevos trabajadores registrados por mes" subtitle="Tendencia de altas desde Excel" badge="2026" />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={newByMonth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.28} />
                <stop offset="100%" stopColor={CHART.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.surface} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: CHART.inkFaint, fontSize: 11 }} tickLine={false} axisLine={false} dy={6} />
            <YAxis tick={{ fill: CHART.inkFaint, fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e3e8e5", fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke={CHART.brand} strokeWidth={2.5} fill="url(#newGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

function ChartHeader({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        <p className="text-[12px] text-ink-quiet">{subtitle}</p>
      </div>
      {badge && <Pill tone="brand" dot>{badge}</Pill>}
    </div>
  );
}

/* ═══ GESTIÓN DEL PERSONAL — TABLA ═══ */
function PersonalTab({ users, cases, onSelectUser }: { users: User[]; cases: import("@/lib/types").CaseFile[]; onSelectUser: (u: User) => void }) {
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [turnoFilter, setTurnoFilter] = useState("");
  const [contractFilter, setContractFilter] = useState("");
  const [sedeFilter, setSedeFilter] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "code" | "area" | "cargo">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = users;
    if (areaFilter) list = list.filter((u) => u.area === areaFilter);
    if (statusFilter) list = list.filter((u) => u.laborState === statusFilter);
    if (roleFilter) list = list.filter((u) => u.userRole === roleFilter);
    if (turnoFilter) list = list.filter((u) => u.turno === turnoFilter);
    if (contractFilter) list = list.filter((u) => u.contractType === contractFilter);
    if (sedeFilter) list = list.filter((u) => u.sede === sedeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q) || u.dni.includes(q) || u.email.toLowerCase().includes(q) || u.cargo.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [users, query, areaFilter, statusFilter, roleFilter, turnoFilter, contractFilter, sedeFilter, sortKey, sortDir]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const exportCSV = () => {
    const headers = ["Código", "DNI", "Nombre", "Cargo", "Área", "Sede", "Correo", "Teléfono", "Turno", "Estado", "Rol", "Contrato", "Ingreso"];
    const rows = filtered.map((u) => [u.code, u.dni, u.name, u.cargo, u.area ? AREA_LABELS[u.area] : "", u.sede, u.email, u.phone ?? "", TURNO_LABELS[u.turno], LABOR_STATE_LABELS[u.laborState], USER_ROLE_LABELS[u.userRole], CONTRACT_LABELS[u.contractType], u.hiredAt]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "personal_sigma_l1.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open("", "_blank"); if (!w) return;
    const rows = filtered.map((u, i) => `<tr><td>${i + 1}</td><td>${u.code}</td><td>${u.name}</td><td>${u.cargo}</td><td>${u.area ? AREA_LABELS[u.area] : ""}</td><td>${LABOR_STATE_LABELS[u.laborState]}</td><td>${USER_ROLE_LABELS[u.userRole]}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Personal SIGMA L1</title><style>body{font-family:Inter,sans-serif;margin:40px;color:#182621}h1{color:#0F6B3E;border-bottom:3px solid #14814a;padding-bottom:10px}table{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:20px}th,td{border:1px solid #e3e8e5;padding:6px 8px;text-align:left}th{background:#f6f8f7;color:#41504a}</style></head><body><h1>Personal SIGMA L1 — Línea 1 Metro de Lima</h1><p>Fecha: ${formatDateTime(new Date().toISOString())} · ${filtered.length} trabajadores</p><table><thead><tr><th>#</th><th>Código</th><th>Nombre</th><th>Cargo</th><th>Área</th><th>Estado</th><th>Rol</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 300);
  };

  const hasActiveFilters = areaFilter || statusFilter || roleFilter || turnoFilter || contractFilter || sedeFilter;

  return (
    <div className="mt-5 space-y-4">
      {/* Toolbar */}
      <Card className="p-3 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 h-9 px-3 rounded-lg bg-surface border border-line">
          <Search className="h-4 w-4 text-ink-faint shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, código, DNI, correo o cargo…" className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters((s) => !s)} className={cn(hasActiveFilters && "border-brand-300 text-brand-700")}>
          <Filter className="h-4 w-4" /> Filtros {hasActiveFilters && `(${[areaFilter, statusFilter, roleFilter, turnoFilter, contractFilter, sedeFilter].filter(Boolean).length})`}
        </Button>
        <Button variant="outline" size="sm" onClick={exportCSV}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
        <Button variant="outline" size="sm" onClick={exportPDF}><FileDown className="h-4 w-4" /> PDF</Button>
      </Card>

      {/* Filtros avanzados */}
      {showFilters && (
        <Card className="p-4 animate-[riseUp_0.2s_ease-out]">
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <FilterSelect label="Área" value={areaFilter} onChange={setAreaFilter} options={[{ v: "", l: "Todas" }, ...Object.entries(AREA_LABELS).map(([v, l]) => ({ v, l }))]} />
            <FilterSelect label="Estado laboral" value={statusFilter} onChange={setStatusFilter} options={[{ v: "", l: "Todos" }, ...Object.entries(LABOR_STATE_LABELS).map(([v, l]) => ({ v, l }))]} />
            <FilterSelect label="Rol" value={roleFilter} onChange={setRoleFilter} options={[{ v: "", l: "Todos" }, ...Object.entries(USER_ROLE_LABELS).map(([v, l]) => ({ v, l }))]} />
            <FilterSelect label="Turno" value={turnoFilter} onChange={setTurnoFilter} options={[{ v: "", l: "Todos" }, ...Object.entries(TURNO_LABELS).map(([v, l]) => ({ v, l }))]} />
            <FilterSelect label="Contrato" value={contractFilter} onChange={setContractFilter} options={[{ v: "", l: "Todos" }, ...Object.entries(CONTRACT_LABELS).map(([v, l]) => ({ v, l }))]} />
            <FilterSelect label="Sede" value={sedeFilter} onChange={setSedeFilter} options={[{ v: "", l: "Todas" }, ...Array.from(new Set(users.map((u) => u.sede))).map((s) => ({ v: s, l: s }))]} />
          </div>
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-line-soft flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setAreaFilter(""); setStatusFilter(""); setRoleFilter(""); setTurnoFilter(""); setContractFilter(""); setSedeFilter(""); }}>Limpiar filtros</Button>
            </div>
          )}
        </Card>
      )}

      {/* Tabla */}
      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface/60 border-b border-line text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
                <th className="px-3 py-3 w-[52px]">Foto</th>
                <SortHeader label="Código" k="code" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="w-[100px]" />
                <th className="px-3 py-3 w-[90px]">DNI</th>
                <SortHeader label="Nombre" k="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="min-w-[160px]" />
                <SortHeader label="Cargo" k="cargo" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="w-[170px]" />
                <SortHeader label="Área" k="area" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="w-[130px]" />
                <th className="px-3 py-3 w-[120px]">Jefe inmediato</th>
                <th className="px-3 py-3 w-[180px]">Correo</th>
                <th className="px-3 py-3 w-[80px]">Turno</th>
                <th className="px-3 py-3 w-[100px]">Estado</th>
                <th className="px-3 py-3 w-[60px] text-center">Casos</th>
                <th className="px-3 py-3 w-[60px] text-center">Inv.</th>
                <th className="px-3 py-3 w-[60px] text-center">Planes</th>
                <th className="px-3 py-3 w-[100px]">Últ. sync</th>
                <th className="px-3 py-3 w-[80px] text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {filtered.map((u) => {
                const userCases = cases.filter((c) => c.assignee === u.name || c.reporter === u.name);
                const openCases = userCases.filter((c) => c.stage !== "cierre" && c.stage !== "rechazado").length;
                const investigations = cases.filter((c) => c.investigator === u.name).length;
                const pendingPlans = userCases.filter((c) => c.stage === "ejecucion" || c.stage === "plan_accion").length;
                return (
                  <tr key={u.id} className="hover:bg-surface/40 transition-colors group cursor-pointer" onClick={() => onSelectUser(u)}>
                    <td className="px-3 py-3">
                      <div className="h-8 w-8 rounded-full grid place-items-center text-white text-[10px] font-semibold shrink-0" style={{ background: u.avatarColor ?? "#14814a" }}>{u.initials}</div>
                    </td>
                    <td className="px-3 py-3"><span className="font-mono text-[11.5px] font-semibold text-brand-700">{u.code}</span></td>
                    <td className="px-3 py-3"><span className="text-[11.5px] text-ink-soft tabular-nums">{u.dni}</span></td>
                    <td className="px-3 py-3 max-w-[180px]">
                      <p className="text-[12.5px] font-semibold text-ink truncate">{u.name}</p>
                      <p className="text-[10.5px] text-ink-quiet mt-0.5">{USER_ROLE_LABELS[u.userRole]}</p>
                    </td>
                    <td className="px-3 py-3"><span className="text-[12px] text-ink-soft">{u.cargo}</span></td>
                    <td className="px-3 py-3"><span className="text-[12px] text-ink-soft">{u.area ? AREA_LABELS[u.area] : "—"}</span></td>
                    <td className="px-3 py-3"><span className="text-[11.5px] text-ink-soft truncate block max-w-[110px]">{u.area ? AREA_HEADS[u.area] : "—"}</span></td>
                    <td className="px-3 py-3"><span className="text-[11.5px] text-ink-soft truncate block max-w-[170px]">{u.email}</span></td>
                    <td className="px-3 py-3"><span className="text-[11.5px] text-ink-soft">{TURNO_LABELS[u.turno]}</span></td>
                    <td className="px-3 py-3"><Pill tone={LABOR_STATE_TONE[u.laborState]} dot>{LABOR_STATE_LABELS[u.laborState]}</Pill></td>
                    <td className="px-3 py-3 text-center"><span className="text-[12px] tabular-nums font-semibold text-ink">{openCases}</span></td>
                    <td className="px-3 py-3 text-center"><span className="text-[12px] tabular-nums font-semibold text-ink">{investigations}</span></td>
                    <td className="px-3 py-3 text-center"><span className="text-[12px] tabular-nums font-semibold text-ink">{pendingPlans}</span></td>
                    <td className="px-3 py-3"><span className="text-[11px] text-ink-quiet">{formatDate(u.lastSyncAt)}</span></td>
                    <td className="px-3 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onSelectUser(u); }}>Ficha <ChevronRight className="h-3.5 w-3.5" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-10 text-center text-[13px] text-ink-quiet">No se encontraron trabajadores con los filtros seleccionados.</div>}
        <div className="p-3 border-t border-line-soft text-[11.5px] text-ink-quiet flex items-center justify-between">
          <span>Mostrando {filtered.length} de {users.length} trabajadores</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-brand-600" /> Datos sincronizados desde Excel</span>
        </div>
      </Card>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div>
      <p className="text-[10.5px] font-medium text-ink-faint mb-1">{label}</p>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-3 pr-8 rounded-lg bg-white border border-line text-[12.5px] text-ink-soft cursor-pointer">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

function SortHeader({ label, k, sortKey, sortDir, onSort, className }: { label: string; k: "name" | "code" | "area" | "cargo"; sortKey: string; sortDir: "asc" | "desc"; onSort: (k: "name" | "code" | "area" | "cargo") => void; className?: string }) {
  const active = sortKey === k;
  return (
    <th className={cn("px-3 py-3", className)}>
      <button onClick={() => onSort(k)} className={cn("inline-flex items-center gap-1 hover:text-ink transition-colors", active && "text-ink")}>
        {label}<ArrowUpDown className={cn("h-3 w-3", active ? "text-brand-700" : "text-ink-faint")} />
      </button>
    </th>
  );
}

/* ═══ FICHA DEL TRABAJADOR ═══ */
function WorkerProfile({ user, onClose }: { user: User; onClose: () => void }) {
  const { cases, assignUserRole, deactivateUser, reassignResponsible } = useStore();
  const [tab, setTab] = useState<"info" | "roles" | "casos" | "investigaciones" | "planes" | "actividad" | "historial">("info");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const userCases = cases.filter((c) => c.assignee === user.name || c.reporter === user.name);
  const userInvestigations = cases.filter((c) => c.investigator === user.name || (c.involvedWorkers ?? []).some((w) => w.userId === user.id));
  const userPlans = cases.filter((c) => c.assignee === user.name && c.actionPlan);
  const openCases = userCases.filter((c) => c.stage !== "cierre" && c.stage !== "rechazado").length;
  const closedCases = userCases.filter((c) => c.stage === "cierre").length;
  const criticalCases = userCases.filter((c) => c.priority === "critica").length;
  const pendingPlans = userPlans.filter((c) => c.stage === "ejecucion" || c.stage === "plan_accion").length;
  const hasPendingWork = openCases > 0 || pendingPlans > 0;

  const antiguedadYears = Math.floor((Date.now() - new Date(user.hiredAt).getTime()) / (365 * 86400000));
  const antiguedadMonths = Math.floor(((Date.now() - new Date(user.hiredAt).getTime()) % (365 * 86400000)) / (30 * 86400000));

  const tabs = [
    { id: "info" as const, label: "Información General", icon: UserIcon },
    { id: "roles" as const, label: "Roles", icon: ShieldCheck },
    { id: "casos" as const, label: "Casos", icon: ClipboardList, count: userCases.length },
    { id: "investigaciones" as const, label: "Investigaciones", icon: FileSearch, count: userInvestigations.length },
    { id: "planes" as const, label: "Planes de Acción", icon: ClipboardList, count: userPlans.length },
    { id: "actividad" as const, label: "Actividad", icon: Activity },
    { id: "historial" as const, label: "Historial Laboral", icon: History },
  ];

  return (
    <SegShell>
      {/* Back */}
      <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver al Centro de Personal
      </button>

      {/* Header corporativo */}
      <Card className="p-6 mb-5">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="h-20 w-20 rounded-2xl grid place-items-center text-white text-[24px] font-bold shrink-0" style={{ background: user.avatarColor ?? "#14814a" }}>
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[24px] font-bold text-ink tracking-tight">{user.name}</h1>
              <Pill tone={LABOR_STATE_TONE[user.laborState]} dot>{LABOR_STATE_LABELS[user.laborState]}</Pill>
            </div>
            <p className="text-[14px] text-ink-soft mt-1">{user.cargo} · {user.area ? AREA_LABELS[user.area] : "—"}</p>
            <div className="mt-3 flex items-center gap-4 flex-wrap text-[12px] text-ink-quiet">
              <span className="flex items-center gap-1.5"><IdCard className="h-3.5 w-3.5" /> {user.code}</span>
              <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> DNI {user.dni}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {user.sede}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasPendingWork ? (
              <Button variant="outline" size="sm" onClick={() => setReassignOpen(true)} className="border-warning/40 text-warning-ink hover:bg-warning-soft">
                <AlertTriangle className="h-4 w-4" /> Reasignar
              </Button>
            ) : null}
            {user.laborState !== "baja_definitiva" && (
              <Button variant="outline" size="sm" onClick={() => setDeactivateOpen(true)} className="text-critical hover:bg-critical-soft">
                <UserX className="h-4 w-4" /> Dar de baja
              </Button>
            )}
          </div>
        </div>

        {/* Indicadores operativos */}
        <div className="mt-5 pt-5 border-t border-line-soft grid grid-cols-3 sm:grid-cols-6 gap-3">
          <Metric label="Casos abiertos" value={openCases} icon={ClipboardList} tone={openCases > 0 ? "warning" : "neutral"} />
          <Metric label="Casos cerrados" value={closedCases} icon={CheckCircle2} tone="brand" />
          <Metric label="Críticos" value={criticalCases} icon={AlertTriangle} tone={criticalCases > 0 ? "critical" : "neutral"} />
          <Metric label="Investigaciones" value={userInvestigations.length} icon={FileSearch} tone="info" />
          <Metric label="Planes activos" value={pendingPlans} icon={Activity} tone={pendingPlans > 0 ? "warning" : "neutral"} />
          <Metric label="Antigüedad" value={`${antiguedadYears}a ${antiguedadMonths}m`} icon={Award} tone="brand" />
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-line w-fit overflow-x-auto scrollbar-none mb-5">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn("h-9 px-3.5 rounded-md text-[12.5px] font-medium transition-colors flex items-center gap-2 whitespace-nowrap",
              tab === t.id ? "bg-brand-700 text-white shadow-sm" : "text-ink-soft hover:bg-surface")}>
            <t.icon className="h-4 w-4" /> {t.label}
            {t.count !== undefined && <span className={cn("text-[10.5px] tabular-nums px-1.5 rounded-full", tab === t.id ? "bg-white/20" : "bg-surface-2 text-ink-quiet")}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "info" && <InfoTab user={user} antiguedadYears={antiguedadYears} antiguedadMonths={antiguedadMonths} />}
      {tab === "roles" && <RolesTab user={user} onAssignRole={(r) => assignUserRole(user.id, r)} />}
      {tab === "casos" && <CasesTab cases={userCases} />}
      {tab === "investigaciones" && <InvestigationsTab cases={userInvestigations} userName={user.name} />}
      {tab === "planes" && <PlansTab cases={userPlans} />}
      {tab === "actividad" && <ActivityTab user={user} />}
      {tab === "historial" && <HistoryTab user={user} />}

      {/* Reasignación */}
      <ReassignModal open={reassignOpen} onClose={() => setReassignOpen(false)} user={user} pendingCases={userCases.filter((c) => c.stage !== "cierre" && c.stage !== "rechazado")} onReassign={reassignResponsible} />

      {/* Baja */}
      <Modal open={deactivateOpen} onClose={() => setDeactivateOpen(false)} title="Dar de baja al trabajador" subtitle={`${user.name} · ${user.code}`} size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeactivateOpen(false)}>Cancelar</Button><Button variant="danger" onClick={() => { deactivateUser(user.id); setDeactivateOpen(false); onClose(); }}><UserX className="h-4 w-4" /> Confirmar baja</Button></>}>
        {hasPendingWork ? (
          <div className="rounded-lg bg-warning-soft border border-warning/30 p-4 flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-warning-ink shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-ink">Este trabajador posee actividades pendientes</p>
              <p className="text-[12px] text-ink-soft mt-1">Antes de darlo de baja deberá reasignar sus responsabilidades ({openCases} casos abiertos, {pendingPlans} planes pendientes).</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => { setDeactivateOpen(false); setReassignOpen(true); }}>
                <RefreshCw className="h-4 w-4" /> Reasignar responsable
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-ink-soft">El trabajador no tiene actividades pendientes. Puede darlo de baja. Su historial se conservará.</p>
        )}
      </Modal>
    </SegShell>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: typeof ClipboardList; tone: "neutral" | "brand" | "warning" | "critical" | "info" }) {
  return (
    <div>
      <div className={cn("h-8 w-8 rounded-lg grid place-items-center mb-1.5",
        tone === "brand" ? "bg-brand-50 text-brand-700" : tone === "warning" ? "bg-warning-soft text-warning-ink" :
        tone === "critical" ? "bg-critical-soft text-critical-ink" : tone === "info" ? "bg-info-soft text-info-ink" : "bg-surface-2 text-ink-soft")}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[18px] font-bold tabular-nums text-ink leading-none">{value}</p>
      <p className="text-[10.5px] text-ink-quiet mt-1">{label}</p>
    </div>
  );
}

function InfoTab({ user, antiguedadYears, antiguedadMonths }: { user: User; antiguedadYears: number; antiguedadMonths: number }) {
  const rows = [
    { label: "Fotografía", value: user.initials, icon: UserIcon },
    { label: "Código del trabajador", value: user.code, icon: IdCard },
    { label: "DNI", value: user.dni, icon: FileText },
    { label: "Nombre completo", value: user.name, icon: UserIcon },
    { label: "Cargo", value: user.cargo, icon: Briefcase },
    { label: "Área", value: user.area ? AREA_LABELS[user.area] : "—", icon: Building2 },
    { label: "Subárea", value: user.subarea ?? "—", icon: Building2 },
    { label: "Centro de trabajo", value: user.sede, icon: MapPin },
    { label: "Estación asignada", value: user.station ?? "—", icon: MapPin },
    { label: "Turno", value: TURNO_LABELS[user.turno], icon: Clock },
    { label: "Correo corporativo", value: user.email, icon: Mail },
    { label: "Teléfono", value: user.phone ?? "—", icon: Phone },
    { label: "Fecha de ingreso", value: formatDate(user.hiredAt), icon: Calendar },
    { label: "Antigüedad", value: `${antiguedadYears} años, ${antiguedadMonths} meses`, icon: Award },
    { label: "Estado laboral", value: LABOR_STATE_LABELS[user.laborState], icon: ShieldCheck },
    { label: "Tipo de contrato", value: CONTRACT_LABELS[user.contractType], icon: FileText },
    { label: "Jefe inmediato", value: user.area ? AREA_HEADS[user.area] : "—", icon: UserIcon },
    { label: "Última sincronización", value: formatDateTime(user.lastSyncAt), icon: RefreshCw },
    { label: "Usuario que sincronizó", value: user.lastSyncBy, icon: UserIcon },
  ];
  return (
    <Card className="p-5">
      <h3 className="text-[15px] font-bold text-ink mb-4">Información General</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start gap-2.5">
            <span className="text-ink-faint mt-0.5"><r.icon className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-medium tracking-wide uppercase text-ink-faint">{r.label}</p>
              <p className="text-[13px] text-ink font-medium mt-0.5">{r.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RolesTab({ user, onAssignRole }: { user: User; onAssignRole: (r: UserRole) => void }) {
  return (
    <Card className="p-5">
      <h3 className="text-[15px] font-bold text-ink mb-4">Roles y Permisos</h3>
      <div className="space-y-2.5">
        {(Object.keys(USER_ROLE_LABELS) as UserRole[]).map((role) => {
          const assigned = user.roles.some((r) => r.role === role);
          const assignment = user.roles.find((r) => r.role === role);
          return (
            <div key={role} className={cn("rounded-xl border p-4 flex items-start justify-between gap-3", assigned ? "border-brand-200 bg-brand-50/40" : "border-line bg-white")}>
              <div className="flex items-start gap-3 min-w-0">
                <div className={cn("h-10 w-10 rounded-lg grid place-items-center shrink-0", assigned ? "bg-brand-700 text-white" : "bg-surface-2 text-ink-faint")}>
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-ink">{USER_ROLE_LABELS[role]}</p>
                    {assigned && <Pill tone={USER_ROLE_TONE[role]} dot>Asignado</Pill>}
                  </div>
                  <p className="text-[12px] text-ink-soft mt-1 leading-relaxed">{USER_ROLE_DESCRIPTIONS[role]}</p>
                  {assignment && (
                    <p className="text-[11px] text-ink-faint mt-1.5">Asignado por {assignment.assignedBy} · {formatDate(assignment.assignedAt)}</p>
                  )}
                </div>
              </div>
              <Button variant={assigned ? "ghost" : "outline"} size="sm" onClick={() => onAssignRole(role)} disabled={assigned}>
                {assigned ? <Check className="h-4 w-4" /> : "Asignar"}
              </Button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CasesTab({ cases }: { cases: import("@/lib/types").CaseFile[] }) {
  const open = cases.filter((c) => c.stage !== "cierre" && c.stage !== "rechazado").length;
  const closed = cases.filter((c) => c.stage === "cierre").length;
  const critical = cases.filter((c) => c.priority === "critica").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Casos abiertos" value={open} tone="warning" />
        <MetricCard label="Casos cerrados" value={closed} tone="brand" />
        <MetricCard label="Casos críticos" value={critical} tone="critical" />
      </div>
      <Card padded={false} className="overflow-hidden">
        <table className="w-full text-left">
          <thead><tr className="bg-surface/60 border-b border-line text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-3">Código</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Prioridad</th><th className="px-4 py-3">Área</th><th className="px-4 py-3">Acción</th>
          </tr></thead>
          <tbody className="divide-y divide-line-soft">
            {cases.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-[13px] text-ink-quiet">Sin casos relacionados</td></tr> : null}
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-surface/40">
                <td className="px-4 py-3"><span className="font-mono text-[12px] font-semibold text-brand-700">{c.id}</span></td>
                <td className="px-4 py-3"><span className="text-[12px] text-ink-soft">{c.type}</span></td>
                <td className="px-4 py-3"><Pill tone="neutral" dot>{c.stage}</Pill></td>
                <td className="px-4 py-3"><span className="text-[12px] text-ink-soft">{formatDate(c.createdAt)}</span></td>
                <td className="px-4 py-3"><Pill tone={c.priority === "critica" ? "critical" : c.priority === "alta" ? "warning" : "info"} dot>{c.priority}</Pill></td>
                <td className="px-4 py-3"><span className="text-[12px] text-ink-soft">{c.area ? AREA_LABELS[c.area] : "—"}</span></td>
                <td className="px-4 py-3"><Button variant="ghost" size="sm">Ver caso <ChevronRight className="h-3.5 w-3.5" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function InvestigationsTab({ cases, userName }: { cases: import("@/lib/types").CaseFile[]; userName: string }) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="p-5 border-b border-line-soft"><h3 className="text-[15px] font-bold text-ink">Investigaciones</h3><p className="text-[12px] text-ink-quiet">Participación como investigador, testigo o involucrado</p></div>
      <table className="w-full text-left">
        <thead><tr className="bg-surface/60 border-b border-line text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
          <th className="px-4 py-3">Código</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Fecha</th>
        </tr></thead>
        <tbody className="divide-y divide-line-soft">
          {cases.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-[13px] text-ink-quiet">Sin investigaciones</td></tr> : null}
          {cases.map((c) => {
            const role = c.investigator === userName ? "Investigador" : (c.involvedWorkers ?? []).find((w) => w.userId === userName)?.implication ?? "Involucrado";
            return (
              <tr key={c.id} className="hover:bg-surface/40">
                <td className="px-4 py-3"><span className="font-mono text-[12px] font-semibold text-brand-700">{c.id}</span></td>
                <td className="px-4 py-3"><Pill tone="info" dot>{role}</Pill></td>
                <td className="px-4 py-3"><Pill tone="neutral" dot>{c.stage}</Pill></td>
                <td className="px-4 py-3"><span className="text-[12px] text-ink-soft">{formatDate(c.createdAt)}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function PlansTab({ cases }: { cases: import("@/lib/types").CaseFile[] }) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="p-5 border-b border-line-soft"><h3 className="text-[15px] font-bold text-ink">Planes de Acción</h3><p className="text-[12px] text-ink-quiet">Planes donde participa como responsable o ejecutor</p></div>
      <table className="w-full text-left">
        <thead><tr className="bg-surface/60 border-b border-line text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
          <th className="px-4 py-3">Código</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Avance</th><th className="px-4 py-3">Vence</th><th className="px-4 py-3">Días rest.</th>
        </tr></thead>
        <tbody className="divide-y divide-line-soft">
          {cases.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-[13px] text-ink-quiet">Sin planes asignados</td></tr> : null}
          {cases.map((c) => {
            const days = Math.ceil((new Date(c.slaDueDate).getTime() - Date.now()) / 86400000);
            return (
              <tr key={c.id} className="hover:bg-surface/40">
                <td className="px-4 py-3"><span className="font-mono text-[12px] font-semibold text-brand-700">{c.id}</span></td>
                <td className="px-4 py-3"><Pill tone="neutral" dot>{c.stage}</Pill></td>
                <td className="px-4 py-3 w-[160px]"><Progress value={c.execution?.progress ?? 0} showLabel /></td>
                <td className="px-4 py-3"><span className="text-[12px] text-ink-soft">{formatDate(c.slaDueDate)}</span></td>
                <td className="px-4 py-3"><span className={cn("text-[12px] tabular-nums font-semibold", days < 0 ? "text-critical" : days <= 2 ? "text-warning-ink" : "text-ink-soft")}>{days}d</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function ActivityTab({ user }: { user: User }) {
  const acts = [...user.activity].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return (
    <Card padded={false}>
      <div className="p-5 border-b border-line-soft"><h3 className="text-[15px] font-bold text-ink">Actividad del Usuario</h3><p className="text-[12px] text-ink-quiet">Línea de tiempo de acciones en el sistema</p></div>
      <div className="p-5">
        <div className="relative">
          <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-line" />
          <div className="space-y-4">
            {acts.map((a) => (
              <div key={a.id} className="relative pl-10">
                <div className="absolute left-0 top-0.5 h-6 w-6 rounded-full bg-brand-100 text-brand-700 grid place-items-center border-2 border-white shrink-0">
                  <Activity className="h-3 w-3" />
                </div>
                <p className="text-[13px] font-semibold text-ink leading-tight">{a.title}</p>
                <p className="text-[11.5px] text-ink-quiet mt-0.5">{formatDateTime(a.at)} · {relativeTime(a.at)}</p>
                {a.detail && <p className="text-[12px] text-ink-soft mt-1">{a.detail}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function HistoryTab({ user }: { user: User }) {
  const hist = [...user.workHistory].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  return (
    <div className="space-y-4">
      <Card padded={false}>
        <div className="p-5 border-b border-line-soft"><h3 className="text-[15px] font-bold text-ink">Historial Laboral</h3><p className="text-[12px] text-ink-quiet">Cambios registrados desde Excel corporativo</p></div>
        <div className="p-5">
          <div className="relative">
            <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-line" />
            <div className="space-y-4">
              {hist.map((h) => (
                <div key={h.id} className="relative pl-10">
                  <div className="absolute left-0 top-0.5 h-6 w-6 rounded-full bg-info-soft text-info-ink grid place-items-center border-2 border-white shrink-0">
                    <RefreshCw className="h-3 w-3" />
                  </div>
                  <p className="text-[13px] font-semibold text-ink leading-tight">{h.field === "alta" ? "Alta de trabajador" : `${h.field} actualizado`}</p>
                  <p className="text-[11.5px] text-ink-quiet mt-0.5">{formatDate(h.at)} · {h.source === "excel" ? "Sincronización Excel" : "Manual"}</p>
                  {h.oldValue !== "—" && <p className="text-[12px] text-ink-soft mt-1">{h.oldValue} → <span className="font-medium text-ink">{h.newValue}</span></p>}
                  {h.oldValue === "—" && <p className="text-[12px] text-ink-soft mt-1">{h.newValue}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: "brand" | "warning" | "critical" }) {
  return (
    <Card className="p-4">
      <p className={cn("text-[24px] font-bold tabular-nums leading-none",
        tone === "brand" ? "text-brand-700" : tone === "warning" ? "text-warning-ink" : "text-critical-ink")}>{value}</p>
      <p className="text-[11.5px] text-ink-quiet mt-1.5">{label}</p>
    </Card>
  );
}

/* ═══ REASIGNACIÓN INTELIGENTE ═══ */
function ReassignModal({ open, onClose, user, pendingCases, onReassign }: {
  open: boolean; onClose: () => void; user: User;
  pendingCases: import("@/lib/types").CaseFile[];
  onReassign: (caseId: string, newAssignee: string, newArea: import("@/lib/types").Area, motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newArea, setNewArea] = useState<import("@/lib/types").Area | "">("");

  const canConfirm = motivo.trim() && newAssignee && newArea;

  const confirm = () => {
    if (!canConfirm) return;
    pendingCases.forEach((c) => onReassign(c.id, newAssignee, newArea as import("@/lib/types").Area, motivo.trim()));
    onClose();
    setMotivo(""); setNewAssignee(""); setNewArea("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Reasignación inteligente" subtitle={`${user.name} · ${pendingCases.length} actividades pendientes`} size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={confirm} disabled={!canConfirm}><RefreshCw className="h-4 w-4" /> Reasignar todo</Button></>}>
      <div className="space-y-4">
        <div className="rounded-lg bg-warning-soft border border-warning/30 p-4 flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-warning-ink shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-ink-soft">El trabajador ya no pertenece a la empresa. Existen actividades pendientes que requieren reasignación.</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-faint mb-2">Actividades pendientes detectadas</p>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {pendingCases.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-line text-[12px]">
                <span className="font-mono text-brand-700 font-semibold">{c.id}</span>
                <span className="text-ink-soft truncate flex-1">{c.title}</span>
                <Pill tone="warning" dot>{c.stage}</Pill>
              </div>
            ))}
          </div>
        </div>

        <Field label="Nuevo responsable" required>
          <Select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
            <option value="">Seleccione un jefe de área…</option>
            {Object.entries(AREA_HEADS).map(([area, name]) => <option key={area} value={name}>{name} · {AREA_LABELS[area as import("@/lib/types").Area]}</option>)}
          </Select>
        </Field>
        <Field label="Área del nuevo responsable" required>
          <Select value={newArea} onChange={(e) => setNewArea(e.target.value as import("@/lib/types").Area)}>
            <option value="">Seleccione un área…</option>
            {Object.entries(AREA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Motivo de la reasignación" required>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Justifique la reasignación…" />
        </Field>
        <div className="rounded-lg bg-info-soft border border-info/20 p-3 text-[12px] text-info-ink flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Se registrará automáticamente: responsable anterior ({user.name}), nuevo responsable, fecha, usuario que realizó la reasignación y motivo.</span>
        </div>
      </div>
    </Modal>
  );
}

/* ═══ SINCRONIZACIÓN ═══ */
function SyncTab({ syncLogs }: { syncLogs: import("@/lib/types").SyncLog[] }) {
  return (
    <div className="mt-5 space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-bold text-ink">Estado de sincronización</h3>
            <p className="text-[12px] text-ink-quiet">Conexión con Excel corporativo de Línea 1</p>
          </div>
          <Pill tone="brand" dot>Conectado</Pill>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <SyncStat label="Última sincronización" value={syncLogs[0] ? formatDate(syncLogs[0].at) : "—"} />
          <SyncStat label="Registros nuevos" value={`${syncLogs.reduce((a, l) => a + l.newUsers, 0)}`} />
          <SyncStat label="Registros actualizados" value={`${syncLogs.reduce((a, l) => a + l.updatedUsers, 0)}`} />
          <SyncStat label="Dados de baja" value={`${syncLogs.reduce((a, l) => a + l.deactivatedUsers, 0)}`} />
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="p-5 border-b border-line-soft">
          <h3 className="text-[15px] font-bold text-ink">Historial de sincronizaciones</h3>
          <p className="text-[12px] text-ink-quiet">Registro de todas las sincronizaciones con Excel</p>
        </div>
        <table className="w-full text-left">
          <thead><tr className="bg-surface/60 border-b border-line text-[10.5px] font-semibold uppercase tracking-wide text-ink-faint">
            <th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Nuevos</th>
            <th className="px-4 py-3">Actualizados</th><th className="px-4 py-3">Bajas</th><th className="px-4 py-3">Duración</th><th className="px-4 py-3">Estado</th>
          </tr></thead>
          <tbody className="divide-y divide-line-soft">
            {syncLogs.map((log) => (
              <tr key={log.id} className="hover:bg-surface/40">
                <td className="px-4 py-3.5"><span className="text-[12.5px] text-ink font-medium">{formatDateTime(log.at)}</span></td>
                <td className="px-4 py-3.5"><span className="text-[12.5px] text-ink-soft">{log.triggeredBy}</span></td>
                <td className="px-4 py-3.5"><span className="text-[12.5px] text-brand-700 font-semibold tabular-nums">+{log.newUsers}</span></td>
                <td className="px-4 py-3.5"><span className="text-[12.5px] text-info-ink font-semibold tabular-nums">{log.updatedUsers}</span></td>
                <td className="px-4 py-3.5"><span className="text-[12.5px] text-critical-ink font-semibold tabular-nums">-{log.deactivatedUsers}</span></td>
                <td className="px-4 py-3.5"><span className="text-[12.5px] text-ink-soft tabular-nums">{log.durationSec}s</span></td>
                <td className="px-4 py-3.5">{log.status === "completada" ? <Pill tone="brand" dot>Completada</Pill> : <Pill tone="warning" dot>En proceso</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function SyncStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface border border-line p-3">
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="text-[18px] font-bold text-ink mt-1">{value}</p>
    </div>
  );
}

/* ═══ SYNC MODAL ═══ */
function SyncModal({ open, onClose, syncing, result }: { open: boolean; onClose: () => void; syncing: boolean; result: { newCount: number; updatedCount: number; deactivatedCount: number; durationSec: number } | null }) {
  return (
    <Modal open={open} onClose={onClose} title={syncing ? "Sincronizando con Excel" : "Sincronización completada"} subtitle={syncing ? "Leyendo archivo Excel corporativo…" : "Resumen del proceso"} size="sm"
      footer={syncing ? undefined : <Button onClick={onClose} className="w-full"><Check className="h-4 w-4" /> Cerrar</Button>}>
      {syncing ? (
        <div className="py-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-brand-50 grid place-items-center">
            <Loader2 className="h-8 w-8 text-brand-700 animate-spin" />
          </div>
          <p className="mt-4 text-[14px] font-semibold text-ink">Conectando con Excel corporativo</p>
          <p className="text-[12.5px] text-ink-quiet mt-1">Leyendo trabajadores, detectando cambios…</p>
          <div className="mt-4 space-y-1.5 text-left">
            {["Conectando al archivo…", "Leyendo registros…", "Detectando cambios…", "Actualizando plataforma…"].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px] text-ink-soft"><Loader2 className="h-3.5 w-3.5 text-brand-700 animate-spin" /> {t}</div>
            ))}
          </div>
        </div>
      ) : result ? (
        <div className="py-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-brand-700 grid place-items-center animate-[riseUp_0.4s_ease-out]">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <p className="mt-3 text-center text-[14px] font-semibold text-ink">¡Sincronización completada!</p>
          <div className="mt-4 space-y-2.5">
            <ResultRow icon={<UserPlus className="h-4 w-4" />} label="Nuevos trabajadores" value={`+${result.newCount}`} tone="brand" />
            <ResultRow icon={<RefreshCw className="h-4 w-4" />} label="Actualizados" value={`${result.updatedCount}`} tone="info" />
            <ResultRow icon={<UserX className="h-4 w-4" />} label="Dados de baja" value={`-${result.deactivatedCount}`} tone="critical" />
            <ResultRow icon={<Activity className="h-4 w-4" />} label="Tiempo total" value={`${result.durationSec} s`} tone="neutral" />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function ResultRow({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "brand" | "info" | "critical" | "neutral" }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-line">
      <span className={cn("h-8 w-8 rounded-lg grid place-items-center shrink-0",
        tone === "brand" ? "bg-brand-50 text-brand-700" : tone === "info" ? "bg-info-soft text-info-ink" : tone === "critical" ? "bg-critical-soft text-critical-ink" : "bg-surface-2 text-ink-soft")}>{icon}</span>
      <p className="text-[13px] text-ink-soft flex-1">{label}</p>
      <p className={cn("text-[14px] font-bold tabular-nums", tone === "brand" ? "text-brand-700" : tone === "info" ? "text-info-ink" : tone === "critical" ? "text-critical-ink" : "text-ink")}>{value}</p>
    </div>
  );
}
