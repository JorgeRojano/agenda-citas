"use client";

import { Badge, Button, Text, Stack, Tabs } from "@mantine/core";
import { useState, useEffect } from "react";
import DayPicker from "./DayPicker";
import CreateAppointmentButton from "./CreateAppointmentButton";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { AppointmentItem } from "@/types/Appointment";

interface Props {
  items: AppointmentItem[];
  slug: string;
  business: any;
}

const statusConfig: Record<string, { label: string; border: string; bg: string; btnBg: string; btnColor: string }> = {
  PENDING:   { label: "Pendiente",  border: "#f59e0b", bg: "#fffbeb", btnBg: "#f59e0b", btnColor: "white" },
  CONFIRMED: { label: "Confirmada", border: "#22c55e", bg: "#f0fdf4", btnBg: "#22c55e", btnColor: "white" },
  CANCELLED: { label: "Cancelada",  border: "#cbd5e1", bg: "#f8fafc", btnBg: "#e2e8f0", btnColor: "#64748b" },
};

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

function AppointmentCard({ item, onOpen }: { item: AppointmentItem; onOpen: (item: AppointmentItem) => void }) {
  const config          = statusConfig[item.status] ?? statusConfig.CONFIRMED;
  const resourceInitials = item.assignedTo
    ? item.assignedTo.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
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
        <span style={{ fontSize: 10, fontWeight: 700, background: config.btnBg, color: config.btnColor, padding: "2px 8px", borderRadius: 4 }}>
          {config.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "0 14px 10px" }}>
        <Text fw={700} size="md" mb={3}>{item.clientName}</Text>
        <Text size="xs" c="dimmed">🏷️ {item.service}</Text>
        {item.assignedTo ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f3f0ff", borderRadius: 99, padding: "3px 10px", marginTop: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#7c3aed", color: "white", fontSize: 7, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {resourceInitials}
            </div>
            <Text size="xs" fw={600} style={{ color: "#7c3aed" }}>{item.assignedTo}</Text>
          </div>
        ) : item.status === "PENDING" ? (
          <Text size="xs" c="red.4" mt={4} fs="italic">Sin recurso asignado</Text>
        ) : null}
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 14px 12px", borderTop: `1px solid ${config.border}20`, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => onOpen(item)}
          style={{
            fontSize: 12, fontWeight: 600, padding: "6px 14px",
            borderRadius: 8, background: config.btnBg, color: config.btnColor,
            border: "none", cursor: "pointer",
          }}
        >
          Ver detalle →
        </button>
      </div>
    </div>
  );
}

export default function BookingsClient({ items, slug, business }: Props) {
  const [isDayBlocked, setIsDayBlocked] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AppointmentItem | null>(null);
  const [localItems, setLocalItems]     = useState<AppointmentItem[]>(items);

  useEffect(() => {
    setLocalItems(items);
    setSelectedItem(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  const handleResourceUpdated = (appointmentId: string, assignedToId: string, assignedTo: string) => {
    setLocalItems((prev) =>
      prev.map((i) => i.id === appointmentId ? { ...i, assignedToId, assignedTo } : i),
    );
    setSelectedItem((prev) =>
      prev?.id === appointmentId ? { ...prev, assignedToId, assignedTo } : prev,
    );
  };

  const handleStatusUpdated = (appointmentId: string, status: string) => {
    setLocalItems((prev) =>
      prev.map((i) => i.id === appointmentId ? { ...i, status } : i),
    );
  };

  const pending   = localItems.filter((a) => a.status === "PENDING");
  const confirmed = localItems.filter((a) => a.status === "CONFIRMED");
  const cancelled = localItems.filter((a) => a.status === "CANCELLED");

  const KanbanColumn = ({ title, count, color, items: colItems }: {
    title: string; count: number; color: string; items: AppointmentItem[];
  }) => (
    <div style={{ background: "white", borderRadius: 14, border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", height: "100%" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Text fw={700} size="sm">{title}</Text>
        <Badge color={color} variant="light" size="sm" circle>{count}</Badge>
      </div>
      <div style={{ padding: 12, overflowY: "auto", flex: 1, minHeight: 0 }}>
        {colItems.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" mt="md">Sin citas</Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {colItems.map((item) => <AppointmentCard key={item.id} item={item} onOpen={setSelectedItem} />)}
          </div>
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
                : pending.map((item) => <AppointmentCard key={item.id} item={item} onOpen={setSelectedItem} />)}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="confirmed">
            <Stack gap="sm">
              {confirmed.length === 0
                ? <Text size="sm" c="dimmed">Sin citas confirmadas</Text>
                : confirmed.map((item) => <AppointmentCard key={item.id} item={item} onOpen={setSelectedItem} />)}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="cancelled">
            <Stack gap="sm">
              {cancelled.length === 0
                ? <Text size="sm" c="dimmed">Sin citas canceladas</Text>
                : cancelled.map((item) => <AppointmentCard key={item.id} item={item} onOpen={setSelectedItem} />)}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </div>

      {/* Drawer / Bottom sheet */}
      {selectedItem && (
        <AppointmentDrawer
          item={selectedItem}
          slug={slug}
          onClose={() => setSelectedItem(null)}
          onResourceUpdated={handleResourceUpdated}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </>
  );
}