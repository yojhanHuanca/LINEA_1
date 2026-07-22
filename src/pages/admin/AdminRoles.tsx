import { useState } from "react";
import { Plus, Edit2, Trash2, Shield, Check, X } from "lucide-react";
import { Button } from "@/design-system/primitives/Button";
import { Input, Field } from "@/design-system/primitives/Input";
import { Modal } from "@/design-system/primitives/Modal";
import { useAdminStore } from "@/lib/adminStore";
import { cn } from "@/lib/utils";
import type { RolePermissions } from "@/lib/adminTypes";

const PERM_GROUP_LABELS: Record<string, string> = {
  cases: "Expedientes",
  investigation: "Investigación",
  plans: "Planes de Acción",
  execution: "Ejecución",
  users: "Usuarios",
  admin: "Administración",
  reports: "Reportes",
};

const PERM_ITEMS: { group: string; key: keyof RolePermissions; label: string }[] = [
  { group: "cases", key: "caseView", label: "Ver casos" },
  { group: "cases", key: "caseCreate", label: "Crear casos" },
  { group: "cases", key: "caseEdit", label: "Editar casos" },
  { group: "cases", key: "caseDelete", label: "Eliminar casos" },
  { group: "cases", key: "caseAssign", label: "Asignar casos" },
  { group: "cases", key: "caseClose", label: "Cerrar casos" },
  { group: "cases", key: "caseReopen", label: "Reabrir casos" },
  { group: "investigation", key: "investigationView", label: "Ver investigación" },
  { group: "investigation", key: "investigationEdit", label: "Editar investigación" },
  { group: "plans", key: "planView", label: "Ver planes" },
  { group: "plans", key: "planCreate", label: "Crear planes" },
  { group: "plans", key: "planApprove", label: "Aprobar planes" },
  { group: "plans", key: "planReject", label: "Rechazar planes" },
  { group: "execution", key: "executionView", label: "Ver ejecución" },
  { group: "execution", key: "executionEdit", label: "Editar ejecución" },
  { group: "users", key: "userView", label: "Ver usuarios" },
  { group: "users", key: "userCreate", label: "Crear usuarios" },
  { group: "users", key: "userEdit", label: "Editar usuarios" },
  { group: "users", key: "userDelete", label: "Eliminar usuarios" },
  { group: "users", key: "userAssignRole", label: "Asignar roles" },
  { group: "admin", key: "adminAccess", label: "Acceso admin" },
  { group: "admin", key: "configEdit", label: "Configuración" },
  { group: "admin", key: "auditView", label: "Ver auditoría" },
  { group: "admin", key: "catalogEdit", label: "Catálogos" },
  { group: "admin", key: "areaEdit", label: "Áreas" },
  { group: "admin", key: "stationEdit", label: "Estaciones" },
  { group: "admin", key: "rollingStockEdit", label: "Material Rodante" },
  { group: "reports", key: "reportView", label: "Ver reportes" },
  { group: "reports", key: "reportExport", label: "Exportar" },
  { group: "reports", key: "kpiView", label: "Ver KPIs" },
];

export function AdminRoles() {
  const { roles, createRole, updateRole, deleteRole, updatePermissions, addAuditEntry } = useAdminStore();
  const [editRole, setEditRole] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", key: "", description: "", color: "#14814a" });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createRole({
      name: form.name,
      key: form.name.toLowerCase().replace(/\s+/g, "_"),
      description: form.description,
      color: form.color,
      permissions: {
        caseView: true, caseCreate: false, caseEdit: false, caseDelete: false, caseAssign: false, caseClose: false, caseReopen: false,
        investigationView: false, investigationEdit: false, planView: false, planCreate: false, planApprove: false, planReject: false,
        executionView: false, executionEdit: false, userView: false, userCreate: false, userEdit: false, userDelete: false, userAssignRole: false,
        adminAccess: false, configEdit: false, auditView: false, catalogEdit: false, areaEdit: false, stationEdit: false, rollingStockEdit: false,
        reportView: true, reportExport: false, kpiView: false,
      },
      isSystem: false,
    });
    addAuditEntry("role_changed", form.name, "Rol creado");
    setCreateOpen(false);
    setForm({ name: "", key: "", description: "", color: "#14814a" });
  };

  const handleDelete = (id: string, name: string) => {
    if (deleteRole(id)) {
      addAuditEntry("role_changed", name, "Rol eliminado");
    }
  };

  const editingRole = roles.find((r) => r.id === editRole);

  return (
    <div className="max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold font-display text-ink tracking-tight">Roles y Permisos</h1>
          <p className="text-[13px] text-ink-quiet mt-1">{roles.length} roles configurados</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Crear Rol
        </Button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl border border-line p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl grid place-items-center" style={{ backgroundColor: role.color + "15" }}>
                  <Shield className="h-5 w-5" style={{ color: role.color }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink">{role.name}</p>
                  <p className="text-[11px] text-ink-quiet">{role.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditRole(role.id)} className="h-7 w-7 rounded-md hover:bg-surface grid place-items-center transition-colors">
                  <Edit2 className="h-3.5 w-3.5 text-ink-quiet" />
                </button>
                {!role.isSystem && (
                  <button onClick={() => handleDelete(role.id, role.name)} className="h-7 w-7 rounded-md hover:bg-critical-soft grid place-items-center transition-colors">
                    <Trash2 className="h-3.5 w-3.5 text-critical" />
                  </button>
                )}
              </div>
            </div>
            {role.isSystem && (
              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-2 text-ink-faint">ROL DEL SISTEMA</span>
            )}
            <div className="flex flex-wrap gap-1.5">
              {PERM_ITEMS.filter((p) => role.permissions[p.key]).slice(0, 8).map((p) => (
                <span key={p.key} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-50 text-brand-700">
                  {p.label}
                </span>
              ))}
              {PERM_ITEMS.filter((p) => role.permissions[p.key]).length > 8 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-2 text-ink-quiet">
                  +{PERM_ITEMS.filter((p) => role.permissions[p.key]).length - 8} más
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        size="md"
        title="Crear Nuevo Rol"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.name.trim()}>Crear Rol</Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <Field label="Nombre del Rol" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Investigador" />
          </Field>
          <Field label="Descripción">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción breve del rol" />
          </Field>
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-8 w-8 rounded border border-line cursor-pointer" />
              <span className="text-[12px] text-ink-quiet font-mono">{form.color}</span>
            </div>
          </Field>
        </div>
      </Modal>

      {/* Edit Permissions Modal */}
      <Modal
        open={!!editRole}
        onClose={() => setEditRole(null)}
        size="lg"
        title={editingRole ? `Permisos — ${editingRole.name}` : ""}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditRole(null)}>Cerrar</Button>
          </div>
        }
      >
        {editingRole && (
          <div className="space-y-4 py-2">
            {Object.entries(PERM_GROUP_LABELS).map(([groupKey, groupLabel]) => {
              const items = PERM_ITEMS.filter((p) => p.group === groupKey);
              return (
                <div key={groupKey} className="bg-surface rounded-xl p-4">
                  <p className="text-[11px] font-semibold text-ink-quiet uppercase tracking-wider mb-3">{groupLabel}</p>
                  <div className="space-y-2">
                    {items.map((perm) => (
                      <label key={perm.key} className="flex items-center justify-between cursor-pointer group">
                        <span className="text-[13px] text-ink-soft group-hover:text-ink transition-colors">{perm.label}</span>
                        <button
                          onClick={() => {
                            if (editingRole.isSystem) return;
                            updatePermissions(editingRole.id, { [perm.key]: !editingRole.permissions[perm.key] });
                            addAuditEntry("permission_changed", editingRole.name, `${perm.label}: ${!editingRole.permissions[perm.key] ? "activado" : "desactivado"}`);
                          }}
                          className={cn(
                            "relative h-5 w-9 rounded-full transition-colors",
                            editingRole.permissions[perm.key] ? "bg-brand-600" : "bg-line-strong",
                            editingRole.isSystem && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <span className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                            editingRole.permissions[perm.key] ? "left-[18px]" : "left-0.5"
                          )} />
                        </button>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
