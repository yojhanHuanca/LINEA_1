import { useState } from "react";
import { Plus, Edit2, Power, PowerOff, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/design-system/primitives/Button";
import { Input, Field } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { useAdminStore } from "@/lib/adminStore";
import { cn } from "@/lib/utils";
import { CATALOG_LABELS, type CatalogKey } from "@/lib/adminTypes";

export function AdminCatalogs() {
  const { catalogs, getCatalogItems, createCatalogItem, updateCatalogItem, toggleCatalogItem, addAuditEntry } = useAdminStore();
  const [activeCatalog, setActiveCatalog] = useState<CatalogKey>("tipo_sop");
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ value: "", label: "" });

  const items = getCatalogItems(activeCatalog);

  const catalogKeys = Object.keys(CATALOG_LABELS) as CatalogKey[];

  const handleCreate = () => {
    if (!form.value.trim() || !form.label.trim()) return;
    createCatalogItem(activeCatalog, form.value, form.label);
    addAuditEntry("catalog_created", form.label, CATALOG_LABELS[activeCatalog]);
    setCreateOpen(false);
    setForm({ value: "", label: "" });
  };

  const handleUpdate = () => {
    if (!editId || !form.label.trim()) return;
    updateCatalogItem(editId, { label: form.label, value: form.value });
    addAuditEntry("catalog_updated", form.label, CATALOG_LABELS[activeCatalog]);
    setEditId(null);
    setForm({ value: "", label: "" });
  };

  return (
    <div className="max-w-[1200px] flex gap-6">
      {/* Left: Catalog list */}
      <div className="w-[260px] shrink-0 bg-white rounded-xl border border-line p-3 h-fit sticky top-24">
        <p className="px-3 text-[10px] font-semibold tracking-[0.16em] uppercase text-ink-faint mb-2">Catálogos</p>
        <div className="space-y-0.5">
          {catalogKeys.map((key) => {
            const count = catalogs.filter((c) => c.catalogKey === key).length;
            const active = activeCatalog === key;
            return (
              <button
                key={key}
                onClick={() => setActiveCatalog(key)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12.5px] font-medium transition-all",
                  active ? "bg-brand-50 text-brand-800" : "text-ink-soft hover:bg-surface hover:text-ink"
                )}
              >
                <BookOpen className={cn("h-3.5 w-3.5 shrink-0", active ? "text-brand-700" : "text-ink-faint")} />
                <span className="flex-1 text-left truncate">{CATALOG_LABELS[key]}</span>
                <span className="text-[10px] text-ink-faint tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Items */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">{CATALOG_LABELS[activeCatalog]}</h1>
            <p className="text-[13px] text-ink-quiet mt-1">{items.length} elementos</p>
          </div>
          <Button onClick={() => { setForm({ value: "", label: "" }); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Agregar Elemento
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-line overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">#</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Valor</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Etiqueta</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-quiet">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-b border-line-soft hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 text-ink-faint font-mono text-[12px]">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-ink-quiet">{item.value}</td>
                  <td className="px-4 py-3 font-medium text-ink">{item.label}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", item.active ? "bg-brand-50 text-brand-700" : "bg-critical-soft text-critical-ink")}>
                      {item.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditId(item.id); setForm({ value: item.value, label: item.label }); }} className="h-7 w-7 rounded-md hover:bg-surface grid place-items-center transition-colors">
                        <Edit2 className="h-3.5 w-3.5 text-ink-quiet" />
                      </button>
                      <button onClick={() => { toggleCatalogItem(item.id); addAuditEntry(item.active ? "catalog_deleted" : "catalog_created", item.label, CATALOG_LABELS[activeCatalog]); }} className={cn("h-7 w-7 rounded-md grid place-items-center transition-colors", item.active ? "hover:bg-critical-soft" : "hover:bg-brand-50")}>
                        {item.active ? <PowerOff className="h-3.5 w-3.5 text-critical" /> : <Power className="h-3.5 w-3.5 text-brand-600" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div className="py-12 text-center text-[13px] text-ink-quiet">No hay elementos en este catálogo</div>}
        </div>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} size="md" title="Agregar Elemento"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!form.value.trim() || !form.label.trim()}>Agregar</Button></div>}>
        <div className="space-y-4 py-2">
          <Field label="Valor (identificador)" required><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value.toLowerCase().replace(/\s+/g, "_") })} placeholder="valor_identificador" className="font-mono" /></Field>
          <Field label="Etiqueta (nombre visible)" required><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Nombre visible" /></Field>
        </div>
      </Modal>

      <Modal open={!!editId} onClose={() => setEditId(null)} size="md" title="Editar Elemento"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="ghost" onClick={() => setEditId(null)}>Cancelar</Button><Button onClick={handleUpdate} disabled={!form.label.trim()}>Guardar</Button></div>}>
        <div className="space-y-4 py-2">
          <Field label="Valor"><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="font-mono" /></Field>
          <Field label="Etiqueta"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}
