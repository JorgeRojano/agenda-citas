"use client";

import { Button } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { notifications } from "@mantine/notifications";
import { IconTrash, IconCheck, IconX } from "@tabler/icons-react";

type Props = {
  blockId: string;
  slug: string; // Agregamos el slug para la URL multi-tenant
};

export default function UnblockButton({ blockId, slug }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnblock() {
    // Usamos una confirmación sencilla, o podrías usar Mantine Modals
    const confirmed = window.confirm("¿Seguro que deseas quitar este bloqueo?");
    if (!confirmed) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/business/${slug}/availability/${blockId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al quitar bloqueo");
      }

      notifications.show({
        title: "Bloqueo eliminado",
        message: "El horario vuelve a estar disponible.",
        color: "green",
        icon: <IconCheck size={16} />,
      });

      router.refresh();
    } catch (error: any) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: error.message || "No se pudo quitar el bloqueo",
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
      color="red"
      variant="subtle"
      leftSection={<IconTrash size={14} />}
      onClick={handleUnblock}
      loading={loading}
    >
      Desbloquear
    </Button>
  );
}