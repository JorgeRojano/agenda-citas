"use client";

import { Button, Group, Modal, Select, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { getWhatsAppLink } from "@/lib/utils";
import { Resource } from "@/types/Resource";

interface Props {
  appointmentId: string;
  slug: string;
  serviceId: string;
  assignedToId?: string | null;
}

export function StatusButtons({ appointmentId, slug, serviceId, assignedToId }: Props) {
  const router  = useRouter();
  const [loading, setLoading]       = useState<string | null>(null);
  const [resources, setResources]   = useState<Resource[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  // Cargar recursos del servicio cuando se abre el modal
  useEffect(() => {
    if (!modalOpened) return;
    fetch(`/api/business/${slug}/staff?serviceId=${serviceId}`)
      .then((r) => r.json())
      .then(setResources);
  }, [modalOpened, slug, serviceId]);

  const updateStatus = async (newStatus: string, resourceId?: string | null) => {
    setLoading(newStatus);
    try {
      const body: any = { status: newStatus };
      if (resourceId !== undefined) body.assignedToId = resourceId;

      const res = await fetch(
        `/api/business/${slug}/appointments/${appointmentId}`,
        { method: "PATCH", body: JSON.stringify(body) },
      );

      const data = await res.json();

      if (res.ok && data.appointment) {
        const appo      = data.appointment;
        const startDate = new Date(appo.startTime);

        const fechaMx = startDate.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
        const horaMx  = startDate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true });

        const message = newStatus === "CONFIRMED"
          ? `*¡Cita Confirmada!* ✅\n\nHola *${appo.clientName}*, te confirmamos tu cita:\n\n🔹 *Servicio:* ${appo.service.name}\n📅 *Día:* ${fechaMx}\n⏰ *Hora:* ${horaMx}\n📍 *Lugar:* ${appo.business.name}\n\n¡Te esperamos! 😊`
          : `*Aviso de Cita* 🗓️\n\nHola *${appo.clientName}*, lamentamos informarte que no pudimos confirmar tu espacio para *${appo.service.name}* en el horario solicitado.\n\n🙏 Por favor, intenta agendar en otro horario disponible. ¡Gracias!`;

        window.open(getWhatsAppLink(appo.phone, message), "_blank");

        notifications.show({
          title:    newStatus === "CONFIRMED" ? "Cita Confirmada" : "Cita Rechazada",
          message:  "Estado actualizado y WhatsApp preparado.",
          color:    newStatus === "CONFIRMED" ? "green" : "red",
          autoClose: 3000,
        });
        router.refresh();
      } else {
        throw new Error();
      }
    } catch {
      notifications.show({ title: "Error", message: "No se pudo actualizar el estado.", color: "red" });
    } finally {
      setLoading(null);
    }
  };

  const handleConfirm = () => {
    // Si ya tiene recurso asignado, confirmar directo
    if (assignedToId) {
      updateStatus("CONFIRMED");
      return;
    }
    // Si no tiene recurso, abrir modal para asignar uno
    openModal();
  };

  const handleConfirmWithResource = async () => {
    if (!selectedId) {
      notifications.show({ title: "Error", message: "Selecciona un recurso para continuar", color: "red" });
      return;
    }
    closeModal();
    await updateStatus("CONFIRMED", selectedId);
  };

  return (
    <>
      <Group gap={5}>
        <Button
          variant="light" color="green" size="compact-xs"
          loading={loading === "CONFIRMED"}
          disabled={!!loading && loading !== "CONFIRMED"}
          onClick={handleConfirm}
        >
          Aceptar
        </Button>
        <Button
          variant="light" color="red" size="compact-xs"
          loading={loading === "CANCELLED"}
          disabled={!!loading && loading !== "CANCELLED"}
          onClick={() => updateStatus("CANCELLED")}
        >
          Rechazar
        </Button>
      </Group>

      {/* Modal asignación obligatoria */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title="Asignar recurso"
        centered
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Esta cita no tiene un recurso asignado. Selecciona uno para confirmarla.
          </Text>
          <Select
            label="Recurso"
            placeholder="Selecciona un colaborador"
            data={resources.map((r) => ({
              value: r.id as string,
              label: r.specialty ? `${r.name} · ${r.specialty}` : r.name,
            }))}
            value={selectedId}
            onChange={setSelectedId}
          />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={closeModal}>Cancelar</Button>
            <Button
              color="green"
              disabled={!selectedId}
              loading={loading === "CONFIRMED"}
              onClick={handleConfirmWithResource}
            >
              Confirmar cita
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}