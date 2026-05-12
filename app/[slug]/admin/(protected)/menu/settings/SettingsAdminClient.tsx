"use client";

import {
  Stack, Title, Group, Button, Text, Switch, Divider,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { useState, useMemo } from "react";
import { IconDeviceFloppy, IconX } from "@tabler/icons-react";
import { showNotification } from "@mantine/notifications";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type TimeSlot = { start: string; end: string };
type Hours    = Record<DayKey, TimeSlot[]>;

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DAY_LABELS: Record<DayKey, string> = {
  mon: "Lunes", tue: "Martes", wed: "Miércoles", thu: "Jueves",
  fri: "Viernes", sat: "Sábado", sun: "Domingo",
};

const formatTime = (time: string | undefined | null) => {
  if (!time || !time.includes(":")) return "--:--";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${suffix}`;
};

type Props = {
  slug:     string;
  settings: Record<string, unknown>;
};

const TIME_RE = /^\d{2}:\d{2}$/;

function asSlot(s: unknown): TimeSlot | null {
  if (!s || typeof s !== "object") return null;
  const start = (s as Record<string, unknown>).start;
  const end   = (s as Record<string, unknown>).end;
  if (typeof start !== "string" || typeof end !== "string") return null;
  if (!TIME_RE.test(start) || !TIME_RE.test(end)) return null;
  return { start, end };
}

// Acepta tanto el shape viejo ({ open, close } | null) como el nuevo (TimeSlot[])
function parseHours(raw: unknown): Hours {
  const data = (raw ?? {}) as Record<string, unknown>;
  const out  = {} as Hours;
  for (const d of DAY_KEYS) {
    const v = data[d];
    if (Array.isArray(v)) {
      out[d] = v.map(asSlot).filter((s): s is TimeSlot => s !== null);
    } else if (v && typeof v === "object" && "open" in v && "close" in v) {
      const obj = v as { open?: unknown; close?: unknown };
      if (typeof obj.open === "string" && typeof obj.close === "string" && TIME_RE.test(obj.open) && TIME_RE.test(obj.close)) {
        out[d] = [{ start: obj.open, end: obj.close }];
      } else {
        out[d] = [];
      }
    } else {
      out[d] = [];
    }
  }
  return out;
}

export default function SettingsAdminClient({ slug, settings }: Props) {
  const initialHours = useMemo(() => parseHours(settings.hours), [settings]);
  const [hours, setHours]                   = useState<Hours>(initialHours);
  const [savedHours, setSavedHours]         = useState<Hours>(initialHours);
  const [expandedSlots, setExpandedSlots]   = useState<Record<string, boolean>>({});
  const [saving, setSaving]                 = useState(false);

  const hasChanges = useMemo(
    () => JSON.stringify(hours) !== JSON.stringify(savedHours),
    [hours, savedHours],
  );

  const toggleExpand = (day: DayKey, idx: number) => {
    const key = `${day}-${idx}`;
    setExpandedSlots((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  const isExpanded = (day: DayKey, idx: number) => expandedSlots[`${day}-${idx}`] ?? false;

  const toggleDay = (day: DayKey, enabled: boolean) =>
    setHours((prev) => ({ ...prev, [day]: enabled ? [{ start: "09:00", end: "21:00" }] : [] }));

  const addSlot = (day: DayKey) =>
    setHours((prev) => ({ ...prev, [day]: [...prev[day], { start: "09:00", end: "21:00" }] }));

  const removeSlot = (day: DayKey, idx: number) =>
    setHours((prev) => ({ ...prev, [day]: prev[day].filter((_, i) => i !== idx) }));

  const updateSlot = (day: DayKey, idx: number, field: "start" | "end", value: string) =>
    setHours((prev) => ({
      ...prev,
      [day]: prev[day].map((s, i) => i === idx ? { ...s, [field]: value } : s),
    }));

  const handleSave = async () => {
    setSaving(true);
    const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    for (const day of DAY_KEYS) {
      const label = DAY_LABELS[day];
      const slots = hours[day];
      for (const slot of slots) {
        if (toMin(slot.end) <= toMin(slot.start)) {
          showNotification({ title: "Rango inválido", message: `${label}: el cierre debe ser mayor a la apertura`, color: "red" });
          setSaving(false); return;
        }
      }
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const a = slots[i], b = slots[j];
          if (toMin(a.start) < toMin(b.end) && toMin(a.end) > toMin(b.start)) {
            showNotification({ title: "Rango inválido", message: `${label}: los rangos se solapan`, color: "red" });
            setSaving(false); return;
          }
        }
      }
    }

    try {
      const res = await fetch(`/api/business/${slug}/admin/menu/settings`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hours }),
      });
      if (!res.ok) throw new Error();
      setSavedHours(hours);
      showNotification({ title: "Guardado", message: "Horarios guardados correctamente", color: "green" });
    } catch {
      showNotification({ title: "Error", message: "Error guardando horarios", color: "red" });
    } finally {
      setSaving(false);
    }
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
            <Title order={3}>Horarios</Title>
            <Text size="sm" c="dimmed" mt={2}>
              Define los horarios de atención de tu local. Puedes agregar varios rangos por día (ej. mañana y tarde).
            </Text>
          </div>
          <Button leftSection={<IconDeviceFloppy size={18} />} onClick={handleSave} disabled={!hasChanges} loading={saving}>
            {hasChanges ? "Guardar horarios" : "Guardado"}
          </Button>
        </Group>

        <Divider />

        <Stack gap="xs">
          {DAY_KEYS.map((day) => {
            const slots  = hours[day];
            const isOpen = slots.length > 0;
            return (
              <div key={day} className="day-row">
                <div className="day-col-left">
                  <Switch checked={isOpen} onChange={(e) => toggleDay(day, e.currentTarget.checked)} size="md" />
                  <Text fw={600} c={isOpen ? undefined : "dimmed"} size="sm">{DAY_LABELS[day]}</Text>
                </div>
                <div className="day-col-right">
                  {!isOpen ? (
                    <Text size="sm" c="dimmed" fs="italic">Cerrado</Text>
                  ) : (
                    <>
                      {slots.map((slot, index) => (
                        <div key={index} style={{ width: isExpanded(day, index) ? "100%" : "auto" }}>
                          {isExpanded(day, index) ? (
                            <div className="edit-slot-bg">
                              <div className="edit-slot-grid">
                                <div style={{ flex: 1 }}>
                                  <Text size="xs" fw={600} c="dimmed" mb={4}>Abre</Text>
                                  <TimeInput value={slot.start} onChange={(e) => updateSlot(day, index, "start", e.target.value)} size="sm" />
                                </div>
                                <div className="edit-slot-arrow">→</div>
                                <div style={{ flex: 1 }}>
                                  <Text size="xs" fw={600} c="dimmed" mb={4}>Cierra</Text>
                                  <TimeInput value={slot.end} onChange={(e) => updateSlot(day, index, "end", e.target.value)} size="sm" />
                                </div>
                                <Button size="xs" variant="light" color="blue" mb={2} onClick={() => toggleExpand(day, index)} style={{ flexShrink: 0 }} className="edit-slot-desktop-btn">Listo</Button>
                                <Button size="xs" variant="light" color="red" mb={2} onClick={() => removeSlot(day, index)} style={{ flexShrink: 0 }} className="edit-slot-desktop-btn"><IconX size={14} /></Button>
                              </div>
                              <div className="edit-slot-mobile-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                                <Button size="xs" variant="light" color="blue" flex={1} onClick={() => toggleExpand(day, index)}>✓ Listo</Button>
                                <Button size="xs" variant="light" color="red" onClick={() => removeSlot(day, index)}>🗑</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="time-pill" onClick={() => toggleExpand(day, index)}>
                              <span>✏️ {formatTime(slot.start)} → {formatTime(slot.end)}</span>
                              <button className="pill-remove" onClick={(e) => { e.stopPropagation(); removeSlot(day, index); }}>✕</button>
                            </div>
                          )}
                        </div>
                      ))}
                      <button className="add-range-btn" onClick={() => addSlot(day)}>+ Rango</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </Stack>
      </Stack>
    </>
  );
}
