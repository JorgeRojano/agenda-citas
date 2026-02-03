"use client";

import { useEffect, useState } from "react";

export default function BookPage() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  async function loadSlots(selectedDate: string) {
    const res = await fetch(
      `/api/availability?date=${selectedDate}&serviceId=${"443ec559-47c5-4317-af5e-b9095a44cc6c"}`
    );
    const data = await res.json();
    setSlots(data);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Agendar cita</h1>

      <input
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          loadSlots(e.target.value);
        }}
      />

      <ul>
        {slots.map((slot) => (
          <li key={slot}>
            <button onClick={() => setSelected(slot)}>
              {new Date(slot).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <p>
          Seleccionaste:{" "}
          {new Date(selected).toLocaleString("es-MX")}
        </p>
      )}
    </div>
  );
}
