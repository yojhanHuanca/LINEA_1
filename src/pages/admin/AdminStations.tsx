import { useState } from "react";
import { Plus, Edit2, Power, PowerOff, GripVertical } from "lucide-react";
import { Button } from "@/design-system/primitives/Button";
import { Input, Field } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { useAdminStore } from "@/lib/adminStore";
import { cn } from "@/lib/utils";

export function AdminStations() {
  const { stations, createStation, updateStation, toggleStation, reorderStations, addAuditEntry } = useAdminStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const sorted = [...stations].sort((a, b) => a.order - b.order);

  const handleCreate = () => {
    if (!name.trim()) return;
    createStation(name);
    addAuditEntry("station_created", name);
    setCreateOpen(false);
    setName("");
  };

  const handleUpdate = () => {
    if (!editId || !name.trim()) return;
    updateStation(editId, name);
    addAuditEntry("station_updated", name);
    setEditId(null);
    setName("");
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const ids = sorted.map((s) => s.id);
    [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
    reorderStations(ids);
  };

  const moveDown = (idx: number) => {
    if (idx >= sorted.length - 1) return;
    const ids = sorted.map((s) => s.id);
    [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
    reorderStations(ids);
  };

  return (
    <div className="max-w-[900px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">Gestión de Estaciones</h1>
          <p className="text-[13px] text-ink-quiet mt-1">{stations.length} estaciones · Línea 1 del Metro de Lima</p>
        </div>
        <Button onClick={() => { setName(""); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Crear Estación
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th className="w-12 px-4 py-3 font-semibold text-ink-quiet text-center">#</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-quiet">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((station, i) => (
                <tr key={station.id} className="border-b border-line-soft hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 text-center text-ink-faint font-mono text-[12px]">{station.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button onClick={() => moveUp(i)} className="text-ink-faint hover:text-ink transition-colors" disabled={i === 0}><GripVertical className="h-3 w-3 rotate-180" /></button>
                        <button onClick={() => moveDown(i)} className="text-ink-faint hover:text-ink transition-colors" disabled={i === sorted.length - 1}><GripVertical className="h-3 w-3" /></button>
                      </div>
                      <span className="font-medium text-ink">{station.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", station.active ? "bg-brand-50 text-brand-700" : "bg-critical-soft text-critical-ink")}>
                      {station.active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditId(station.id); setName(station.name); }} className="h-7 w-7 rounded-md hover:bg-surface grid place-items-center transition-colors">
                        <Edit2 className="h-3.5 w-3.5 text-ink-quiet" />
                      </button>
                      <button onClick={() => { toggleStation(station.id); addAuditEntry(station.active ? "station_deleted" : "station_created", station.name); }} className={cn("h-7 w-7 rounded-md grid place-items-center transition-colors", station.active ? "hover:bg-critical-soft" : "hover:bg-brand-50")}>
                        {station.active ? <PowerOff className="h-3.5 w-3.5 text-critical" /> : <Power className="h-3.5 w-3.5 text-brand-600" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} size="sm" title="Crear Estación"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!name.trim()}>Crear</Button></div>}>
        <Field label="Nombre de la Estación" required><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: San Juan" /></Field>
      </Modal>

      <Modal open={!!editId} onClose={() => setEditId(null)} size="sm" title="Editar Estación"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="ghost" onClick={() => setEditId(null)}>Cancelar</Button><Button onClick={handleUpdate} disabled={!name.trim()}>Guardar</Button></div>}>
        <Field label="Nombre de la Estación" required><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
