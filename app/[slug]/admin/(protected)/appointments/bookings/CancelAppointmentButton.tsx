"use client";

import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { IconCalendarOff, IconCheck, IconX } from "@tabler/icons-react";

type Props = {
  appointmentId: string;
  slug: string;
};

export default function CancelAppointmentButton({ appointmentId, slug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    const confirmed = window.confirm("¿Estás seguro de que deseas cancelar esta cita confirmada?");
    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/business/${slug}/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al cancelar la cita");
      }

      notifications.show({
        title: "Cita cancelada",
        message: "Se ha actualizado el estado de la cita correctamente.",
        color: "gray",
        icon: <IconCheck size={16} />,
      });

      router.refresh();
    } catch (error: any) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: error.message || "No se pudo cancelar la cita",
        color: "red",
        icon: <IconX size={16} />,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="compact-xs"
      color="gray"
      variant="subtle"
      leftSection={<IconCalendarOff size={14} />}
      onClick={handleCancel}
      loading={loading}
    >
      Cancelar cita
    </Button>
  );
}