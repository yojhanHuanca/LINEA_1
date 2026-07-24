import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  ArrowRight,
  FileSearch,
  Filter,
  Download,
  Inbox,
  Clock,
  Send,
  Activity,
  CheckCircle2,
  FolderKanban,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { SegShell } from "@/design-system/layout/SegShell";
import { Card } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { PriorityPill, StagePill, Pill, RiskPill } from "@/design-system/primitives/Pill";
import { EmptyState } from "@/design-system/primitives/Progress";
import {
  AREA_LABELS,
  EVENT_LABELS,
  PRIORITY_LABELS,
  STAGE_LABELS,
  type Stage,
} from "@/lib/types";
import { cn, formatDate, relativeTime, slaState, daysUntil, PRIORITY_RANK } from "@/lib/utils";

const FILTER_TABS: { id: string; label: string; stages: Stage[] | "all" }[] = [
  { id: "todos", label: "Todos", stages: "all" },
  { id: "nuevos", label: "Recepción", stages: ["recepcion", "evaluacion"] },
  { id: "pendientes", label: "Pendientes", stages: ["pendiente_info", "plan_accion"] },
  { id: "derivados", label: "Investigación", stages: ["investigacion"] },
  { id: "seguimiento", label: "Ejecución y Verificación", stages: ["ejecucion", "verificacion"] },
  { id: "cerrados", label: "Cerrados", stages: ["cierre", "rechazado"] },
];

const TYPE_TONE: Record<string, string> = {
  accidente: "bg-critical-soft text-critical-ink",
  incidente: "bg-warning-soft text-warning-ink",
  falla_operativa: "bg-info-soft text-info-ink",
  condicion_insegura: "bg-warning-soft text-warning-ink",
  acto_inseguro: "bg-warning-soft text-warning-ink",
  observacion: "bg-brand-50 text-brand-800",
  riesgo: "bg-critical-soft text-critical-ink",
  hallazgo: "bg-info-soft text-info-ink",
  incumplimiento: "bg-critical-soft text-critical-ink",
  otro: "bg-surface-2 text-ink-soft",
};

export function CaseList() {
  const { cases } = useStore();
  const [params, setParams] = useSearchParams();
  const initialFilter = params.get("filtro") ?? "todos";
  const [tab, setTab] = useState(initialFilter);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [sort, setSort] = useState<"recent" | "priority" | "sla">("recent");

  const setFilter = (id: string) => {
    setTab(id);
    setParams(id === "todos" ? {} : { filtro: id });
  };

  const filtered = useMemo(() => {
    const cfg = FILTER_TABS.find((f) => f.id === tab) ?? FILTER_TABS[0];
    let list = cases;
    if (cfg.stages !== "all") list = list.filter((c) => cfg.stages!.includes(c.stage));
    if (areaFilter) list = list.filter((c) => c.area === areaFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.station.toLowerCase().includes(q) ||
          c.reporter.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === "priority") {
      sorted.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    } else if (sort === "sla") {
      sorted.sort((a, b) => +new Date(a.slaDueDate) - +new Date(b.slaDueDate));
    } else {
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return sorted;
  }, [cases, tab, areaFilter, query, sort]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    FILTER_TABS.forEach((f) => {
      if (f.stages === "all") map[f.id] = cases.length;
      else map[f.id] = cases.filter((c) => f.stages!.includes(c.stage)).length;
    });
    return map;
  }, [cases]);

  return (
    <SegShell>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-ink tracking-tight">Gestión de Casos</h1>
          <p className="text-[13px] text-ink-quiet mt-1">
            Todos los casos del sistema. Abra el expediente para gestionar el flujo completo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Exportar lista
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-line overflow-x-auto scrollbar-none">
          {FILTER_TABS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-9 px-3.5 rounded-lg text-[12.5px] font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                tab === f.id ? "bg-brand-700 text-white shadow-sm" : "text-ink-soft hover:bg-surface"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "tabular-nums text-[10.5px] px-1.5 rounded-full",
                  tab === f.id ? "bg-white/20" : "bg-surface-2 text-ink-quiet"
                )}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mt-4 p-3 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 h-9 px-3 rounded-lg bg-surface border border-line">
          <Search className="h-4 w-4 text-ink-faint shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, título, estación o reportante…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
          />
        </div>
        <div className="flex items-center gap-2">
          <FilterSelect
            value={areaFilter}
            onChange={setAreaFilter}
            options={[{ value: "", label: "Todas las áreas" }, ...Object.entries(AREA_LABELS).map(([value, label]) => ({ value, label }))]}
          />
          <FilterSelect
            value={sort}
            onChange={(v) => setSort(v as typeof sort)}
            options={[
              { value: "recent", label: "Más recientes" },
              { value: "priority", label: "Por prioridad" },
              { value: "sla", label: "Por SLA" },
            ]}
          />
        </div>
      </Card>

      {/* Table */}
      <Card padded={false} className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface/60 border-b border-line">
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[120px]">Código</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[120px]">Tipo</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint">Título</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[130px]">Reportante</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[120px]">Estación</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[130px]">Área</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[90px]">Prioridad</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[120px]">Estado</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[90px]">SLA</th>
                <th className="px-4 py-3 text-[11px] font-semibold tracking-wide uppercase text-ink-faint w-[100px] text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {filtered.map((c) => {
                const sla = slaState(c.slaDueDate, c.stage);
                const days = daysUntil(c.slaDueDate);
                return (
                  <tr key={c.id} className="group hover:bg-surface/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[12px] font-semibold text-brand-700">{c.id}</span>
                      <p className="text-[10.5px] text-ink-faint mt-0.5">{formatDate(c.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex px-2 py-1 rounded-md text-[11px] font-medium", TYPE_TONE[c.type])}>
                        {EVENT_LABELS[c.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[320px]">
                      <p className="text-[13px] font-semibold text-ink truncate">{c.title}</p>
                      <p className="text-[11px] text-ink-quiet truncate mt-0.5">{c.location}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-ink-soft truncate">{c.reporter}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[12.5px] text-ink-soft truncate">{c.station}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] text-ink-soft">{AREA_LABELS[c.area]}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <RiskPill risk={c.riskLevel} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StagePill stage={c.stage} />
                    </td>
                    <td className="px-4 py-3.5">
                      {c.stage === "cierre" ? (
                        <span className="text-[11.5px] text-ink-faint">Cerrado</span>
                      ) : sla === "overdue" ? (
                        <Pill tone="critical" dot>Vencido {Math.abs(days)}d</Pill>
                      ) : sla === "soon" ? (
                        <Pill tone="warning" dot>{days}d</Pill>
                      ) : (
                        <span className="text-[11.5px] tabular-nums text-ink-quiet">{days}d</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link to={`/seguridad/casos/${c.id}`}>
                        <Button variant="outline" size="sm" className="opacity-80 group-hover:opacity-100">
                          Expediente <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            className="m-4 border-0 bg-transparent"
            icon={<FolderKanban className="h-5 w-5" />}
            title="No hay casos en este filtro"
            description="Ajuste los filtros o el término de búsqueda para ver resultados."
          />
        )}
      </Card>

      <p className="mt-3 text-[11.5px] text-ink-quiet">
        Mostrando {filtered.length} de {cases.length} casos · Última actualización {relativeTime(new Date().toISOString())}
      </p>
    </SegShell>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-3 pr-8 rounded-lg bg-white border border-line text-[12.5px] text-ink-soft appearance-none cursor-pointer hover:border-line-strong focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/15"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23767f79' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          backgroundPosition: "right 8px center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

