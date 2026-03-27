"use client";

import { Button, Select, Stack, Text, Group } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { IconBrandWhatsapp, IconCheck, IconX, IconCalendarOff } from "@tabler/icons-react";
import { getWhatsAppLink } from "@/lib/utils";
import { AppointmentItem } from "@/types/Appointment";

interface Props {
  item: AppointmentItem | null;
  slug: string;
  onClose: () => void;
  onResourceUpdated?: (appointmentId: string, assignedToId: string, assignedTo: string) => void;
  onStatusUpdated?: (appointmentId: string, status: string) => void;
}

const statusConfig: Record<string, { label: string; border: string; bg: string; badgeBg: string; badgeColor: string }> = {
  PENDING:   { label: "Pendiente",  border: "#f59e0b", bg: "#fffbeb", badgeBg: "#fffbeb", badgeColor: "#b45309" },
  CONFIRMED: { label: "Confirmada", border: "#22c55e", bg: "#f0fdf4", badgeBg: "#f0fdf4", badgeColor: "#15803d" },
  CANCELLED: { label: "Cancelada",  border: "#cbd5e1", bg: "#f8fafc", badgeBg: "#f1f5f9", badgeColor: "#64748b" },
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function AppointmentDrawer({ item, slug, onClose, onResourceUpdated, onStatusUpdated }: Props) {
  const router = useRouter();
  const [assignedToId, setAssignedToId]   = useState<string | null>(item?.assignedToId ?? null);
  const [assignedTo, setAssignedTo]       = useState<string | null>(item?.assignedTo ?? null);
  const [resources, setResources]         = useState<{ id: string; name: string; specialty?: string }[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [savingResource, setSavingResource] = useState(false);

  // Sync cuando cambia el item
  useEffect(() => {
    setAssignedToId(item?.assignedToId ?? null);
    setAssignedTo(item?.assignedTo ?? null);
  }, [item?.id]);

  // Cargar recursos al abrir — filtrar por fecha de la cita
  useEffect(() => {
    if (!item) return;
    const dateForApi = new Date(item.start).toString();
    fetch(`/api/business/${slug}/staff?serviceId=${item.serviceId}&date=${encodeURIComponent(dateForApi)}`)
      .then((r) => r.json())
      .then(setResources);
  }, [item?.id, slug]);

  if (!item) return null;

  const config   = statusConfig[item.status] ?? statusConfig.CONFIRMED;
  const initials = getInitials(item.clientName);
  const isPast   = new Date(item.start) < new Date(new Date().toLocaleDateString("en-CA") + "T00:00:00");

  const formatDate = (d: Date) => new Date(d).toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", timeZone: "America/Mexico_City",
  });
  const formatTime = (d: Date) => new Date(d).toLocaleTimeString("es-MX", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City",
  });

  const handleAssignResource = async (resourceId: string) => {
    setSavingResource(true);
    const res = await fetch(`/api/business/${slug}/appointments/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: resourceId }),
    });
    if (res.ok) {
      const found = resources.find((r) => r.id === resourceId);
      const name  = found?.name ?? null;
      setAssignedToId(resourceId);
      setAssignedTo(name);
      if (name) onResourceUpdated?.(item.id, resourceId, name);
    }
    setSavingResource(false);
  };

  const updateStatus = async (newStatus: string, resourceId?: string | null) => {
    setLoadingAction(newStatus);
    try {
      const body: any = { status: newStatus };
      if (resourceId !== undefined) body.assignedToId = resourceId;

      const res = await fetch(`/api/business/${slug}/appointments/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.appointment) {
        const appo      = data.appointment;
        const startDate = new Date(appo.startTime);
        const fechaMx   = startDate.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
        const horaMx    = startDate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });

        const message = newStatus === "CONFIRMED"
          ? `*¡Cita Confirmada!* ✅\n\nHola *${appo.clientName}*, te confirmamos tu cita:\n\n🔹 *Servicio:* ${appo.service.name}\n📅 *Día:* ${fechaMx}\n⏰ *Hora:* ${horaMx}\n📍 *Lugar:* ${appo.business.name}\n\n¡Te esperamos! 😊`
          : `*Aviso de Cita* 🗓️\n\nHola *${appo.clientName}*, lamentamos informarte que no pudimos confirmar tu espacio para *${appo.service.name}* en el horario solicitado.\n\n🙏 Por favor, intenta agendar en otro horario disponible. ¡Gracias!`;

        window.open(getWhatsAppLink(appo.phone, message), "_blank");
        notifications.show({
          title:    newStatus === "CONFIRMED" ? "Cita confirmada" : "Cita rechazada",
          message:  "Estado actualizado y WhatsApp preparado.",
          color:    newStatus === "CONFIRMED" ? "green" : "red",
          autoClose: 3000,
        });
        onStatusUpdated?.(item.id, newStatus);
        router.refresh();
        onClose();
      } else throw new Error();
    } catch {
      notifications.show({ title: "Error", message: "No se pudo actualizar la cita.", color: "red" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirm = () => {
    if (!assignedToId) {
      notifications.show({ title: "Recurso requerido", message: "Asigna un recurso antes de confirmar.", color: "yellow" });
      return;
    }
    updateStatus("CONFIRMED");
  };

  const handleCancel = async () => {
    if (!window.confirm("¿Cancelar esta cita?")) return;
    setLoadingAction("CANCELLED");
    try {
      const res = await fetch(`/api/business/${slug}/appointments/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        notifications.show({ title: "Cita cancelada", message: "Estado actualizado.", color: "gray", icon: <IconCheck size={16} /> });
        onStatusUpdated?.(item.id, "CANCELLED");
        router.refresh();
        onClose();
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleWhatsApp = () => {
    const message =
      `Hola ${item.clientName} 👋, te recordamos que tienes una cita confirmada:\n\n` +
      `📋 *Servicio:* ${item.service}\n` +
      `📅 *Fecha:* ${formatDate(item.start)}\n` +
      `⏰ *Hora:* ${formatTime(item.start)}\n\n` +
      `¡Te esperamos! 😊`;
    window.open(getWhatsAppLink(item.phone, message), "_blank");
  };

  const content = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Text fw={700} size="sm">Detalle de cita</Text>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "#f1f5f9", border: "none", cursor: "pointer", fontSize: 14, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Cliente */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="sm">{item.clientName}</Text>
            <Text size="xs" c="dimmed" mt={2}>{item.phone}</Text>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, background: config.badgeBg, color: config.badgeColor, padding: "3px 10px", borderRadius: 99, border: `1px solid ${config.border}40`, flexShrink: 0 }}>
            {config.label}
          </span>
        </div>

        {/* Info */}
        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text size="xs" c="dimmed">Servicio</Text>
            <Text size="xs" fw={600}>{item.service}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text size="xs" c="dimmed">Fecha</Text>
            <Text size="xs" fw={600} style={{ textTransform: "capitalize" }}>{formatDate(item.start)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text size="xs" c="dimmed">Hora</Text>
            <Text size="xs" fw={600}>{formatTime(item.start)} — {formatTime(item.end)}</Text>
          </div>
        </div>

        {/* Recurso */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.05em" }}>Recurso asignado</Text>
            {savingResource && <Text size="xs" c="dimmed">Guardando...</Text>}
          </div>
          {item.status !== "CANCELLED" && !isPast ? (
            <>
              {/* Desktop — Select de Mantine */}
              <div className="resource-select-desktop">
                <Select
                  placeholder="Sin asignar"
                  size="sm"
                  disabled={savingResource}
                  data={resources.map((r) => ({ value: r.id, label: r.specialty ? `${r.name} · ${r.specialty}` : r.name }))}
                  value={assignedToId}
                  onChange={(v) => v && handleAssignResource(v)}
                  clearable={false}
                />
              </div>
              {/* Mobile — select nativo para evitar temblor */}
              <div className="resource-select-mobile">
                <select
                  value={assignedToId ?? ""}
                  disabled={savingResource}
                  onChange={(e) => e.target.value && handleAssignResource(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px",
                    borderRadius: 8, border: "1px solid #e2e8f0",
                    fontSize: 14, background: "white",
                    color: assignedToId ? "#0f172a" : "#94a3b8",
                    opacity: savingResource ? 0.6 : 1,
                  }}
                >
                  <option value="">Sin asignar</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.specialty ? `${r.name} · ${r.specialty}` : r.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <Text size="sm" c="dimmed" fs="italic">{assignedTo ?? "Sin recurso"}</Text>
          )}
        </div>

        {/* Alerta sin recurso */}
        {item.status === "PENDING" && !assignedToId && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px" }}>
            <Text size="xs" c="yellow.8" fw={600}>⚠️ Asigna un recurso antes de confirmar</Text>
          </div>
        )}
      </div>

      {/* Footer acciones */}
      <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        {item.status === "PENDING" && !isPast && (
          <Group gap={8}>
            <Button flex={1} color="green" loading={loadingAction === "CONFIRMED"} disabled={!assignedToId || !!loadingAction} onClick={handleConfirm}>
              ✓ Confirmar
            </Button>
            <Button flex={1} color="red" variant="light" loading={loadingAction === "CANCELLED"} disabled={!!loadingAction} onClick={() => updateStatus("CANCELLED")}>
              ✕ Rechazar
            </Button>
          </Group>
        )}
        {item.status === "CONFIRMED" && !isPast && (
          <>
            <Button color="red" variant="light" loading={loadingAction === "CANCELLED"} disabled={!!loadingAction} onClick={handleCancel} leftSection={<IconCalendarOff size={15} />} fullWidth>
              Cancelar cita
            </Button>
            <Button variant="light" color="green" fullWidth leftSection={<IconBrandWhatsapp size={15} />} onClick={handleWhatsApp}>
              Enviar recordatorio WhatsApp
            </Button>
          </>
        )}
        {isPast && (
          <div style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 8, padding: "10px 14px" }}>
            <Text size="xs" c="dimmed" ta="center">Esta cita es de un día pasado — no se puede modificar</Text>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .drawer-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 200;
        }
        .drawer-panel {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: 360px; background: white;
          box-shadow: -4px 0 24px rgba(0,0,0,0.1);
          z-index: 201; display: flex; flex-direction: column;
          animation: slideIn 0.2s ease;
        }
        .bottom-sheet-panel {
          position: fixed; left: 0; right: 0; bottom: 0;
          background: white; border-radius: 16px 16px 0 0;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.12);
          z-index: 201; display: flex; flex-direction: column;
          max-height: 90vh;
          animation: slideUp 0.2s ease;
        }
        .bottom-sheet-handle {
          display: flex; justify-content: center; padding: 10px 0 4px;
        }
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .resource-select-desktop { display: block; }
        .resource-select-mobile  { display: none; }
        @media (min-width: 768px) { .bottom-sheet-panel { display: none; } }
        @media (max-width: 767px) {
          .drawer-panel { display: none; }
          .resource-select-desktop { display: none; }
          .resource-select-mobile  { display: block; }
        }
      `}</style>

      <div className="drawer-overlay" onClick={onClose} />

      {/* Desktop drawer */}
      <div className="drawer-panel">{content}</div>

      {/* Mobile bottom sheet */}
      <div className="bottom-sheet-panel">
        <div className="bottom-sheet-handle">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e2e8f0" }} />
        </div>
        {content}
      </div>
    </>
  );
}