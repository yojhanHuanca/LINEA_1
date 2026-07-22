import { useState } from "react";
import { Plus, Edit2, Power, PowerOff, Check, X } from "lucide-react";
import { Button } from "@/design-system/primitives/Button";
import { Input, Field } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { useAdminStore } from "@/lib/adminStore";
import { cn } from "@/lib/utils";

export function AdminAreas() {
  const { areas, createArea, updateArea, toggleArea, addAuditEntry } = useAdminStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", head: "" });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createArea({ key: form.name.toLowerCase().replace(/\s+/g, "_") as any, name: form.name, head: form.head, active: true });
    addAuditEntry("area_created", form.name);
    setCreateOpen(false);
    setForm({ name: "", head: "" });
  };

  const handleUpdate = () => {
    if (!editId || !form.name.trim()) return;
    updateArea(editId, { name: form.name, head: form.head });
    addAuditEntry("area_updated", form.name);
    setEditId(null);
    setForm({ name: "", head: "" });
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">Gestión de Áreas</h1>
          <p className="text-[13px] text-ink-quiet mt-1">{areas.length} áreas · {areas.filter((a) => a.active).length} activas</p>
        </div>
        <Button onClick={() => { setForm({ name: "", head: "" }); setCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          Crear Área
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {areas.map((area) => (
          <div key={area.id} className={cn("bg-white rounded-xl border p-5 transition-all", area.active ? "border-line" : "border-line-strong opacity-60")}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink">{area.name}</p>
                <p className="text-[12px] text-ink-quiet mt-0.5">Jefe: {area.head}</p>
                <p className="text-[11px] text-ink-faint mt-1 font-mono">key: {area.key}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditId(area.id); setForm({ name: area.name, head: area.head }); }} className="h-7 w-7 rounded-md hover:bg-surface grid place-items-center transition-colors">
                  <Edit2 className="h-3.5 w-3.5 text-ink-quiet" />
                </button>
                <button onClick={() => { toggleArea(area.id); addAuditEntry(area.active ? "area_deleted" : "area_created", area.name); }} className={cn("h-7 w-7 rounded-md grid place-items-center transition-colors", area.active ? "hover:bg-critical-soft" : "hover:bg-brand-50")}>
                  {area.active ? <PowerOff className="h-3.5 w-3.5 text-critical" /> : <Power className="h-3.5 w-3.5 text-brand-600" />}
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", area.active ? "bg-brand-50 text-brand-700" : "bg-critical-soft text-critical-ink")}>
                {area.active ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} size="md" title="Crear Área"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!form.name.trim()}>Crear</Button></div>}>
        <div className="space-y-4 py-2">
          <Field label="Nombre del Área" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del área" /></Field>
          <Field label="Jefe del Área"><Input value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} placeholder="Nombre del jefe responsable" /></Field>
        </div>
      </Modal>

      <Modal open={!!editId} onClose={() => setEditId(null)} size="md" title="Editar Área"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="ghost" onClick={() => setEditId(null)}>Cancelar</Button><Button onClick={handleUpdate} disabled={!form.name.trim()}>Guardar</Button></div>}>
        <div className="space-y-4 py-2">
          <Field label="Nombre del Área" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Jefe del Área"><Input value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}
