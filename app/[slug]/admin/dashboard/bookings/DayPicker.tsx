"use client";

import { Group, Button } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface DayPickerProps {
  onBlockTimeClick?: () => void;
}

export default function DayPicker({ onBlockTimeClick }: DayPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  const slug = params.slug as string;

  const initialDateString =
    searchParams.get("date") ?? new Date().toLocaleDateString("en-CA");

  const [dateString, setDateString] = useState(initialDateString);
  const [closedDays, setClosedDays] = useState<number[]>([]);

  useEffect(() => {
    setDateString(initialDateString);
  }, [initialDateString]);

  // 👇 Fetch de días disponibles
  useEffect(() => {
    fetch(`/api/business/${slug}/schedule`)
      .then((r) => r.json())
      .then((slots) => {
        if (!Array.isArray(slots)) return;
        // Días que SÍ tienen slots
        const openDays = new Set(slots.map((s: any) => s.dayOfWeek));
        // Días cerrados = los que NO están en openDays (0-6)
        const closed = [0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays.has(d));
        setClosedDays(closed);
      });
  }, [slug]);

  function updateDate(value: string | null) {
    if (!value) return;
    setDateString(value);
    router.push(`/${slug}/admin/dashboard/bookings?date=${value}`);
  }

  return (
    <Group mb="md">
      <DatePickerInput
        label="Fecha"
        value={new Date(dateString + "T12:00:00")}
        onChange={updateDate}
        style={{ flex: 1 }}
        // 👇 Deshabilita los días cerrados
        excludeDate={(date) => {
          const d = new Date(date);
          // Usar UTC para evitar el offset de timezone
          return closedDays.includes(d.getUTCDay());
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
