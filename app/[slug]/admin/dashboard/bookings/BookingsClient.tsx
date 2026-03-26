"use client";

import { Badge, Button, Group, Text, Stack, Tabs, Select } from "@mantine/core";
import { useState } from "react";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { StatusButtons } from "./StatusButtons";
import CancelAppointmentButton from "./CancelAppointmentButton";
import DayPicker from "./DayPicker";
import CreateAppointmentButton from "./CreateAppointmentButton";
import { getWhatsAppLink } from "@/lib/utils";
import { AppointmentItem } from "@/types/Appointment";

interface Props {
  items: AppointmentItem[];
  slug: string;
  business: any;
}

const statusConfig: Record<string, { color: string; label: string; border: string; bg: string }> = {
  PENDING:   { color: "yellow", label: "Pendiente",  border: "#f59e0b", bg: "#fffbeb" },
  CONFIRMED: { color: "green",  label: "Confirmada", border: "#22c55e", bg: "#f0fdf4" },
  CANCELLED: { color: "gray",   label: "Cancelada",  border: "#cbd5e1", bg: "#f8fafc" },
};

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

function AppointmentCard({ item, slug }: { item: AppointmentItem; slug: string }) {
  const [assignedTo, setAssignedTo] = useState(item.assignedTo);
  const [assignedToId, setAssignedToId] = useState(item.assignedToId ?? null);
  const [resources, setResources]   = useState<{ id: string; name: string }[]>([]);
  const [assigning, setAssigning]   = useState(false);
  const [loadingRes, setLoadingRes] = useState(false);
  const [showSelect, setShowSelect] = useState(false);

  const config = statusConfig[item.status] ?? statusConfig.CONFIRMED;

  const handleWhatsApp = () => {
    const date = new Date(item.start).toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long",
      timeZone: "America/Mexico_City",
    });
    const time = new Date(item.start).toLocaleTimeString("es-MX", {
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "America/Mexico_City",
    });
    const message =
      `Hola ${item.clientName} 👋, te recordamos que tienes una cita confirmada:\n\n` +
      `📋 *Servicio:* ${item.service}\n` +
      `📅 *Fecha:* ${date}\n` +
      `⏰ *Hora:* ${time}\n\n` +
      `¡Te esperamos! 😊`;
    window.open(getWhatsAppLink(item.phone, message), "_blank");
  };

  const handleLoadResources = async () => {
    if (resources.length > 0) { setShowSelect(true); return; }
    setLoadingRes(true);
    const data = await fetch(`/api/business/${slug}/staff?serviceId=${item.serviceId}`)
      .then((r) => r.json());
    setResources(data);
    setLoadingRes(false);
    setShowSelect(true);
  };

  const handleAssign = async (resourceId: string) => {
    setAssigning(true);
    const res = await fetch(`/api/business/${slug}/appointments/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: resourceId }),
    });

    if (res.ok) {
      const resource = resources.find((r) => r.id === resourceId);
      setAssignedTo(resource?.name ?? null);
      setAssignedToId(resourceId);
      setShowSelect(false);
    }
    setAssigning(false);
  };

  const resourceInitials = assignedTo
    ? assignedTo.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : null;

  return (
    <div style={{
      background: config.bg,
      borderLeft: `4px solid ${config.border}`,
      borderRadius: 12,
      border: `1px solid ${config.border}40`,
      borderLeftWidth: 4,
      opacity: item.status === "CANCELLED" ? 0.6 : 1,
      overflow: "hidden",
    }}>
      {/* Top */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 8px" }}>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
          {formatTime(item.start)} – {formatTime(item.end)}
        </Text>
        <Badge color={config.color} variant="filled" radius="xs" size="sm">
          {config.label}
        </Badge>
      </div>

      {/* Body */}
      <div style={{ padding: "0 14px 10px" }}>
        <Text fw={700} size="md" mb={4}>{item.clientName}</Text>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: assignedTo ? 8 : 0 }}>
          <Text size="xs">🏷️</Text>
          <Text size="xs" c="dimmed">{item.service}</Text>
        </div>
        {assignedTo && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f3f0ff", borderRadius: 99, padding: "3px 10px", marginTop: 4 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#7c3aed", color: "white", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {resourceInitials}
            </div>
            <Text size="xs" fw={600} style={{ color: "#7c3aed" }}>{assignedTo}</Text>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 14px 12px", borderTop: `1px solid ${config.border}20` }}>
        {/* Select inline para asignar recurso manualmente */}
        {item.status === "PENDING" && !assignedTo && (
          <div style={{ marginBottom: 8 }}>
            {showSelect ? (
              <Group gap={6} wrap="nowrap">
                <Select
                  placeholder="Asignar recurso"
                  size="xs"
                  style={{ flex: 1 }}
                  data={resources.map((r) => ({ value: r.id, label: r.name }))}
                  onChange={(v) => v && handleAssign(v)}
                  disabled={assigning}
                />
                <Button size="xs" variant="subtle" color="gray" onClick={() => setShowSelect(false)}>✕</Button>
              </Group>
            ) : (
              <Button
                size="xs" variant="subtle" color="violet"
                loading={loadingRes}
                onClick={handleLoadResources}
              >
                + Asignar recurso
              </Button>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {item.status === "PENDING" && (
            <StatusButtons
              appointmentId={item.id}
              slug={slug}
              serviceId={item.serviceId}
              assignedToId={assignedToId}
            />
          )}
          {item.status === "CONFIRMED" && (
            <Group gap="xs" justify="flex-end" wrap="nowrap">
              <Button
                size="compact-xs" variant="light" color="green"
                leftSection={<IconBrandWhatsapp size={14} />}
                onClick={handleWhatsApp}
              >
                Recordatorio
              </Button>
              <CancelAppointmentButton appointmentId={item.id} slug={slug} />
            </Group>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingsClient({ items, slug, business }: Props) {
  const [isDayBlocked, setIsDayBlocked] = useState(false);

  const pending   = items.filter((a) => a.status === "PENDING");
  const confirmed = items.filter((a) => a.status === "CONFIRMED");
  const cancelled = items.filter((a) => a.status === "CANCELLED");

  const KanbanColumn = ({ title, count, color, items: colItems }: {
    title: string; count: number; color: string; items: AppointmentItem[];
  }) => (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", height: "100%" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Text fw={700} size="sm">{title}</Text>
        <Badge color={color} variant="light" size="sm" circle>{count}</Badge>
      </div>
      <div style={{ padding: 12, flexDirection: "column", gap: 8, overflowY: "auto", flex: 1, minHeight: 0 }}>
        {colItems.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" mt="md">Sin citas</Text>
        ) : (
          colItems.map((item) => <AppointmentCard key={item.id} item={item} slug={slug} />)
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .bookings-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
        .bookings-kanban { display: flex; gap: 16px; height: 600px; align-items: stretch; }
        .bookings-list { display: none; }
        @media (max-width: 768px) {
          .bookings-kanban { display: none; }
          .bookings-list { display: block; }
          .bookings-header { flex-direction: column; }
        }
      `}</style>

      <div className="bookings-header">
        <div>
          <Text fw={700} size="xl">Citas del día</Text>
          <Text size="xs" c="dimmed">{business.name}</Text>
        </div>
        <CreateAppointmentButton
          slug={slug}
          primaryColor={business.primaryColor}
          services={business.services}
          disabled={isDayBlocked}
        />
      </div>

      <DayPicker onBlockedChange={setIsDayBlocked} />

      {isDayBlocked && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 16px", marginBottom: 12 }}>
          <Text size="sm" c="orange.7" fw={600}>🚫 Este día está marcado como festivo o cierre especial</Text>
        </div>
      )}

      {/* Desktop Kanban */}
      <div className="bookings-kanban">
        <KanbanColumn title="Pendientes" count={pending.length}   color="yellow" items={pending} />
        <KanbanColumn title="Confirmadas" count={confirmed.length} color="green"  items={confirmed} />
        <KanbanColumn title="Canceladas"  count={cancelled.length} color="gray"   items={cancelled} />
      </div>

      {/* Mobile Tabs */}
      <div className="bookings-list">
        <Tabs defaultValue="pending">
          <Tabs.List mb="md">
            <Tabs.Tab value="pending">
              Pendientes{pending.length > 0 && <Badge color="yellow" variant="light" size="xs" ml={4}>{pending.length}</Badge>}
            </Tabs.Tab>
            <Tabs.Tab value="confirmed">
              Confirmadas{confirmed.length > 0 && <Badge color="green" variant="light" size="xs" ml={4}>{confirmed.length}</Badge>}
            </Tabs.Tab>
            <Tabs.Tab value="cancelled">Canceladas</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            <Stack gap="sm">
              {pending.length === 0
                ? <Text size="sm" c="dimmed">Sin citas pendientes</Text>
                : pending.map((item) => <AppointmentCard key={item.id} item={item} slug={slug} />)}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="confirmed">
            <Stack gap="sm">
              {confirmed.length === 0
                ? <Text size="sm" c="dimmed">Sin citas confirmadas</Text>
                : confirmed.map((item) => <AppointmentCard key={item.id} item={item} slug={slug} />)}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="cancelled">
            <Stack gap="sm">
              {cancelled.length === 0
                ? <Text size="sm" c="dimmed">Sin citas canceladas</Text>
                : cancelled.map((item) => <AppointmentCard key={item.id} item={item} slug={slug} />)}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </div>
    </>
  );
}