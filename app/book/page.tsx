"use client";

import { useEffect, useState } from "react";
import { createAppointment } from "./actions";

export default function BookPage() {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [services, setServices] = useState<any[]>([]);
  const [serviceId, setServiceId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then(setServices);
  }, []);

  useEffect(() => {
    if (!date || !serviceId) return;

    fetch(`/api/availability?date=${date}&serviceId=${serviceId}`)
      .then((res) => res.json())
      .then(setSlots);
  }, [date, serviceId]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Agendar cita</h1>

      <input
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
        }}
      />

      <select
        value={serviceId ?? ""}
        onChange={(e) => {
          setServiceId(e.target.value);
          setSlots([]);
        }}
      >
        <option value="">Selecciona un servicio</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.duration} min)
          </option>
        ))}
      </select>

      <ul>
        {slots.map((slot) => (
          <li key={slot}>
            <button
              onClick={() => setSelected(slot)}
              style={{
                background: selected === slot ? "#000" : "#eee",
                color: selected === slot ? "#fff" : "#000",
              }}
            >
              {new Date(slot).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          </li>
        ))}
      </ul>

      <button
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);

          try {
            await createAppointment(selected!, serviceId!);
            setSuccess(true);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Agendando..." : "Confirmar cita"}
      </button>

      {selected && (
        <p>Seleccionaste: {new Date(selected).toLocaleString("es-MX")}</p>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>¡Cita confirmada!</p>}
    </div>
  );
}
