"use client";

import {
  Stack, Title, Group, Button, Text, Switch, Divider, Modal, TextInput, Tooltip,
} from "@mantine/core";
import { TimeInput, DatePickerInput } from "@mantine/dates";
import { useState, useMemo } from "react";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/navigation";
import { IconDeviceFloppy, IconX, IconPlus, IconTrash, IconLock } from "@tabler/icons-react";
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

type TimeSlot     = { start: string; end: string };
type DaySchedule  = { dayOfWeek: number; slots: TimeSlot[] };
type Availability = { days: DaySchedule[] };

type BlockedTime = { id: string; name: string | null; start: string; end: string };
type NewBlocked  = { name: string; start: Date | string | null; end: Date | string | null };

const createEmptyAvailability = (): Availability => ({
  days: weekDays.map((d) => ({ dayOfWeek: d.value, slots: [] })),
});

const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });

function blockedStatus(start: string, end: string) {
  const now = new Date();
  const e   = new Date(end);
  const s   = new Date(start);
  if (e < now)  return { label: "Pasado",   color: "dimmed" } as const;
  if (s <= now) return { label: "En curso", color: "yellow" } as const;
  const days = Math.ceil((s.getTime() - now.getTime()) / 86400000);
  if (days <= 30) return { label: "Próximo", color: "orange" } as const;
  return { label: "Futuro", color: "blue" } as const;
}

interface Props {
  slug: string;
  userRole: string;
  currentUserId: string | null;
  initialSchedule: { dayOfWeek: number; startTime: string; endTime: string }[];
  businessSchedule: { dayOfWeek: number; startTime: string; endTime: string }[];
  initialBlockedTimes: BlockedTime[];
}

export default function AvailabilityClient({ slug, userRole, currentUserId, initialSchedule, businessSchedule, initialBlockedTimes }: Props) {
  const isStaff = userRole === "STAFF";
  const router = useRouter();

  const businessOpenDays = useMemo(
    () => [...new Set(businessSchedule.map((s) => s.dayOfWeek))],
    [businessSchedule],
  );

  const businessRangesByDay = useMemo(() => {
    const map: Record<number, { startTime: string; endTime: string }[]> = {};
    businessSchedule.forEach((s) => {
      if (!map[s.dayOfWeek]) map[s.dayOfWeek] = [];
      map[s.dayOfWeek].push({ startTime: s.startTime, endTime: s.endTime });
    });
    return map;
  }, [businessSchedule]);

  const buildAvailability = (data: typeof initialSchedule): Availability => {
    const grouped = createEmptyAvailability();
    data.forEach((s) => {
      const day = grouped.days.find((d) => d.dayOfWeek === s.dayOfWeek);
      if (day) day.slots.push({ start: s.startTime, end: s.endTime });
    });
    return grouped;
  };

  const [availability, setAvailability]           = useState<Availability>(() => buildAvailability(initialSchedule));
  const [savedAvailability, setSavedAvailability] = useState<Availability>(() => buildAvailability(initialSchedule));
  const [expandedSlots, setExpandedSlots]         = useState<Record<string, boolean>>({});
  const [saving, setSaving]                       = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(availability) !== JSON.stringify(savedAvailability),
    [availability, savedAvailability],
  );

  const [blockedTimes, setBlockedTimes]   = useState<BlockedTime[]>(initialBlockedTimes);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [savingBlocked, setSavingBlocked] = useState(false);
  const [newBlocked, setNewBlocked]       = useState<NewBlocked>({ name: "", start: null, end: null });
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const toggleExpand = (dow: number, idx: number) => {
    const key = `${dow}-${idx}`;
    setExpandedSlots((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const isExpanded = (dow: number, idx: number) => expandedSlots[`${dow}-${idx}`] ?? false;

  const toggleDay = (dow: number, enabled: boolean) =>
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dow ? { ...d, slots: enabled ? [{ start: "09:00", end: "17:00" }] : [] } : d,
      ),
    }));

  const addSlot = (dow: number) =>
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dow ? { ...d, slots: [...d.slots, { start: "09:00", end: "17:00" }] } : d,
      ),
    }));

  const removeSlot = (dow: number, idx: number) =>
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dow ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d,
      ),
    }));

  const updateSlot = (dow: number, idx: number, field: "start" | "end", value: string) =>
    setAvailability((prev) => ({
      days: prev.days.map((d) =>
        d.dayOfWeek === dow
          ? { ...d, slots: d.slots.map((s, i) => i === idx ? { ...s, [field]: value } : s) }
          : d,
      ),
    }));

  const handleSaveSchedule = async () => {
    setSaving(true);
    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    for (const day of availability.days) {
      const label = weekDays.find((d) => d.value === day.dayOfWeek)?.label;
      for (const slot of day.slots) {
        if (toMin(slot.end) <= toMin(slot.start)) {
          showNotification({ title: "Rango inválido", message: `${label}: el cierre debe ser mayor a la apertura`, color: "red" });
          setSaving(false); return;
        }
        if (isStaff) {
          const bizRanges = businessRangesByDay[day.dayOfWeek] ?? [];
          const fits = bizRanges.some(
            (r) => toMin(slot.start) >= toMin(r.startTime) && toMin(slot.end) <= toMin(r.endTime),
          );
          if (!fits) {
            const ref = bizRanges.length
              ? bizRanges.map((r) => `${formatTime(r.startTime)}–${formatTime(r.endTime)}`).join(", ")
              : "el negocio no abre este día";
            showNotification({ title: "Fuera del horario del negocio", message: `${label}: el rango debe estar dentro de ${ref}`, color: "red" });
            setSaving(false); return;
          }
        }
      }
      for (let i = 0; i < day.slots.length; i++) {
        for (let j = i + 1; j < day.slots.length; j++) {
          const a = day.slots[i], b = day.slots[j];
          if (toMin(a.start) < toMin(b.end) && toMin(a.end) > toMin(b.start)) {
            showNotification({ title: "Rango inválido", message: `${label}: los rangos se solapan`, color: "red" });
            setSaving(false); return;
          }
        }
      }
    }
    const flatSlots = availability.days.flatMap((day) =>
      day.slots.map((slot) => ({ dayOfWeek: day.dayOfWeek, startTime: slot.start, endTime: slot.end })),
    );
    const scheduleUrl = isStaff
      ? `/api/business/${slug}/resources/${currentUserId}/schedule`
      : `/api/business/${slug}/schedule`;
    const res = await fetch(scheduleUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slots: flatSlots }),
    });
    if (!res.ok) {
      showNotification({ title: "Error", message: "Error guardando horario", color: "red" });
      setSaving(false); return;
    }
    setSavedAvailability(availability);
    showNotification({ title: "Guardado", message: "Horario guardado correctamente", color: "green" });
    setSaving(false);
    router.refresh(); // ← re-ejecuta server components, actualiza cards de recursos
  };

  const handleAddBlocked = async () => {
    if (!newBlocked.start || !newBlocked.end) {
      showNotification({ title: "Error", message: "Selecciona fechas de inicio y fin", color: "red" });
      return;
    }
    setSavingBlocked(true);
    const toDateStr = (d: Date | string) => {
      const dt = new Date(d);
      return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
    };
    const blockedUrl = isStaff
      ? `/api/business/${slug}/resources/${currentUserId}/vacations`
      : `/api/business/${slug}/blocked-times`;
    const res = await fetch(blockedUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newBlocked.name || null,
        start: `${toDateStr(newBlocked.start)}T00:00:00.000Z`,
        end:   `${toDateStr(newBlocked.end)}T23:59:59.999Z`,
      }),
    });
    setSavingBlocked(false);
    if (!res.ok) {
      const data = await res.json();
      showNotification({ title: "Error", message: data.error ?? "No se pudo guardar el festivo", color: "red" });
      return;
    }
    const created = await res.json();
    setBlockedTimes((prev) => [...prev, created].sort((a, b) => a.start.localeCompare(b.start)));
    setNewBlocked({ name: "", start: null, end: null });
    showNotification({ title: "Guardado", message: "Cierre especial agregado", color: "green" });
    closeModal();
  };

  const handleDeleteBlocked = async (id: string) => {
    setDeletingId(id);
    const deleteUrl = isStaff
      ? `/api/business/${slug}/resources/${currentUserId}/vacations?id=${id}`
      : `/api/business/${slug}/blocked-times?id=${id}`;
    await fetch(deleteUrl, { method: "DELETE" });
    setBlockedTimes((prev) => prev.filter((b) => b.id !== id));
    setDeletingId(null);
    showNotification({ title: "Eliminado", message: "Cierre especial eliminado", color: "red" });
  };

  return (
    <>
      <style>{`
        .day-row {
          display: grid; grid-template-columns: 160px 1fr;
          align-items: start; gap: 16px; padding: 16px 20px;
          background: var(--mantine-color-default-hover);
          border-radius: 12px;
          border: 1px solid var(--mantine-color-default-border);
        }
        .day-col-left { display: flex; align-items: center; gap: 10px; padding-top: 2px; }
        .day-col-right { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .time-pill {
          display: flex; align-items: center; gap: 6px;
          background: var(--mantine-color-body);
          border: 1.5px solid var(--mantine-color-default-border);
          border-radius: 99px; padding: 6px 14px;
          font-size: 13px; font-weight: 500;
          color: var(--mantine-color-text);
          cursor: pointer;
        }
        .pill-remove {
          width: 16px; height: 16px;
          background: var(--mantine-color-red-light);
          color: var(--mantine-color-red-light-color);
          border-radius: 50%; border: none; font-size: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; line-height: 1;
        }
        .add-range-btn {
          padding: 6px 12px;
          background: var(--mantine-color-body);
          color: var(--mantine-color-blue-6);
          border: 1.5px dashed var(--mantine-color-blue-light-hover);
          border-radius: 99px; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: inherit;
        }
        .edit-slot-bg {
          background: var(--mantine-color-blue-light);
          border: 1.5px solid var(--mantine-color-blue-light-hover);
          border-radius: 12px; padding: 14px; margin-bottom: 6px; width: 100%;
        }
        @media (max-width: 600px) {
          .day-row { grid-template-columns: 1fr; gap: 10px; }
          .time-pill { width: 100%; border-radius: 10px; padding: 10px 14px; justify-content: space-between; font-size: 15px; }
          .pill-remove { width: 22px; height: 22px; font-size: 11px; }
          .add-range-btn { width: 100%; border-radius: 8px; padding: 10px; text-align: center; }
          .day-col-right { flex-direction: column; align-items: stretch; }
        }
        .edit-slot-grid { display: flex; align-items: flex-end; gap: 8px; }
        .edit-slot-arrow { color: var(--mantine-color-dimmed); padding-bottom: 10px; flex-shrink: 0; }
        .edit-slot-desktop-btn { display: flex; }
        .edit-slot-mobile-actions { display: none; }
        @media (max-width: 600px) {
          .edit-slot-grid { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 8px; }
          .edit-slot-arrow { padding-bottom: 10px; text-align: center; }
          .edit-slot-desktop-btn { display: none !important; }
          .edit-slot-mobile-actions { display: flex !important; }
        }
      `}</style>

      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={3}>Disponibilidad</Title>
            <Text size="sm" c="dimmed" mt={2}>
              {isStaff ? "Tu horario personal de atención" : "Horario semanal y cierres especiales del negocio"}
            </Text>
          </div>
          <Button leftSection={<IconDeviceFloppy size={18} />} onClick={handleSaveSchedule} disabled={!hasChanges} loading={saving}>
            {hasChanges ? "Guardar horario" : "Guardado"}
          </Button>
        </Group>

        {/* Referencia del negocio — lista por día */}
        {isStaff && (
          <div style={{ background: "var(--mantine-color-blue-light)", border: "1px solid var(--mantine-color-blue-light-hover)", borderRadius: 10, padding: "12px 16px" }}>
            <Text size="xs" fw={700} c="blue" tt="uppercase" mb={8} style={{ letterSpacing: "0.06em" }}>Horario del negocio (referencia)</Text>
            <Stack gap={4}>
              {weekDays.map((d) => {
                const slots = businessSchedule.filter((s) => s.dayOfWeek === d.value);
                return (
                  <Group key={d.value} gap={8}>
                    <Text size="xs" fw={600} c="blue.7" style={{ width: 80, flexShrink: 0 }}>{d.label}</Text>
                    {slots.length === 0
                      ? <Text size="xs" c="dimmed" fs="italic">Cerrado</Text>
                      : <Text size="xs" c="blue.7">{slots.map((s) => `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`).join(", ")}</Text>
                    }
                  </Group>
                );
              })}
            </Stack>
          </div>
        )}

        <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: "0.06em" }}>
          {isStaff ? "Mi horario" : "Horario semanal"}
        </Text>

        <Stack gap="xs">
          {availability.days.map((day) => {
            const dayLabel    = weekDays.find((d) => d.value === day.dayOfWeek)?.label ?? "";
            const isOpen      = day.slots.length > 0;
            const isBlocked   = isStaff && !businessOpenDays.includes(day.dayOfWeek);
            return (
              <div key={day.dayOfWeek} className="day-row" style={{ opacity: isBlocked ? 0.5 : 1 }}>
                <div className="day-col-left">
                  <Tooltip label="El negocio no abre este día" disabled={!isBlocked} withArrow>
                    <div>
                      <Switch checked={isOpen && !isBlocked} onChange={(e) => toggleDay(day.dayOfWeek, e.currentTarget.checked)} size="md" disabled={isBlocked} />
                    </div>
                  </Tooltip>
                  <Text fw={600} c={isOpen && !isBlocked ? undefined : "dimmed"} size="sm">{dayLabel}</Text>
                  {isBlocked && <Group gap={4}><IconLock size={12} color="var(--mantine-color-dimmed)" /><Text size="xs" c="dimmed">Cerrado</Text></Group>}
                </div>
                <div className="day-col-right">
                  {!isOpen || isBlocked ? (
                    <Text size="sm" c="dimmed" fs="italic">{isBlocked ? "" : "Cerrado"}</Text>
                  ) : (
                    <>
                      {day.slots.map((slot, index) => (
                        <div key={index} style={{ width: isExpanded(day.dayOfWeek, index) ? "100%" : "auto" }}>
                          {isExpanded(day.dayOfWeek, index) ? (
                            <div className="edit-slot-bg">
                              <div className="edit-slot-grid">
                                <div style={{ flex: 1 }}>
                                  <Text size="xs" fw={600} c="dimmed" mb={4}>Abre</Text>
                                  <TimeInput value={slot.start} onChange={(e) => updateSlot(day.dayOfWeek, index, "start", e.target.value)} size="sm" />
                                </div>
                                <div className="edit-slot-arrow">→</div>
                                <div style={{ flex: 1 }}>
                                  <Text size="xs" fw={600} c="dimmed" mb={4}>Cierra</Text>
                                  <TimeInput value={slot.end} onChange={(e) => updateSlot(day.dayOfWeek, index, "end", e.target.value)} size="sm" />
                                </div>
                                <Button size="xs" variant="light" color="blue" mb={2} onClick={() => toggleExpand(day.dayOfWeek, index)} style={{ flexShrink: 0 }} className="edit-slot-desktop-btn">Listo</Button>
                                <Button size="xs" variant="light" color="red" mb={2} onClick={() => removeSlot(day.dayOfWeek, index)} style={{ flexShrink: 0 }} className="edit-slot-desktop-btn"><IconX size={14} /></Button>
                              </div>
                              <div className="edit-slot-mobile-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                                <Button size="xs" variant="light" color="blue" flex={1} onClick={() => toggleExpand(day.dayOfWeek, index)}>✓ Listo</Button>
                                <Button size="xs" variant="light" color="red" onClick={() => removeSlot(day.dayOfWeek, index)}>🗑</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="time-pill" onClick={() => toggleExpand(day.dayOfWeek, index)}>
                              <span>✏️ {formatTime(slot.start)} → {formatTime(slot.end)}</span>
                              <button className="pill-remove" onClick={(e) => { e.stopPropagation(); removeSlot(day.dayOfWeek, index); }}>✕</button>
                            </div>
                          )}
                        </div>
                      ))}
                      <button className="add-range-btn" onClick={() => addSlot(day.dayOfWeek)}>+ Rango</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </Stack>

        <Divider />

        <Group justify="space-between">
          <div>
            <Text fw={600} size="sm">{isStaff ? "Mis ausencias y vacaciones" : "Festivos y cierres especiales"}</Text>
            <Text size="xs" c="dimmed" mt={2}>{isStaff ? "Fechas en las que no estarás disponible" : "El negocio no atiende en estas fechas"}</Text>
          </div>
          <Button size="xs" leftSection={<IconPlus size={14} />} onClick={openModal}>{isStaff ? "Agregar ausencia" : "Agregar festivo"}</Button>
        </Group>

        {blockedTimes.length === 0 ? (
          <Text size="sm" c="dimmed" fs="italic">{isStaff ? "Sin ausencias registradas" : "Sin cierres especiales registrados"}</Text>
        ) : (
          <Stack gap="xs">
            {blockedTimes.map((b) => {
              const status   = blockedStatus(b.start, b.end);
              const isSingle = b.start.slice(0, 10) === b.end.slice(0, 10);
              return (
                <Group
                  key={b.id} gap="sm" p="sm" wrap="nowrap"
                  style={{
                    background: "var(--mantine-color-default-hover)",
                    border: "1px solid var(--mantine-color-default-border)",
                    borderRadius: 10,
                    opacity: status.label === "Pasado" ? 0.55 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={700} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {b.name ?? "Sin nombre"}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      {isSingle ? formatDate(b.start) : `${formatDate(b.start)} — ${formatDate(b.end)}`}
                    </Text>
                  </div>
                  <Text size="xs" c={status.color} fw={600} style={{ flexShrink: 0 }}>{status.label}</Text>
                  <Button size="xs" variant="light" color="red" px={6} loading={deletingId === b.id} onClick={() => handleDeleteBlocked(b.id)}>
                    <IconTrash size={12} />
                  </Button>
                </Group>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Modal opened={modalOpened} onClose={closeModal} title={isStaff ? "Agregar ausencia" : "Agregar cierre especial"} centered size="sm">
        <Stack gap="md">
          <TextInput
            label="Nombre" placeholder="Ej: Semana Santa, Año Nuevo..."
            value={newBlocked.name}
            onChange={(e) => setNewBlocked((p) => ({ ...p, name: e.target.value }))}
          />
          <Group gap={8} wrap="nowrap">
            <DatePickerInput
              label="Inicio" placeholder="Fecha inicio" style={{ flex: 1 }}
              value={newBlocked.start} onChange={(v) => setNewBlocked((p) => ({ ...p, start: v }))}
              minDate={new Date()} valueFormat="DD MMM YYYY" clearable
            />
            <DatePickerInput
              label="Fin" placeholder="Fecha fin" style={{ flex: 1 }}
              value={newBlocked.end} onChange={(v) => setNewBlocked((p) => ({ ...p, end: v }))}
              minDate={newBlocked.start ? new Date(newBlocked.start) : new Date()} valueFormat="DD MMM YYYY" clearable
            />
          </Group>
          <Text size="xs" c="dimmed">Para un día suelto selecciona la misma fecha en inicio y fin.</Text>
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={closeModal}>Cancelar</Button>
            <Button loading={savingBlocked} disabled={!newBlocked.start || !newBlocked.end} onClick={handleAddBlocked}>Agregar</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}