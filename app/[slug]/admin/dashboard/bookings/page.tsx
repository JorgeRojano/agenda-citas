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
import RefreshButton from "./RefreshButton";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function AdminBookingsPage({
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
        <Flex align="center" justify="space-between" style={{ width: "100%" }}>
          <BlockTimeButton slug={slug} />
          <RefreshButton />
        </Flex>
      </Group>

      <DayPicker />

      <Stack mt="md">
        {items.length === 0 && (
          <Text c="dimmed">
            No hay citas ni tiempos bloqueados para este día
          </Text>
        )}

        {items.map((item) => {
          const statusConfigs: Record<
            string,
            { color: string; label: string }
          > = {
            PENDING: { color: "yellow", label: "Pendiente" },
            CONFIRMED: { color: "green", label: "Confirmada" },
            CANCELLED: { color: "gray", label: "Cancelada" },
          };

          if (item.type === "blocked") {
            return (
              <Card
                key={item.id}
                withBorder
                style={{
                  backgroundColor: "var(--mantine-color-red-light)",
                  borderColor: "var(--mantine-color-red-outline)",
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

          const config = statusConfigs[item.status] || statusConfigs.CONFIRMED;

          return (
            <Card
              key={item.id}
              withBorder
              padding="md"
              radius="md"
              style={{
                backgroundColor: `var(--mantine-color-${config.color}-light)`,
                borderColor: `var(--mantine-color-${config.color}-outline)`,
                position: "relative",
                opacity: item.status === "CANCELLED" ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {/* Badge en la esquina superior derecha */}
              <Badge
                color={config.color}
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
      </Stack>
    </div>
  );
}
