import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  X,
  CheckCircle2,
  Tag,
  MapPin,
  Type,
  ShieldCheck,
  User,
  Sparkles,
  Train,
  Building2,
  Footprints,
  Car,
  ArrowUpDown,
  Layers,
  DoorOpen,
  Warehouse,
  HelpCircle,
  AlertTriangle,
  Eye,
  Wrench,
  Flag,
  Lightbulb,
  FileSearch,
  Type as TypeIcon,
  Send,
  Lock,
  Info,
  PartyPopper,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { ReportanteShell } from "@/design-system/layout/ReportanteShell";
import { Button } from "@/design-system/primitives/Button";
import { Card } from "@/design-system/primitives/Card";
import { Field, Input, Select, Textarea } from "@/design-system/primitives/Input";
import { Pill } from "@/design-system/primitives/Pill";
import { cn, uid } from "@/lib/utils";
import {
  AREA_LABELS,
  EVENT_LABELS,
  STATIONS,
  TIPO_SOP_LABELS,
  SUBTIPO_SOP_LABELS,
  type Area,
  type Evidence,
  type EventType,
  type TipoSOP,
  type SubtipoSOP,
} from "@/lib/types";

const STEPS = [
  { id: 0, label: "Tipo", icon: Tag },
  { id: 1, label: "Ubicación", icon: MapPin },
  { id: 2, label: "Descripción", icon: Type },
  { id: 3, label: "Clasificación", icon: ShieldCheck },
  { id: 4, label: "Evidencias", icon: Upload },
  { id: 5, label: "Envío", icon: ShieldCheck },
] as const;

const REPORT_TYPES: { value: EventType; label: string; icon: typeof Tag; hint: string }[] = [
  { value: "accidente", label: "Accidente", icon: AlertTriangle, hint: "Lesión o daño" },
  { value: "incidente", label: "Incidente", icon: Flag, hint: "Casi accidente" },
  { value: "observacion", label: "Observación", icon: Eye, hint: "Comportamiento" },
  { value: "condicion_insegura", label: "Condición Insegura", icon: Wrench, hint: "Estado físico" },
  { value: "acto_inseguro", label: "Acto Inseguro", icon: AlertTriangle, hint: "Acción de riesgo" },
  { value: "falla_operativa", label: "Falla Operativa", icon: Wrench, hint: "Equipo o sistema" },
  { value: "riesgo", label: "Riesgo", icon: ShieldCheck, hint: "Potencial daño" },
  { value: "hallazgo", label: "Hallazgo", icon: Lightbulb, hint: "Detección" },
  { value: "otro", label: "Otro", icon: HelpCircle, hint: "Otro evento" },
];

const LOCATIONS = [
  { value: "Andén", icon: Layers },
  { value: "Vagón", icon: Train },
  { value: "Escalera Mecánica", icon: ArrowUpDown },
  { value: "Ascensor", icon: ArrowUpDown },
  { value: "Boletería", icon: Building2 },
  { value: "Pasillo", icon: Footprints },
  { value: "Acceso", icon: DoorOpen },
  { value: "Patio Taller", icon: Warehouse },
  { value: "Otro", icon: MapPin },
];

export function NewReportWizard() {
  const navigate = useNavigate();
  const { createReport } = useStore();
  const [step, setStep] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "" as EventType | "",
    station: "",
    location: "",
    description: "",
    evidence: [] as Evidence[],
    anonymous: true,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    tipoSOP: "" as TipoSOP | "",
    subtipoSOP: "" as SubtipoSOP | "",
    peligro: "",
    consecuencia: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canNext = (() => {
    switch (step) {
      case 0:
        return !!form.type;
      case 1:
        return !!form.station;
      case 2:
        return form.description.trim().length >= 10;
      case 3:
        return !!form.tipoSOP && !!form.subtipoSOP;
      default:
        return true;
    }
  })();

  const next = () => canNext && setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const addMockEvidence = (kind: Evidence["kind"]) => {
    const names: Record<Evidence["kind"], [string, string]> = {
      foto: ["evidencia_foto.jpg", "2.4 MB"],
      video: ["evidencia_video.mp4", "14.8 MB"],
      documento: ["documento_apoyo.pdf", "640 KB"],
    };
    const [name, size] = names[kind];
    set("evidence", [
      ...form.evidence,
      { id: uid("ev"), kind, name: name.replace(/(\.\w+)$/, `_${form.evidence.length + 1}$1`), size, at: new Date().toISOString() },
    ]);
  };

  const removeEvidence = (id: string) => set("evidence", form.evidence.filter((e) => e.id !== id));

  const submit = () => {
    const reporterName = form.anonymous ? "Reporte Anónimo" : form.contactName.trim() || "Reportante Identificado";
    const newCase = createReport({
      type: form.type as EventType,
      title: `${EVENT_LABELS[form.type as EventType]} en ${form.station}`,
      description: form.description.trim(),
      observations: form.location ? `Lugar específico: ${form.location}` : "",
      area: "operaciones" as Area, // SO lo reclasificará después
      station: form.station,
      location: form.location,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      priority: "media",
      riskLevel: "3C",
      evidence: form.evidence,
      reporter: reporterName,
      anonymous: form.anonymous,
      contactName: form.anonymous ? undefined : form.contactName.trim() || undefined,
      contactEmail: form.anonymous ? undefined : form.contactEmail.trim() || undefined,
      contactPhone: form.anonymous ? undefined : form.contactPhone.trim() || undefined,
    });
    setSuccess(newCase.id);
  };

  // ─── Pantalla de éxito ───
  if (success) {
    return (
      <ReportanteShell>
        <div className="max-w-xl mx-auto">
          <Card className="p-8 text-center border-brand-200">
            <div className="mx-auto h-20 w-20 rounded-full bg-brand-700 text-white grid place-items-center animate-[riseUp_0.4s_ease-out]">
              <PartyPopper className="h-10 w-10" />
            </div>
            <h1 className="mt-6 text-[24px] font-bold text-ink tracking-tight font-display">
              ¡Tu reporte fue registrado correctamente!
            </h1>
            <p className="text-[13.5px] text-ink-soft mt-2 leading-relaxed">
              El equipo de Seguridad Operativa revisará la información y, de ser necesario, iniciará el proceso de evaluación e investigación.
            </p>
            <div className="mt-6 rounded-xl bg-brand-50 border border-brand-200 p-5">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brand-700">Código del reporte</p>
              <p className="mt-1.5 text-[28px] font-bold font-mono text-brand-900 tracking-tight">{success}</p>
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={() => navigate("/reportante")}>
              <Check className="h-5 w-5" /> Finalizar
            </Button>
          </Card>
        </div>
      </ReportanteShell>
    );
  }

  return (
    <ReportanteShell>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brand-700">Registrar Incidencia</p>
          <h1 className="mt-1 text-[26px] font-bold text-ink tracking-tight font-display">Reporta lo que observaste</h1>
          <p className="text-[13.5px] text-ink-quiet mt-1.5">Toma menos de un minuto. Tú solo reportas, nosotros nos encargamos del resto.</p>
        </div>

        {/* Stepper */}
        <Card className="p-4 mb-5">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <div className={cn(
                    "h-9 px-3 rounded-full flex items-center gap-2 text-[12px] font-medium transition-all",
                    done && "bg-brand-700 text-white",
                    active && "bg-brand-50 text-brand-800 ring-1 ring-brand-200",
                    !done && !active && "bg-surface-2 text-ink-faint"
                  )}>
                    <span className={cn(
                      "h-5 w-5 rounded-full grid place-items-center text-[11px]",
                      done && "bg-white/20",
                      active && "bg-brand-700 text-white",
                      !done && !active && "bg-white text-ink-faint"
                    )}>
                      {done ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("h-0.5 flex-1 mx-1 rounded-full", done ? "bg-brand-700" : "bg-line")} />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step body */}
        <Card className="p-6 min-h-[340px]">
          {/* Paso 1 — Tipo de Reporte */}
          {step === 0 && (
            <StepBox title="¿Qué desea reportar?" subtitle="Selecciona el tipo de incidencia que observaste.">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {REPORT_TYPES.map((opt) => {
                  const active = form.type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => set("type", opt.value)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all flex flex-col items-start gap-2",
                        active
                          ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200"
                          : "border-line bg-white hover:border-line-strong hover:bg-surface/50"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-lg grid place-items-center shrink-0",
                        active ? "bg-brand-700 text-white" : "bg-surface-2 text-ink-soft"
                      )}>
                        <opt.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={cn("text-[13.5px] font-semibold", active ? "text-brand-900" : "text-ink")}>{opt.label}</p>
                        <p className="text-[11px] text-ink-quiet mt-0.5">{opt.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </StepBox>
          )}

          {/* Paso 2 — Ubicación */}
          {step === 1 && (
            <StepBox title="¿Dónde ocurrió?" subtitle="Indica la estación y el lugar específico (opcional).">
              <Field label="Estación" required>
                <Select value={form.station} onChange={(e) => set("station", e.target.value)}>
                  <option value="">Selecciona una estación…</option>
                  {STATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <div className="mt-4">
                <p className="text-[12px] font-medium text-ink-soft mb-2">Lugar específico (opcional)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {LOCATIONS.map((loc) => {
                    const active = form.location === loc.value;
                    return (
                      <button
                        key={loc.value}
                        onClick={() => set("location", form.location === loc.value ? "" : loc.value)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all flex items-center gap-2.5",
                          active ? "border-brand-600 bg-brand-50 ring-1 ring-brand-200" : "border-line bg-white hover:border-line-strong hover:bg-surface/50"
                        )}
                      >
                        <loc.icon className={cn("h-4.5 w-4.5", active ? "text-brand-700" : "text-ink-faint")} />
                        <span className={cn("text-[12.5px] font-medium", active ? "text-brand-900" : "text-ink")}>{loc.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </StepBox>
          )}

          {/* Paso 3 — Descripción */}
          {step === 2 && (
            <StepBox title="Cuéntanos brevemente qué ocurrió" subtitle="Solo describe lo que observaste.">
              <Field label="Descripción" required hint={`${form.description.length}/300 caracteres`}>
                <Textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value.slice(0, 300))}
                  placeholder="Describe brevemente lo que observaste."
                  rows={5}
                />
              </Field>
              <div className="mt-4 rounded-lg bg-info-soft border border-info/20 p-3.5 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-info-ink shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-info-ink leading-relaxed">
                  No es necesario identificar responsables ni conocer las causas. Solo describe lo que observaste y el equipo de Seguridad Operativa realizará la evaluación correspondiente.
                </p>
              </div>
            </StepBox>
          )}

          {/* Paso 3 — Clasificación SOP */}
          {step === 3 && (
            <StepBox title="Clasificación SOP" subtitle="Selecciona el tipo y subtipo para ayudar al análisis.">
              <Field label="Tipo de SOP" required>
                <Select value={form.tipoSOP} onChange={(e) => set("tipoSOP", e.target.value as TipoSOP)}>
                  <option value="">Seleccionar…</option>
                  {(Object.keys(TIPO_SOP_LABELS) as TipoSOP[]).map((t) => (
                    <option key={t} value={t}>{TIPO_SOP_LABELS[t]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Subtipo SOP" required className="mt-4">
                <Select value={form.subtipoSOP} onChange={(e) => set("subtipoSOP", e.target.value as SubtipoSOP)}>
                  <option value="">Seleccionar…</option>
                  {(Object.keys(SUBTIPO_SOP_LABELS) as SubtipoSOP[]).map((s) => (
                    <option key={s} value={s}>{SUBTIPO_SOP_LABELS[s]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Peligro (opcional)" className="mt-4">
                <Input
                  value={form.peligro}
                  onChange={(e) => set("peligro", e.target.value)}
                  placeholder="Ej: Superficie mojada sin señalización"
                />
              </Field>
              <Field label="Consecuencia (opcional)" className="mt-4">
                <Input
                  value={form.consecuencia}
                  onChange={(e) => set("consecuencia", e.target.value)}
                  placeholder="Ej: Lesión leve en muñeca"
                />
              </Field>
            </StepBox>
          )}

          {/* Paso 4 — Evidencias */}
          {step === 4 && (
            <StepBox title="¿Deseas adjuntar evidencias?" subtitle="Fotografías o video. Es opcional.">
              <div className="rounded-xl border-2 border-dashed border-line-strong bg-surface/40 p-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-white border border-line grid place-items-center text-brand-700 mx-auto">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[13.5px] font-medium text-ink">Arrastra archivos o adjunta desde tu equipo</p>
                <p className="text-[12px] text-ink-quiet mt-1">JPG, PNG, MP4 · opcional</p>
                <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => addMockEvidence("foto")}>
                    <ImageIcon className="h-4 w-4" /> Adjuntar foto
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addMockEvidence("video")}>
                    <Video className="h-4 w-4" /> Adjuntar video
                  </Button>
                </div>
              </div>

              {form.evidence.length > 0 && (
                <div className="mt-4 space-y-2">
                  {form.evidence.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-line">
                      <div className="h-9 w-9 rounded-lg bg-surface-2 text-ink-soft grid place-items-center shrink-0">
                        {ev.kind === "foto" ? <ImageIcon className="h-4 w-4" /> : ev.kind === "video" ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-ink truncate">{ev.name}</p>
                        <p className="text-[11px] text-ink-quiet">{ev.size}</p>
                      </div>
                      <button onClick={() => removeEvidence(ev.id)} className="h-8 w-8 grid place-items-center rounded-md text-ink-faint hover:bg-surface-2 hover:text-critical transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </StepBox>
          )}

          {/* Paso 5 — Confirmación y Privacidad */}
          {step === 5 && (
            <StepBox title="¿Cómo deseas enviar tu reporte?" subtitle="Elige la modalidad de envío.">
              {/* Opciones de privacidad */}
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => set("anonymous", true)}
                  className={cn(
                    "p-5 rounded-xl border text-left transition-all",
                    form.anonymous ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : "border-line bg-white hover:border-line-strong"
                  )}
                >
                  <div className={cn("h-11 w-11 rounded-xl grid place-items-center", form.anonymous ? "bg-brand-700 text-white" : "bg-surface-2 text-ink-soft")}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-[14px] font-bold text-ink">Reporte Anónimo</p>
                  <p className="text-[12px] text-ink-soft mt-1 leading-relaxed">Tus datos personales permanecerán ocultos. El equipo de Seguridad Operativa únicamente visualizará la información del reporte.</p>
                </button>

                <button
                  onClick={() => set("anonymous", false)}
                  className={cn(
                    "p-5 rounded-xl border text-left transition-all",
                    !form.anonymous ? "border-brand-600 bg-brand-50 ring-2 ring-brand-200" : "border-line bg-white hover:border-line-strong"
                  )}
                >
                  <div className={cn("h-11 w-11 rounded-xl grid place-items-center", !form.anonymous ? "bg-brand-700 text-white" : "bg-surface-2 text-ink-soft")}>
                    <User className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-[14px] font-bold text-ink">Reporte Identificado</p>
                  <p className="text-[12px] text-ink-soft mt-1 leading-relaxed">Tus datos podrán ser visualizados únicamente por el equipo de Seguridad Operativa en caso sea necesario contactarte para ampliar la información.</p>
                </button>
              </div>

              {/* Campos si es identificado */}
              {!form.anonymous && (
                <div className="grid sm:grid-cols-2 gap-4 mb-4 animate-[riseUp_0.25s_ease-out]">
                  <Field label="Nombre Completo" required className="sm:col-span-2">
                    <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Tu nombre completo" />
                  </Field>
                  <Field label="Correo Electrónico (opcional)">
                    <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="tucorreo@ejemplo.com" />
                  </Field>
                  <Field label="Teléfono (opcional)">
                    <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="+51 999 888 777" />
                  </Field>
                </div>
              )}

              {/* Resumen */}
              <div className="rounded-xl bg-surface border border-line p-4">
                <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-3">Resumen del reporte</p>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 text-[12.5px]">
                  <SummaryRow label="Tipo de Reporte" value={form.type ? EVENT_LABELS[form.type as EventType] : "—"} />
                  <SummaryRow label="Estación" value={form.station || "—"} />
                  <SummaryRow label="Lugar" value={form.location || "—"} />
                  <SummaryRow label="Descripción" value={form.description ? `${form.description.slice(0, 50)}…` : "—"} />
                  <SummaryRow label="Evidencias" value={`${form.evidence.length} archivo(s)`} />
                  <SummaryRow label="Modalidad" value={form.anonymous ? "Anónimo" : "Identificado"} />
                </div>
              </div>
            </StepBox>
          )}
        </Card>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={back} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canNext}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={!form.type || !form.station || form.description.trim().length < 10 || (!form.anonymous && !form.contactName.trim())}>
              <Send className="h-4 w-4" /> Enviar Reporte
            </Button>
          )}
        </div>
      </div>
    </ReportanteShell>
  );
}

function StepBox({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="animate-[riseUp_0.3s_ease-out]">
      <h2 className="text-[19px] font-bold text-ink tracking-tight">{title}</h2>
      <p className="text-[13px] text-ink-quiet mt-1 mb-5">{subtitle}</p>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-medium tracking-wide uppercase text-ink-faint">{label}</p>
      <p className="text-[13px] text-ink font-medium mt-0.5 leading-snug">{value}</p>
    </div>
  );
}
