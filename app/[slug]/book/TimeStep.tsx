"use client";

import { Stack, Text, Title, Center, Loader, Alert } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface Props {
  selectedService: any;
  selectedDate: any;
  slug: string;
  selectedTime: string | null;
  staffId?: string | null;
  onNext: (slot: string) => void;
  primaryColor?: string;
}

export function TimeStep({
  selectedService,
  selectedDate,
  slug,
  selectedTime,
  staffId,
  onNext,
  primaryColor = "#2563eb",
}: Props) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate || !selectedService?.id) {
      setSlots([]);
      return;
    }
    setLoading(true);
    const staffParam = staffId ? `&staffId=${staffId}` : "";
    fetch(
      `/api/business/${slug}/availability?date=${selectedDate}&serviceId=${selectedService?.id}${staffParam}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setSlots(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedDate, selectedService?.id]);

  const formatTime = (slot: string) =>
    new Date(slot).toLocaleTimeString("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Mexico_City",
    });

  const getHour = (slot: string) =>
    new Date(slot).toLocaleString("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "America/Mexico_City",
    });

  const morningSlots = slots.filter((s) => parseInt(getHour(s)) < 12);
  const afternoonSlots = slots.filter((s) => parseInt(getHour(s)) >= 12);

  const SlotGrid = ({ items }: { items: string[] }) => (
    <div className="times-grid">
      {items.map((slot) => {
        const isSelected = selectedTime === slot;
        return (
          <div
            key={slot}
            onClick={() => onNext(slot)}
            style={{
              padding: "10px 6px",
              borderRadius: 10,
              border: `1.5px solid ${isSelected ? primaryColor : "#f1f5f9"}`,
              background: isSelected ? primaryColor : "white",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: isSelected
                ? `0 3px 10px ${primaryColor}40`
                : "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <Text
              size="sm"
              fw={700}
              style={{ color: isSelected ? "white" : "#374151" }}
            >
              {formatTime(slot)}
            </Text>
          </div>
        );
      })}
    </div>
  );

  return (
    <Stack gap="md">
      <style>{`
        .times-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 4px;
        }
        .time-section-title {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 16px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .time-section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }
        .time-chip { display: flex; }
        @media (min-width: 768px) {
          .times-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .time-chip { display: none; }
        }
      `}</style>

      <div>
        <Title order={4}>Selecciona una hora</Title>
        <Text size="sm" c="dimmed" mt={4}>
          Horarios disponibles para el día seleccionado
        </Text>
      </div>

      {selectedService && selectedDate && (
        <div
          className="time-chip"
          style={{
            alignItems: "center",
            gap: 6,
            background: `${primaryColor}12`,
            border: `1px solid ${primaryColor}30`,
            borderRadius: 99,
            padding: "6px 14px",
            alignSelf: "flex-start",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: primaryColor }}>
            ✓ {selectedService.name} · {selectedService.duration} min ·{" "}
            {new Date(selectedDate).toLocaleDateString("es-MX", {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })}
          </span>
        </div>
      )}

      {loading ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Cargando horarios...
            </Text>
          </Stack>
        </Center>
      ) : slots.length === 0 ? (
        <Alert
          variant="light"
          color="gray"
          title="Sin horarios disponibles"
          icon={<IconInfoCircle />}
        >
          No hay horarios disponibles para este día. Intenta con otra fecha.
        </Alert>
      ) : (
        <>
          {morningSlots.length > 0 && (
            <>
              <div className="time-section-title">☀️ Mañana</div>
              <SlotGrid items={morningSlots} />
            </>
          )}
          {afternoonSlots.length > 0 && (
            <>
              <div className="time-section-title">🌤️ Tarde</div>
              <SlotGrid items={afternoonSlots} />
            </>
          )}
        </>
      )}
    </Stack>
  );
}
