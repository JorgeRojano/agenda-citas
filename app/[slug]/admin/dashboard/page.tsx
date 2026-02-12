import { prisma } from "@/lib/prisma";
import { getAppointmentsByDay, getBlockedTimeByDay } from "@/lib/appointments";
import {
  Title,
  Stack,
  Text,
  Card,
  Badge,
  Group,
  Flex,
  Button,
} from "@mantine/core";
import DayPicker from "./DayPicker";
import { StatusButtons } from "./StatusButtons";
import BlockTimeButton from "./BlockTimeButton";
import UnblockButton from "./UnblockButton";
import CancelAppointmentButton from "./CancelAppointmentButton";
/* import CancelAppointmentButton from "./CancelAppointmentButton"; */

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function AdminDashboardPage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { date } = await searchParams;

  // 1️⃣ Buscar negocio por slug
  const business = await prisma.business.findUnique({
    where: { slug },
  });

  if (!business) {
    return <div>Negocio no encontrado</div>;
  }

  const dateString = date ?? new Date().toLocaleDateString("en-CA");

  const startOfDay = new Date(`${dateString}T00:00:00`);
  const endOfDay = new Date(`${dateString}T23:59:59`);

  // 2️⃣ Pasar businessId
  const appointments = await getAppointmentsByDay(
    business.id,
    startOfDay,
    endOfDay,
  );

  const blockedTimes = await getBlockedTimeByDay(
    business.id,
    startOfDay,
    endOfDay,
  );

  // 3️⃣ Usar startTime y endTime del nuevo schema
  const items = [
    ...appointments.map((a) => ({
      type: "appointment" as const,
      id: a.id,
      start: a.startTime,
      end: a.endTime,
      clientName: a.clientName,
      service: a.service.name,
      status: a.status,
    })),
    ...blockedTimes.map((b) => ({
      type: "blocked" as const,
      id: b.id,
      start: b.start,
      end: b.end,
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <Group justify="space-between" mb="md" align="center">
        <Title order={2} style={{ margin: 0 }}>
          Citas del día — {business.name}
        </Title>
        <BlockTimeButton slug={slug} />
      </Group>

      <DayPicker />

      <Stack mt="md">
        {items.length === 0 && (
          <Text c="dimmed">
            No hay citas ni tiempos bloqueados para este día
          </Text>
        )}

        {items.map((item) => {
          const statusColors: Record<
            string,
            { border: string; bg: string; badge: string; label: string }
          > = {
            PENDING: {
              border: "#fab005",
              bg: "#fff9db",
              badge: "yellow",
              label: "Pendiente",
            },
            CONFIRMED: {
              border: "#40c057",
              bg: "#ebfbee",
              badge: "green",
              label: "Confirmada",
            },
            CANCELLED: {
              border: "#adb5bd",
              bg: "#f8f9fa",
              badge: "gray",
              label: "Cancelada",
            },
          };

          if (item.type === "blocked") {
            return (
              <Card
                key={item.id}
                withBorder
                style={{
                  borderColor: "#ff6b6b",
                  backgroundColor: "#ffe0e0",
                  gap: 8,
                }}
              >
                <Badge
                  color="red"
                  radius="xs"
                  size="lg"
                  style={{ position: "absolute", top: 0, right: 0 }}
                >
                  Bloqueado
                </Badge>
                <Text
                  size="sm"
                  fw={700}
                  c="dimmed"
                  style={{ textTransform: "uppercase" }}
                >
                  {item.start.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {item.end.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>

                <Flex justify="flex-end" mt="xs">
                  <UnblockButton blockId={item.id} slug={slug} />
                </Flex>
              </Card>
            );
          }

          const config = statusColors[item.status] || statusColors.CONFIRMED;

          return (
            <Card
              key={item.id}
              withBorder
              padding="md"
              radius="md"
              style={{
                borderColor: config.border,
                backgroundColor: config.bg,
                position: "relative", // Necesario para posicionar el badge
                opacity: item.status === "CANCELLED" ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {/* Badge en la esquina superior derecha */}
              <Badge
                color={config.badge}
                variant="filled"
                radius="xs"
                size="lg"
                style={{ position: "absolute", top: 0, right: 0 }}
              >
                {config.label}
              </Badge>

              {/* 1. Tiempo */}
              <Text
                size="sm"
                fw={700}
                c="dimmed"
                style={{ textTransform: "uppercase" }}
              >
                {item.start.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {item.end.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>

              {/* 2. Cliente y Servicio */}
              <Stack gap={2} mt={4} mb="md">
                <Text fw={700} size="lg" style={{ color: "#2c3e50" }}>
                  {item.clientName}
                </Text>
                <Group gap={4}>
                  <Text size="xs" c="dimmed" fw={500}>
                    Servicio:
                  </Text>
                  <Text size="sm" fw={600}>
                    {item.service || "Sin servicio"}
                  </Text>
                </Group>
              </Stack>

              {/* 3. Acciones inferiores (Solo si es PENDING) */}
              <Flex justify="flex-end" mt="xs">
                {item.status === "PENDING" && (
                  <StatusButtons appointmentId={item.id} slug={slug} />
                )}

                {item.status === "CONFIRMED" && (
                  <CancelAppointmentButton
                    appointmentId={item.id}
                    slug={slug}
                  />
                )}
              </Flex>
            </Card>
          );
        })}

        {/* {items.map((item) => {
          if (item.type === "blocked") {
            return (
              <Card
                key={item.id}
                withBorder
                style={{
                  borderColor: "#ff6b6b",
                  backgroundColor: "#ffe0e0",
                  gap: 8,
                }}
              >
                <Text fw={500}>
                  {item.start.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {item.end.toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>

                <Flex justify="space-between" align="center">
                  <Badge color="red">Tiempo bloqueado</Badge>
                  <UnblockButton blockId={item.id} />
                </Flex>
              </Card>
            );
          }

          
        })} */}
      </Stack>
    </div>
  );
}
