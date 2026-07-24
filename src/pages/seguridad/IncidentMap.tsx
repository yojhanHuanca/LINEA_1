import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock,
  FileText,
  MapPin,
  Radio,
  Shield,
  Train,
  TrendingUp,
  X,
} from "lucide-react";
import { Card } from "@/design-system/primitives/Card";
import { Pill, RiskPill, StagePill } from "@/design-system/primitives/Pill";
import { useStore } from "@/lib/store";
import {
  AREA_LABELS,
  EVENT_LABELS,
  STAGE_STATUS,
  TIPO_SOP_LABELS,
  SUBTIPO_SOP_LABELS,
  PROCEDENCIA_LABELS,
  ESTADO_HALLAZGO_LABELS,
  riskCategory,
  type Area,
  type CaseFile,
  type RiskLevel as DomainRiskLevel,
} from "@/lib/types";
import { cn, formatDateTime, relativeTime } from "@/lib/utils";

type VisualRisk = "bajo" | "medio" | "alto" | "critico";

interface StationCaseSummary {
  id: string;
  title: string;
  stage: CaseFile["stage"];
  riskLevel: DomainRiskLevel;
  createdAt: string;
  type: CaseFile["type"];
  sop?: CaseFile["sop"];
}

interface StationData {
  name: string;
  x: number;
  y: number;
  km: number;
  total: number;
  abiertos: number;
  cerrados: number;
  criticidad: number;
  riesgo: VisualRisk;
  ultimaIncidencia: string | null;
  area: Area | null;
  ultimoTipo: string;
  cumplimiento: number;
  recentCases: StationCaseSummary[];
  ultimoSOP?: CaseFile["sop"];
}

const RISK_CONFIG: Record<VisualRisk, { color: string; label: string; bg: string; text: string; ring: string }> = {
  bajo: { color: "#22c55e", label: "Bajo", bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200" },
  medio: { color: "#eab308", label: "Medio", bg: "bg-yellow-50", text: "text-yellow-700", ring: "ring-yellow-200" },
  alto: { color: "#f97316", label: "Alto", bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-200" },
  critico: { color: "#ef4444", label: "Crítico", bg: "bg-red-50", text: "text-red-700", ring: "ring-red-200" },
};

const VISUAL_RISK_ORDER: Record<VisualRisk, number> = {
  bajo: 0,
  medio: 1,
  alto: 2,
  critico: 3,
};

const STATION_COORDS: { name: string; x: number; y: number; km: number }[] = [
  { name: "Villa El Salvador", x: 60, y: 445, km: 0 },
  { name: "Parque Industrial", x: 88, y: 415, km: 2.2 },
  { name: "Pumacahua", x: 116, y: 385, km: 4.4 },
  { name: "Villa Maria", x: 146, y: 355, km: 6.5 },
  { name: "Maria Auxiliadora", x: 178, y: 325, km: 8.5 },
  { name: "San Juan", x: 212, y: 295, km: 10.5 },
  { name: "Atocongo", x: 248, y: 265, km: 12.5 },
  { name: "Jorge Chavez", x: 286, y: 235, km: 14.5 },
  { name: "Ayacucho", x: 326, y: 205, km: 16.5 },
  { name: "Cabitos", x: 368, y: 178, km: 18.5 },
  { name: "Angamos", x: 412, y: 155, km: 20.5 },
  { name: "San Borja Sur", x: 458, y: 136, km: 22.5 },
  { name: "La Cultura", x: 506, y: 122, km: 24.5 },
  { name: "Arriola", x: 556, y: 112, km: 26.5 },
  { name: "Gamarra", x: 606, y: 106, km: 28.0 },
  { name: "Miguel Grau", x: 656, y: 104, km: 29.5 },
  { name: "El Angel", x: 706, y: 106, km: 30.5 },
  { name: "Presbitero Maestro", x: 756, y: 112, km: 31.5 },
  { name: "Caja de Agua", x: 806, y: 122, km: 32.5 },
  { name: "Piramide del Sol", x: 856, y: 136, km: 33.0 },
  { name: "Los Jardines", x: 906, y: 155, km: 33.5 },
  { name: "Los Postes", x: 956, y: 178, km: 34.0 },
  { name: "San Carlos", x: 1006, y: 205, km: 34.5 },
  { name: "San Martin", x: 1056, y: 235, km: 35.0 },
  { name: "Santa Rosa", x: 1106, y: 265, km: 35.5 },
  { name: "Bayovar", x: 1156, y: 295, km: 34.0 },
];

const MAP_W = 1220;
const MAP_H = 500;

export function IncidentMap() {
  const { cases } = useStore();
  const [selected, setSelected] = useState<StationData | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const stations = useMemo(() => {
    return STATION_COORDS.map((coord) => buildStationData(coord, cases));
  }, [cases]);

  const highlightedStation = useMemo(() => {
    return [...stations].sort((a, b) => {
      if (b.abiertos !== a.abiertos) return b.abiertos - a.abiertos;
      if (b.criticidad !== a.criticidad) return b.criticidad - a.criticidad;
      return b.total - a.total;
    })[0] ?? null;
  }, [stations]);

  useEffect(() => {
    if (!stations.length) return;
    setSelected((current) => {
      if (current) {
        const fresh = stations.find((station) => station.name === current.name);
        if (fresh) return fresh;
      }
      return null;
    });
  }, [stations]);

  const linePath = useMemo(() => {
    const pts = STATION_COORDS;
    if (pts.length < 2) return "";
    // Construir path con curvas suaves tipo metropolitano (Cubic Bezier entre puntos)
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      // Puntos de control suaves
      const dx = curr.x - prev.x;
      const cp1x = prev.x + dx * 0.5;
      const cp1y = prev.y;
      const cp2x = prev.x + dx * 0.5;
      const cp2y = curr.y;
      d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${curr.x} ${curr.y}`;
    }
    return d;
  }, []);

  const kpis = useMemo(() => {
    const activas = stations.filter((station) => station.abiertos > 0).length;
    const incidenciasAbiertas = stations.reduce((sum, station) => sum + station.abiertos, 0);
    const totalCerrados = stations.reduce((sum, station) => sum + station.cerrados, 0);
    return {
      monitoreadas: stations.length,
      activas,
      incidenciasAbiertas,
      totalCerrados,
      topStation: highlightedStation,
    };
  }, [stations, highlightedStation]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <MapKpi
          icon={<Train className="h-4.5 w-4.5" />}
          label="Estaciones monitoreadas"
          value={kpis.monitoreadas}
          tone="brand"
          sub="Cobertura Línea 1"
        />
        <MapKpi
          icon={<Activity className="h-4.5 w-4.5" />}
          label="Estaciones con casos activos"
          value={kpis.activas}
          tone="info"
          sub="Seguimiento operativo"
        />
        <MapKpi
          icon={<AlertOctagon className="h-4.5 w-4.5" />}
          label="Casos abiertos"
          value={kpis.incidenciasAbiertas}
          tone="critical"
          sub="Pendientes de gestión"
        />
        <MapKpi
          icon={<CheckCircle2 className="h-4.5 w-4.5" />}
          label="Casos cerrados"
          value={kpis.totalCerrados}
          tone="brand"
          sub="Histórico consolidado"
        />
        <MapKpi
          icon={<TrendingUp className="h-4.5 w-4.5" />}
          label="Estación prioritaria"
          value={kpis.topStation?.name ?? "Sin datos"}
          tone={kpis.topStation?.riesgo === "critico" ? "critical" : "warning"}
          sub={kpis.topStation ? `${kpis.topStation.abiertos} casos activos` : "Sin incidencias"}
          isText
        />
      </div>

      <Card padded={false} className="overflow-hidden border-line-strong">
        <div className="relative">
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-brand-100 bg-gradient-to-r from-brand-50 to-white">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-100 border border-brand-200 grid place-items-center shrink-0">
                <Radio className="h-5 w-5 text-brand-700" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-ink tracking-tight">Tablero Operativo por Estación</p>
                <p className="text-[12px] text-ink-quiet mt-0.5">
                  Vista consolidada de Línea 1 · 26 estaciones · 34 km
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-2.5 py-1">
                <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
                <span className="text-[10.5px] font-semibold text-brand-800">ACTUALIZADO</span>
              </div>
              <p className="text-[10.5px] text-ink-quiet mt-1">Sin filtros manuales</p>
            </div>
            </div>

          {/* Contenedor relativo solo al SVG+popup */}
          <div className="relative bg-[#eef4f1]">
            <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full h-auto block" style={{ minHeight: 460 }}>
              <defs>
                <linearGradient id="lineGradL1" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14814a" />
                  <stop offset="50%" stopColor="#1f9d52" />
                  <stop offset="100%" stopColor="#38a860" />
                </linearGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#c4d4cc" strokeWidth="0.5" opacity="0.5" />
                </pattern>
                <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0c5431" floodOpacity="0.3" />
                </filter>
              </defs>

              <rect width={MAP_W} height={MAP_H} fill="url(#grid)" />
              {/* Río Rímac */}
              <path d="M 0 230 Q 400 260 800 220 T 1220 210" stroke="#b8d4e8" strokeWidth="18" fill="none" opacity="0.3" strokeLinecap="round" />
              <path d="M 0 230 Q 400 260 800 220 T 1220 210" stroke="#8ab4d8" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="6 4" />

              {/* Etiquetas de distritos */}
              <text x="60" y="478" fontSize="10" fill="#5a7a6a" fontWeight="700" letterSpacing="1">VILLA EL SALVADOR</text>
              <text x="340" y="320" fontSize="10" fill="#5a7a6a" fontWeight="700" letterSpacing="1">SURCO · SAN BORJA</text>
              <text x="750" y="85" fontSize="10" fill="#5a7a6a" fontWeight="700" letterSpacing="1">S.J. DE LURIGANCHO</text>
              <text x="1080" y="380" fontSize="10" fill="#5a7a6a" fontWeight="700" letterSpacing="1">BAYÓVAR</text>

              {/* Línea 1 —轨迹 con gradiente */}
              <path d={linePath} stroke="#14814a" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.12" />
              <path d={linePath} stroke="url(#lineGradL1)" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d={linePath} stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55" strokeDasharray="3 6" />

              {/* Marcadores de km */}
              <text x="60" y="468" fontSize="8" fill="#0c5431" fontWeight="600" opacity="0.5">km 0</text>
              <text x="1150" y="318" fontSize="8" fill="#0c5431" fontWeight="600" opacity="0.5">km 34</text>

              {stations.map((station, idx) => {
                const risk = RISK_CONFIG[station.riesgo];
                const isHovered = hovered === station.name;
                const isSelected = selected?.name === station.name;
                const hasActive = station.abiertos > 0;
                const radius = hasActive ? 8 + Math.min(station.abiertos, 4) : 6.5;
                const labelAbove = idx % 2 === 0;
                return (
                  <g
                    key={station.name}
                    onClick={() => setSelected(station)}
                    onMouseEnter={() => setHovered(station.name)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer"
                  >
                    {station.riesgo === "critico" && hasActive && (
                      <circle cx={station.x} cy={station.y} r={radius + 6} fill={risk.color} opacity="0.16">
                        <animate attributeName="r" values={`${radius + 4};${radius + 14};${radius + 4}`} dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.24;0.05;0.24" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={station.x} cy={station.y} r={radius + 4} fill={risk.color} opacity={hasActive ? 0.14 : 0.08} />
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={radius}
                      fill={hasActive ? risk.color : "#ffffff"}
                      stroke={risk.color}
                      strokeWidth={isSelected ? 3.5 : 2.5}
                      filter="url(#markerShadow)"
                      style={{
                        transform: isHovered || isSelected ? "scale(1.2)" : undefined,
                        transformOrigin: `${station.x}px ${station.y}px`,
                      }}
                    />
                    {/* Número de estación */}
                    <text x={station.x} y={station.y + 3.5} textAnchor="middle" fontSize="8.5" fontWeight="700" fill={hasActive ? "#ffffff" : risk.color}>
                      {idx + 1}
                    </text>
                    {/* Badge de casos abiertos */}
                    {hasActive && (
                      <g>
                        <rect x={station.x + radius + 3} y={station.y - 9} width={22} height={18} rx={5} fill={risk.color} opacity="0.98" />
                        <text x={station.x + radius + 14} y={station.y + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">
                          {station.abiertos}
                        </text>
                      </g>
                    )}
                    {/* Etiqueta de nombre (siempre visible, alternando arriba/abajo) */}
                    <text
                      x={station.x}
                      y={labelAbove ? station.y - radius - 8 : station.y + radius + 14}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight={isHovered || isSelected ? "700" : "500"}
                      fill={isSelected ? "#0c5431" : "#4a6a5a"}
                      style={{ pointerEvents: "none" }}
                    >
                      {station.name.length > 18 ? station.name.slice(0, 17) + "…" : station.name}
                    </text>
                    {/* km */}
                    <text
                      x={station.x}
                      y={labelAbove ? station.y - radius - 20 : station.y + radius + 26}
                      textAnchor="middle"
                      fontSize="7.5"
                      fill="#7a9a8a"
                      opacity="0.6"
                      style={{ pointerEvents: "none" }}
                    >
                      km {station.km}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Popup flotante al lado del marcador clickeado */}
            {selected && (
              <div
                className="absolute z-30 w-[320px] animate-[fadeIn_0.18s_var(--ease-out)]"
                style={{
                  left: `calc(${(selected.x / MAP_W) * 100}% + 18px)`,
                  top: `calc(${(selected.y / MAP_H) * 100}% - 20px)`,
                  transform: selected.x > MAP_W * 0.65 ? "translateX(calc(-100% - 36px))" : undefined,
                }}
              >
                <StationPanel station={selected} onClose={() => setSelected(null)} />
              </div>
            )}

            <div className="flex items-center gap-4 px-4 py-3 bg-white border-t border-line">
              <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-wider">Lectura por estación</span>
              {(Object.keys(RISK_CONFIG) as VisualRisk[]).map((riskKey) => (
                <div key={riskKey} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_CONFIG[riskKey].color }} />
                  <span className="text-[11px] text-ink-soft">{RISK_CONFIG[riskKey].label}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-700" />
                <span className="text-[11px] text-ink-quiet">Seleccione una estación para revisar su detalle</span>
              </div>
            </div>
          </div>
          </div>

        </Card>

    </div>
  );
}

function StationPanel({ station, onClose }: { station: StationData; onClose: () => void }) {
  const risk = RISK_CONFIG[station.riesgo];
  const latestCase = station.recentCases[0];

  return (
    <Card padded={false} className="overflow-hidden border-line-strong shadow-[0_8px_30px_rgba(12,84,49,0.18)] max-h-[420px] overflow-y-auto">
      <div className={cn("px-5 py-4 border-b border-line-soft relative", risk.bg)}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-7 w-7 rounded-lg grid place-items-center text-ink-quiet hover:bg-white/70 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0 ring-2", risk.bg, risk.text, risk.ring)}>
            <Train className="h-6 w-6" />
          </div>
          <div className="min-w-0 pr-8">
            <p className="text-[17px] font-bold text-ink tracking-tight">{station.name}</p>
            <p className="text-[12px] text-ink-quiet mt-0.5">Detalle operativo de estación · Línea 1</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill tone={station.riesgo === "critico" ? "critical" : station.riesgo === "alto" ? "warning" : station.riesgo === "medio" ? "info" : "brand"}>
                Riesgo {risk.label}
              </Pill>
              <Pill tone="neutral">{station.area ? AREA_LABELS[station.area] : "Sin área dominante"}</Pill>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-4 gap-2.5">
          <StatBox label="Total" value={station.total} icon={<FileText className="h-3.5 w-3.5" />} />
          <StatBox label="Abiertos" value={station.abiertos} icon={<AlertOctagon className="h-3.5 w-3.5" />} tone="critical" />
          <StatBox label="Cerrados" value={station.cerrados} icon={<CheckCircle2 className="h-3.5 w-3.5" />} tone="brand" />
          <StatBox label="Cumpl." value={station.cumplimiento} suffix="%" icon={<Shield className="h-3.5 w-3.5" />} tone="neutral" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider">Nivel de atención</p>
            <span className={cn("text-[11px] font-bold", risk.text)}>{risk.label}</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${station.riesgo === "critico" ? 96 : station.riesgo === "alto" ? 72 : station.riesgo === "medio" ? 48 : 18}%`,
                background: risk.color,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-line-soft p-4">
          <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-3">Lectura de estación</p>
          <div className="space-y-2.5">
            <InfoRow icon={<CircleDot className="h-3.5 w-3.5" />} label="Último tipo registrado" value={station.ultimoTipo} />
            <InfoRow icon={<Clock className="h-3.5 w-3.5" />} label="Última actualización" value={station.ultimaIncidencia ? formatDateTime(station.ultimaIncidencia) : "Sin registros"} />
            <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Área con mayor incidencia" value={station.area ? AREA_LABELS[station.area] : "Sin asignación"} />
            {station.ultimoSOP && (
              <>
                <div className="h-px bg-line-soft my-2" />
                <InfoRow icon={<FileText className="h-3.5 w-3.5" />} label="Tipo SOP" value={TIPO_SOP_LABELS[station.ultimoSOP.tipoSOP]} />
                <InfoRow icon={<AlertOctagon className="h-3.5 w-3.5" />} label="Subtipo" value={SUBTIPO_SOP_LABELS[station.ultimoSOP.subtipoSOP]} />
                <InfoRow icon={<Building2 className="h-3.5 w-3.5" />} label="Procedencia" value={PROCEDENCIA_LABELS[station.ultimoSOP.procedencia]} />
                <InfoRow icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Estado hallazgo" value={ESTADO_HALLAZGO_LABELS[station.ultimoSOP.estadoHallazgo]} />
                {station.ultimoSOP.peligro && <InfoRow icon={<AlertOctagon className="h-3.5 w-3.5" />} label="Peligro" value={station.ultimoSOP.peligro} />}
                {station.ultimoSOP.consecuencia && <InfoRow icon={<AlertOctagon className="h-3.5 w-3.5" />} label="Consecuencia" value={station.ultimoSOP.consecuencia} />}
              </>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider">Casos recientes</p>
            <Link to={`/seguridad/casos?q=${encodeURIComponent(station.name)}`} className="text-[11.5px] font-medium text-brand-700 hover:text-brand-800">
              Ver todos
            </Link>
          </div>
          {station.recentCases.length === 0 ? (
            <div className="rounded-xl bg-surface border border-line p-4 text-center">
              <p className="text-[12.5px] font-medium text-ink">Sin incidencias registradas</p>
              <p className="text-[11.5px] text-ink-quiet mt-1">Esta estación no tiene expedientes en el histórico actual.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {station.recentCases.map((item) => (
                <Link
                  key={item.id}
                  to={`/seguridad/casos/${item.id}`}
                  className="block rounded-xl border border-line p-3.5 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] font-mono font-semibold text-brand-700">{item.id}</p>
                      <p className="text-[13px] font-semibold text-ink mt-1 truncate">{item.title}</p>
                      <p className="text-[11px] text-ink-quiet mt-1">{relativeTime(item.createdAt)}</p>
                      {item.sop && (
                        <p className="text-[10.5px] text-ink-faint mt-1">
                          {TIPO_SOP_LABELS[item.sop.tipoSOP]} · {SUBTIPO_SOP_LABELS[item.sop.subtipoSOP]}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <RiskPill risk={item.riskLevel} />
                      <StagePill stage={item.stage} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Link
            to={`/seguridad/casos?q=${encodeURIComponent(station.name)}`}
            className="h-10 rounded-xl bg-brand-700 text-white text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-brand-800 transition-colors"
          >
            Ver expedientes
            <ChevronRight className="h-4 w-4" />
          </Link>
          {latestCase ? (
            <Link
              to={`/seguridad/casos/${latestCase.id}`}
              className="h-10 rounded-xl border border-line text-[12.5px] font-semibold inline-flex items-center justify-center gap-2 text-ink hover:border-brand-300 hover:text-brand-800 transition-colors"
            >
              Último expediente
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : (
            <div className="h-10 rounded-xl border border-line bg-surface text-[12px] text-ink-faint inline-flex items-center justify-center">
              Sin expediente
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function buildStationData(coord: { name: string; x: number; y: number; km: number }, cases: CaseFile[]): StationData {
  const stationCases = cases.filter((item) => item.station === coord.name);
  const openCases = stationCases.filter((item) => STAGE_STATUS[item.stage] === "abierto");
  const closedCases = stationCases.filter((item) => STAGE_STATUS[item.stage] === "cerrado");

  const latestCase = [...stationCases].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  )[0];

  const dominantArea = getDominantArea(openCases.length ? openCases : stationCases);
  const topRiskCase = [...(openCases.length ? openCases : stationCases)].sort((a, b) => {
    const riskDiff = visualRiskScore(fromDomainRisk(b.riskLevel)) - visualRiskScore(fromDomainRisk(a.riskLevel));
    if (riskDiff !== 0) return riskDiff;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  })[0];

  const visualRisk = topRiskCase ? fromDomainRisk(topRiskCase.riskLevel) : "bajo";
  const recentCases = [...stationCases]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.title,
      stage: item.stage,
      riskLevel: item.riskLevel,
      createdAt: item.createdAt,
      type: item.type,
      sop: item.sop,
    }));

  return {
    ...coord,
    total: stationCases.length,
    abiertos: openCases.length,
    cerrados: closedCases.length,
    criticidad: openCases.filter((item) => fromDomainRisk(item.riskLevel) === "critico").length,
    riesgo: visualRisk,
    ultimaIncidencia: latestCase?.createdAt ?? null,
    area: dominantArea,
    ultimoTipo: latestCase ? EVENT_LABELS[latestCase.type] : "Sin incidencias registradas",
    cumplimiento: stationCases.length ? Math.round((closedCases.length / stationCases.length) * 100) : 100,
    recentCases,
    ultimoSOP: latestCase?.sop,
  };
}

function fromDomainRisk(risk: DomainRiskLevel): VisualRisk {
  const category = riskCategory(risk);
  if (category === "inaceptable") return "critico";
  if (category === "no_deseable") return "alto";
  if (category === "aceptable_revision") return "medio";
  return "bajo";
}

function visualRiskScore(risk: VisualRisk): number {
  return VISUAL_RISK_ORDER[risk];
}

function getDominantArea(cases: CaseFile[]): Area | null {
  if (!cases.length) return null;
  const counts = new Map<Area, number>();
  cases.forEach((item) => counts.set(item.area, (counts.get(item.area) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function MapKpi({
  icon,
  label,
  value,
  tone,
  sub,
  isText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: "info" | "critical" | "brand" | "warning";
  sub: string;
  isText?: boolean;
}) {
  const tones = {
    info: "bg-info-soft text-info-ink",
    critical: "bg-critical-soft text-critical-ink",
    brand: "bg-brand-50 text-brand-700",
    warning: "bg-warning-soft text-warning-ink",
  };

  return (
    <Card className="p-4 flex items-center gap-3.5">
      <div className={cn("h-11 w-11 rounded-xl grid place-items-center shrink-0", tones[tone])}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold text-ink-quiet uppercase tracking-wider">{label}</p>
        <p className={cn("font-bold text-ink leading-tight truncate", isText ? "text-[14px]" : "text-[22px] tabular-nums")}>{value}</p>
        <p className="text-[10.5px] text-ink-faint mt-0.5">{sub}</p>
      </div>
    </Card>
  );
}

function StatBox({
  label,
  value,
  icon,
  tone = "neutral",
  suffix = "",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "critical" | "brand" | "neutral";
  suffix?: string;
}) {
  const tones = {
    critical: "text-critical",
    brand: "text-brand-700",
    neutral: "text-ink",
  };

  return (
    <div className="rounded-xl border border-line-soft p-3 text-center bg-white">
      <div className={cn("flex items-center justify-center gap-1 text-ink-faint mb-1", tones[tone])}>{icon}</div>
      <p className={cn("text-[20px] font-bold tabular-nums leading-none", tones[tone])}>
        {value}
        {suffix}
      </p>
      <p className="text-[10.5px] text-ink-quiet mt-1">{label}</p>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="text-ink-faint shrink-0">{icon}</span>
      <span className="text-ink-quiet">{label}:</span>
      <span className="text-ink font-medium truncate">{value}</span>
    </div>
  );
}
