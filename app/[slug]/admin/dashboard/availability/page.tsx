"use client";

import {
  Stack,
  Title,
  Group,
  Button,
  Text,
  Switch,
  Paper,
  Divider,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useState, useMemo, useEffect } from "react";
import { IconDeviceFloppy, IconX, IconPlus } from "@tabler/icons-react";
import { useParams } from "next/navigation";
import { showNotification } from "@mantine/notifications";

const weekDays = [
  { label: "Domingo", value: 0 },
  { label: "Lunes", value: 1 },
  { label: "Martes", value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves", value: 4 },
  { label: "Viernes", value: 5 },
  { label: "Sábado", value: 6 },
];

type TimeSlot = { start: string; end: string };
type DaySchedule = { dayOfWeek: number; slots: TimeSlot[] };
type Availability = { days: DaySchedule[] };

const createEmptyAvailability = (): Availability => ({
  days: weekDays.map((d) => ({ dayOfWeek: d.value, slots: [] })),
});

const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

export default function AdminAvailabilityPage() {
  const { slug } = useParams();
  const [availability, setAvailability] = useState<Availability>(
    createEmptyAvailability(),
  );
  const [savedAvailability, setSavedAvailability] = useState<Availability>(
    createEmptyAvailability(),
  );
  const [editingSlots, setEditingSlots] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>(
    {},
  );

  const toggleExpand = (dayOfWeek: number, index: number) => {
    const key = `${dayOfWeek}-${index}`;
    setExpandedSlots((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isExpanded = (dayOfWeek: number, index: number) =>
    expandedSlots[`${dayOfWeek}-${index}`] ?? false;

  const hasChanges = useMemo(
    () => JSON.stringify(availability) !== JSON.stringify(savedAvailability),
    [availability, savedAvailability],
  );

  useEffect(() => {
    const fetchSchedule = async () => {
      const res = await fetch(`/api/business/${slug}/schedule`);
      if (!res.ok) return;
      const data = await res.json();
      const grouped = createEmptyAvailability();
      data.forEach((slot: any) => {
        const day = grouped.days.find((d) => d.dayOfWeek === slot.dayOfWeek);
        if (day) day.slots.push({ start: slot.startTime, end: slot.endTime });
      });
      setAvailability(grouped);
      setSavedAvailability(grouped);
    };
    fetchSchedule();
  }, []);

  const toggleDay = (dayOfWeek: number, enabled: boolean) => {
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, slots: enabled ? [{ start: "09:00", end: "17:00" }] : [] }
          : d,
      ),
    }));
  };

  const addSlot = (dayOfWeek: number) => {
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, slots: [...d.slots, { start: "09:00", end: "17:00" }] }
          : d,
      ),
    }));
  };

  const removeSlot = (dayOfWeek: number, index: number) => {
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, slots: d.slots.filter((_, i) => i !== index) }
          : d,
      ),
    }));
  };

  const updateSlot = (
    dayOfWeek: number,
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              slots: d.slots.map((slot, i) =>
                i === index ? { ...slot, [field]: value } : slot,
              ),
            }
          : d,
      ),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    for (const day of availability.days) {
      const dayLabel = weekDays.find((d) => d.value === day.dayOfWeek)?.label;
      for (const slot of day.slots) {
        if (toMinutes(slot.end) <= toMinutes(slot.start)) {
          showNotification({
            title: "Rango inválido",
            message: `${dayLabel}: el cierre debe ser mayor a la apertura`,
            color: "red",
          });
          return;
        }
      }
      for (let i = 0; i < day.slots.length; i++) {
        for (let j = i + 1; j < day.slots.length; j++) {
          const a = day.slots[i];
          const b = day.slots[j];
          if (
            toMinutes(a.start) < toMinutes(b.end) &&
            toMinutes(a.end) > toMinutes(b.start)
          ) {
            showNotification({
              title: "Rango inválido",
              message: `${dayLabel}: los rangos se solapan`,
              color: "red",
            });
            setSaving(false);
            return;
          }
        }
      }
    }

    const flatSlots = availability.days.flatMap((day) =>
      day.slots.map((slot) => ({
        dayOfWeek: day.dayOfWeek,
        startTime: slot.start,
        endTime: slot.end,
      })),
    );

    const res = await fetch(`/api/business/${slug}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: flatSlots }),
    });

    if (!res.ok) {
      showNotification({
        title: "Error",
        message: "Error guardando horario",
        color: "red",
      });
      return;
    }

    setSavedAvailability(availability);
    showNotification({
      title: "Guardado",
      message: "Horario guardado correctamente",
      color: "green",
    });
    setSaving(false);
  };

  return (
    <>
      <style>{`
        .day-row {
          display: grid;
          grid-template-columns: 160px 1fr;
          align-items: start;
          gap: 16px;
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .day-col-left {
          display: flex; align-items: center; gap: 10px; padding-top: 2px;
        }
        .day-col-right {
          display: flex; flex-wrap: wrap; align-items: center; gap: 8px;
        }
        .time-pill {
          display: flex; align-items: center; gap: 6px;
          background: white; border: 1.5px solid #e2e8f0;
          border-radius: 99px; padding: 6px 14px;
          font-size: 13px; font-weight: 500; color: #374151;
        }
        .pill-remove {
          width: 16px; height: 16px;
          background: #fee2e2; color: #e11d48;
          border-radius: 50%; border: none; font-size: 10px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-weight: 700; line-height: 1;
        }
        .add-range-btn {
          padding: 6px 12px;
          background: white; color: #2563eb;
          border: 1.5px dashed #bfdbfe; border-radius: 99px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          font-family: inherit;
        }

        /* Mobile */
        @media (max-width: 600px) {
          .day-row {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .time-pill {
            width: 100%;
            border-radius: 10px;
            padding: 10px 14px;
            justify-content: space-between;
            font-size: 15px;
          }
          .pill-remove {
            width: 22px; height: 22px; font-size: 11px;
          }
          .add-range-btn {
            width: 100%; border-radius: 8px;
            padding: 10px; text-align: center;
          }
          .day-col-right {
            flex-direction: column; align-items: stretch;
          }
        }
      `}</style>

      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3}>Disponibilidad</Title>
          <Button
            leftSection={<IconDeviceFloppy size={18} />}
            onClick={handleSave}
            disabled={!hasChanges}
            loading={saving}
          >
            {hasChanges ? "Guardar" : "Guardado"}
          </Button>
        </Group>

        <Divider />

        <Stack gap="xs">
          {availability.days.map((day) => {
            const dayLabel =
              weekDays.find((d) => d.value === day.dayOfWeek)?.label ?? "";
            const isOpen = day.slots.length > 0;

            return (
              <div key={day.dayOfWeek} className="day-row">
                {/* Left — toggle + nombre */}
                <div className="day-col-left">
                  <Switch
                    checked={isOpen}
                    onChange={(e) =>
                      toggleDay(day.dayOfWeek, e.currentTarget.checked)
                    }
                    size="md"
                  />
                  <Text fw={600} c={isOpen ? "dark" : "dimmed"} size="sm">
                    {dayLabel}
                  </Text>
                </div>

                {/* Right — pills o cerrado */}
                <div className="day-col-right">
                  {!isOpen ? (
                    <Text size="sm" c="dimmed" fs="italic">
                      Cerrado
                    </Text>
                  ) : (
                    <>
                      {day.slots.map((slot, index) => (
                        <div
                          key={index}
                          style={{
                            width: isExpanded(day.dayOfWeek, index)
                              ? "100%"
                              : "auto",
                          }}
                        >
                          {isExpanded(day.dayOfWeek, index) ? (
                            <div
                              style={{
                                background: "#eff6ff",
                                border: "1.5px solid #bfdbfe",
                                borderRadius: 12,
                                padding: 14,
                                marginBottom: 6,
                                width: "100%",
                              }}
                            >
                              {/* Grid responsive: inline en desktop, stacked en mobile */}
                              <style>{`
                                .edit-slot-grid {
                                  display: flex;
                                  align-items: flex-end;
                                  gap: 8px;
                                }
                                .edit-slot-arrow {
                                  color: #94a3b8;
                                  padding-bottom: 10px;
                                  flex-shrink: 0;
                                }
                                .edit-slot-actions {
                                  display: flex;
                                  gap: 8px;
                                  justify-content: flex-end;
                                  margin-top: 0;
                                }
                                @media (max-width: 600px) {
                                  .edit-slot-grid {
                                    display: grid;
                                    grid-template-columns: 1fr auto 1fr;
                                    align-items: end;
                                    gap: 8px;
                                  }
                                  .edit-slot-arrow {
                                    padding-bottom: 10px;
                                    text-align: center;
                                  }
                                  .edit-slot-actions {
                                    margin-top: 10px;
                                    justify-content: flex-end;
                                  }
                                }
                              `}</style>

                              <div className="edit-slot-grid">
                                <div style={{ flex: 1 }}>
                                  <Text size="xs" fw={600} c="dimmed" mb={4}>
                                    Abre
                                  </Text>
                                  <TimeInput
                                    value={slot.start}
                                    onChange={(e) =>
                                      updateSlot(
                                        day.dayOfWeek,
                                        index,
                                        "start",
                                        e.target.value,
                                      )
                                    }
                                    size="sm"
                                  />
                                </div>
                                <div className="edit-slot-arrow">→</div>
                                <div style={{ flex: 1 }}>
                                  <Text size="xs" fw={600} c="dimmed" mb={4}>
                                    Cierra
                                  </Text>
                                  <TimeInput
                                    value={slot.end}
                                    onChange={(e) =>
                                      updateSlot(
                                        day.dayOfWeek,
                                        index,
                                        "end",
                                        e.target.value,
                                      )
                                    }
                                    size="sm"
                                  />
                                </div>
                                {/* Botones inline solo en desktop */}
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="blue"
                                  mb={2}
                                  onClick={() =>
                                    toggleExpand(day.dayOfWeek, index)
                                  }
                                  style={{ flexShrink: 0 }}
                                  className="edit-slot-desktop-btn"
                                >
                                  Listo
                                </Button>
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="red"
                                  mb={2}
                                  onClick={() =>
                                    removeSlot(day.dayOfWeek, index)
                                  }
                                  style={{ flexShrink: 0 }}
                                  className="edit-slot-desktop-btn"
                                >
                                  <IconX size={14} />
                                </Button>
                              </div>

                              {/* Botones solo en mobile */}
                              <style>{`
                                .edit-slot-desktop-btn { display: flex; }
                                .edit-slot-mobile-actions { display: none; }
                                @media (max-width: 600px) {
                                  .edit-slot-desktop-btn { display: none !important; }
                                  .edit-slot-mobile-actions { display: flex !important; }
                                }
                              `}</style>
                              <div className="edit-slot-mobile-actions edit-slot-actions">
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="blue"
                                  flex={1}
                                  onClick={() =>
                                    toggleExpand(day.dayOfWeek, index)
                                  }
                                >
                                  ✓ Listo
                                </Button>
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="red"
                                  onClick={() =>
                                    removeSlot(day.dayOfWeek, index)
                                  }
                                >
                                  🗑
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // Modo pill
                            <div
                              className="time-pill"
                              onClick={() => toggleExpand(day.dayOfWeek, index)}
                              style={{ cursor: "pointer" }}
                            >
                              <span>
                                ✏️ {formatTime(slot.start)} →{" "}
                                {formatTime(slot.end)}
                              </span>
                              <button
                                className="pill-remove"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSlot(day.dayOfWeek, index);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        className="add-range-btn"
                        onClick={() => addSlot(day.dayOfWeek)}
                      >
                        + Rango
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </Stack>
      </Stack>
    </>
  );
}
