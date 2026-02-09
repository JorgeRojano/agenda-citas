"use client";

import { Button, Modal, Stack, Text, Group, Notification } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";

export default function BlockTimeButton() {
  const params = useSearchParams();
  const router = useRouter();
  const dateString =
    params.get("date") ?? new Date().toISOString().split("T")[0];

  const [modalOpen, setModalOpen] = useState(false);
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");
  const [blocking, setBlocking] = useState(false);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleBlockTime() {
    setBlocking(true);
    setNotification(null);

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateString,
          startTime,
          endTime,
        }),
      });

      if (response.ok) {
        setModalOpen(false);
        setStartTime("09:00");
        setEndTime("10:00");
        setNotification({
          type: "success",
          message: `Horario bloqueado de ${startTime} a ${endTime}`,
        });
        router.refresh();
      } else {
        alert("Error al bloquear el tiempo");
      }
    } catch (error) {
      console.error("Error:", error);
      setNotification({
        type: "error",
        message: "No se pudo bloquear el horario",
      });
    } finally {
      setBlocking(false);
      setTimeout(() => {
        setNotification(null);
      }, 4000);
    }
  }

  return (
    <>
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 1000,
            maxWidth: 360,
          }}
        >
          <Notification
            icon={
              notification.type === "success" ? (
                <IconCheck size={18} />
              ) : (
                <IconX size={18} />
              )
            }
            color={notification.type === "success" ? "green" : "red"}
            title={
              notification.type === "success" ? "Horario bloqueado" : "Error"
            }
            onClose={() => setNotification(null)}
            withCloseButton
          >
            {notification.message}
          </Notification>
        </div>
      )}

      <Button onClick={() => setModalOpen(true)} variant="light">
        Bloquear tiempo
      </Button>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Bloquear tiempo"
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
          />

          <TimeInput
            label="Hora de fin"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlockTime} loading={blocking}>
              Bloquear
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
