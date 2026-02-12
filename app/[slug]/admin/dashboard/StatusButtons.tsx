"use client";

import { Button, Group } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifications } from "@mantine/notifications";

interface Props {
  appointmentId: string;
  slug: string;
}

export function StatusButtons({ appointmentId, slug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (newStatus: string) => {
    setLoading(newStatus);
    
    try {
      const res = await fetch(`/api/business/${slug}/appointments/${appointmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        notifications.show({
          title: newStatus === "CONFIRMED" ? "Cita Confirmada" : "Cita Rechazada",
          message: `La cita ha sido actualizada correctamente.`,
          color: newStatus === "CONFIRMED" ? "green" : "red",
          autoClose: 3000,
        });
        router.refresh();
      } else {
        throw new Error();
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "No se pudo actualizar el estado de la cita.",
        color: "red",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Group gap={5}>
      <Button
        variant="light"
        color="green"
        size="compact-xs"
        loading={loading === "CONFIRMED"}
        disabled={!!loading && loading !== "CONFIRMED"}
        onClick={() => updateStatus("CONFIRMED")}
      >
        Aceptar
      </Button>
      <Button
        variant="light"
        color="red"
        size="compact-xs"
        loading={loading === "CANCELLED"}
        disabled={!!loading && loading !== "CANCELLED"}
        onClick={() => updateStatus("CANCELLED")}
      >
        Rechazar
      </Button>
    </Group>
  );
}