import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  FileText,
  MapPin,
  Calendar,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Mail,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ReportanteShell } from "@/design-system/layout/ReportanteShell";
import { Card } from "@/design-system/primitives/Card";
import { Button } from "@/design-system/primitives/Button";
import { Input } from "@/design-system/primitives/Input";
import { StagePill, PriorityPill, Pill, RiskPill } from "@/design-system/primitives/Pill";
import { EmptyState } from "@/design-system/primitives/Progress";
import { EVENT_LABELS, STAGE_STATUS, STAGE_LABELS } from "@/lib/types";
import { cn, formatDate, relativeTime, slaState, daysUntil } from "@/lib/utils";

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "activos", label: "Activos" },
  { id: "pendientes_info", label: "Con solicitudes" },
  { id: "cerrados", label: "Cerrados" },
] as const;

export function MyReports() {
  const { cases, currentUser } = useStore();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("todos");
  const [query, setQuery] = useState("");
  const nuevoId = params.get("nuevo");

  const myCases = useMemo(
    () => cases.filter((c) => c.reporter === "Carlos Núñez" || c.reporter === currentUser.name),
    [cases, currentUser]
  );

  const filtered = useMemo(() => {
    let list = myCases;
    if (filter === "activos") list = list.filter((c) => STAGE_STATUS[c.stage] === "abierto");
    if (filter === "cerrados") list = list.filter((c) => STAGE_STATUS[c.stage] === "cerrado");
    if (filter === "pendientes_info") list = list.filter((c) => c.pendingInfoRequest);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.station.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [myCases, filter, query]);

  return (
    <ReportanteShell>
      {nuevoId && (
        <Card className="mb-5 border-brand-200 bg-brand-50">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-700 text-white grid place-items-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-brand-900">Reporte registrado con éxito</p>
              <p className="text-[13px] text-brand-800/80 mt-0.5">
                Su caso <span className="font-mono font-semibold">{nuevoId}</span> fue creado. Seguridad
                Operativa recibió la notificación y lo revisará a la brevedad.
              </p>
            </div>
            <button onClick={() => setParams({})} className="text-brand-700 hover:text-brand-900 text-[12px] font-medium">
              Cerrar aviso
            </button>
          </div>
        </Card>
      )}

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-ink tracking-tight">Mis reportes</h1>
          <p className="text-[13px] text-ink-quiet mt-1">
            Consulte el estado de sus casos y responda solicitudes de información.
          </p>
        </div>
        <Link to="/reportante/nuevo">
          <Button size="sm"><Plus className="h-4 w-4" /> Nuevo reporte</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-line">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-8 px-3 rounded-md text-[12.5px] font-medium transition-colors",
                filter === f.id ? "bg-brand-700 text-white" : "text-ink-soft hover:bg-surface"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px] max-w-sm flex items-center gap-2 h-10 px-3 rounded-lg bg-white border border-line">
          <Search className="h-4 w-4 text-ink-faint shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, título o estación…"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={<FileText className="h-5 w-5" />}
          title="No se encontraron reportes"
          description="Pruebe con otro filtro o registre una nueva incidencia."
        />
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.map((c) => {
            const sla = slaState(c.slaDueDate, c.stage);
            const days = daysUntil(c.slaDueDate);
            return (
              <Card key={c.id} hover className="p-0 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12.5px] font-mono font-semibold text-brand-700">{c.id}</span>
                        <span className="text-[12px] text-ink-faint">·</span>
                        <span className="text-[12px] text-ink-soft">{EVENT_LABELS[c.type]}</span>
                        <span className="text-[12px] text-ink-faint">·</span>
                        <span className="text-[12px] text-ink-quiet flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-[15px] font-semibold text-ink mt-1 leading-snug">{c.title}</p>
                      <p className="text-[12px] text-ink-quiet mt-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {c.station} · {c.location}
                      </p>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
                      <StagePill stage={c.stage} />
                      <RiskPill risk={c.riskLevel} />
                    </div>
                  </div>

                  {c.pendingInfoRequest && (
                    <div className="mt-4 rounded-lg bg-warning-soft border border-warning/25 p-3.5">
                      <div className="flex items-start gap-2.5">
                        <Mail className="h-4 w-4 text-warning-ink shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12.5px] font-semibold text-warning-ink">
                            Seguridad Operativa solicita información
                          </p>
                          <p className="text-[12px] text-ink-soft mt-0.5">{c.pendingInfoRequest.question}</p>
                          <Link to="/reportante/notificaciones">
                            <Button variant="secondary" size="sm" className="mt-2.5">
                              Responder solicitud <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-line-soft">
                    <div className="flex items-center gap-3 text-[12px]">
                      {STAGE_STATUS[c.stage] === "cerrado" ? (
                        <span className="flex items-center gap-1.5 text-brand-700 font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Caso cerrado · {formatDate(c.closedAt ?? c.createdAt)}
                        </span>
                      ) : sla === "overdue" ? (
                        <Pill tone="critical" dot>SLA vencido {Math.abs(days)}d</Pill>
                      ) : sla === "soon" ? (
                        <Pill tone="warning" dot>SLA en {days}d</Pill>
                      ) : sla === "done" ? null : (
                        <Pill tone="neutral" dot>SLA {days}d</Pill>
                      )}
                      <span className="text-ink-faint">·</span>
                      <span className="text-ink-quiet">Última actividad {relativeTime(c.timeline[c.timeline.length - 1]?.at ?? c.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:hidden">
                      <StagePill stage={c.stage} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </ReportanteShell>
  );
}

