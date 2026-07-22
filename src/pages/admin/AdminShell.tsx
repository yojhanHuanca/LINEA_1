import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users,
  Shield,
  Building2,
  MapPin,
  Train,
  BookOpen,
  Settings,
  ScrollText,
  LayoutDashboard,
  ChevronDown,
  LogOut,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/lib/adminStore";
import { Logo } from "@/design-system/brand/Logo";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  children: NavItem[];
}

export function AdminShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { logout } = useAdminStore();

  const groups: NavGroup[] = [
    {
      id: "gestion",
      label: "Gestión",
      icon: Settings,
      children: [
        { to: "/admin/usuarios", label: "Gestión de Usuarios", icon: Users },
        { to: "/admin/roles", label: "Roles y Permisos", icon: Shield },
        { to: "/admin/areas", label: "Gestión de Áreas", icon: Building2 },
        { to: "/admin/estaciones", label: "Gestión de Estaciones", icon: MapPin },
        { to: "/admin/material-rodante", label: "Material Rodante", icon: Train },
      ],
    },
    {
      id: "configuracion",
      label: "Configuración",
      icon: Settings,
      children: [
        { to: "/admin/catalogos", label: "Catálogos", icon: BookOpen },
        { to: "/admin/configuracion", label: "Configuración General", icon: Settings },
      ],
    },
  ];

  const standalone: NavItem[] = [
    { to: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
  ];

  const isActive = (to: string) => location.pathname === to;

  const initialExpanded: Record<string, boolean> = {
    gestion: true,
    configuracion: location.pathname.startsWith("/admin/catalogos") || location.pathname.startsWith("/admin/configuracion"),
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded);
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const currentLabel = (() => {
    for (const g of groups) {
      for (const c of g.children) if (isActive(c.to)) return c.label;
    }
    for (const s of standalone) if (isActive(s.to)) return s.label;
    return "Panel de Administración";
  })();

  return (
    <div className="flex min-h-screen bg-[#f8fafb]">
      {/* Sidebar */}
      <aside className="w-[272px] shrink-0 h-screen sticky top-0 bg-white border-r border-line flex flex-col">
        {/* Header */}
        <div className="px-5 h-16 flex items-center border-b border-line-soft">
          <Link to="/admin" className="flex items-center gap-2.5">
            <Logo size={28} withWordmark={false} />
            <div className="leading-tight">
              <p className="text-[13px] font-bold tracking-tight font-display text-ink">
                SIGMA<span className="text-brand-600"> L1</span>
              </p>
              <div className="flex items-center gap-1.5">
                <Lock className="h-2.5 w-2.5 text-brand-600" />
                <p className="text-[9.5px] font-semibold tracking-wide text-brand-700 uppercase">
                  Centro de Administración
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-none">
          <Link
            to="/admin"
            className={cn(
              "flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors mb-3",
              location.pathname === "/admin"
                ? "bg-brand-50 text-brand-800"
                : "text-ink-soft hover:bg-surface hover:text-ink"
            )}
          >
            <LayoutDashboard className={cn("h-[18px] w-[18px] shrink-0", location.pathname === "/admin" ? "text-brand-700" : "text-ink-quiet")} />
            <span>Panel Principal</span>
          </Link>

          <p className="px-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-ink-faint mb-2 mt-1">
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
                      hasActiveChild ? "text-ink bg-surface" : "text-ink-soft hover:bg-surface hover:text-ink"
                    )}
                  >
                    <group.icon className={cn("h-[18px] w-[18px] shrink-0", hasActiveChild ? "text-brand-700" : "text-ink-quiet")} />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown className={cn("h-4 w-4 text-ink-faint transition-transform duration-200", expandedFlag && "rotate-180")} />
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
                              active ? "bg-brand-50 text-brand-800" : "text-ink-soft hover:bg-surface hover:text-ink"
                            )}
                          >
                            <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-brand-700" : "text-ink-faint")} />
                            <span className="flex-1 truncate">{item.label}</span>
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
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-line-soft space-y-2">
          <Link
            to="/seguridad"
            className="flex items-center gap-3 px-3 h-10 rounded-lg text-[13px] font-medium transition-colors text-ink-soft hover:bg-surface hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0 text-ink-quiet" />
            <span>Volver al Sistema</span>
          </Link>
          <div className="rounded-xl bg-surface p-3 flex items-center gap-3">
            <span className="h-9 w-9 rounded-full bg-brand-800 text-white grid place-items-center text-[12px] font-semibold shrink-0">
              AD
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink truncate">Administrador</p>
              <p className="text-[11px] text-ink-quiet truncate">Acceso Total</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="h-16 bg-white border-b border-line-soft flex items-center px-8 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-[13px] text-ink-quiet">
            <span className="text-ink-faint">SIGMA L1</span>
            <span className="text-ink-faint">/</span>
            <span className="text-ink font-medium">Centro de Administración</span>
          </div>
        </div>
        <main className="p-8 animate-[fadeIn_0.3s_var(--ease-out)]">
          {children}
        </main>
      </div>
    </div>
  );
}
