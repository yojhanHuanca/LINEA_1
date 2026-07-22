import { useState } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Key,
  ChevronRight,
  X,
  Check,
  Mail,
  Phone,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Button } from "@/design-system/primitives/Button";
import { Input, Field, Select } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { useStore } from "@/lib/store";
import { useAdminStore } from "@/lib/adminStore";
import { cn } from "@/lib/utils";
import { AREA_LABELS, SYSTEM_ROLE_LABELS, CARGO_LABELS, type Area, type SystemRole, type Cargo } from "@/lib/types";

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;
const STEP_LABELS = ["Información Personal", "Área", "Cargo", "Rol del Sistema", "Permisos", "Confirmación"];

export function AdminUsers() {
  const { users, deactivateUser, assignUserRole } = useStore();
  const { roles, areas, addAuditEntry } = useAdminStore();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(0);
  const [editUser, setEditUser] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    email: "",
    phone: "",
    area: "" as Area | "",
    cargo: "" as Cargo | "",
    systemRole: "" as SystemRole | "",
  });

  // Confirmation modal
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId: string; label: string } | null>(null);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q) || u.dni.includes(q);
    const matchRole = filterRole === "todos" || u.systemRole === filterRole;
    const matchStatus = filterStatus === "todos" || u.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const openWizard = (userId?: string) => {
    if (userId) {
      const u = users.find((us) => us.id === userId);
      if (u) {
        setEditUser(userId);
        setForm({
          firstName: u.firstName,
          lastName: u.lastName,
          dni: u.dni,
          email: u.email,
          phone: u.phone || "",
          area: u.area || "",
          cargo: u.cargoType,
          systemRole: u.systemRole,
        });
      }
    } else {
      setEditUser(null);
      setForm({ firstName: "", lastName: "", dni: "", email: "", phone: "", area: "", cargo: "", systemRole: "" });
    }
    setStep(0);
    setWizardOpen(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, userId } = confirmAction;
    if (type === "deactivate") {
      deactivateUser(userId);
      addAuditEntry("user_deactivated", userId);
    } else if (type === "activate") {
      const u = users.find((us) => us.id === userId);
      if (u) {
        // Re-activate by toggling status via role assignment (simulated)
        addAuditEntry("user_activated", userId);
      }
    } else if (type === "block") {
      addAuditEntry("user_blocked", userId);
    } else if (type === "unblock") {
      addAuditEntry("user_unblocked", userId);
    } else if (type === "reset_password") {
      addAuditEntry("password_reset", userId);
    }
    setConfirmAction(null);
  };

  const statusTone = (s: string) => s === "activo" ? "bg-brand-50 text-brand-700" : "bg-critical-soft text-critical-ink";
  const roleTone = (r: SystemRole) => {
    const map: Record<SystemRole, string> = {
      administrador: "bg-critical-soft text-critical-ink",
      seguridad_operativa: "bg-brand-50 text-brand-700",
      auditor: "bg-info-soft text-info-ink",
      consulta: "bg-surface-2 text-ink-quiet",
    };
    return map[r] || "bg-surface-2 text-ink-quiet";
  };

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">Gestión de Usuarios</h1>
          <p className="text-[13px] text-ink-quiet mt-1">{users.length} usuarios registrados · {users.filter((u) => u.status === "activo").length} activos</p>
        </div>
        <Button onClick={() => openWizard()}>
          <Plus className="h-4 w-4 mr-1.5" />
          Crear Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-line p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
          <Input
            placeholder="Buscar por nombre, código o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
          <option value="todos">Todos los roles</option>
          {Object.entries(SYSTEM_ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">DNI</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Área</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Cargo</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Rol</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-quiet">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-quiet">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr key={u.id} className={cn("border-b border-line-soft hover:bg-surface/50 transition-colors", i === filteredUsers.length - 1 && "border-b-0")}>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-ink-quiet">{u.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-full bg-brand-100 text-brand-800 grid place-items-center text-[10px] font-semibold shrink-0">
                        {u.initials}
                      </span>
                      <div>
                        <p className="font-medium text-ink">{u.name}</p>
                        <p className="text-[11px] text-ink-faint">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-quiet font-mono text-[12px]">{u.dni}</td>
                  <td className="px-4 py-3 text-ink-soft">{u.area ? AREA_LABELS[u.area] : "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{u.cargoType ? CARGO_LABELS[u.cargoType] : u.cargo}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", roleTone(u.systemRole))}>
                      {SYSTEM_ROLE_LABELS[u.systemRole]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-medium", statusTone(u.status))}>
                      {u.status === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openWizard(u.id)} className="h-7 w-7 rounded-md hover:bg-surface grid place-items-center transition-colors" title="Editar">
                        <Edit2 className="h-3.5 w-3.5 text-ink-quiet" />
                      </button>
                      <button onClick={() => setConfirmAction({ type: "reset_password", userId: u.id, label: u.name })} className="h-7 w-7 rounded-md hover:bg-surface grid place-items-center transition-colors" title="Restablecer contraseña">
                        <Key className="h-3.5 w-3.5 text-ink-quiet" />
                      </button>
                      <button onClick={() => setConfirmAction({ type: u.status === "activo" ? "deactivate" : "activate", userId: u.id, label: u.name })} className="h-7 w-7 rounded-md hover:bg-surface grid place-items-center transition-colors" title={u.status === "activo" ? "Desactivar" : "Activar"}>
                        {u.status === "activo" ? <UserX className="h-3.5 w-3.5 text-critical" /> : <UserCheck className="h-3.5 w-3.5 text-brand-600" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-[13px] text-ink-quiet">No se encontraron usuarios</div>
        )}
      </div>

      {/* Create/Edit Wizard */}
      <Modal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        size="lg"
        title={editUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
        footer={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {STEP_LABELS.map((_, i) => (
                <div key={i} className={cn("h-1.5 rounded-full transition-all", i <= step ? "w-6 bg-brand-600" : "w-3 bg-line-strong")} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => step > 0 ? setStep((s) => (s - 1) as WizardStep) : setWizardOpen(false)}>
                {step > 0 ? "Anterior" : "Cancelar"}
              </Button>
              {step < 5 ? (
                <Button onClick={() => setStep((s) => (s + 1) as WizardStep)}>
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={() => {
                  if (editUser) {
                    assignUserRole(editUser, form.systemRole as SystemRole);
                    addAuditEntry("user_updated", editUser, `Rol cambiado a ${SYSTEM_ROLE_LABELS[form.systemRole as SystemRole]}`);
                  } else {
                    addAuditEntry("user_created", form.firstName + " " + form.lastName);
                  }
                  setWizardOpen(false);
                }}>
                  <Check className="h-4 w-4 mr-1" />
                  {editUser ? "Guardar Cambios" : "Crear Usuario"}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="py-2 min-h-[320px]">
          <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider mb-4">
            Paso {step + 1} de {STEP_LABELS.length} — {STEP_LABELS[step]}
          </p>

          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombres" required>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Nombres completos" />
                </Field>
                <Field label="Apellidos" required>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Apellidos completos" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="DNI" required>
                  <Input value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} placeholder="8 dígitos" maxLength={8} />
                </Field>
                <Field label="Correo Electrónico" required>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@metrolinea1.pe" />
                </Field>
              </div>
              <Field label="Teléfono">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+51 999 999 999" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-[13px] text-ink-soft">Seleccione el área organizacional a la que pertenece el usuario.</p>
              <div className="grid grid-cols-2 gap-3">
                {areas.filter((a) => a.active).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setForm({ ...form, area: a.key })}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      form.area === a.key ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-line hover:border-brand-300 bg-white"
                    )}
                  >
                    <p className="text-[13px] font-semibold text-ink">{a.name}</p>
                    <p className="text-[11px] text-ink-quiet mt-0.5">Jefe: {a.head}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[13px] text-ink-soft">Seleccione el cargo organizacional del usuario.</p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(CARGO_LABELS) as [Cargo, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setForm({ ...form, cargo: key })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      form.cargo === key ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-line hover:border-brand-300 bg-white"
                    )}
                  >
                    <p className="text-[13px] font-medium text-ink">{label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-[13px] text-ink-soft">Asigne el rol del sistema que controla los permisos de acceso.</p>
              <div className="space-y-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setForm({ ...form, systemRole: r.key as SystemRole })}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4",
                      form.systemRole === r.key ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20" : "border-line hover:border-brand-300 bg-white"
                    )}
                  >
                    <div className="h-10 w-10 rounded-lg grid place-items-center shrink-0" style={{ backgroundColor: r.color + "15" }}>
                      <Shield className="h-5 w-5" style={{ color: r.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-ink">{r.name}</p>
                      <p className="text-[11px] text-ink-quiet">{r.description}</p>
                    </div>
                    {form.systemRole === r.key && <Check className="h-5 w-5 text-brand-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <p className="text-[13px] text-ink-soft">Revise los permisos del rol seleccionado.</p>
              {form.systemRole && (() => {
                const role = roles.find((r) => r.key === form.systemRole);
                if (!role) return null;
                const permGroups = [
                  { label: "Expedientes", keys: ["caseView", "caseCreate", "caseEdit", "caseDelete", "caseAssign", "caseClose", "caseReopen"] as const },
                  { label: "Investigación", keys: ["investigationView", "investigationEdit"] as const },
                  { label: "Planes de Acción", keys: ["planView", "planCreate", "planApprove", "planReject"] as const },
                  { label: "Ejecución", keys: ["executionView", "executionEdit"] as const },
                  { label: "Usuarios", keys: ["userView", "userCreate", "userEdit", "userDelete", "userAssignRole"] as const },
                  { label: "Administración", keys: ["adminAccess", "configEdit", "auditView", "catalogEdit", "areaEdit", "stationEdit", "rollingStockEdit"] as const },
                  { label: "Reportes", keys: ["reportView", "reportExport", "kpiView"] as const },
                ];
                const permLabels: Record<string, string> = {
                  caseView: "Ver casos", caseCreate: "Crear casos", caseEdit: "Editar casos", caseDelete: "Eliminar casos",
                  caseAssign: "Asignar casos", caseClose: "Cerrar casos", caseReopen: "Reabrir casos",
                  investigationView: "Ver investigación", investigationEdit: "Editar investigación",
                  planView: "Ver planes", planCreate: "Crear planes", planApprove: "Aprobar planes", planReject: "Rechazar planes",
                  executionView: "Ver ejecución", executionEdit: "Editar ejecución",
                  userView: "Ver usuarios", userCreate: "Crear usuarios", userEdit: "Editar usuarios", userDelete: "Eliminar usuarios", userAssignRole: "Asignar roles",
                  adminAccess: "Acceso admin", configEdit: "Editar configuración", auditView: "Ver auditoría",
                  catalogEdit: "Editar catálogos", areaEdit: "Editar áreas", stationEdit: "Editar estaciones", rollingStockEdit: "Editar material rodante",
                  reportView: "Ver reportes", reportExport: "Exportar reportes", kpiView: "Ver KPIs",
                };
                return (
                  <div className="space-y-4">
                    {permGroups.map((group) => (
                      <div key={group.label} className="bg-surface rounded-lg p-3">
                        <p className="text-[11px] font-semibold text-ink-quiet uppercase tracking-wider mb-2">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.keys.map((k) => (
                            <span key={k} className={cn(
                              "px-2 py-1 rounded-md text-[11px] font-medium",
                              role.permissions[k] ? "bg-brand-50 text-brand-700" : "bg-surface-2 text-ink-faint line-through"
                            )}>
                              {permLabels[k]}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <p className="text-[13px] text-ink-soft">Confirme la información del usuario antes de {editUser ? "guardar" : "crear"}.</p>
              <div className="bg-surface rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-12 w-12 rounded-full bg-brand-100 text-brand-800 grid place-items-center text-[14px] font-semibold">
                    {(form.firstName[0] || "") + (form.lastName[0] || "")}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{form.firstName} {form.lastName}</p>
                    <p className="text-[12px] text-ink-quiet">{form.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12.5px]">
                  <div className="flex items-center gap-2"><span className="text-ink-faint">DNI:</span><span className="font-medium text-ink">{form.dni || "—"}</span></div>
                  <div className="flex items-center gap-2"><span className="text-ink-faint">Teléfono:</span><span className="font-medium text-ink">{form.phone || "—"}</span></div>
                  <div className="flex items-center gap-2"><span className="text-ink-faint">Área:</span><span className="font-medium text-ink">{form.area ? AREA_LABELS[form.area as Area] : "—"}</span></div>
                  <div className="flex items-center gap-2"><span className="text-ink-faint">Cargo:</span><span className="font-medium text-ink">{form.cargo ? CARGO_LABELS[form.cargo] : "—"}</span></div>
                  <div className="flex items-center gap-2 col-span-2"><span className="text-ink-faint">Rol:</span><span className="font-medium text-ink">{form.systemRole ? SYSTEM_ROLE_LABELS[form.systemRole as SystemRole] : "—"}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm Action Modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        size="sm"
        title="Confirmar Acción"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button variant={confirmAction?.type === "activate" || confirmAction?.type === "unblock" ? "primary" : "danger"} onClick={handleConfirmAction}>
              {confirmAction?.type === "activate" ? "Activar" : confirmAction?.type === "deactivate" ? "Desactivar" : confirmAction?.type === "block" ? "Bloquear" : confirmAction?.type === "unblock" ? "Desbloquear" : "Restablecer"}
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-ink-soft py-2">
          ¿Está seguro de que desea {confirmAction?.type === "activate" ? "activar" : confirmAction?.type === "deactivate" ? "desactivar" : confirmAction?.type === "block" ? "bloquear" : confirmAction?.type === "unblock" ? "desbloquear" : "restablecer la contraseña de"} el usuario <strong className="text-ink">{confirmAction?.label}</strong>?
        </p>
      </Modal>
    </div>
  );
}
