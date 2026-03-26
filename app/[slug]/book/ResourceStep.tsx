"use client";

import { Stack, Text, Title, Center, Loader, Alert } from "@mantine/core";
import { IconInfoCircle, IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface Resource {
  id: string;
  name: string;
  specialty?: string | null;
}

interface Props {
  slug: string;
  selectedService: any;
  selectedResource: Resource | null;
  onNext: (resource: Resource) => void;
  primaryColor?: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #f59e0b, #f97316)",
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #3b82f6, #2563eb)",
    "linear-gradient(135deg, #ec4899, #db2777)",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

export function ResourceStep({
  slug,
  selectedService,
  selectedResource,
  onNext,
  primaryColor = "#2563eb",
}: Props) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!selectedService?.id) return;
    setLoading(true);
    fetch(`/api/business/${slug}/staff?serviceId=${selectedService.id}`)
      .then((r) => r.json())
      .then((data: Resource[]) => setResources(data))
      .finally(() => setLoading(false));
  }, [slug, selectedService?.id]);

  return (
    <Stack gap="md">
      <div>
        <Title order={4}>¿Con quién quieres tu cita?</Title>
        <Text size="sm" c="dimmed" mt={4}>
          Selecciona un terapeuta o colaborador disponible
        </Text>
      </div>

      {loading ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Buscando recursos disponibles...</Text>
          </Stack>
        </Center>
      ) : resources.length === 0 ? (
        <Alert variant="light" color="gray" title="Sin recursos disponibles" icon={<IconInfoCircle />}>
          No hay colaboradores disponibles para este servicio en este momento.
        </Alert>
      ) : (
        <Stack gap="xs">
          {resources.map((resource) => {
            const isSelected = selectedResource?.id === resource.id;
            return (
              <div
                key={resource.id}
                onClick={() => onNext(resource)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  background: "white",
                  borderRadius: 14,
                  cursor: "pointer",
                  border: `2px solid ${isSelected ? primaryColor : "transparent"}`,
                  boxShadow: isSelected
                    ? `0 0 0 4px ${primaryColor}22`
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {isSelected && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 22, height: 22, borderRadius: "50%",
                    background: primaryColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <IconCheck size={12} color="white" strokeWidth={3} />
                  </div>
                )}

                {/* Avatar */}
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                  background: getAvatarColor(resource.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "white",
                }}>
                  {getInitials(resource.name)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={700} size="md">{resource.name}</Text>
                  {resource.specialty && (
                    <Text size="xs" c="dimmed" mt={2}>{resource.specialty}</Text>
                  )}
                </div>
              </div>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}