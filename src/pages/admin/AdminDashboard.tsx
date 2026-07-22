import { Link } from "react-router-dom";
import {
  Users,
  Shield,
  Building2,
  MapPin,
  Train,
  BookOpen,
  Settings,
  ScrollText,
  ArrowRight,
  TrendingUp,
  Activity,
  Clock,
} from "lucide-react";
import { useAdminStore } from "@/lib/adminStore";
import { useStore } from "@/lib/store";

const CARDS = [
  { to: "/admin/usuarios", label: "Gestión de Usuarios", desc: "Crear, editar, activar y gestionar cuentas de usuario", icon: Users, color: "bg-brand-50 text-brand-700 border-brand-200" },
  { to: "/admin/roles", label: "Roles y Permisos", desc: "Configurar roles del sistema y permisos granulares", icon: Shield, color: "bg-info-soft text-info-ink border-info/20" },
  { to: "/admin/areas", label: "Gestión de Áreas", desc: "Administrar áreas organizacionales y jefes responsables", icon: Building2, color: "bg-warning-soft text-warning-ink border-warning/20" },
  { to: "/admin/estaciones", label: "Gestión de Estaciones", desc: "Configurar estaciones de la Línea 1 del Metro", icon: MapPin, color: "bg-brand-50 text-brand-700 border-brand-200" },
  { to: "/admin/material-rodante", label: "Material Rodante", desc: "Administrar series, unidades y vehículos auxiliares", icon: Train, color: "bg-info-soft text-info-ink border-info/20" },
  { to: "/admin/catalogos", label: "Catálogos", desc: "Tipos SOP, subtipos, procedencia, riesgo y más", icon: BookOpen, color: "bg-surface-2 text-ink-soft border-line" },
  { to: "/admin/configuracion", label: "Configuración General", desc: "Numeración, plazos y parámetros del sistema", icon: Settings, color: "bg-warning-soft text-warning-ink border-warning/20" },
  { to: "/admin/auditoria", label: "Auditoría", desc: "Bitácora de acciones y trazabilidad del sistema", icon: ScrollText, color: "bg-critical-soft text-critical-ink border-critical/20" },
];

export function AdminDashboard() {
  const { areas, stations, rollingStock, roles, catalogs, auditLog } = useAdminStore();
  const { users } = useStore();

  const activeUsers = users.filter((u) => u.status === "activo").length;
  const activeAreas = areas.filter((a) => a.active).length;
  const activeStations = stations.filter((s) => s.active).length;
  const activeRolling = rollingStock.filter((r) => r.active).length;

  const kpis = [
    { label: "Usuarios Activos", value: activeUsers, icon: Users, tone: "text-brand-700" },
    { label: "Áreas Activas", value: activeAreas, icon: Building2, tone: "text-info" },
    { label: "Estaciones", value: activeStations, icon: MapPin, tone: "text-warning" },
    { label: "Material Rodante", value: activeRolling, icon: Train, tone: "text-brand-600" },
    { label: "Roles Configurados", value: roles.length, icon: Shield, tone: "text-info" },
    { label: "Catálogos", value: catalogs.length, icon: BookOpen, tone: "text-ink-soft" },
    { label: "Registros de Auditoría", value: auditLog.length, icon: ScrollText, tone: "text-critical" },
  ];

  return (
    <div className="max-w-[1200px] space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">Panel de Administración</h1>
        <p className="text-[13px] text-ink-quiet mt-1">
          Centro de control institucional para la configuración del sistema SIGMA L1
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-line p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-surface grid place-items-center">
              <kpi.icon className={`h-5 w-5 ${kpi.tone}`} />
            </div>
            <div>
              <p className="text-[20px] font-bold text-ink font-display">{kpi.value}</p>
              <p className="text-[11px] text-ink-quiet font-medium">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="text-[14px] font-semibold text-ink mb-3">Módulos de Administración</h2>
        <div className="grid grid-cols-2 gap-4">
          {CARDS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group bg-white rounded-xl border border-line p-5 flex items-start gap-4 hover:shadow-[var(--shadow-card-hover)] hover:border-brand-300 transition-all duration-200"
            >
              <div className={`h-11 w-11 rounded-xl border grid place-items-center shrink-0 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-ink group-hover:text-brand-700 transition-colors">
                  {card.label}
                </p>
                <p className="text-[12px] text-ink-quiet mt-0.5">{card.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-faint group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Audit */}
      <div>
        <h2 className="text-[14px] font-semibold text-ink mb-3">Actividad Reciente</h2>
        <div className="bg-white rounded-xl border border-line overflow-hidden">
          {auditLog.slice(0, 5).map((entry, i) => (
            <div key={entry.id} className={`flex items-center gap-4 px-5 py-3 ${i > 0 ? "border-t border-line-soft" : ""}`}>
              <Clock className="h-4 w-4 text-ink-faint shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] text-ink">
                  <span className="font-medium">{entry.actor}</span>{" "}
                  <span className="text-ink-quiet">{entry.action.replace(/_/g, " ")}</span>{" "}
                  <span className="font-medium text-ink">{entry.target}</span>
                </p>
                {entry.detail && <p className="text-[11px] text-ink-faint mt-0.5">{entry.detail}</p>}
              </div>
              <span className="text-[11px] text-ink-faint shrink-0 tabular-nums">
                {new Date(entry.at).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
        <Link to="/admin/auditoria" className="text-[12px] text-brand-600 font-medium hover:text-brand-700 mt-2 inline-block">
          Ver toda la auditoría →
        </Link>
      </div>
    </div>
  );
}
