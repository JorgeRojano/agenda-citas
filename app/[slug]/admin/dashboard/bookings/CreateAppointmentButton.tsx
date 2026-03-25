"use client";

import {
  Modal, Button, TextInput, Select,
  Text, Stack, Group, Center, Loader,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { showNotification } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { createAppointmentByAdmin } from "./actions";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface Resource { id: string; name: string; specialty?: string }

export default function CreateAppointmentButton({
  slug,
  primaryColor,
  services,
  disabled
}: {
  slug: string;
  primaryColor: string | null;
  services: any[];
  disabled?: boolean;
}) {
  const [opened, { open, close }] = useDisclosure(false);
  const [resources, setResources]         = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [slots, setSlots]                 = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot]   = useState<string | null>(null);
  const [phone, setPhone]                 = useState("+52");
  const [phoneError, setPhoneError]       = useState<string | null>(null);
  const [loading, setLoading]             = useState(false);
  const [loadingSlots, setLoadingSlots]   = useState(false);

  const searchParams = useSearchParams();
  const dateString = searchParams.get("date") ?? new Date().toLocaleDateString("en-CA");
  const today      = new Date().toLocaleDateString("en-CA");
  const isPastDate = dateString < today;

  const displayDate = new Date(dateString + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  const form = useForm({
    initialValues: { name: "", serviceId: "", assignedToId: "" },
    validate: {
      name:      (v) => (v.trim().length < 2 ? "Nombre requerido" : null),
      serviceId: (v) => (!v ? "Selecciona un servicio" : null),
    },
  });

  // ── Fetch recursos disponibles cuando cambia el servicio ──
  useEffect(() => {
    const { serviceId } = form.values;
    if (!serviceId || !dateString) {
      setResources([]);
      form.setFieldValue("assignedToId", "");
      return;
    }

    setLoadingResources(true);
    form.setFieldValue("assignedToId", "");
    setSlots([]);
    setSelectedSlot(null);

    const dateForApi = new Date(dateString + "T12:00:00").toString();

    fetch(
      `/api/business/${slug}/staff?date=${encodeURIComponent(dateForApi)}&serviceId=${serviceId}`,
    )
      .then((r) => r.json())
      .then((data: Resource[]) => setResources(data))
      .finally(() => setLoadingResources(false));
  }, [form.values.serviceId, dateString]);

  // ── Fetch slots cuando cambia recurso ──
  useEffect(() => {
    const { serviceId, assignedToId } = form.values;
    if (!serviceId || !dateString) { setSlots([]); return; }

    setLoadingSlots(true);
    setSelectedSlot(null);

    const dateForApi  = new Date(dateString + "T12:00:00").toString();
    const staffParam  = assignedToId ? `&staffId=${assignedToId}` : "";

    fetch(
      `/api/business/${slug}/availability?date=${encodeURIComponent(dateForApi)}&serviceId=${serviceId}${staffParam}`,
    )
      .then((r) => r.json())
      .then((data) => setSlots(data))
      .finally(() => setLoadingSlots(false));
  }, [form.values.serviceId, form.values.assignedToId, dateString]);

  const formatTime = (slot: string) =>
    new Date(slot).toLocaleTimeString("es-MX", {
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "America/Mexico_City",
    });

  const getHour = (slot: string) =>
    parseInt(new Date(slot).toLocaleString("en-US", {
      hour: "numeric", hour12: false, timeZone: "America/Mexico_City",
    }));

  const morningSlots   = slots.filter((s) => getHour(s) < 12);
  const afternoonSlots = slots.filter((s) => getHour(s) >= 12);

  const SlotGrid = ({ items }: { items: string[] }) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
      {items.map((slot) => (
        <div
          key={slot}
          onClick={() => setSelectedSlot(slot)}
          style={{
            padding: "7px 4px", borderRadius: 8, textAlign: "center",
            cursor: "pointer", fontSize: 11, fontWeight: 600,
            border: `1.5px solid ${selectedSlot === slot ? "#2563eb" : "#f1f5f9"}`,
            background: selectedSlot === slot ? "#2563eb" : "white",
            color: selectedSlot === slot ? "white" : "#374151",
            transition: "all 0.1s",
          }}
        >
          {formatTime(slot)}
        </div>
      ))}
    </div>
  );

  const handleClose = () => {
    close();
    form.reset();
    setPhone("+52");
    setSelectedSlot(null);
    setSlots([]);
    setResources([]);
    setPhoneError(null);
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Número inválido");
      return;
    }
    if (!selectedSlot) {
      showNotification({ title: "Error", message: "Selecciona un horario", color: "red" });
      return;
    }

    setLoading(true);
    try {
      await createAppointmentByAdmin(slug, {
        clientName:   values.name,
        phone,
        serviceId:    values.serviceId,
        slot:         selectedSlot,
        assignedToId: values.assignedToId || null,
      });
      showNotification({ title: "Cita creada", message: "La cita fue confirmada exitosamente", color: "green" });
      handleClose();
    } catch (error: any) {
      showNotification({ title: "Error", message: error.message, color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={open}
        color={primaryColor ?? "blue"}
        size="xs"
        disabled={isPastDate || disabled}
        title={isPastDate ? "No puedes crear citas en fechas pasadas" : disabled ? "Este día es festivo o cierre especial" : undefined}
      >
        Nueva cita
      </Button>

      <Modal opened={opened} onClose={handleClose} title="Nueva cita" centered size="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {/* Confirmada + fecha */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <span>✅</span>
              <div>
                <Text size="xs" fw={600} c="green.7">La cita se creará como Confirmada</Text>
                <Text size="xs" c="dimmed" mt={2}>📅 {displayDate}</Text>
              </div>
            </div>

            {/* Datos cliente */}
            <div>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>
                Datos del cliente
              </Text>
              <Stack gap="sm">
                <TextInput label="Nombre" placeholder="Nombre completo" required {...form.getInputProps("name")} />
                <div>
                  <Text size="sm" fw={500} mb={4}>Celular <span style={{ color: "red" }}>*</span></Text>
                  <PhoneInput
                    defaultCountry="MX" international withCountryCallingCode
                    value={phone}
                    onChange={(v) => { setPhone(v ?? ""); setPhoneError(null); }}
                    style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px" }}
                  />
                  {phoneError && <Text size="xs" c="red" mt={4}>{phoneError}</Text>}
                </div>
              </Stack>
            </div>

            {/* Servicio */}
            <div>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>
                Servicio
              </Text>
              <Select
                label="Servicio"
                placeholder="Selecciona un servicio"
                data={services.map((s) => ({ value: s.id, label: `${s.name} · ${s.duration} min` }))}
                required
                {...form.getInputProps("serviceId")}
              />
            </div>

            {/* Recurso — solo si hay servicio seleccionado */}
            {form.values.serviceId && (
              <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>
                  Recurso
                </Text>
                {loadingResources ? (
                  <Center h={40}><Loader size="xs" /></Center>
                ) : resources.length === 0 ? (
                  <Text size="xs" c="dimmed" fs="italic">
                    Ningún recurso tiene disponibilidad este día
                  </Text>
                ) : (
                  <Select
                    label="Asignar a (opcional)"
                    placeholder="Sin asignar"
                    clearable
                    data={resources.map((r) => ({
                      value: r.id,
                      label: r.specialty ? `${r.name} · ${r.specialty}` : r.name,
                    }))}
                    {...form.getInputProps("assignedToId")}
                  />
                )}
              </div>
            )}

            {/* Horarios */}
            {form.values.serviceId && form.values.assignedToId && (
              <div>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>
                  Horario disponible
                </Text>
                {loadingSlots ? (
                  <Center h={60}><Loader size="sm" /></Center>
                ) : slots.length === 0 ? (
                  <Text size="xs" c="dimmed">No hay horarios disponibles para este día</Text>
                ) : (
                  <Stack gap="xs">
                    {morningSlots.length > 0 && (
                      <>
                        <Text size="xs" c="dimmed">☀️ Mañana</Text>
                        <SlotGrid items={morningSlots} />
                      </>
                    )}
                    {afternoonSlots.length > 0 && (
                      <>
                        <Text size="xs" c="dimmed">🌤️ Tarde</Text>
                        <SlotGrid items={afternoonSlots} />
                      </>
                    )}
                  </Stack>
                )}
              </div>
            )}

            <Group justify="flex-end">
              <Button variant="subtle" color="gray" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" color={primaryColor ?? "blue"} loading={loading}>
                ✓ Confirmar cita
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}