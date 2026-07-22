import { useState } from "react";
import { Search, Filter, Clock, User, FileText } from "lucide-react";
import { Input, Select } from "@/design-system/primitives/Input";
import { useAdminStore } from "@/lib/adminStore";
import { cn } from "@/lib/utils";
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_TONE, type AuditAction } from "@/lib/adminTypes";

export function AdminAudit() {
  const { auditLog } = useAdminStore();
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("todos");

  const filtered = auditLog.filter((entry) => {
    const q = search.toLowerCase();
    const matchSearch = !q || entry.actor.toLowerCase().includes(q) || entry.target.toLowerCase().includes(q) || (entry.detail || "").toLowerCase().includes(q);
    const matchAction = filterAction === "todos" || entry.action === filterAction;
    return matchSearch && matchAction;
  });

  const toneMap: Record<string, string> = {
    brand: "bg-brand-50 text-brand-700",
    info: "bg-info-soft text-info-ink",
    warning: "bg-warning-soft text-warning-ink",
    critical: "bg-critical-soft text-critical-ink",
    neutral: "bg-surface-2 text-ink-quiet",
  };

  const uniqueActions = [...new Set(auditLog.map((e) => e.action))].sort();

  return (
    <div className="max-w-[1200px] space-y-6">
      <div>
        <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">Auditoría del Sistema</h1>
        <p className="text-[13px] text-ink-quiet mt-1">{auditLog.length} registros · Trazabilidad completa de acciones</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-line p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <Input
            placeholder="Buscar por actor, destino o detalle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="w-[200px]">
          <option value="todos">Todas las acciones</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{AUDIT_ACTION_LABELS[a as AuditAction]}</option>
          ))}
        </Select>
      </div>

      {/* Log */}
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet w-[180px]">Fecha/Hora</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Acción</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Actor</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Destino</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr key={entry.id} className={cn("border-b border-line-soft hover:bg-surface/50 transition-colors", i === filtered.length - 1 && "border-b-0")}>
                  <td className="px-4 py-3 text-ink-quiet font-mono text-[11.5px]">
                    {new Date(entry.at).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", toneMap[AUDIT_ACTION_TONE[entry.action]] || "")}>
                      {AUDIT_ACTION_LABELS[entry.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-ink-faint" />
                      <span className="text-ink font-medium">{entry.actor}</span>
                      <span className="text-[10px] text-ink-faint">({entry.actorRole})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{entry.target}</td>
                  <td className="px-4 py-3 text-ink-quiet">{entry.detail || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-ink-quiet">No se encontraron registros</div>
        )}
      </div>
    </div>
  );
}
