"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Select,
  TextInput,
  Group,
  Stack,
  Title,
  Text,
  Alert,
  Grid,
  Paper,
} from "@mantine/core";
import { DatePickerInput, DateValue } from "@mantine/dates";
import { createAppointment } from "./actions";
import dayjs from "dayjs";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export default function BookingForm() {
  const [date, setDate] = useState<DateValue>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then(setServices);
  }, []);

  useEffect(() => {
    if (!date || !serviceId) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    const dateString = dayjs(date).format("YYYY-MM-DD");
    fetch(`/api/availability?date=${dateString}&serviceId=${serviceId}`)
      .then((res) => res.json())
      .then(setSlots);
  }, [date, serviceId]);

  const handleSubmit = async () => {
    if (!selectedSlot || !serviceId || !clientName || !phone) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAppointment(selectedSlot, serviceId, clientName, phone);
      setSuccess(true);
      // Reset form
      setDate(null);
      setServiceId(null);
      setSelectedSlot(null);
      setClientName("");
      setPhone("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper p="xl" radius="md" withBorder>
      <Stack gap="lg">
        <Title order={2}>Agendar cita</Title>

        <Select
          label="Servicio"
          placeholder="Selecciona un servicio"
          value={serviceId}
          onChange={(value) => {
            setServiceId(value);
            setSelectedSlot(null);
          }}
          data={services.map((s) => ({
            value: s.id,
            label: `${s.name} (${s.duration} min) - $${s.price}`,
          }))}
          required
        />

        <DatePickerInput
          label="Fecha"
          placeholder="Selecciona una fecha"
          value={date}
          onChange={setDate}
          minDate={new Date()}
          required
        />

        {slots.length > 0 && (
          <div>
            <Text size="sm" fw={500} mb="xs">
              Horarios disponibles
            </Text>
            <Grid>
              {slots.map((slot) => (
                <Grid.Col key={slot} span={{ base: 6, sm: 4, md: 3 }}>
                  <Button
                    variant={selectedSlot === slot ? "filled" : "outline"}
                    fullWidth
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {dayjs(slot).format("HH:mm")}
                  </Button>
                </Grid.Col>
              ))}
            </Grid>
          </div>
        )}

        {selectedSlot && (
          <Alert color="blue">
            Horario seleccionado:{" "}
            {dayjs(selectedSlot).format("DD/MM/YYYY HH:mm")}
          </Alert>
        )}

        <TextInput
          label="Nombre del cliente"
          placeholder="Ingresa el nombre"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
        />

        <TextInput
          label="Teléfono"
          placeholder="Ingresa el teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="green" title="Éxito">
            ¡Cita confirmada exitosamente!
          </Alert>
        )}

        <Group justify="flex-end">
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedSlot || !serviceId || !clientName || !phone}
          >
            {loading ? "Agendando..." : "Confirmar cita"}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
