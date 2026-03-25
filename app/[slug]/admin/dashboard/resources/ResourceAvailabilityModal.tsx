"use client";

import {
  Modal, Stack, Group, Text, Button, Switch, Tabs, TextInput,
} from "@mantine/core";
import { TimeInput, DatePickerInput } from "@mantine/dates";
import { IconPlus, IconX, IconDeviceFloppy, IconTrash } from "@tabler/icons-react";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { showNotification } from "@mantine/notifications";

const weekDays = [
  { label: "Domingo",   value: 0 },
  { label: "Lunes",     value: 1 },
  { label: "Martes",    value: 2 },
  { label: "Miércoles", value: 3 },
  { label: "Jueves",    value: 4 },
  { label: "Viernes",   value: 5 },
  { label: "Sábado",    value: 6 },
];

type TimeSlot    = { start: string; end: string };
type DaySchedule = { dayOfWeek: number; slots: TimeSlot[] };

type Vacation = {
  id: string;
  name: string | null;
  start: string;
  end: string;
};

type NewVacation = {
  name: string;
  start: Date | string | null;
  end: Date | string | null;
};

const emptyDays = (): DaySchedule[] =>
  weekDays.map((d) => ({ dayOfWeek: d.value, slots: [] }));

function toMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}

function vacationStatus(start: string, end: string) {
  const now   = new Date();
  const s     = new Date(start);
  const e     = new Date(end);
  if (e < now)  return { label: "Pasado",  color: "dimmed" } as const;
  if (s <= now) return { label: "En curso", color: "yellow" } as const;
  // days until start
  const days = Math.ceil((s.getTime() - now.getTime()) / 86400000);
  if (days <= 30) return { label: "Próximo", color: "orange" } as const;
  return { label: "Futuro", color: "blue" } as const;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
  avatarColor: string;
  initials: string;
  onSaved: (activeDays: number[]) => void;
}

export function ResourceAvailabilityModal({
  opened, onClose, profileId, profileName, avatarColor, initials, onSaved,
}: Props) {
  const { slug } = useParams<{ slug: string }>();

  // ── Horario ──
  const [days, setDays]       = useState<DaySchedule[]>(emptyDays());
  const [saved, setSaved]     = useState<DaySchedule[]>(emptyDays());
  const [saving, setSaving]   = useState(false);
  const [loadingSched, setLoadingSched] = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(days) !== JSON.stringify(saved),
    [days, saved],
  );

  // ── Vacaciones ──
  const [vacations, setVacations]           = useState<Vacation[]>([]);
  const [loadingVac, setLoadingVac]         = useState(false);
  const [savingVac, setSavingVac]           = useState(false);
  const [deletingId, setDeletingId]         = useState<string | null>(null);
  const [newVac, setNewVac]                 = useState<NewVacation>({ name: "", start: null, end: null });

  // Cargar al abrir
  useEffect(() => {
    if (!opened || !profileId) return;

    setLoadingSched(true);
    fetch(`/api/business/${slug}/resources/${profileId}/schedule`)
      .then((r) => r.json())
      .then((data: { dayOfWeek: number; startTime: string; endTime: string }[]) => {
        const grouped = emptyDays();
        data.forEach((s) => {
          const day = grouped.find((d) => d.dayOfWeek === s.dayOfWeek);
          if (day) day.slots.push({ start: s.startTime, end: s.endTime });
        });
        setDays(grouped);
        setSaved(grouped);
      })
      .finally(() => setLoadingSched(false));

    setLoadingVac(true);
    fetch(`/api/business/${slug}/resources/${profileId}/vacations`)
      .then((r) => r.json())
      .then(setVacations)
      .finally(() => setLoadingVac(false));
  }, [opened, profileId, slug]);

  // ── Horario: mutaciones ──
  const toggleDay = (dow: number, on: boolean) =>
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dow ? { ...d, slots: on ? [{ start: "09:00", end: "17:00" }] : [] } : d,
    ));

  const addSlot = (dow: number) =>
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dow ? { ...d, slots: [...d.slots, { start: "09:00", end: "17:00" }] } : d,
    ));

  const removeSlot = (dow: number, idx: number) =>
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dow ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d,
    ));

  const updateSlot = (dow: number, idx: number, field: "start" | "end", val: string) =>
    setDays((prev) => prev.map((d) =>
      d.dayOfWeek === dow
        ? { ...d, slots: d.slots.map((s, i) => i === idx ? { ...s, [field]: val } : s) }
        : d,
    ));

  // ── Horario: guardar ──
  const handleSaveSchedule = async () => {
    for (const day of days) {
      const label = weekDays.find((d) => d.value === day.dayOfWeek)?.label;
      for (const s of day.slots) {
        if (toMinutes(s.end) <= toMinutes(s.start)) {
          showNotification({ title: "Rango inválido", message: `${label}: el cierre debe ser mayor a la apertura`, color: "red" });
          return;
        }
      }
      for (let i = 0; i < day.slots.length; i++) {
        for (let j = i + 1; j < day.slots.length; j++) {
          const a = day.slots[i], b = day.slots[j];
          if (toMinutes(a.start) < toMinutes(b.end) && toMinutes(a.end) > toMinutes(b.start)) {
            showNotification({ title: "Rango inválido", message: `${label}: los rangos se solapan`, color: "red" });
            return;
          }
        }
      }
    }

    setSaving(true);
    const flatSlots = days.flatMap((d) =>
      d.slots.map((s) => ({ dayOfWeek: d.dayOfWeek, startTime: s.start, endTime: s.end })),
    );

    const res = await fetch(`/api/business/${slug}/resources/${profileId}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: flatSlots }),
    });
    setSaving(false);

    if (!res.ok) {
      showNotification({ title: "Error", message: "No se pudo guardar el horario", color: "red" });
      return;
    }

    setSaved(days);
    const activeDays = days.filter((d) => d.slots.length > 0).map((d) => d.dayOfWeek);
    onSaved(activeDays);
    showNotification({ title: "Guardado", message: `Horario de ${profileName} actualizado`, color: "green" });
  };

  // ── Vacaciones: agregar ──
  const handleAddVacation = async () => {
    if (!newVac.start || !newVac.end) {
      showNotification({ title: "Error", message: "Selecciona fechas de inicio y fin", color: "red" });
      return;
    }
    if (newVac.start > newVac.end) {
      showNotification({ title: "Error", message: "La fecha de inicio debe ser menor al fin", color: "red" });
      return;
    }

    setSavingVac(true);
    const res = await fetch(`/api/business/${slug}/resources/${profileId}/vacations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:  newVac.name || null,
        start: new Date(newVac.start).toISOString(),
        end:   new Date(newVac.end).toISOString(),
      }),
    });
    setSavingVac(false);

    if (!res.ok) {
      showNotification({ title: "Error", message: "No se pudo guardar la ausencia", color: "red" });
      return;
    }

    const created = await res.json();
    setVacations((prev) => [...prev, created].sort((a, b) => a.start.localeCompare(b.start)));
    setNewVac({ name: "", start: null, end: null });
    showNotification({ title: "Guardado", message: "Período de ausencia agregado", color: "green" });
  };

  // ── Vacaciones: eliminar ──
  const handleDeleteVacation = async (id: string) => {
    setDeletingId(id);
    await fetch(`/api/business/${slug}/resources/${profileId}/vacations?id=${id}`, {
      method: "DELETE",
    });
    setVacations((prev) => prev.filter((v) => v.id !== id));
    setDeletingId(null);
    showNotification({ title: "Eliminado", message: "Período de ausencia eliminado", color: "red" });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      size="md"
      padding={0}
      withCloseButton={false}
    >
      {/* Header */}
      <Group p="md" style={{ borderBottom: "1px solid #f1f5f9" }} justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <div style={{
            width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
            background: avatarColor,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "white",
          }}>
            {initials}
          </div>
          <div>
            <Text fw={700} size="sm">{profileName}</Text>
            <Text size="xs" c="dimmed">Configura horario y ausencias</Text>
          </div>
        </Group>
        <Button variant="subtle" color="gray" size="xs" onClick={onClose} px={8}>✕</Button>
      </Group>

      {/* Tabs */}
      <Tabs defaultValue="schedule" keepMounted={false}>
        <Tabs.List grow style={{ borderBottom: "1px solid #f1f5f9" }}>
          <Tabs.Tab value="schedule">Horario semanal</Tabs.Tab>
          <Tabs.Tab value="vacations">Vacaciones</Tabs.Tab>
        </Tabs.List>

        {/* ── Tab Horario ── */}
        <Tabs.Panel value="schedule">
          <Stack gap="xs" p="md" style={{ maxHeight: "55vh", overflowY: "auto" }}>
            {loadingSched ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">Cargando horarios...</Text>
            ) : (
              days.map((day) => {
                const label = weekDays.find((d) => d.value === day.dayOfWeek)?.label ?? "";
                const isOn  = day.slots.length > 0;
                return (
                  <div key={day.dayOfWeek} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, overflow: "hidden" }}>
                    <Group gap="sm" p="sm" wrap="nowrap">
                      <Switch
                        checked={isOn}
                        onChange={(e) => toggleDay(day.dayOfWeek, e.currentTarget.checked)}
                        size="md"
                      />
                      <Text fw={700} size="sm" c={isOn ? "dark" : "dimmed"} style={{ flex: 1 }}>{label}</Text>
                      {isOn && (
                        <Button size="xs" variant="subtle" color="blue" leftSection={<IconPlus size={12} />} onClick={() => addSlot(day.dayOfWeek)} px={8}>
                          Agregar rango
                        </Button>
                      )}
                    </Group>
                    {isOn && (
                      <Stack gap={6} px="sm" pb="sm">
                        {day.slots.map((slot, idx) => (
                          <Group key={idx} gap={8} wrap="nowrap">
                            <TimeInput value={slot.start} onChange={(e) => updateSlot(day.dayOfWeek, idx, "start", e.target.value)} size="sm" style={{ flex: 1 }} />
                            <Text size="sm" c="dimmed" fw={600}>→</Text>
                            <TimeInput value={slot.end} onChange={(e) => updateSlot(day.dayOfWeek, idx, "end", e.target.value)} size="sm" style={{ flex: 1 }} />
                            <Button size="xs" variant="light" color="red" px={8} onClick={() => removeSlot(day.dayOfWeek, idx)}>
                              <IconX size={12} />
                            </Button>
                          </Group>
                        ))}
                      </Stack>
                    )}
                  </div>
                );
              })
            )}
          </Stack>

          <Group p="md" justify="flex-end" gap="sm" style={{ borderTop: "1px solid #f1f5f9" }}>
            <Button variant="subtle" color="gray" onClick={onClose}>Cancelar</Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSaveSchedule}
              loading={saving}
              disabled={!hasChanges}
              color="green"
            >
              Guardar horario
            </Button>
          </Group>
        </Tabs.Panel>

        {/* ── Tab Vacaciones ── */}
        <Tabs.Panel value="vacations">
          <Stack gap="xs" p="md" style={{ maxHeight: "55vh", overflowY: "auto" }}>

            {/* Lista de vacaciones existentes */}
            {loadingVac ? (
              <Text size="sm" c="dimmed" ta="center" py="md">Cargando...</Text>
            ) : vacations.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md" fs="italic">Sin períodos de ausencia registrados</Text>
            ) : (
              vacations.map((v) => {
                const status  = vacationStatus(v.start, v.end);
                const isPast  = status.label === "Pasado";
                const isSingle = v.start.slice(0, 10) === v.end.slice(0, 10);
                return (
                  <Group
                    key={v.id}
                    gap="sm"
                    p="sm"
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #f1f5f9",
                      borderRadius: 10,
                      opacity: isPast ? 0.55 : 1,
                    }}
                    wrap="nowrap"
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={700} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {v.name ?? "Sin nombre"}
                      </Text>
                      <Text size="xs" c="dimmed" mt={2}>
                        {isSingle ? formatDate(v.start) : `${formatDate(v.start)} — ${formatDate(v.end)}`}
                      </Text>
                    </div>
                    <Text size="xs" c={status.color} fw={600} style={{ flexShrink: 0 }}>
                      {status.label}
                    </Text>
                    <Button
                      size="xs" variant="light" color="red" px={6}
                      loading={deletingId === v.id}
                      onClick={() => handleDeleteVacation(v.id)}
                    >
                      <IconTrash size={12} />
                    </Button>
                  </Group>
                );
              })
            )}

            {/* Formulario agregar */}
            <div style={{ background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 12, padding: 12, marginTop: 4 }}>
              <Text size="xs" fw={700} c="dimmed" mb={10} tt="uppercase" style={{ letterSpacing: "0.05em" }}>
                Agregar período de ausencia
              </Text>
              <Stack gap={8}>
                <TextInput
                  placeholder="Motivo (opcional)"
                  size="sm"
                  value={newVac.name}
                  onChange={(e) => setNewVac((p) => ({ ...p, name: e.target.value }))}
                />
                <Group gap={8} wrap="nowrap">
                  <DatePickerInput
                    placeholder="Inicio"
                    size="sm"
                    style={{ flex: 1 }}
                    value={newVac.start}
                    onChange={(v) => setNewVac((p) => ({ ...p, start: v }))}
                    minDate={new Date()}
                    valueFormat="DD MMM YYYY"
                    clearable
                  />
                  <Text size="sm" c="dimmed">→</Text>
                  <DatePickerInput
                    placeholder="Fin"
                    size="sm"
                    style={{ flex: 1 }}
                    value={newVac.end}
                    onChange={(v) => setNewVac((p) => ({ ...p, end: v }))}
                    minDate={newVac.start ?? new Date()}
                    valueFormat="DD MMM YYYY"
                    clearable
                  />
                </Group>
                <Button
                  size="xs"
                  color="blue"
                  loading={savingVac}
                  onClick={handleAddVacation}
                  disabled={!newVac.start || !newVac.end}
                  style={{ alignSelf: "flex-end" }}
                >
                  Agregar
                </Button>
              </Stack>
            </div>
          </Stack>

          <Group p="md" justify="flex-end" style={{ borderTop: "1px solid #f1f5f9" }}>
            <Button variant="subtle" color="gray" onClick={onClose}>Cerrar</Button>
          </Group>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}