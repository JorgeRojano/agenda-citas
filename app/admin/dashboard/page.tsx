import { getAppointmentsByDay, getBlockedTimeByDay } from "@/lib/appointments";
import { Title, Stack, Text, Card, Badge, Group, Flex } from "@mantine/core";
import DayPicker from "./DayPicker";
import BlockTimeButton from "./BlockTimeButton";
import UnblockButton from "./UnblockButton";

type Props = {
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  const params = await searchParams;

  const dateString = params.date ?? new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const startOfDay = new Date(`${dateString}T00:00:00`);
  const endOfDay = new Date(`${dateString}T23:59:59`);

  const appointments = await getAppointmentsByDay(startOfDay, endOfDay);

  const blockedTimes = await getBlockedTimeByDay(startOfDay, endOfDay);

  // Combine and sort appointments and blocked times by start time
  const items = [
    ...appointments.map((a) => ({
      type: "appointment" as const,
      id: a.id,
      start: a.dateTime,
      end: new Date(a.dateTime.getTime() + a.durationMinutes * 60000),
      clientName: a.clientName,
      service: a.service.name,
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
          Citas del día
        </Title>
        <BlockTimeButton />
      </Group>

      <DayPicker />

      <Stack mt="md">
        {items.length === 0 && (
          <Text c="dimmed">
            No hay citas ni tiempos bloqueados para este día
          </Text>
        )}

        {items.map((item) => {
          if (item.type === "blocked") {
            return (
              <Card
                key={item.id}
                withBorder
                style={{ borderColor: "#ff6b6b", backgroundColor: "#ffe0e0" }}
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
                  <Badge mt="xs" color="red">
                    Tiempo bloqueado
                  </Badge>
                  <UnblockButton blockId={item.id} />
                </Flex>
              </Card>
            );
          }

          return (
            <Card key={item.id} withBorder>
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

              <Text>{item.clientName}</Text>
              <Badge mt="xs">{item.service}</Badge>
            </Card>
          );
        })}
      </Stack>
    </div>
  );
}
