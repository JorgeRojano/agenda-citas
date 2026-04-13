"use client";

import { Resource } from "@/types/Resource";
import { Stack, Text, Title, Center, Loader } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface Props {
  slug: string;
  selectedService: any;
  selectedDate: any;
  selectedTime: string | null;
  selectedResource: Resource | null;
  onNext: (resource: Resource) => void;
  colorName?: string;
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
  slug, selectedService, selectedDate, selectedTime, selectedResource, onNext, colorName = "blue",
}: Props) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!selectedService?.id) return;
    setLoading(true);
    const dateParam = selectedDate ? `&date=${selectedDate}` : "";
    const timeParam = selectedTime ? `&time=${encodeURIComponent(selectedTime)}` : "";
    fetch(`/api/business/${slug}/staff?serviceId=${selectedService.id}${dateParam}${timeParam}`)
      .then((r) => r.json())
      .then((data: Resource[]) => setResources(data))
      .finally(() => setLoading(false));
  }, [slug, selectedService?.id, selectedDate, selectedTime]);

  return (
    <Stack gap="md">
      <div>
        <Title order={4}>¿Con quién quieres tu cita?</Title>
        <Text size="sm" c="dimmed" mt={4}>Selecciona un terapeuta o colaborador disponible</Text>
      </div>

      {loading ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Buscando recursos disponibles...</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="xs">
          {[...(resources.length >= 2 ? [{ id: null, name: "Sin preferencia", specialty: "Cualquier colaborador disponible" }] : []), ...resources].map((resource) => {
            const isSelected = selectedResource?.id === resource.id;
            const isAny      = resource.id === null;
            return (
              <div
                key={resource.id ?? "any"}
                onClick={() => onNext(resource)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 16px",
                  background: isSelected
                    ? `var(--mantine-color-${colorName}-light)`       // era ${primaryColor}12
                    : "var(--mantine-color-default)",
                  borderRadius: 14, cursor: "pointer",
                  border: isSelected
                    ? `2px solid var(--mantine-color-${colorName}-3)` // era primaryColor hex
                    : "2px solid transparent",
                  boxShadow: isSelected
                    ? `0 0 0 4px var(--mantine-color-${colorName}-light)` // era ${primaryColor}22
                    : "0 1px 3px rgba(0,0,0,0.06)",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
              >
                {isSelected && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 22, height: 22, borderRadius: "50%",
                    background: `var(--mantine-color-${colorName}-6)`, // era primaryColor hex
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <IconCheck size={12} color="white" strokeWidth={3} />
                  </div>
                )}

                {/* Avatar — gradientes fijos, no son color de negocio */}
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                  background: isAny
                    ? "var(--mantine-color-default-hover)"
                    : getAvatarColor(resource.name),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isAny ? 22 : 16, fontWeight: 700,
                  color: isAny ? "var(--mantine-color-dimmed)" : "white",
                }}>
                  {isAny ? "★" : getInitials(resource.name)}
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