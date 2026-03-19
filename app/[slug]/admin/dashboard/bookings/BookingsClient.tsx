"use client";

import { Badge, Button, Group, Text, Stack, Tabs } from "@mantine/core";
import { IconBrandWhatsapp, IconLock, IconRefresh } from "@tabler/icons-react";
import { StatusButtons } from "./StatusButtons";
import CancelAppointmentButton from "./CancelAppointmentButton";
import UnblockButton from "./UnblockButton";
import BlockTimeButton from "./BlockTimeButton";
import DayPicker from "./DayPicker";
import CreateAppointmentButton from "./CreateAppointmentButton";
import { Business } from "@/types/Business";
import { getWhatsAppLink } from "@/lib/utils";

type AppointmentItem = {
  type: "appointment";
  id: string;
  start: Date;
  end: Date;
  clientName: string;
  service: string;
  status: string;
  phone: string;
};

type BlockedItem = {
  type: "blocked";
  id: string;
  start: Date;
  end: Date;
};

type Item = AppointmentItem | BlockedItem;

interface Props {
  items: Item[];
  slug: string;
  business: Business;
}

const statusConfig: Record<
  string,
  { color: string; label: string; border: string; bg: string }
> = {
  PENDING: {
    color: "yellow",
    label: "Pendiente",
    border: "#f59e0b",
    bg: "#fffbeb",
  },
  CONFIRMED: {
    color: "green",
    label: "Confirmada",
    border: "#22c55e",
    bg: "#f0fdf4",
  },
  CANCELLED: {
    color: "gray",
    label: "Cancelada",
    border: "#cbd5e1",
    bg: "#f8fafc",
  },
};

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

function AppointmentCard({ item, slug }: { item: Item; slug: string }) {
  if (item.type === "blocked") {
    return (
      <div
        style={{
          background: "#fff1f2",
          borderLeft: "4px solid #f43f5e",
          borderRadius: 12,
          padding: "14px 16px",
          position: "relative",
          border: "1px solid #fecdd3",
          borderLeftWidth: 4,
        }}
      >
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <Badge color="red" variant="filled" radius="xs" size="sm">
            Bloqueado
          </Badge>
        </div>
        <Text size="xs" fw={700} c="dimmed" tt="uppercase">
          {formatTime(item.start)} – {formatTime(item.end)}
        </Text>
        <Text fw={700} c="red.7" mt={4} mb={10}>
          Tiempo bloqueado
        </Text>
        <Group justify="flex-end">
          <UnblockButton blockId={item.id} slug={slug} />
        </Group>
      </div>
    );
  }

  const config = statusConfig[item.status] ?? statusConfig.CONFIRMED;

  const handleWhatsApp = () => {
    if (item.type !== "appointment") return;

    const cleanPhone = item.phone.replace(/\D/g, "");
    const date = new Date(item.start).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "America/Mexico_City",
    });
    const time = new Date(item.start).toLocaleTimeString("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Mexico_City",
    });

    const message = encodeURIComponent(
      `Hola ${item.clientName} 👋, te recordamos que tienes una cita confirmada:\n\n` +
        `📋 *Servicio:* ${item.service}\n` +
        `📅 *Fecha:* ${date}\n` +
        `⏰ *Hora:* ${time}\n\n` +
        `¡Te esperamos! 😊`,
    );

    const whatsappUrl = getWhatsAppLink(item.phone, message);

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div
      style={{
        background: config.bg,
        borderLeft: `4px solid ${config.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        position: "relative",
        border: `1px solid ${config.border}40`,
        borderLeftWidth: 4,
        opacity: item.status === "CANCELLED" ? 0.6 : 1,
      }}
    >
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <Badge color={config.color} variant="filled" radius="xs" size="sm">
          {config.label}
        </Badge>
      </div>
      <Text size="xs" fw={700} c="dimmed" tt="uppercase">
        {formatTime(item.start)} – {formatTime(item.end)}
      </Text>
      <Text fw={700} size="md" mt={4}>
        {item.clientName}
      </Text>
      <Text size="xs" c="dimmed" mt={2} mb={10}>
        Servicio: {item.service}
      </Text>
      <Group justify="flex-end">
        {item.status === "PENDING" && (
          <StatusButtons appointmentId={item.id} slug={slug} />
        )}
        {item.status === "CONFIRMED" && (
          <Group gap="xs" justify="flex-end">
            <Button
              size="compact-xs"
              variant="light"
              color="green"
              leftSection={<IconBrandWhatsapp size={14} />}
              onClick={handleWhatsApp}
            >
              Recordatorio
            </Button>
            <CancelAppointmentButton appointmentId={item.id} slug={slug} />
          </Group>
        )}
      </Group>
    </div>
  );
}

export default function BookingsClient({ items, slug, business }: Props) {
  const appointments = items.filter(
    (i) => i.type === "appointment",
  ) as AppointmentItem[];
  const blocked = items.filter((i) => i.type === "blocked") as BlockedItem[];

  const pending = appointments.filter((a) => a.status === "PENDING");
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED");
  const cancelled = appointments.filter((a) => a.status === "CANCELLED");

  const KanbanColumn = ({
    title,
    count,
    color,
    items: colItems,
  }: {
    title: string;
    count: number;
    color: string;
    items: Item[];
  }) => (
    <div
      style={{
        background: "white",
        borderRadius: 14,
        border: "1px solid #f1f5f9",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text fw={700} size="sm">
          {title}
        </Text>
        <Badge color={color} variant="light" size="sm" circle>
          {count}
        </Badge>
      </div>
      <div
        style={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          flex: 1,
        }}
      >
        {colItems.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" mt="md">
            Sin citas
          </Text>
        ) : (
          colItems.map((item) => (
            <AppointmentCard key={item.id} item={item} slug={slug} />
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .bookings-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 16px; gap: 12px;
        }
        .bookings-kanban {
          display: flex; gap: 16px; height: 600px;
        }
        .bookings-list { display: none; }

        @media (max-width: 768px) {
          .bookings-kanban { display: none; }
          .bookings-list { display: block; }
          .bookings-header { flex-direction: column; }
        }
      `}</style>

      {/* Header */}
      <div className="bookings-header">
        <div>
          <Text fw={700} size="xl">
            Citas del día
          </Text>
          <Text size="xs" c="dimmed">
            {business.name}
          </Text>
        </div>
        <Group gap="xs">
          <CreateAppointmentButton
            slug={slug}
            primaryColor={business.primaryColor}
          />
          <BlockTimeButton slug={slug} />
        </Group>
      </div>

      {/* Date picker */}
      <DayPicker />

      {/* ── DESKTOP: Kanban ── */}
      <div className="bookings-kanban">
        <KanbanColumn
          title="Pendientes"
          count={pending.length}
          color="yellow"
          items={pending}
        />
        <KanbanColumn
          title="Confirmadas"
          count={confirmed.length}
          color="green"
          items={[...confirmed, ...blocked]}
        />
        <KanbanColumn
          title="Canceladas"
          count={cancelled.length}
          color="gray"
          items={cancelled}
        />
      </div>

      {/* ── MOBILE: Lista con tabs ── */}
      <div className="bookings-list">
        <Tabs defaultValue="pending">
          <Tabs.List mb="md">
            <Tabs.Tab value="pending">
              Pendientes{" "}
              {pending.length > 0 && (
                <Badge color="yellow" variant="light" size="xs" ml={4}>
                  {pending.length}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab value="confirmed">
              Confirmadas{" "}
              {confirmed.length > 0 && (
                <Badge color="green" variant="light" size="xs" ml={4}>
                  {confirmed.length}
                </Badge>
              )}
            </Tabs.Tab>
            <Tabs.Tab value="cancelled">Canceladas</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="pending">
            <Stack gap="sm">
              {pending.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Sin citas pendientes
                </Text>
              ) : (
                pending.map((item) => (
                  <AppointmentCard key={item.id} item={item} slug={slug} />
                ))
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="confirmed">
            <Stack gap="sm">
              {[...confirmed, ...blocked].length === 0 ? (
                <Text size="sm" c="dimmed">
                  Sin citas confirmadas
                </Text>
              ) : (
                [...confirmed, ...blocked].map((item) => (
                  <AppointmentCard key={item.id} item={item} slug={slug} />
                ))
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="cancelled">
            <Stack gap="sm">
              {cancelled.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Sin citas canceladas
                </Text>
              ) : (
                cancelled.map((item) => (
                  <AppointmentCard key={item.id} item={item} slug={slug} />
                ))
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </div>
    </>
  );
}
