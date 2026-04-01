"use client";

import { Badge, Text, Stack, Tabs, SegmentedControl } from "@mantine/core";
import { useState, useEffect } from "react";
import DayPicker from "./DayPicker";
import CreateAppointmentButton from "./CreateAppointmentButton";
import { AppointmentDrawer } from "./AppointmentDrawer";
import { AppointmentItem } from "@/types/Appointment";

interface StaffMember {
  id: string;
  name: string;
  specialty: string | null;
}

interface Props {
  items: AppointmentItem[];
  slug: string;
  business: any;
  staff: StaffMember[];
}

const statusConfig: Record<string, { label: string; border: string; bg: string; btnBg: string; btnColor: string }> = {
  PENDING:   { label: "Pendiente",  border: "#f59e0b", bg: "var(--mantine-color-yellow-light)",  btnBg: "#f59e0b", btnColor: "white" },
  CONFIRMED: { label: "Confirmada", border: "#22c55e", bg: "var(--mantine-color-green-light)",   btnBg: "#22c55e", btnColor: "white" },
  CANCELLED: { label: "Cancelada",  border: "#cbd5e1", bg: "var(--mantine-color-default-hover)", btnBg: "#94a3b8", btnColor: "white" },
};

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#6366f1","#f59e0b","#10b981","#ec4899","#3b82f6","#f97316"];
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function AppointmentCard({ item, onOpen }: { item: AppointmentItem; onOpen: (item: AppointmentItem) => void }) {
  const config           = statusConfig[item.status] ?? statusConfig.CONFIRMED;
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 8px" }}>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
          {formatTime(item.start)} – {formatTime(item.end)}
        </Text>
        <span style={{ fontSize: 10, fontWeight: 700, background: config.btnBg, color: config.btnColor, padding: "2px 8px", borderRadius: 4 }}>
          {config.label}
        </span>
      </div>
      <div style={{ padding: "0 14px 10px" }}>
        <Text fw={700} size="md" mb={3}>{item.clientName}</Text>
        <Text size="xs" c="dimmed">🏷️ {item.service}</Text>
        {item.assignedTo ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "var(--mantine-color-violet-light)", borderRadius: 99, padding: "3px 10px", marginTop: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#7c3aed", color: "white", fontSize: 7, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {resourceInitials}
            </div>
            <Text size="xs" fw={600} style={{ color: "var(--mantine-color-violet-light-color)" }}>{item.assignedTo}</Text>
          </div>
        ) : item.status === "PENDING" ? (
          <Text size="xs" c="red.4" mt={4} fs="italic">Sin recurso asignado</Text>
        ) : null}
      </div>
      <div style={{ padding: "8px 14px 12px", borderTop: `1px solid ${config.border}20`, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => onOpen(item)}
          style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, background: config.btnBg, color: config.btnColor, border: "none", cursor: "pointer" }}
        >
          Ver detalle →
        </button>
      </div>
    </div>
  );
}

function KanbanColumn({ title, count, color, items: colItems, onOpen }: {
  title: string; count: number; color: string; items: AppointmentItem[]; onOpen: (item: AppointmentItem) => void;
}) {
  return (
    <div style={{ background: "var(--mantine-color-body)", borderRadius: 14, border: "1px solid var(--mantine-color-default-border)", display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", height: "100%" }}>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--mantine-color-default-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <Text fw={700} size="sm">{title}</Text>
        <Badge color={color} variant="light" size="sm" circle>{count}</Badge>
      </div>
      <div style={{ padding: 12, overflowY: "auto", flex: 1, minHeight: 0 }}>
        {colItems.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" mt="md">Sin citas</Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {colItems.map((item) => <AppointmentCard key={item.id} item={item} onOpen={onOpen} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingsClient({ items, slug, business, staff }: Props) {
  const hasStaff = business.hasStaff ?? false;
  const colorName = business.primaryColor ?? "blue";

  const [isDayBlocked, setIsDayBlocked]   = useState(false);
  const [selectedItem, setSelectedItem]   = useState<AppointmentItem | null>(null);
  const [localItems, setLocalItems]       = useState<AppointmentItem[]>(items);
  const [viewMode, setViewMode]           = useState<"all" | "staff">(hasStaff ? "staff" : "all");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(
    staff.length > 0 ? staff[0].id : null
  );

  useEffect(() => {
    setLocalItems(items);
    setSelectedItem(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(items)]);

  const handleResourceUpdated = (appointmentId: string, assignedToId: string, assignedTo: string) => {
    setLocalItems((prev) => prev.map((i) => i.id === appointmentId ? { ...i, assignedToId, assignedTo } : i));
    setSelectedItem((prev) => prev?.id === appointmentId ? { ...prev, assignedToId, assignedTo } : prev);
  };

  const handleStatusUpdated = (appointmentId: string, status: string) => {
    setLocalItems((prev) => prev.map((i) => i.id === appointmentId ? { ...i, status } : i));
  };

  // Items filtrados según vista
  const visibleItems = viewMode === "staff" && selectedStaffId
    ? localItems.filter((a) => a.assignedToId === selectedStaffId)
    : localItems;

  const pending   = visibleItems.filter((a) => a.status === "PENDING");
  const confirmed = visibleItems.filter((a) => a.status === "CONFIRMED");
  const cancelled = visibleItems.filter((a) => a.status === "CANCELLED");

  return (
    <>
      <style>{`
        .bookings-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; gap: 12px; }
        .bookings-kanban { display: flex; gap: 16px; height: 600px; align-items: stretch; }
        .bookings-list { display: none; }
        .staff-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .staff-scroll::-webkit-scrollbar { display: none; }
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Toggle solo si hasStaff */}
          {hasStaff && (
            <SegmentedControl
              size="xs"
              color={colorName}
              value={viewMode}
              onChange={(v) => setViewMode(v as "all" | "staff")}
              data={[
                { label: "Todos", value: "all" },
                { label: "Por staff", value: "staff" },
              ]}
            />
          )}
          <CreateAppointmentButton
            slug={slug}
            primaryColor={business.primaryColor}
            services={business.services}
            disabled={isDayBlocked}
            hasStaff={hasStaff}
          />
        </div>
      </div>

      <DayPicker onBlockedChange={setIsDayBlocked} />

      {isDayBlocked && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 16px", marginBottom: 12 }}>
          <Text size="sm" c="orange.7" fw={600}>🚫 Este día está marcado como festivo o cierre especial</Text>
        </div>
      )}

      {/* Avatars de staff — solo en modo "Por staff" */}
      {hasStaff && viewMode === "staff" && staff.length > 0 && (
        <>
          <div className="staff-scroll" style={{ marginBottom: 14 }}>
            {staff.map((s) => {
              const isSel = selectedStaffId === s.id;
              const color = getAvatarColor(s.name);
              const count = localItems.filter((a) => a.assignedToId === s.id).length;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStaffId(s.id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", flexShrink: 0 }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: color, color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700,
                    border: isSel ? `3px solid var(--mantine-color-${colorName}-6)` : "3px solid transparent",
                    boxShadow: isSel ? `0 0 0 2px var(--mantine-color-${colorName}-light)` : "none",
                    transition: "all 0.15s",
                  }}>
                    {getInitials(s.name)}
                  </div>
                  <Text size="xs" c={isSel ? colorName : "dimmed"} fw={isSel ? 600 : 400} style={{ whiteSpace: "nowrap" }}>
                    {s.name.split(" ")[0]}
                  </Text>
                  <Text size="xs" fw={700} c={count > 0 ? colorName : "dimmed"}>{count}</Text>
                </div>
              );
            })}
          </div>

          {/* Barra de resumen del staff seleccionado */}
          {selectedStaffId && (() => {
            const s         = staff.find((x) => x.id === selectedStaffId);
            if (!s) return null;
            const total     = localItems.filter((a) => a.assignedToId === s.id).length;
            const confirmed = localItems.filter((a) => a.assignedToId === s.id && a.status === "CONFIRMED").length;
            const pending   = localItems.filter((a) => a.assignedToId === s.id && a.status === "PENDING").length;
            const color     = getAvatarColor(s.name);
            return (
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", marginBottom: 14,
                background: "var(--mantine-color-body)",
                borderRadius: 10, border: "1px solid var(--mantine-color-default-border)",
              }}>
                <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                  {getInitials(s.name)}
                </div>
                <div>
                  <Text size="sm" fw={600}>{s.name}</Text>
                  {s.specialty && <Text size="xs" c="dimmed">{s.specialty}</Text>}
                </div>
                <div style={{ display: "flex", gap: 16, marginLeft: "auto", alignItems: "center" }}>
                  <div style={{ width: 1, height: 32, background: "var(--mantine-color-default-border)" }} />
                  <div style={{ textAlign: "center" }}>
                    <Text size="lg" fw={500}>{total}</Text>
                    <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.04em" }}>Hoy</Text>
                  </div>
                  <div style={{ width: 1, height: 32, background: "var(--mantine-color-default-border)" }} />
                  <div style={{ textAlign: "center" }}>
                    <Text size="lg" fw={500} c={`${colorName}.6`}>{confirmed}</Text>
                    <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.04em" }}>Conf.</Text>
                  </div>
                  <div style={{ width: 1, height: 32, background: "var(--mantine-color-default-border)" }} />
                  <div style={{ textAlign: "center" }}>
                    <Text size="lg" fw={500} c="yellow.6">{pending}</Text>
                    <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: "0.04em" }}>Pend.</Text>
                  </div>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Desktop Kanban */}
      <div className="bookings-kanban">
        <KanbanColumn title="Pendientes"  count={pending.length}   color="yellow" items={pending}   onOpen={setSelectedItem} />
        <KanbanColumn title="Confirmadas" count={confirmed.length} color="green"  items={confirmed} onOpen={setSelectedItem} />
        <KanbanColumn title="Canceladas"  count={cancelled.length} color="gray"   items={cancelled} onOpen={setSelectedItem} />
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

      {selectedItem && (
        <AppointmentDrawer
          item={selectedItem}
          slug={slug}
          onClose={() => setSelectedItem(null)}
          onResourceUpdated={handleResourceUpdated}
          onStatusUpdated={handleStatusUpdated}
          hasStaff={hasStaff}
        />
      )}
    </>
  );
}