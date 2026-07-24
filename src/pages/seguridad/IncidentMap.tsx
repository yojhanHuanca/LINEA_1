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
} from "lucide-react";
import { Card } from "@/design-system/primitives/Card";
import { Pill, RiskPill, StagePill } from "@/design-system/primitives/Pill";
import { useStore } from "@/lib/store";
import {
  AREA_LABELS,
  EVENT_LABELS,
  STAGE_STATUS,
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
}

interface StationData {
  name: string;
  x: number;
  y: number;
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

const STATION_COORDS: { name: string; x: number; y: number }[] = [
  { name: "San Juan", x: 90, y: 430 },
  { name: "Atocongo", x: 130, y: 390 },
  { name: "Pamplona", x: 170, y: 350 },
  { name: "Matellini", x: 210, y: 315 },
  { name: "Puno", x: 245, y: 285 },
  { name: "Parque Industrial", x: 280, y: 258 },
  { name: "Pueblo Libre", x: 315, y: 232 },
  { name: "Oscar R. Benavides", x: 355, y: 208 },
  { name: "Cabitos", x: 400, y: 185 },
  { name: "Ayacucho", x: 445, y: 165 },
  { name: "Javier Prado", x: 495, y: 145 },
  { name: "El Ángel", x: 545, y: 128 },
  { name: "Gamarra", x: 590, y: 116 },
  { name: "Caja de Agua", x: 635, y: 108 },
  { name: "Pirámide del Sol", x: 680, y: 102 },
  { name: "Estación Central", x: 725, y: 98 },
];

const MAP_W = 800;
const MAP_H = 480;

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
      return highlightedStation ?? stations[0];
    });
  }, [stations, highlightedStation]);

  const linePath = useMemo(() => {
    const pts = STATION_COORDS;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cx = (prev.x + curr.x) / 2;
      const cy = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x} ${prev.y} ${cx} ${cy}`;
    }
    d += ` T ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
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

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <Card padded={false} className="overflow-hidden border-line-strong">
          <div className="relative bg-[#091828]">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#0d2238] to-[#091828]">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-600/15 border border-brand-500/25 grid place-items-center shrink-0">
                  <Radio className="h-5 w-5 text-brand-300" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-white tracking-tight">Tablero Operativo por Estación</p>
                  <p className="text-[12px] text-slate-300 mt-0.5">
                    Vista consolidada de Línea 1. Cada estación refleja los casos registrados en el sistema.
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10.5px] font-semibold text-emerald-200">ACTUALIZADO</span>
                </div>
                <p className="text-[10.5px] text-slate-400 mt-1">Sin filtros manuales</p>
              </div>
            </div>

            <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full h-auto block" style={{ minHeight: 420 }}>
              <defs>
                <linearGradient id="lineGradL1" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#14814a" />
                  <stop offset="50%" stopColor="#1f9d52" />
                  <stop offset="100%" stopColor="#38a860" />
                </linearGradient>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e3a5f" strokeWidth="0.5" opacity="0.3" />
                </pattern>
                <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.45" />
                </filter>
              </defs>

              <rect width={MAP_W} height={MAP_H} fill="url(#grid)" />
              <path d="M 0 220 Q 200 240 400 200 T 800 180" stroke="#1e3a5f" strokeWidth="14" fill="none" opacity="0.25" strokeLinecap="round" />
              <path d="M 0 220 Q 200 240 400 200 T 800 180" stroke="#2a5a8a" strokeWidth="1" fill="none" opacity="0.15" strokeDasharray="6 4" />

              <text x="70" y="465" fontSize="9" fill="#46617e" fontWeight="600" letterSpacing="1">VILLA EL SALVADOR</text>
              <text x="330" y="270" fontSize="9" fill="#46617e" fontWeight="600" letterSpacing="1">SURCO · SAN BORJA</text>
              <text x="560" y="80" fontSize="9" fill="#46617e" fontWeight="600" letterSpacing="1">S.J. DE LURIGANCHO</text>

              <path d={linePath} stroke="#14814a" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.15" />
              <path d={linePath} stroke="url(#lineGradL1)" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d={linePath} stroke="#fff" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.16" strokeDasharray="3 6" />

              {stations.map((station) => {
                const risk = RISK_CONFIG[station.riesgo];
                const isHovered = hovered === station.name;
                const isSelected = selected?.name === station.name;
                const hasActive = station.abiertos > 0;
                const radius = hasActive ? 7 + Math.min(station.abiertos, 4) : station.total > 0 ? 6 : 4.5;
                return (
                  <g
                    key={station.name}
                    onClick={() => setSelected(station)}
                    onMouseEnter={() => setHovered(station.name)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer"
                  >
                    {station.riesgo === "critico" && hasActive && (
                      <circle cx={station.x} cy={station.y} r={radius + 6} fill={risk.color} opacity="0.14">
                        <animate attributeName="r" values={`${radius + 4};${radius + 12};${radius + 4}`} dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.2;0.04;0.2" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={station.x} cy={station.y} r={radius + 4} fill={risk.color} opacity={hasActive ? 0.12 : 0.06} />
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r={radius}
                      fill={hasActive ? risk.color : station.total > 0 ? "#0f253c" : "#091828"}
                      stroke={risk.color}
                      strokeWidth={isSelected ? 3 : 2.4}
                      filter="url(#markerShadow)"
                      style={{
                        transform: isHovered || isSelected ? "scale(1.18)" : undefined,
                        transformOrigin: `${station.x}px ${station.y}px`,
                      }}
                    />
                    <circle cx={station.x} cy={station.y} r={2} fill="#fff" opacity={hasActive || station.total > 0 ? 0.9 : 0.45} />
                    {hasActive && (
                      <g>
                        <rect x={station.x + radius + 2} y={station.y - 8} width={20} height={16} rx={4} fill={risk.color} opacity="0.98" />
                        <text x={station.x + radius + 12} y={station.y + 3} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff">
                          {station.abiertos}
                        </text>
                      </g>
                    )}
                    {(isHovered || isSelected) && (
                      <g style={{ pointerEvents: "none" }}>
                        <rect
                          x={station.x - station.name.length * 3.2 - 8}
                          y={station.y - radius - 24}
                          width={station.name.length * 6.4 + 16}
                          height={18}
                          rx={5}
                          fill="#091828"
                          stroke={risk.color}
                          strokeWidth="0.7"
                          opacity="0.98"
                        />
                        <text x={station.x} y={station.y - radius - 12} textAnchor="middle" fontSize="9" fontWeight="600" fill="#fff">
                          {station.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="flex items-center gap-4 px-4 py-3 bg-[#091828] border-t border-[#17314a]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Lectura por estación</span>
              {(Object.keys(RISK_CONFIG) as VisualRisk[]).map((riskKey) => (
                <div key={riskKey} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: RISK_CONFIG[riskKey].color }} />
                  <span className="text-[11px] text-slate-300">{RISK_CONFIG[riskKey].label}</span>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-brand-300" />
                <span className="text-[11px] text-slate-400">Seleccione una estación para revisar su detalle</span>
              </div>
            </div>
          </div>
        </Card>

        {selected && <StationPanel station={selected} />}
      </div>

      <Card>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-faint">Resumen institucional</p>
            <h3 className="text-[18px] font-bold text-ink tracking-tight mt-1">Estado de las estaciones de Línea 1</h3>
          </div>
          <Pill tone="neutral">{stations.filter((station) => station.total > 0).length} estaciones con histórico</Pill>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {stations.map((station) => (
            <button
              key={station.name}
              onClick={() => setSelected(station)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all bg-white hover:shadow-[var(--shadow-card-hover)]",
                selected?.name === station.name ? "border-brand-300 ring-1 ring-brand-200" : "border-line"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink truncate">{station.name}</p>
                  <p className="text-[11.5px] text-ink-quiet mt-0.5">
                    {station.area ? AREA_LABELS[station.area] : "Sin casos registrados"}
                  </p>
                </div>
                <span
                  className={cn(
                    "h-9 w-9 rounded-xl grid place-items-center shrink-0",
                    RISK_CONFIG[station.riesgo].bg,
                    RISK_CONFIG[station.riesgo].text
                  )}
                >
                  <Train className="h-4.5 w-4.5" />
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat label="Abiertos" value={station.abiertos} tone={station.abiertos > 0 ? "critical" : "neutral"} />
                <MiniStat label="Cerrados" value={station.cerrados} tone="brand" />
                <MiniStat label="Total" value={station.total} tone="neutral" />
              </div>

              <div className="mt-3 flex items-center justify-between text-[11.5px]">
                <span className={cn("font-semibold", RISK_CONFIG[station.riesgo].text)}>
                  Riesgo {RISK_CONFIG[station.riesgo].label}
                </span>
                <span className="text-ink-faint">
                  {station.ultimaIncidencia ? relativeTime(station.ultimaIncidencia) : "Sin actividad"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StationPanel({ station }: { station: StationData }) {
  const risk = RISK_CONFIG[station.riesgo];
  const latestCase = station.recentCases[0];

  return (
    <Card padded={false} className="overflow-hidden border-line-strong">
      <div className={cn("px-5 py-4 border-b border-line-soft", risk.bg)}>
        <div className="flex items-start gap-3">
          <div className={cn("h-12 w-12 rounded-xl grid place-items-center shrink-0 ring-2", risk.bg, risk.text, risk.ring)}>
            <Train className="h-6 w-6" />
          </div>
          <div className="min-w-0">
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

function buildStationData(coord: { name: string; x: number; y: number }, cases: CaseFile[]): StationData {
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

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "critical" | "brand" | "neutral";
}) {
  const tones = {
    critical: "text-critical",
    brand: "text-brand-700",
    neutral: "text-ink",
  };

  return (
    <div className="rounded-xl bg-surface border border-line p-2.5 text-center">
      <p className={cn("text-[16px] font-bold tabular-nums leading-none", tones[tone])}>{value}</p>
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
