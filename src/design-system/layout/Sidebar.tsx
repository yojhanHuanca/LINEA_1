import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Bell,
  User,
  Users,
  ChevronDown,
  Home,
  Siren,
  FilePlus2,
  Clock,
  Send,
  Activity,
  CheckCircle2,
  Gauge,
  PieChart,
  Download,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { Logo } from "@/design-system/brand/Logo";
import { AdminGate } from "@/pages/admin/AdminGate";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  children: NavItem[];
}

function useBadgeCount() {
  const { cases, notifications } = useStore();
  const open = (s: string) => cases.filter((c) => c.stage === s).length;
  const alertCount = notifications.filter((n) => !n.read && n.audience !== "reportante").length;
  return {
    nuevos: open("recepcion") + open("evaluacion"),
    pendientes: open("pendiente_info") + open("plan_accion"),
    derivados: open("investigacion"),
    seguimiento: open("ejecucion") + open("verificacion"),
    cerrados: open("cierre"),
    alertas: alertCount,
  };
}

export function Sidebar() {
  const location = useLocation();
  const counts = useBadgeCount();
  const { notifications } = useStore();
  const alertCount = notifications.filter((n) => !n.read && n.audience !== "reportante").length;
  const [showAdminGate, setShowAdminGate] = useState(false);

  const groups: NavGroup[] = [
    {
      id: "inicio",
      label: "Inicio",
      icon: Home,
      children: [
        { to: "/seguridad", label: "Dashboard Ejecutivo", icon: LayoutDashboard },
        { to: "/seguridad/decisiones", label: "Centro de Decisiones", icon: Siren },
        { to: "/seguridad/alertas", label: "Alertas", icon: Bell, badge: alertCount },
      ],
    },
    {
      id: "casos",
      label: "Gestión de Casos",
      icon: FolderKanban,
      children: [
        { to: "/seguridad/casos?filtro=nuevos", label: "Casos Nuevos", icon: FilePlus2, badge: counts.nuevos },
        { to: "/seguridad/casos?filtro=pendientes", label: "Casos Pendientes", icon: Clock, badge: counts.pendientes },
        { to: "/seguridad/casos?filtro=derivados", label: "Casos Derivados", icon: Send, badge: counts.derivados },
        { to: "/seguridad/casos?filtro=seguimiento", label: "En Seguimiento", icon: Activity, badge: counts.seguimiento },
        { to: "/seguridad/casos?filtro=cerrados", label: "Casos Cerrados", icon: CheckCircle2, badge: counts.cerrados },
      ],
    },
    {
      id: "reportes",
      label: "Reportes",
      icon: BarChart3,
      children: [
        { to: "/seguridad/kpis", label: "KPIs", icon: Gauge },
        { to: "/seguridad/estadisticas", label: "Estadísticas", icon: PieChart },
        { to: "/seguridad/exportar", label: "Exportar", icon: Download },
      ],
    },
  ];

  const standalone: NavItem[] = [
    { to: "/seguridad/usuarios", label: "Administración de Usuarios", icon: Users },
    { to: "/seguridad/notificaciones", label: "Notificaciones", icon: Bell, badge: alertCount },
    { to: "/seguridad/perfil", label: "Mi Perfil", icon: User },
  ];

  const isActive = (to: string) => {
    const [path, query] = to.split("?");
    if (query) {
      return location.pathname === path && location.search === `?${query}`;
    }
    if (to === "/seguridad") return location.pathname === "/seguridad";
    return location.pathname === path;
  };

  const initialExpanded: Record<string, boolean> = {
    inicio: true,
    casos: true,
    reportes: location.pathname.startsWith("/seguridad/kpis") || location.pathname.startsWith("/seguridad/estadisticas") || location.pathname.startsWith("/seguridad/exportar"),
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const currentLabel = (() => {
    for (const g of groups) {
      for (const c of g.children) if (isActive(c.to)) return c.label;
    }
    for (const s of standalone) if (isActive(s.to)) return s.label;
    return "Dashboard Ejecutivo";
  })();

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 bg-white border-r border-line flex flex-col">
      <div className="px-5 h-16 flex items-center border-b border-line-soft">
        <Link to="/seguridad">
          <Logo size={32} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
        <p className="px-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-ink-faint mb-2">
          {currentLabel}
        </p>
        <div className="space-y-1">
          {groups.map((group) => {
            const expandedFlag = expanded[group.id];
            const hasActiveChild = group.children.some((c) => isActive(c.to));
            return (
              <div key={group.id}>
                <button
                  onClick={() => toggle(group.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors",
                    hasActiveChild
                      ? "text-ink bg-surface"
                      : "text-ink-soft hover:bg-surface hover:text-ink"
                  )}
                >
                  <group.icon className={cn("h-[18px] w-[18px] shrink-0", hasActiveChild ? "text-brand-700" : "text-ink-quiet")} />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-ink-faint transition-transform duration-200",
                      expandedFlag && "rotate-180"
                    )}
                  />
                </button>
                {expandedFlag && (
                  <div className="mt-0.5 mb-1.5 ml-3 pl-3 border-l border-line-soft space-y-0.5 reveal-up">
                    {group.children.map((item) => {
                      const active = isActive(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-2.5 pl-3 pr-2 h-9 rounded-md text-[12.5px] font-medium transition-all",
                            active
                              ? "bg-brand-50 text-brand-800"
                              : "text-ink-soft hover:bg-surface hover:text-ink"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-brand-700" : "text-ink-faint")} />
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge ? (
                            <span
                              className={cn(
                                "tabular-nums text-[10.5px] font-semibold px-1.5 h-4.5 min-w-[18px] grid place-items-center rounded-full",
                                active ? "bg-brand-200 text-brand-900" : "bg-surface-2 text-ink-quiet"
                              )}
                              style={{ minHeight: 18 }}
                            >
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="h-px bg-line-soft my-3 mx-3" />

        <div className="space-y-1">
          {standalone.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors",
                  active ? "bg-brand-50 text-brand-800" : "text-ink-soft hover:bg-surface hover:text-ink"
                )}
              >
                <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-brand-700" : "text-ink-quiet")} />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="tabular-nums text-[10.5px] font-semibold px-1.5 grid place-items-center rounded-full bg-critical text-white" style={{ minHeight: 18, minWidth: 18 }}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {/* Admin Access */}
        <div className="h-px bg-line-soft my-3 mx-3" />
        <button
          onClick={() => setShowAdminGate(true)}
          className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors text-ink-soft hover:bg-surface hover:text-ink"
        >
          <Shield className="h-[18px] w-[18px] shrink-0 text-ink-quiet" />
          <span className="flex-1 text-left">Centro de Administración</span>
        </button>
      </nav>

      <div className="p-3 border-t border-line-soft">
        <div className="rounded-xl bg-surface p-3 flex items-center gap-3">
          <span className="h-9 w-9 rounded-full bg-brand-700 text-white grid place-items-center text-[12px] font-semibold shrink-0">
            MF
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-ink truncate">Marcela Falcón</p>
            <p className="text-[11px] text-ink-quiet truncate">Seguridad Operativa</p>
          </div>
        </div>
      </div>

      <AdminGate
        open={showAdminGate}
        onClose={() => setShowAdminGate(false)}
        onSuccess={() => setShowAdminGate(false)}
      />
    </aside>
  );
}

export function ShellAction({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}
