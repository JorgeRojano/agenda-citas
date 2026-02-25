import {
  Card,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useEffect, useState } from "react";
import classes from "./TimeStep.module.css";

export function TimeStep({ selectedService, selectedDate, slug, selectedTime, onNext }: any) {
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedDate || !selectedService?.id) {
      setSlots([]);
      return;
    }

    fetch(
      `/api/business/${slug}/availability?date=${selectedDate}&serviceId=${selectedService?.id}`,
    )
      .then((res) => res.json())
      .then(setSlots);
  }, [selectedDate, selectedService?.id]);

  return (
    <Stack gap="xs" mb="lg">
      <Stack gap="xs" mb="lg">
        <Title order={4}>Selecciona una Fecha</Title>
        <Text size="sm" c="dimmed">
          {selectedService?.name} · {selectedDate}
        </Text>
      </Stack>

      <ScrollArea h={400} offsetScrollbars scrollbarSize={4}>
        <SimpleGrid cols={3} spacing="sm">
          {slots.map((slot) => {
            const date = new Date(slot);
            const hour = date.getHours();
            const period = hour >= 12 ? "PM" : "AM";
            const displayHour = hour % 12 || 12;
            const time = `${displayHour} ${period}`;

            return (
              <UnstyledButton
                key={slot}
                className={classes.timeItem}
                data-selected={selectedTime === slot || undefined}
                onClick={() => {
                  onNext(slot);
                }}
              >
                <Text size="sm" fw={700} ta="center">
                  {time}
                </Text>
              </UnstyledButton>
            );
          })}
        </SimpleGrid>
      </ScrollArea>
    </Stack>
  );
}
