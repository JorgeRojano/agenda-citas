import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { Text, TextInput, Title, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { Resource } from "@/types/Resource";

interface Props {
  selectedService: any;
  selectedResource: Resource;
  selectedDate: any;
  selectedTime: any;
  onSubmit: (values: any) => void;
  primaryColor?: string;
}

export function DetailsStep({
  selectedService,
  selectedResource,
  selectedDate,
  selectedTime,
  onSubmit,
  primaryColor = "#2563eb",
}: Props) {
  const [phone, setPhone] = useState<string>("+52");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { name: "", email: "" },
    validate: {
      name: (value) =>
        value.trim().length < 4 ? "Nombre debe tener al menos 4 caracteres" : null,
    },
  });

  const handleSubmit = (values: any) => {
    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Número de teléfono inválido");
      return;
    }
    setPhoneError(null);
    onSubmit({ ...values, phone });
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
    });
  };

  const formatTime = (time: any) => {
    if (!time) return "";
    return new Date(time).toLocaleTimeString("es-MX", {
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "America/Mexico_City",
    });
  };

  const rowStyle = {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 16px", borderBottom: "1px solid #f8fafc",
  };

  const iconBox = (bg: string, emoji: string) => (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: bg, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: 16,
    }}>{emoji}</div>
  );

  return (
    <Stack gap="md">
      <style>{`
        .details-form-grid {
          display: grid; grid-template-columns: 1fr; gap: 16px;
        }
        @media (min-width: 768px) {
          .details-form-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
          .details-form-full { grid-column: 1 / -1; }
        }
        .PhoneInputInput {
          border: none !important; outline: none !important;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          background: transparent; width: 100%;
        }
        .summary-date-mobile { display: flex; }
        .summary-date-desktop { display: none; }
        @media (min-width: 768px) {
          .summary-date-mobile { display: none; }
          .summary-date-desktop { display: flex; }
        }
      `}</style>

      <div>
        <Title order={4}>Tu información</Title>
        <Text size="sm" c="dimmed" mt={4}>Estás a un paso de confirmar tu cita</Text>
      </div>

      {/* Summary card */}
      <div style={{
        background: "white", borderRadius: 14,
        border: "1px solid #f1f5f9",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}>

        {/* Servicio */}
        {selectedService && (
          <div style={rowStyle}>
            {iconBox(`${primaryColor}15`, "💼")}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Servicio</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{selectedService.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                {selectedService.duration} min · ${(selectedService.price / 100).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Recurso */}
        {selectedResource && (
          <div style={rowStyle}>
            {iconBox("#f3f0ff", "👤")}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Recurso</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{selectedResource.name}</div>
              {selectedResource.specialty && (
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{selectedResource.specialty}</div>
              )}
            </div>
          </div>
        )}

        {/* Mobile — fecha y hora juntas */}
        {selectedDate && (
          <div className="summary-date-mobile" style={{ alignItems: "center", gap: 12, padding: "12px 16px" }}>
            {iconBox("#eff6ff", "📅")}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Fecha y hora</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                {formatDate(selectedDate)} · {formatTime(selectedTime)}
              </div>
            </div>
          </div>
        )}

        {/* Desktop — fecha */}
        {selectedDate && (
          <div className="summary-date-desktop" style={{ alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #f8fafc" }}>
            {iconBox("#eff6ff", "📅")}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Fecha</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{formatDate(selectedDate)}</div>
            </div>
          </div>
        )}

        {/* Desktop — hora */}
        {selectedTime && (
          <div className="summary-date-desktop" style={{ alignItems: "center", gap: 12, padding: "12px 16px" }}>
            {iconBox("#f0fdf4", "🕛")}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>Hora</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{formatTime(selectedTime)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <form id="details-form" onSubmit={form.onSubmit(handleSubmit)}>
        <div className="details-form-grid">
          <div>
            <TextInput required label="Nombre" placeholder="Tu nombre completo" {...form.getInputProps("name")} />
          </div>
          <div>
            <Text size="sm" fw={500} mb={4}>Celular <span style={{ color: "red" }}>*</span></Text>
            <PhoneInput
              defaultCountry="MX" international withCountryCallingCode
              value={phone}
              onChange={(value) => { setPhone(value ?? ""); setPhoneError(null); }}
              style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "9px 12px", background: "white" }}
            />
            {phoneError && <Text size="xs" c="red" mt={4}>{phoneError}</Text>}
          </div>
          <div className="details-form-full">
            <TextInput label="Correo Electrónico" placeholder="tu.correo@ejemplo.com" {...form.getInputProps("email")} />
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 10, padding: "10px 14px", marginTop: 20,
        }}>
          <span>🔒</span>
          <Text size="xs" style={{ color: "#16a34a", fontWeight: 500 }}>
            Tu información está segura y solo será usada para confirmar tu cita
          </Text>
        </div>
      </form>
    </Stack>
  );
}