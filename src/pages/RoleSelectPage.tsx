import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, ClipboardList, Train, ChevronRight, Rocket } from "lucide-react";
import { useStore } from "@/lib/store";
import { Logo } from "@/design-system/brand/Logo";
import { cn } from "@/lib/utils";

export function RoleSelectPage() {
  const navigate = useNavigate();
  const { setRole } = useStore();

  const enter = (role: "reportante" | "seguridad" | "jefe") => {
    setRole(role);
    navigate(role === "reportante" ? "/reportante" : role === "jefe" ? "/jefe" : "/seguridad");
  };

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-mesh opacity-90" />
      <svg className="absolute -bottom-32 -right-32 opacity-[0.07]" width="640" height="640" viewBox="0 0 640 640" fill="none" aria-hidden>
        <circle cx="320" cy="320" r="300" stroke="#0F6B3E" strokeWidth="1.5" />
        <circle cx="320" cy="320" r="230" stroke="#0F6B3E" strokeWidth="1.5" />
        <circle cx="320" cy="320" r="160" stroke="#0F6B3E" strokeWidth="1.5" />
        <circle cx="320" cy="320" r="90" stroke="#0F6B3E" strokeWidth="1.5" />
      </svg>

      <div className="relative max-w-[1200px] mx-auto px-6 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Logo size={40} />
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-ink-quiet">
            <span className="h-2 w-2 rounded-full bg-brand-500 animate-[pulseSoft_2s_ease-in-out_infinite]" />
            <span>Plataforma operativa · Prototipo de demostración</span>
          </div>
        </div>

        {/* Hero */}
        <div className="mt-14 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-line text-[11.5px] font-medium text-brand-800 shadow-sm">
            <Train className="h-3.5 w-3.5" />
            Línea 1 · Metro de Lima
          </div>
          <h1 className="mt-5 text-[42px] sm:text-[54px] font-bold tracking-tight leading-[1.02] font-display text-balance">
            Sistema de Gestión de
            <br />
            <span className="text-brand-700">Seguridad Operativa</span>
          </h1>
          <p className="mt-5 text-[15.5px] text-ink-soft max-w-2xl leading-relaxed">
            Una plataforma única que centraliza todo el ciclo de vida de los casos de
            seguridad operativa — desde el reporte del trabajador hasta el cierre por
            el área de Seguridad Operativa. Seleccione su perfil para continuar.
          </p>
        </div>

        {/* Profile cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-5 max-w-5xl">
          <RoleCard
            tone="reportante"
            icon={<ClipboardList className="h-6 w-6" />}
            label="Portal del Trabajador"
            title="Reportante"
            description="Registre una incidencia nueva, consulte sus reportes y el estado de cada caso. Responda solicitudes de información del área de Seguridad Operativa."
            bullets={["Wizard paso a paso", "Código automático del caso", "Solo consulta y respuesta"]}
            cta="Ingresar como Reportante"
            onClick={() => enter("reportante")}
          />
          <RoleCard
            tone="seguridad"
            icon={<ShieldCheck className="h-6 w-6" />}
            label="Centro de Control"
            title="Seguridad Operativa"
            description="Monitoree el dashboard ejecutivo, gestione el expediente digital de cada caso, derive al área responsable y controle el cierre del ciclo."
            bullets={["Dashboard ejecutivo", "Expediente digital", "Workflow completo de casos"]}
            cta="Ingresar como Seguridad Operativa"
            onClick={() => enter("seguridad")}
            featured
          />
          <RoleCard
            tone="jefe"
            icon={<Rocket className="h-6 w-6" />}
            label="Ejecución de Plan"
            title="Jefe del Área"
            description="Ejecute el Plan de Acción asignado por Seguridad Operativa. Registre avances, adjunte evidencias, solicite ampliaciones y envíe el plan a verificación."
            bullets={["Plan de Acción asignado", "Registro de avances y evidencias", "Enviar a verificación"]}
            cta="Ingresar como Jefe del Área"
            onClick={() => enter("jefe")}
          />
        </div>

        {/* Quick demo note */}
        <div className="mt-10 max-w-4xl rounded-xl bg-white border border-line p-4 flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-50 text-brand-700 grid place-items-center shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="text-[12.5px] text-ink-soft leading-relaxed">
            <span className="font-semibold text-ink">Demostración interactiva.</span> Todos los
            cambios que realice (aprobar, derivar, agregar observaciones, ejecutar, cerrar) se
            guardan automáticamente en este dispositivo. Navegue entre pantallas y la información
            persistirá sin necesidad de un backend real.
          </p>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  tone,
  icon,
  label,
  title,
  description,
  bullets,
  cta,
  onClick,
  featured,
}: {
  tone: "reportante" | "seguridad" | "jefe";
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  onClick: () => void;
  featured?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group text-left rounded-2xl bg-white border p-6 transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5",
        featured ? "border-brand-200 shadow-[var(--shadow-card)] ring-1 ring-brand-100" : "border-line shadow-[var(--shadow-card)]"
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "h-12 w-12 rounded-xl grid place-items-center",
            tone === "seguridad" ? "bg-brand-700 text-white" : tone === "jefe" ? "bg-brand-600 text-white" : "bg-surface-2 text-ink-soft"
          )}
        >
          {icon}
        </div>
        <span className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
          {label}
        </span>
      </div>
      <h3 className="mt-5 text-[22px] font-bold text-ink tracking-tight">{title}</h3>
      <p className="mt-2 text-[13.5px] text-ink-soft leading-relaxed">{description}</p>
      <ul className="mt-4 space-y-1.5">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
            <ChevronRight className="h-3.5 w-3.5 text-brand-600" />
            {b}
          </li>
        ))}
      </ul>
      <div
        className={cn(
          "mt-6 inline-flex items-center gap-2 text-[13px] font-semibold transition-all",
          tone === "seguridad" ? "text-brand-700" : "text-ink"
        )}
      >
        {cta}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}
