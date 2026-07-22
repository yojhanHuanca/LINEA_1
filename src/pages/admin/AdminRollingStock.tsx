import { useState } from "react";
import { Plus, Power, PowerOff, Train } from "lucide-react";
import { Button } from "@/design-system/primitives/Button";
import { Input, Field, Select } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { useAdminStore } from "@/lib/adminStore";
import { cn } from "@/lib/utils";
import { SERIES_LABELS, AUXILIARY_LABELS, type RollingStockSeries, type AuxiliaryVehicleType } from "@/lib/adminTypes";

export function AdminRollingStock() {
  const { rollingStock, auxiliaries, createRollingStock, toggleRollingStock, createAuxiliary, toggleAuxiliary, addAuditEntry } = useAdminStore();
  const [tab, setTab] = useState<"series" | "auxiliary">("series");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ code: "", series: "alstom" as RollingStockSeries, type: "dresina" as AuxiliaryVehicleType });

  const alstom = rollingStock.filter((r) => r.series === "alstom");
  const ansaldo = rollingStock.filter((r) => r.series === "ansaldo");

  const handleCreate = () => {
    if (!form.code.trim()) return;
    if (tab === "series") {
      createRollingStock(form.code, form.series);
      addAuditEntry("rolling_stock_created", form.code, `Serie ${SERIES_LABELS[form.series]}`);
    } else {
      createAuxiliary(form.code, form.type);
      addAuditEntry("rolling_stock_created", form.code, `Vehículo auxiliar: ${AUXILIARY_LABELS[form.type]}`);
    }
    setCreateOpen(false);
    setForm({ code: "", series: "alstom", type: "dresina" });
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">Material Rodante</h1>
          <p className="text-[13px] text-ink-quiet mt-1">
            {rollingStock.length} unidades de tren · {auxiliaries.length} vehículos auxiliares
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Agregar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface rounded-lg p-1 w-fit">
        {(["series", "auxiliary"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-md text-[13px] font-medium transition-all", tab === t ? "bg-white text-ink shadow-sm" : "text-ink-quiet hover:text-ink")}>
            {t === "series" ? "Trenes (Series)" : "Vehículos Auxiliares"}
          </button>
        ))}
      </div>

      {tab === "series" && (
        <div className="space-y-6">
          {(["alstom", "ansaldo"] as const).map((series) => {
            const units = rollingStock.filter((r) => r.series === series);
            return (
              <div key={series} className="bg-white rounded-xl border border-line p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-brand-50 border border-brand-200 grid place-items-center">
                    <Train className="h-4.5 w-4.5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{SERIES_LABELS[series]}</p>
                    <p className="text-[11px] text-ink-quiet">{units.length} unidades · {units.filter((u) => u.active).length} activas</p>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {units.sort((a, b) => a.code.localeCompare(b.code)).map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => { toggleRollingStock(unit.id); addAuditEntry(unit.active ? "rolling_stock_deactivated" : "rolling_stock_created", unit.code); }}
                      className={cn(
                        "h-12 rounded-lg border text-[12px] font-mono font-semibold transition-all",
                        unit.active ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100" : "border-line-strong bg-surface-2 text-ink-faint line-through"
                      )}
                    >
                      {unit.code}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "auxiliary" && (
        <div className="bg-white rounded-xl border border-line overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-quiet">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {auxiliaries.map((a) => (
                <tr key={a.id} className="border-b border-line-soft hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-ink">{a.code}</td>
                  <td className="px-4 py-3 text-ink-soft">{AUXILIARY_LABELS[a.type]}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", a.active ? "bg-brand-50 text-brand-700" : "bg-critical-soft text-critical-ink")}>
                      {a.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { toggleAuxiliary(a.id); addAuditEntry(a.active ? "rolling_stock_deactivated" : "rolling_stock_created", a.code); }} className={cn("h-7 w-7 rounded-md grid place-items-center transition-colors", a.active ? "hover:bg-critical-soft" : "hover:bg-brand-50")}>
                      {a.active ? <PowerOff className="h-3.5 w-3.5 text-critical" /> : <Power className="h-3.5 w-3.5 text-brand-600" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} size="sm" title="Agregar Material Rodante"
        footer={<div className="flex items-center justify-end gap-2"><Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!form.code.trim()}>Agregar</Button></div>}>
        <div className="space-y-4 py-2">
          <Field label="Código" required>
            <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Ej: T45" className="font-mono" />
          </Field>
          {tab === "series" ? (
            <Field label="Serie">
              <Select value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value as RollingStockSeries })}>
                <option value="alstom">ALSTOM</option>
                <option value="ansaldo">ANSALDO</option>
              </Select>
            </Field>
          ) : (
            <Field label="Tipo de Vehículo">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AuxiliaryVehicleType })}>
                {Object.entries(AUXILIARY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
          )}
        </div>
      </Modal>
    </div>
  );
}
