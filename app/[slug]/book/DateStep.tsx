"use client";

import {
  SimpleGrid,
  UnstyledButton,
  Text,
  Stack,
  ScrollArea,
  Button,
  Card,
  Title,
  rem,
  Center,
  Loader,
  Alert,
} from "@mantine/core";
import { IconArrowLeft, IconInfoCircle } from "@tabler/icons-react";
import classes from "./DateStep.module.css";
import { useEffect, useMemo, useState } from "react";
import { getBusinessSchedule } from "@/lib/schedule";

/**
 * Generates an array of available Date objects.
 * @param {number} count - The number of days to look ahead.
 * @param {number[]} closedDays - Array of numbers (0-6) representing closed days of the week.
 * @returns {Date[]} - Array of available Date objects.
 */
function getAvailableDays(count: number, closedDays: number[]): Date[] {
  const availableDays: Date[] = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    // We add 'i' days to the current timestamp
    date.setDate(date.getDate() + i);

    const dayOfWeek = date.getDay();

    if (!closedDays.includes(dayOfWeek)) {
      // We push the date object as is, without .setHours(0,0,0,0)
      availableDays.push(date);
    }
  }

  return availableDays;
}

export function DateStep({
  onBack,
  onNext,
  selectedService,
  selectedDate,
}: any) {
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchedule() {
      const businessId = selectedService?.businessId;

      if (!businessId) {
        setLoading(false);
        return;
      }

      try {
        const schedule = await getBusinessSchedule(businessId);
        if (schedule?.closedDays) {
          setClosedDays(schedule.closedDays);
        }
      } catch (error) {
        console.error("Error cargando calendario:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, [selectedService]);

  const days = useMemo(() => getAvailableDays(30, closedDays), [closedDays]);

  return (
    <Stack gap="xs" mb="lg">
      <Stack gap="xs" mb="lg">
        <Title order={4}>Selecciona una Fecha</Title>
        <Text size="sm" c="dimmed">
          {selectedService?.name} · {selectedService?.duration} min
        </Text>
      </Stack>

      {loading ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">
              Buscando fechas disponibles...
            </Text>
          </Stack>
        </Center>
      ) : (
        <ScrollArea h={400} offsetScrollbars scrollbarSize={4}>
          {days.length === 0 ? (
            <Alert
              variant="light"
              color="gray"
              title="No hay fechas"
              icon={<IconInfoCircle />}
            >
              Lo sentimos, no hay días disponibles para programar en este
              momento.
            </Alert>
          ) : (
            <SimpleGrid cols={3} spacing="sm">
              {days.map((date) => {
                const dayName = date.toLocaleDateString("es-MX", {
                  weekday: "long",
                });
                const monthDay = date.toLocaleDateString("es-MX", {
                  month: "short",
                  day: "numeric",
                });
                const dateId = date.toLocaleDateString("en-CA");

                return (
                  <UnstyledButton
                    key={dateId}
                    className={classes.dateItem}
                    data-selected={selectedDate === dateId || undefined}
                    onClick={() => {
                      onNext(date);
                    }}
                  >
                    <Text size="xs" c="dimmed" fw={500} ta="center">
                      {dayName}
                    </Text>
                    <Text size="sm" fw={700} ta="center">
                      {monthDay}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
          )}
        </ScrollArea>
      )}
    </Stack>
  );
}
