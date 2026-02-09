"use client";

import { Group, Button } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface DayPickerProps {
  onBlockTimeClick?: () => void;
}

export default function DayPicker({ onBlockTimeClick }: DayPickerProps) {
  const router = useRouter();
  const params = useSearchParams();

  const initialDateString =
    params.get("date") ?? new Date().toISOString().split("T")[0];

  const [dateString, setDateString] = useState(initialDateString);

  function updateDate(value: string | null) {
    if (!value) return;

    setDateString(value);
    router.push(`/admin/dashboard?date=${value}`);
  }

  return (
    <Group mb="md">
      <DatePickerInput
        label="Fecha"
        value={new Date(dateString + "T12:00:00")}
        onChange={updateDate}
        style={{ flex: 1 }}
      />

      <Button
        style={{ alignSelf: "flex-end" }}
        onClick={() => updateDate(new Date().toISOString().split("T")[0])}
      >
        Hoy
      </Button>
    </Group>
  );
}
