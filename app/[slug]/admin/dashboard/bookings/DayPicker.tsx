"use client";

import { Group, Button } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useState } from "react";

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
      />

      <Button
        style={{ alignSelf: "flex-end" }}
        onClick={() => 
          updateDate(new Date().toLocaleDateString("en-CA"))
        }
      >
        Hoy
      </Button>
    </Group>
  );
}
