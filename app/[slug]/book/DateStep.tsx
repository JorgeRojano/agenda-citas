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
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import classes from "./DateStep.module.css";
import { useState } from "react";

/**
 * @param count - Cuántos días quieres mostrar
 * @param disabledDays - Array de días (0-6) que NO se deben mostrar
 */
const getAvailableDays = (count: number, disabledDays: number[]) => {
  const days = [];
  let date = new Date();

  // Mientras no tengamos la cantidad de días solicitada...
  while (days.length < count) {
    // Evaluamos el día actual primero, así incluimos "hoy" en el conteo
    const dayOfWeek = date.getDay();

    // Si el día de la semana NO está en la lista de desactivados, lo agregamos
    if (!disabledDays.includes(dayOfWeek)) {
      days.push(new Date(date));
    }

    // Avanzamos al siguiente día antes de la siguiente iteración
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export function DateStep({
  onBack,
  onNext,
  selectedService,
  selectedDate,
}: any) {
  // CONFIGURACIÓN SIMULADA (Esto vendrá de tu DB después)
  // Ejemplo: El admin no trabaja Lunes (1), Sábado (6) ni Domingo (0)
  const businessConfig = {
    closedDays: [0, 1, 6],
  };
  const days = getAvailableDays(30, businessConfig.closedDays);

  return (
    <Stack gap="xs" mb="lg">
      <Stack gap="xs" mb="lg">
        <Title order={4}>Selecciona una Fecha</Title>
        <Text size="sm" c="dimmed">
          {selectedService?.name} · {selectedService?.duration} min
        </Text>
      </Stack>

      <ScrollArea h={400} offsetScrollbars scrollbarSize={4}>
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
                  onNext(dateId);
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
      </ScrollArea>
    </Stack>
  );
}
