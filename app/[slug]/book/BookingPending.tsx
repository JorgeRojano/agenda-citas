import { formatDateTimeMexico } from "@/lib/utils";
import { ThemeIcon, Card, Stack, Title, Text, Button } from "@mantine/core";
import { IconClock } from "@tabler/icons-react";

export function BookingPending({
  serviceName,
  time,
  onBookAnother,
}: {
  serviceName: string;
  time: string | null;
  onBookAnother: () => void;
}) {
  return (
    <Card withBorder radius="lg" padding="xl" shadow="sm">
      <Stack align="center" gap="md">
        <ThemeIcon size={60} radius="xl" color="yellow" variant="light">
          <IconClock size={32} />
        </ThemeIcon>

        <Title order={3}>Solicitud enviada</Title>

        <Text ta="center" c="dimmed">
          Tu solicitud de cita para <strong>{serviceName}</strong> el{" "}
          <strong>{formatDateTimeMexico(time || "")}</strong> ha sido enviada.
          Nos pondremos en contacto contigo para confirmar la cita.
        </Text>

        <Button variant="light" mt="md" onClick={onBookAnother}>
          Agendar otra cita
        </Button>
      </Stack>
    </Card>
  );
}
