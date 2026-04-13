"use client";

import { Resource } from "@/types/Resource";
import { Text, Stack, Title, Center, Loader, Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

function getAvailableDays(count: number, closedDays: number[]): Date[] {
  const availableDays: Date[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    if (!closedDays.includes(date.getDay())) availableDays.push(date);
  }
  return availableDays;
}

interface Props {
  onNext: (date: Date) => void;
  selectedService: any;
  selectedResource: Resource | null;
  selectedDate: any;
  slug: string;
  colorName?: string;
}

export function DateStep({
  onNext,
  selectedService,
  selectedResource,
  selectedDate,
  slug,
  colorName = "blue",
}: Props) {
  const primaryColor = `var(--mantine-color-${colorName}-6)`;
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!selectedResource?.id) {
      fetch(`/api/business/${slug}/schedule`)
        .then((r) => r.json())
        .then((slots: { dayOfWeek: number }[]) => {
          if (!Array.isArray(slots)) {
            setClosedDays([]);
            return;
          }
          const openDays = new Set(slots.map((s) => s.dayOfWeek));
          setClosedDays([0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays.has(d)));
        })
        .catch(() => setClosedDays([]))
        .finally(() => setLoading(false));
      return;
    }
    fetch(`/api/business/${slug}/resources/${selectedResource.id}/schedule`)
      .then((r) => r.json())
      .then((data: { dayOfWeek: number }[]) => {
        if (!Array.isArray(data)) {
          setClosedDays([]);
          return;
        }
        const openDays = new Set(data.map((s) => s.dayOfWeek));
        setClosedDays([0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays.has(d)));
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
        .dates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .date-card:hover { background: var(--mantine-color-default-hover) !important; transform: translateY(-2px); }
        .service-chip { display: flex; }
        @media (min-width: 768px) {
          .dates-grid { grid-template-columns: repeat(5, 1fr); gap: 12px; }
          .service-chip { display: none; }
        }
      `}</style>

      <div>
        <Title order={4}>¿Cuándo te viene bien?</Title>
        <Text size="sm" c="dimmed" mt={4}>
          Próximos días disponibles
        </Text>
      </div>

      {selectedService && (
        <div
          className="service-chip"
          style={{
            alignItems: "center",
            gap: 6,
            background: `var(--mantine-color-${colorName}-light)`,
            border: `1px solid var(--mantine-color-${colorName}-light-hover)`,
            borderRadius: 99,
            padding: "6px 14px",
            alignSelf: "flex-start",
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: `var(--mantine-color-${colorName}-light-color)`, // era primaryColor directo
            }}
          >
            ✓ {selectedService.name} · {selectedService.duration} min
            {selectedResource ? ` · ${selectedResource.name}` : ""}
          </span>
        </div>
      )}

      {loading ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Buscando fechas disponibles...
            </Text>
          </Stack>
        </Center>
      ) : days.length === 0 ? (
        <Alert
          variant="light"
          color="gray"
          title="Sin fechas disponibles"
          icon={<IconInfoCircle />}
        >
          Lo sentimos, no hay días disponibles en este momento.
        </Alert>
      ) : (
        <div className="dates-grid">
          {days.map((date) => {
            const dateId = date.toLocaleDateString("en-CA");
            const isSelected = selectedDateId === dateId;
            const dayName = date.toLocaleDateString("es-MX", {
              weekday: "short",
            });
            const dayNum = date.getDate();
            const month = date.toLocaleDateString("es-MX", { month: "short" });

            return (
              <div
                key={dateId}
                onClick={() => onNext(date)}
                style={{
                  background: "var(--mantine-color-body)",
                  borderRadius: 14,
                  padding: "12px 8px",
                  textAlign: "center",
                  cursor: "pointer",
                  border: isSelected
                    ? `2px solid var(--mantine-color-${colorName}-4)`
                    : "2px solid transparent",
                  boxShadow: isSelected
                    ? `0 4px 12px var(--mantine-color-${colorName}-light-hover)`
                    : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Text
                  size="xs"
                  fw={700}
                  style={{
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--mantine-color-dimmed)",
                  }}
                >
                  {dayName}
                </Text>
                <Text
                  fw={700}
                  size="xl"
                  style={{
                    color: "var(--mantine-color-text)",
                    margin: "4px 0",
                  }}
                >
                  {dayNum}
                </Text>
                <Text
                  size="xs"
                  style={{
                    color: "var(--mantine-color-dimmed)",
                  }}
                >
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
