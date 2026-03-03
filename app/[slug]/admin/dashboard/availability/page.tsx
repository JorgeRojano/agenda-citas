"use client";

import {
  Card,
  Stack,
  Title,
  Group,
  Button,
  Text,
  Divider,
  Paper,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useState, useMemo, useEffect } from "react";
import { IconDeviceFloppy } from "@tabler/icons-react";
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

type TimeSlot = {
  start: string;
  end: string;
};

type DaySchedule = {
  dayOfWeek: number;
  slots: TimeSlot[];
};

type Availability = {
  days: DaySchedule[];
};

const createEmptyAvailability = (): Availability => ({
  days: weekDays.map((d) => ({
    dayOfWeek: d.value,
    slots: [],
  })),
});

export default function AdminAvailabilityPage() {
  const { slug } = useParams();
  const [availability, setAvailability] = useState<Availability>(
    createEmptyAvailability(),
  );

  const [savedAvailability, setSavedAvailability] = useState<Availability>(
    createEmptyAvailability(),
  );

  //////////////////////////////////////////////
  // Detectar cambios
  //////////////////////////////////////////////

  const hasChanges = useMemo(
    () => JSON.stringify(availability) !== JSON.stringify(savedAvailability),
    [availability, savedAvailability],
  );

  //////////////////////////////////////////////
  // Cargar desde backend
  //////////////////////////////////////////////

  useEffect(() => {
    const fetchSchedule = async () => {
      const res = await fetch(`/api/business/${slug}/schedule`);

      if (!res.ok) return;

      const data = await res.json();

      // data viene plano → lo agrupamos por día
      const grouped = createEmptyAvailability();

      data.forEach((slot: any) => {
        const day = grouped.days.find((d) => d.dayOfWeek === slot.dayOfWeek);
        if (day) {
          day.slots.push({
            start: slot.startTime,
            end: slot.endTime,
          });
        }
      });

      setAvailability(grouped);
      setSavedAvailability(grouped);
    };

    fetchSchedule();
  }, []);

  //////////////////////////////////////////////
  // Funciones de manejo
  //////////////////////////////////////////////

  const addSlot = (dayOfWeek: number) => {
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              slots: [...d.slots, { start: "09:00", end: "17:00" }],
            }
          : d,
      ),
    }));
  };

  const removeSlot = (dayOfWeek: number, index: number) => {
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              slots: d.slots.filter((_, i) => i !== index),
            }
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

  //////////////////////////////////////////////
  // Guardar
  //////////////////////////////////////////////

  const handleSave = async () => {
    const toMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };
    // Validar overlaps antes de guardar
    for (const day of availability.days) {
      const dayLabel = weekDays.find((d) => d.value === day.dayOfWeek)?.label;

      // Validar que cierre > apertura
      for (const slot of day.slots) {
        if (toMinutes(slot.end) <= toMinutes(slot.start)) {
          showNotification({
            title: "Rango inválido",
            message: `El día ${dayLabel} tiene un rango donde el cierre no es mayor a la apertura`,
            color: "red",
          });
          return;
        }
      }

      for (let i = 0; i < day.slots.length; i++) {
        for (let j = i + 1; j < day.slots.length; j++) {
          const a = day.slots[i];
          const b = day.slots[j];

          const aStart = toMinutes(a.start);
          const aEnd = toMinutes(a.end);
          const bStart = toMinutes(b.start);
          const bEnd = toMinutes(b.end);

          if (aStart < bEnd && aEnd > bStart) {
            showNotification({
              title: "Rango inválido",
              message: `El día ${dayLabel} tiene rangos que se solapan`,
              color: "red",
            });
            return; // cortar y no guardar
          }
        }
      }
    }

    // Si pasa la validación, continuar con el guardado...
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
        message: "Error saving schedule",
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
  };

  //////////////////////////////////////////////
  // UI
  //////////////////////////////////////////////

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Disponibilidad</Title>
        <Button
          leftSection={<IconDeviceFloppy size={18} />}
          onClick={handleSave}
          disabled={!hasChanges}
        >
          {hasChanges ? "Guardar" : "Guardado"}
        </Button>
      </Group>

      <Divider />

      <Stack gap="sm">
        {availability.days.map((day) => {
          const dayLabel =
            weekDays.find((d) => d.value === day.dayOfWeek)?.label ?? "";

          return (
            <Paper key={day.dayOfWeek} withBorder radius="md" p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600}>{dayLabel}</Text>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => addSlot(day.dayOfWeek)}
                  >
                    + Agregar rango
                  </Button>
                </Group>

                {day.slots.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Cerrado
                  </Text>
                ) : (
                  day.slots.map((slot, index) => (
                    <Group key={index} grow>
                      <TimeInput
                        label="Abre"
                        value={slot.start}
                        onChange={(e) =>
                          updateSlot(
                            day.dayOfWeek,
                            index,
                            "start",
                            e.target.value,
                          )
                        }
                      />
                      <TimeInput
                        label="Cierra"
                        value={slot.end}
                        onChange={(e) =>
                          updateSlot(
                            day.dayOfWeek,
                            index,
                            "end",
                            e.target.value,
                          )
                        }
                      />
                      <Button
                        color="red"
                        style={{ alignSelf: "flex-end" }}
                        variant="subtle"
                        onClick={() => removeSlot(day.dayOfWeek, index)}
                      >
                        X
                      </Button>
                    </Group>
                  ))
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Stack>
  );
}
