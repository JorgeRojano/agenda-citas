"use client";

import {
  Stack, Group, Text, Button, Divider,
  TextInput, Textarea, Switch, Card, SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useState } from "react";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type DayHours = { enabled: boolean; open: string; close: string };

type FormValues = {
  welcomeMessage: string;
  tableParam:     string;
  wifiName:       string;
  wifiPassword:   string;
  hours: Record<DayKey, DayHours>;
};

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lunes",
  tue: "Martes",
  wed: "Miércoles",
  thu: "Jueves",
  fri: "Viernes",
  sat: "Sábado",
  sun: "Domingo",
};

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

type Props = {
  slug:     string;
  settings: Record<string, unknown>;
};

function parseSettings(settings: Record<string, unknown>): FormValues {
  const savedHours = (settings.hours ?? {}) as Record<string, { open: string; close: string } | null>;

  const hours = Object.fromEntries(
    DAY_KEYS.map((d) => {
      const day = savedHours[d];
      return [d, { enabled: day !== null && day !== undefined, open: day?.open ?? "09:00", close: day?.close ?? "21:00" }];
    })
  ) as Record<DayKey, DayHours>;

  return {
    welcomeMessage: (settings.welcomeMessage as string) ?? "",
    tableParam:     (settings.tableParam as string)     ?? "mesa",
    wifiName:       (settings.wifiName as string)       ?? "",
    wifiPassword:   (settings.wifiPassword as string)   ?? "",
    hours,
  };
}

export default function SettingsAdminClient({ slug, settings }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: parseSettings(settings),
  });

  async function handleSubmit(values: FormValues) {
    setLoading(true);
    const payload = {
      welcomeMessage: values.welcomeMessage || undefined,
      tableParam:     values.tableParam     || undefined,
      wifiName:       values.wifiName       || undefined,
      wifiPassword:   values.wifiPassword   || undefined,
      hours: Object.fromEntries(
        DAY_KEYS.map((d) => [
          d,
          values.hours[d].enabled
            ? { open: values.hours[d].open, close: values.hours[d].close }
            : null,
        ])
      ),
    };
    try {
      const res = await fetch(`/api/business/${slug}/admin/menu/settings`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      showNotification({ message: "Configuración guardada", color: "teal" });
    } catch {
      showNotification({ message: "Error al guardar", color: "red" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="lg" p="md">
        <Group justify="space-between" align="flex-end">
          <div>
            <Text fw={700} size="xl">Configuración del menú</Text>
            <Text size="sm" c="dimmed">Personaliza la experiencia del cliente</Text>
          </div>
          <Button type="submit" loading={loading}>Guardar cambios</Button>
        </Group>

        {/* Bienvenida */}
        <Card withBorder radius="md" p="md">
          <Text fw={600} mb="sm">Mensaje de bienvenida</Text>
          <Textarea
            placeholder="Bienvenido a nuestro restaurante. ¡Gracias por visitarnos!"
            autosize
            minRows={2}
            {...form.getInputProps("welcomeMessage")}
          />
          <Text size="xs" c="dimmed" mt={6}>
            Se muestra en la pantalla principal del menú público.
          </Text>
        </Card>

        {/* Mesa */}
        <Card withBorder radius="md" p="md">
          <Text fw={600} mb="sm">Parámetro de mesa en URL</Text>
          <TextInput
            placeholder="mesa"
            description='Nombre del parámetro en la URL. Ej: "mesa" → /{slug}/menu?mesa=3'
            {...form.getInputProps("tableParam")}
          />
        </Card>

        {/* WiFi */}
        <Card withBorder radius="md" p="md">
          <Text fw={600} mb="sm">WiFi del local</Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Nombre de red"
              placeholder="MiRestaurante_WiFi"
              {...form.getInputProps("wifiName")}
            />
            <TextInput
              label="Contraseña"
              placeholder="••••••••"
              {...form.getInputProps("wifiPassword")}
            />
          </SimpleGrid>
          <Text size="xs" c="dimmed" mt={6}>
            Se muestra en el menú para que los clientes se conecten fácilmente.
          </Text>
        </Card>

        {/* Horarios */}
        <Card withBorder radius="md" p="md">
          <Text fw={600} mb="xs">Horarios de atención</Text>
          <Text size="xs" c="dimmed" mb="md">
            Formato 24 horas (HH:MM). Desactiva los días en que permaneces cerrado.
          </Text>
          <Stack gap="xs">
            {DAY_KEYS.map((day, i) => (
              <div key={day}>
                {i > 0 && <Divider mb="xs" />}
                <Group align="center" gap="md" wrap="nowrap">
                  <Switch
                    label={DAY_LABELS[day]}
                    checked={form.values.hours[day].enabled}
                    onChange={(e) =>
                      form.setFieldValue(`hours.${day}.enabled`, e.currentTarget.checked)
                    }
                    styles={{ label: { minWidth: 80 } }}
                  />
                  {form.values.hours[day].enabled ? (
                    <Group gap="xs" grow style={{ flex: 1 }}>
                      <TextInput
                        placeholder="09:00"
                        size="xs"
                        leftSection={<Text size="xs" c="dimmed">Abre</Text>}
                        {...form.getInputProps(`hours.${day}.open`)}
                      />
                      <TextInput
                        placeholder="21:00"
                        size="xs"
                        leftSection={<Text size="xs" c="dimmed">Cierra</Text>}
                        {...form.getInputProps(`hours.${day}.close`)}
                      />
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">Cerrado</Text>
                  )}
                </Group>
              </div>
            ))}
          </Stack>
        </Card>

        <Group justify="flex-end">
          <Button type="submit" loading={loading} size="md">Guardar cambios</Button>
        </Group>
      </Stack>
    </form>
  );
}
