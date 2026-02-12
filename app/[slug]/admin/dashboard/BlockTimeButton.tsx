"use client";

import { Button, Modal, Stack, Text, Group } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { notifications } from "@mantine/notifications"; // Cambiado a Mantine Notifications
import { IconCheck, IconX } from "@tabler/icons-react";

interface Props {
  slug: string; // Recibimos el slug como prop
}

export default function BlockTimeButton({ slug }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  
  const dateString = params.get("date") ?? new Date().toISOString().split("T")[0];

  const [modalOpen, setModalOpen] = useState(false);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [blocking, setBlocking] = useState(false);

  async function handleBlockTime() {
    setBlocking(true);

    try {
      // ✅ URL adaptada al nuevo endpoint: /api/[slug]/blocked-times
      const response = await fetch(`/api/business/${slug}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateString,
          startTime,
          endTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        notifications.show({
          title: "Horario bloqueado",
          message: `Bloqueo exitoso de ${startTime} a ${endTime}`,
          color: "green",
          icon: <IconCheck size={18} />,
        });

        setModalOpen(false);
        router.refresh();
        return;
      }

      // ⛔️ Manejo de errores (409 Conflicto con PENDING/CONFIRMED)
      notifications.show({
        title: "No se pudo bloquear",
        message: data.error || "Error al procesar la solicitud",
        color: "red",
        icon: <IconX size={18} />,
      });

    } catch (error) {
      notifications.show({
        title: "Error de conexión",
        message: "No se pudo conectar con el servidor",
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setBlocking(false);
    }
  }

  return (
    <>
      <Button onClick={() => setModalOpen(true)} variant="light">
        Bloquear tiempo
      </Button>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Bloquear tiempo de agenda"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Día seleccionado: <strong>{dateString}</strong>
          </Text>

          <TimeInput
            label="Hora de inicio"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />

          <TimeInput
            label="Hora de fin"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBlockTime} 
              loading={blocking}
              color="blue"
            >
              Confirmar Bloqueo
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}