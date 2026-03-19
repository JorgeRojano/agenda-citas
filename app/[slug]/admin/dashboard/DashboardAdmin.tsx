"use client";

import { Text, SimpleGrid, Card, Group, Badge, Button, ThemeIcon } from "@mantine/core";
import { IconCalendar, IconPlus, IconLock, IconShare, IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";
import { useRouter, useParams } from "next/navigation";

interface Props {
  business: { id: string; name: string; slug: string };
  stats: {
    todayTotal: number;
    todayPending: number;
    todayConfirmed: number;
    weekCount: number;
    weekGrowth: number | null;
    monthCompleted: number;
    monthCancelled: number;
  };
  upcomingToday: {
    id: string;
    clientName: string;
    service: string;
    startTime: string;
    status: string;
  }[];
  weekDayCounts: Record<number, number>;
}

const dayLabels: Record<number, string> = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie" };

export default function DashboardAdmin({ business, stats, upcomingToday, weekDayCounts }: Props) {
  const router = useRouter();
  const { slug } = useParams();

  const today = new Date();
  const todayDay = today.getDay();
  const greeting = today.getHours() < 12 ? "Buenos días" : today.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const dateLabel = today.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const maxBarCount = Math.max(...Object.values(weekDayCounts), 1);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", {
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "America/Mexico_City",
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Header */}
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={700} size="xl">{greeting}, {business.name} 👋</Text>
          <Text size="xs" c="dimmed" mt={4} style={{ textTransform: "capitalize" }}>{dateLabel}</Text>
        </div>
      </Group>

      {/* Pending alert */}
      {stats.todayPending > 0 && (
        <div style={{
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 12, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Text size="xl">⏳</Text>
          <div style={{ flex: 1 }}>
            <Text size="sm" fw={700} c="yellow.8">
              {stats.todayPending} cita{stats.todayPending > 1 ? "s" : ""} pendiente{stats.todayPending > 1 ? "s" : ""} de revisión
            </Text>
            <Text size="xs" c="yellow.7" mt={2}>Tienes solicitudes que necesitan ser aceptadas o rechazadas</Text>
          </div>
          <Button
            size="xs"
            color="yellow"
            onClick={() => router.push(`/${slug}/admin/dashboard/bookings`)}
          >
            Ver ahora →
          </Button>
        </div>
      )}

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <Card withBorder radius="md" padding="md">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }} mb={8}>Hoy</Text>
          <Text fw={700} size="xl" c="blue">{stats.todayTotal}</Text>
          <Text size="xs" c="dimmed" mt={4}>
            <span style={{ color: "#f59e0b" }}>●</span> {stats.todayPending} pendientes · {stats.todayConfirmed} confirmadas
          </Text>
        </Card>

        <Card withBorder radius="md" padding="md">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }} mb={8}>Esta semana</Text>
          <Text fw={700} size="xl">{stats.weekCount}</Text>
          {stats.weekGrowth !== null && (
            <Group gap={4} mt={4}>
              {stats.weekGrowth >= 0
                ? <IconArrowUpRight size={14} color="#16a34a" />
                : <IconArrowDownRight size={14} color="#ef4444" />}
              <Text size="xs" c={stats.weekGrowth >= 0 ? "green" : "red"}>
                {Math.abs(stats.weekGrowth)}% vs semana anterior
              </Text>
            </Group>
          )}
        </Card>

        <Card withBorder radius="md" padding="md">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }} mb={8}>Este mes</Text>
          <Text fw={700} size="xl">{stats.monthCompleted}</Text>
          <Text size="xs" c="dimmed" mt={4}>Citas confirmadas</Text>
        </Card>

        <Card withBorder radius="md" padding="md">
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }} mb={8}>Cancelaciones</Text>
          <Text fw={700} size="xl" c="red">{stats.monthCancelled}</Text>
          <Text size="xs" c="dimmed" mt={4}>Este mes</Text>
        </Card>
      </SimpleGrid>

      {/* Content grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">

        {/* Próximas citas */}
        <Card withBorder radius="md" padding={0}>
          <Group px="md" py="sm" justify="space-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <Text fw={700} size="sm">Próximas citas hoy</Text>
            <Text
              size="xs" c="blue" fw={600} style={{ cursor: "pointer" }}
              onClick={() => router.push(`/${slug}/admin/dashboard/bookings`)}
            >
              Ver todas →
            </Text>
          </Group>
          <div style={{ padding: "8px 16px" }}>
            {upcomingToday.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="lg">Sin citas próximas hoy</Text>
            ) : (
              upcomingToday.map((appt) => (
                <div key={appt.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0", borderBottom: "1px solid #f8fafc",
                }}>
                  <div style={{
                    background: "#f1f5f9", borderRadius: 8,
                    padding: "6px 10px", textAlign: "center", minWidth: 70,
                  }}>
                    <Text size="xs" fw={700}>{formatTime(appt.startTime)}</Text>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={700} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {appt.clientName}
                    </Text>
                    <Text size="xs" c="dimmed" mt={1}>{appt.service}</Text>
                  </div>
                  <Badge
                    color={appt.status === "PENDING" ? "yellow" : "green"}
                    variant="light" size="xs"
                  >
                    {appt.status === "PENDING" ? "Pendiente" : "Confirmada"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Accesos rápidos */}
          <Card withBorder radius="md" padding="md">
            <Text fw={700} size="sm" mb="md">Accesos rápidos</Text>
            <SimpleGrid cols={2} spacing="sm">
              {[
                { icon: "📅", label: "Ver citas", action: () => router.push(`/${slug}/admin/dashboard/bookings`) },
                { icon: "🏷️", label: "Servicios", action: () => router.push(`/${slug}/admin/dashboard/services`) },
                { icon: "🕐", label: "Disponibilidad", action: () => router.push(`/${slug}/admin/dashboard/availability`) },
                { icon: "⚙️", label: "Configuración", action: () => router.push(`/${slug}/admin/dashboard/settings`) },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={item.action}
                  style={{
                    padding: "14px 12px", borderRadius: 12,
                    border: "1.5px solid #f1f5f9", background: "#f8fafc",
                    cursor: "pointer", textAlign: "center",
                  }}
                >
                  <Text size="xl" mb={6}>{item.icon}</Text>
                  <Text size="xs" fw={600} c="dark">{item.label}</Text>
                </div>
              ))}
            </SimpleGrid>
          </Card>

          {/* Gráfica semanal */}
          <Card withBorder radius="md" padding="md">
            <Group justify="space-between" mb="md">
              <Text fw={700} size="sm">Citas esta semana</Text>
              <Text size="xs" c="dimmed">{stats.weekCount} total</Text>
            </Group>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
              {[1, 2, 3, 4, 5].map((day) => {
                const count = weekDayCounts[day] ?? 0;
                const height = Math.max((count / maxBarCount) * 100, 5);
                const isToday = todayDay === day;
                return (
                  <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                    <Text size="xs" c="dimmed" fw={700}>{count}</Text>
                    <div style={{
                      width: "100%", borderRadius: "6px 6px 0 0",
                      background: isToday ? "#2563eb" : count > 0 ? "#93c5fd" : "#e2e8f0",
                      height: `${height}%`, minHeight: 4,
                    }} />
                    <Text size="xs" c={isToday ? "blue" : "dimmed"} fw={isToday ? 700 : 400}>
                      {dayLabels[day]}
                    </Text>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>
      </SimpleGrid>
    </div>
  );
}