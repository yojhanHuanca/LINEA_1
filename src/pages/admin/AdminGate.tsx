import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Modal } from "@/design-system/primitives/Modal";
import { Button } from "@/design-system/primitives/Button";
import { Input, Field } from "@/design-system/primitives/Input";

interface AdminGateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminGate({ open, onClose, onSuccess }: AdminGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const navigate = useNavigate();

  const handleAccess = () => {
    if (code === "ADMIN-SIGMA-2026") {
      setError(false);
      setCode("");
      onSuccess();
      navigate("/admin");
    } else {
      setError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAccess();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-200 grid place-items-center">
            <Lock className="h-5 w-5 text-brand-700" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-ink">Acceso Seguro</p>
            <p className="text-[12px] text-ink-quiet font-normal">Centro de Administración</p>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAccess} disabled={!code.trim()}>
            Ingresar
          </Button>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        <p className="text-[13px] text-ink-soft">
          Ingrese el <strong className="text-ink">Código Maestro de Administración</strong> para acceder al panel de configuración del sistema.
        </p>

        <Field label="Código de Seguridad" required error={error ? "Código inválido. Intente nuevamente." : undefined}>
          <div className="relative">
            <Input
              type={showCode ? "text" : "password"}
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(false); }}
              onKeyDown={handleKeyDown}
              placeholder="ADMIN-SIGMA-2026"
              className="pr-10 font-mono tracking-wider text-center text-[15px]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-quiet transition-colors"
            >
              {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-critical-soft border border-critical/20 text-[12px] text-critical-ink animate-[fadeIn_0.2s_var(--ease-out)]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-critical" />
            <span>Código de seguridad incorrecto. Este intento será registrado en la auditoría.</span>
          </div>
        )}

        <div className="rounded-lg bg-surface p-3 border border-line-soft">
          <p className="text-[11px] text-ink-faint leading-relaxed">
            Este panel contiene configuración crítica del sistema. Solo el personal autorizado de
            Seguridad Operativa puede acceder. Todas las acciones son registradas en bitácora de auditoría.
          </p>
        </div>
      </div>
    </Modal>
  );
}
