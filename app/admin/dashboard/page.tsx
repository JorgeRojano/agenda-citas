import { getAppointmentsByDay } from "@/lib/appointments";
import { Title, Stack, Text, Card, Badge } from "@mantine/core";
import DayPicker from "./DayPicker";

type Props = {
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: Props) {
  const params = await searchParams;

  const dateString =
    params.date ??
    new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const startOfDay = new Date(`${dateString}T00:00:00`);
  const endOfDay = new Date(`${dateString}T23:59:59`);

  const appointments = await getAppointmentsByDay(
    startOfDay,
    endOfDay
  );

  return (
    <>
      <Title order={2} mb="md">
        Citas del día
      </Title>

      <DayPicker />

      <Stack>
        {appointments.length === 0 && (
          <Text c="dimmed">No hay citas para este día</Text>
        )}

        {appointments.map((a) => {
          const start = new Date(a.dateTime);
          const end = new Date(
            start.getTime() + a.durationMinutes * 60000
          );

          return (
            <Card key={a.id} withBorder>
              <Text fw={500}>
                {start.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {end.toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>

              <Text>{a.clientName}</Text>
              <Badge mt="xs">{a.service.name}</Badge>
            </Card>
          );
        })}
      </Stack>
    </>
  );
}
