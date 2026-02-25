"use client";

import { useState } from "react";
import {
  Stack,
  Text,
  Card,
  Group,
  Title,
  rem,
  Button,
} from "@mantine/core";
import { SegmentedProgress } from "./SegmentedProgress";
import { DateStep } from "./DateStep";
import { DateValue } from "@mantine/dates";
import { TimeStep } from "./TimeStep";
import { useParams } from "next/navigation";
import { ServiceStep } from "./ServiceStep";
import { DetailsStep } from "./DetailsStep";
import { createAppointment } from "./actions";
import { BookingPending } from "./BookingPending";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export default function AppointmentBooking() {
  const params = useParams();
  const slug = params.slug as string;

  const [active, setActive] = useState(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<DateValue | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingCompleted, setBookingCompleted] = useState(false);
  const totalSteps = 4;

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setActive(1); // Avanza automáticamente al siguiente paso
  };

  const handleDateSelect = (date: DateValue) => {
    setSelectedDate(date);
    setActive(2); // Avanza automáticamente al siguiente paso
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setActive(3); // Avanza automáticamente al siguiente paso
  };

  const handleSubmit = async (details: any) => {
    if (!selectedTime || !selectedService?.id) {
      console.error("Tiempo o servicio no seleccionado");
      return;
    }

    try {
      await createAppointment(
        slug,
        selectedTime,
        selectedService.id,
        details.name,
        details.phone,
      );
      setBookingCompleted(true);
    } catch (error) {
      console.error("Error al crear la cita:", error);
    }
  };

  if (bookingCompleted) {
  return (
    <div style={{ maxWidth: 500, padding: rem(20) }}>
      <BookingPending
        serviceName={selectedService?.name || ""}
        time={selectedTime}
        onBookAnother={() => {
          setBookingCompleted(false);
          setSelectedService(null);
          setSelectedDate(null);
          setSelectedTime(null);
          setActive(0);
        }}
      />
    </div>
  );
}

  return (
    <div style={{ maxWidth: 500, padding: rem(20) }}>
      {/* Encabezado del Negocio */}
      <Stack align="center" mb="xl" gap={4}>
        <Group gap={8}>
          <Title order={3} c="indigo">
            Test 🚌 ness
          </Title>
        </Group>
        <Text size="sm" c="dimmed">
          Es un test
        </Text>
      </Stack>

      <SegmentedProgress active={active} totalSteps={totalSteps} />

      <Card withBorder radius="md" padding="lg" shadow="sm">
        {active === 0 && (
          <ServiceStep
            slug={slug}
            selectedService={selectedService}
            onNext={handleServiceSelect}
          />
        )}

        {active === 1 && (
          <DateStep
            selectedService={selectedService}
            selectedDate={selectedDate}
            onNext={handleDateSelect}
          />
        )}

        {active === 2 && (
          <TimeStep
            slug={slug}
            selectedService={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onNext={handleTimeSelect}
          />
        )}

        {active === 3 && (
          <DetailsStep
            selectedService={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSubmit={handleSubmit}
          />
        )}

        <Group justify="space-between" mt="md">
          {active > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActive(active - 1)}
            >
              Regresar
            </Button>
          )}

          {/* placeholder for future confirm button when on last step */}
          {active === totalSteps - 1 && (
            <Button type="submit" form="details-form" size="sm">
              Confirmar reserva
            </Button>
          )}
        </Group>
      </Card>
    </div>
  );
}
