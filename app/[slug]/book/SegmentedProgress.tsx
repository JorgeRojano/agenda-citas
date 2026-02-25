"use client";

import { Group, Box, Stack, Text, rem } from "@mantine/core";

interface SegmentedProgressProps {
  active: number; // Paso actual (0 a 3)
  totalSteps: number;
}

export function SegmentedProgress({ active, totalSteps }: SegmentedProgressProps) {
  const stepNames = ["Servicio", "Fecha", "Hora", "Tus datos", "Confirmar"];

  return (
    <Stack gap={8} mb="xl">
      {/* Texto informativo */}
      <Group justify="space-between" px={4}>
        <Text size="xs" fw={800} c="indigo" style={{ textTransform: "uppercase", letterSpacing: rem(1) }}>
          {stepNames[active]}
        </Text>
        <Text size="xs" c="dimmed" fw={600}>
          Paso {active + 1} de {totalSteps}
        </Text>
      </Group>

      {/* Contenedor de las barras */}
      <Group gap={6} grow>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <Box
            key={index}
            h={6}
            style={{
              borderRadius: rem(10),
              backgroundColor:
                index <= active
                  ? "var(--mantine-color-indigo-filled)" // Color activo
                  : "var(--mantine-color-indigo-light)", // Color pendiente
              transition: "background-color 0.3s ease",
            }}
          />
        ))}
      </Group>
    </Stack>
  );
}