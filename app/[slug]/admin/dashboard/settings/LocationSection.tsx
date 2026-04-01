"use client";

import { Paper, Stack, Text, TextInput } from "@mantine/core";

interface Props {
  address: string;
  mapsUrl: string;
  onChange: (field: "address" | "mapsUrl", value: string) => void;
}

export function LocationSection({ address, mapsUrl, onChange }: Props) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Text fw={600}>Ubicación</Text>
        <TextInput
          label="Dirección"
          placeholder="Av. Principal 123, Col. Centro, Xalapa, Ver."
          description="Se mostrará en tu página pública como texto"
          value={address}
          onChange={(e) => onChange("address", e.target.value)}
        />
        <TextInput
          label="URL de Google Maps (embed)"
          placeholder="https://maps.google.com/maps?q=..."
          description="Abre Google Maps → Compartir → Insertar mapa → copia solo el src del iframe"
          value={mapsUrl}
          onChange={(e) => onChange("mapsUrl", e.target.value)}
        />
      </Stack>
    </Paper>
  );
}