import { useState } from "react";
import { Save, RotateCcw, Settings } from "lucide-react";
import { Button } from "@/design-system/primitives/Button";
import { Input, Field } from "@/design-system/primitives/Input";
import { useAdminStore } from "@/lib/adminStore";

export function AdminConfig() {
  const { config, updateConfig, addAuditEntry } = useAdminStore();
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateConfig(form);
    addAuditEntry("config_updated", "Configuración General", "Parámetros actualizados");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setForm({ ...config });
  };

  return (
    <div className="max-w-[800px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">Configuración General</h1>
          <p className="text-[13px] text-ink-quiet mt-1">Parámetros globales del sistema SIGMA L1</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Restablecer
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-1.5" />
            {saved ? "Guardado" : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      {saved && (
        <div className="px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 text-[13px] text-brand-700 font-medium animate-[fadeIn_0.2s_var(--ease-out)]">
          Configuración guardada exitosamente
        </div>
      )}

      {/* General */}
      <div className="bg-white rounded-xl border border-line p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-4 w-4 text-ink-quiet" />
          <h2 className="text-[14px] font-semibold text-ink">General</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre del Sistema">
            <Input value={form.systemName} onChange={(e) => setForm({ ...form, systemName: e.target.value })} />
          </Field>
          <Field label="Versión">
            <Input value={form.systemVersion} onChange={(e) => setForm({ ...form, systemVersion: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Numeración */}
      <div className="bg-white rounded-xl border border-line p-6 space-y-5">
        <h2 className="text-[14px] font-semibold text-ink">Numeración Automática</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prefijo de Expedientes">
            <Input value={form.caseNumberPrefix} onChange={(e) => setForm({ ...form, caseNumberPrefix: e.target.value })} className="font-mono" />
          </Field>
          <Field label="Secuencia Actual (Expedientes)">
            <Input type="number" value={form.caseNumberSeq} onChange={(e) => setForm({ ...form, caseNumberSeq: parseInt(e.target.value) || 0 })} className="font-mono" />
          </Field>
          <Field label="Prefijo de Planes">
            <Input value={form.planNumberPrefix} onChange={(e) => setForm({ ...form, planNumberPrefix: e.target.value })} className="font-mono" />
          </Field>
          <Field label="Secuencia Actual (Planes)">
            <Input type="number" value={form.planNumberSeq} onChange={(e) => setForm({ ...form, planNumberSeq: parseInt(e.target.value) || 0 })} className="font-mono" />
          </Field>
        </div>
      </div>

      {/* Plazos */}
      <div className="bg-white rounded-xl border border-line p-6 space-y-5">
        <h2 className="text-[14px] font-semibold text-ink">Plazos y Tiempos</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Días máx. de investigación" hint="Tiempo límite para completar la investigación">
            <div className="relative">
              <Input type="number" value={form.maxInvestigationDays} onChange={(e) => setForm({ ...form, maxInvestigationDays: parseInt(e.target.value) || 0 })} className="font-mono pr-10" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-faint">días</span>
            </div>
          </Field>
          <Field label="Días para responder planes" hint="Plazo del jefe de área para aceptar/rechazar">
            <div className="relative">
              <Input type="number" value={form.planResponseDays} onChange={(e) => setForm({ ...form, planResponseDays: parseInt(e.target.value) || 0 })} className="font-mono pr-10" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-faint">días</span>
            </div>
          </Field>
          <Field label="Días para solicitar prórroga" hint="Plazo máximo para solicitar ampliación">
            <div className="relative">
              <Input type="number" value={form.extensionRequestDays} onChange={(e) => setForm({ ...form, extensionRequestDays: parseInt(e.target.value) || 0 })} className="font-mono pr-10" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-faint">días</span>
            </div>
          </Field>
        </div>
      </div>

      <p className="text-[11px] text-ink-faint">
        Última actualización: {new Date(config.updatedAt).toLocaleString("es-PE")}
      </p>
    </div>
  );
}
