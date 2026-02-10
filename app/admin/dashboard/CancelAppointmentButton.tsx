"use client";

import { Button, Modal, Text, Group } from "@mantine/core";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  appointmentId: string;
};

export default function CancelAppointmentButton({
  appointmentId,
}: Props) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/appointments/${appointmentId}/cancel`,
        { method: "POST" }
      );

      if (!res.ok) {
        throw new Error("Failed");
      }

      setOpened(false);
      router.refresh();
    } catch (error) {
      alert("Error al cancelar la cita");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        color="red"
        variant="light"
        size="compact-xs"
        onClick={() => setOpened(true)}
      >
        Cancelar cita
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Cancelar cita"
        centered
      >
        <Text size="sm">
          ¿Seguro que deseas cancelar esta cita?  
          Esta acción no se puede deshacer.
        </Text>

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={() => setOpened(false)}>
            Volver
          </Button>
          <Button color="red" onClick={handleCancel} loading={loading}>
            Cancelar cita
          </Button>
        </Group>
      </Modal>
    </>
  );
}
