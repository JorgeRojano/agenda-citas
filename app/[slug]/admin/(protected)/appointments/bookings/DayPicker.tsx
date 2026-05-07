"use client";

import { Group, Button } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface BlockedTime {
  start: string;
  end: string;
}

interface DayPickerProps {
  onBlockedChange?: (isBlocked: boolean) => void;
  onClosedDayChange?: (isClosed: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export default function DayPicker({ onBlockedChange, onClosedDayChange, onLoadingChange }: DayPickerProps) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const params       = useParams();
  const slug         = params.slug as string;

  const initialDateString =
    searchParams.get("date") ?? new Date().toLocaleDateString("en-CA");

  const [isPending, startTransition] = useTransition();
  const [dateString, setDateString] = useState(initialDateString);
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [blockedRanges, setBlockedRanges] = useState<BlockedTime[]>([]);

  useEffect(() => { onLoadingChange?.(isPending); }, [isPending, onLoadingChange]);

  useEffect(() => {
    setDateString(initialDateString);
  }, [initialDateString]);

  // Fetch horario del negocio
  useEffect(() => {
    fetch(`/api/business/${slug}/schedule`)
      .then((r) => r.json())
      .then((slots) => {
        if (!Array.isArray(slots)) return;
        const openDays = new Set(slots.map((s: any) => s.dayOfWeek));
        const closed = [0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays.has(d));
        setClosedDays(closed);
      });
  }, [slug]);

  // Notificar al padre si el día seleccionado es día cerrado
  useEffect(() => {
    if (!onClosedDayChange) return;
    const dayOfWeek = new Date(dateString + "T12:00:00").getDay();
    onClosedDayChange(closedDays.includes(dayOfWeek));
  }, [dateString, closedDays, onClosedDayChange]);

  // Fetch festivos del negocio
  useEffect(() => {
    fetch(`/api/business/${slug}/blocked-times`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setBlockedRanges(data);
      });
  }, [slug]);

  const toDateStr = (d: Date | string) => {
    const dt = new Date(d);
    const y  = dt.getUTCFullYear();
    const m  = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const day = String(dt.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Notificar al padre si la fecha seleccionada está bloqueada
  useEffect(() => {
    if (!onBlockedChange) return;
    const selected = dateString; // ya es "YYYY-MM-DD"
    const isBlocked = blockedRanges.some((b) => {
      return selected >= toDateStr(b.start) && selected <= toDateStr(b.end);
    });
    onBlockedChange(isBlocked);
  }, [dateString, blockedRanges, onBlockedChange]);

  const isDateBlocked = (date: Date) => {
    const d = toDateStr(date);
    return blockedRanges.some((b) => d >= toDateStr(b.start) && d <= toDateStr(b.end));
  };

  function updateDate(value: string | null) {
    if (!value) return;
    setDateString(value);
    startTransition(() => {
      router.push(`/${slug}/admin/appointments/bookings?date=${value}`);
    });
  }

  return (
    <Group mb="md">
      <DatePickerInput
        label="Fecha"
        value={new Date(dateString + "T12:00:00")}
        onChange={updateDate}
        style={{ flex: 1 }}
        excludeDate={(date) => {
          const d = new Date(date);
          return closedDays.includes(d.getUTCDay()) || isDateBlocked(d);
        }}
      />
      <Button
        style={{ alignSelf: "flex-end" }}
        onClick={() => updateDate(new Date().toLocaleDateString("en-CA"))}
      >
        Hoy
      </Button>
    </Group>
  );
}