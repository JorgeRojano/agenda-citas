"use client";

import { Button, Group } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { getWhatsAppLink } from "@/lib/utils";

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
      const res = await fetch(
        `/api/business/${slug}/appointments/${appointmentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await res.json();

      if (res.ok && data.appointment) {
        const appo = data.appointment;
        const startDate = new Date(appo.startTime);

        // Formato de fecha para México: dd/mm/yyyy
        const fechaMx = startDate.toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // Formato de hora para México: 12 horas con am/pm
        const horaMx = startDate.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

        const message =
          newStatus === "CONFIRMED"
            ? `*¡Cita Confirmada!* ✅\n\n` +
              `Hola *${appo.clientName}*, te confirmamos tu cita:\n\n` +
              `🔹 *Servicio:* ${appo.service.name}\n` +
              `📅 *Día:* ${fechaMx}\n` +
              `⏰ *Hora:* ${horaMx}\n` +
              `📍 *Lugar:* ${appo.business.name}\n\n` +
              `¡Te esperamos! 😊`
            : `*Aviso de Cita* 🗓️\n\n` +
              `Hola *${appo.clientName}*, lamentamos informarte que no pudimos confirmar tu espacio para *${appo.service.name}* en el horario solicitado.\n\n` +
              `🙏 Por favor, intenta agendar en otro horario disponible. ¡Gracias!`;

        const whatsappUrl = getWhatsAppLink(appo.phone, message);
        window.open(whatsappUrl, "_blank");

        notifications.show({
          title:
            newStatus === "CONFIRMED" ? "Cita Confirmada" : "Cita Rechazada",
          message: `Estado actualizado y WhatsApp preparado.`,
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
