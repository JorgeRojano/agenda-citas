"use client";

import { Text, Stack, Title, Center, Loader, Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

function getAvailableDays(count: number, closedDays: number[]): Date[] {
  const availableDays: Date[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    if (!closedDays.includes(date.getDay())) {
      availableDays.push(date);
    }
  }
  return availableDays;
}

interface Props {
  onNext: (date: Date) => void;
  selectedService: any;
  selectedResource?: { id: string; name: string } | null;
  selectedDate: any;
  slug: string;
  primaryColor?: string;
}

export function DateStep({
  onNext,
  selectedService,
  selectedResource,
  selectedDate,
  slug,
  primaryColor = "#2563eb",
}: Props) {
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!selectedResource?.id) {
      setClosedDays([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch días activos del recurso via el endpoint de schedule
    fetch(`/api/business/${slug}/resources/${selectedResource.id}/schedule`)
      .then((r) => r.json())
      .then((data: { dayOfWeek: number }[]) => {
        if (!Array.isArray(data)) { setClosedDays([]); return; }
        const openDays = new Set(data.map((s) => s.dayOfWeek));
        const closed   = [0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays.has(d));
        setClosedDays(closed);
      })
      .catch(() => setClosedDays([]))
      .finally(() => setLoading(false));
  }, [selectedResource?.id, slug]);

  const days = useMemo(() => getAvailableDays(30, closedDays), [closedDays]);

  const selectedDateId = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-CA")
    : null;

  return (
    <Stack gap="md">
      <style>{`
        .dates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .service-chip { display: flex; }
        @media (min-width: 768px) {
          .dates-grid { grid-template-columns: repeat(5, 1fr); gap: 10px; }
          .service-chip { display: none; }
        }
      `}</style>

      <div>
        <Title order={4}>¿Cuándo te viene bien?</Title>
        <Text size="sm" c="dimmed" mt={4}>Próximos días disponibles</Text>
      </div>

      {selectedService && (
        <div
          className="service-chip"
          style={{
            alignItems: "center", gap: 6,
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}30`,
            borderRadius: 99, padding: "6px 14px", alignSelf: "flex-start",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: primaryColor }}>
            ✓ {selectedService.name} · {selectedService.duration} min
            {selectedResource ? ` · ${selectedResource.name}` : ""}
          </span>
        </div>
      )}

      {loading ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Buscando fechas disponibles...</Text>
          </Stack>
        </Center>
      ) : days.length === 0 ? (
        <Alert variant="light" color="gray" title="Sin fechas disponibles" icon={<IconInfoCircle />}>
          Lo sentimos, no hay días disponibles en este momento.
        </Alert>
      ) : (
        <div className="dates-grid">
          {days.map((date) => {
            const dateId    = date.toLocaleDateString("en-CA");
            const isSelected = selectedDateId === dateId;
            const dayName   = date.toLocaleDateString("es-MX", { weekday: "short" });
            const dayNum    = date.getDate();
            const month     = date.toLocaleDateString("es-MX", { month: "short" });

            return (
              <div
                key={dateId}
                onClick={() => onNext(date)}
                style={{
                  background: isSelected ? primaryColor : "white",
                  borderRadius: 14, padding: "12px 8px", textAlign: "center",
                  cursor: "pointer",
                  border: `2px solid ${isSelected ? primaryColor : "#f1f5f9"}`,
                  boxShadow: isSelected ? `0 4px 12px ${primaryColor}40` : "0 1px 4px rgba(0,0,0,0.05)",
                  transition: "all 0.15s ease",
                }}
              >
                <Text size="xs" fw={700} style={{ textTransform: "uppercase", letterSpacing: "0.04em", color: isSelected ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
                  {dayName}
                </Text>
                <Text fw={700} size="xl" style={{ color: isSelected ? "white" : "#0f172a", margin: "4px 0" }}>
                  {dayNum}
                </Text>
                <Text size="xs" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
                  {month}
                </Text>
              </div>
            );
          })}
        </div>
      )}
    </Stack>
  );
}