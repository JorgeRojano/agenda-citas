import { Text, Title, Stack, Button } from "@mantine/core";

interface Props {
  serviceName: string;
  time: string | null;
  onBookAnother: () => void;
  selectedDate?: any;
  selectedTime?: any;
  selectedService?: any;
  primaryColor?: string;
}

export function BookingPending({
  serviceName,
  time,
  onBookAnother,
  selectedDate,
  selectedTime,
  selectedService,
  primaryColor = "#2563eb",
}: Props) {
  const formatDate = (date: any) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("es-MX", {
      weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
    });
  };

  const formatTime = (t: any) => {
    if (!t) return "";
    return new Date(t).toLocaleTimeString("es-MX", {
      hour: "numeric", minute: "2-digit", hour12: true,
      timeZone: "America/Mexico_City",
    });
  };

  return (
    <Stack gap="md" align="center" style={{ textAlign: "center" }}>

      {/* Ícono */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg, #22c55e, #16a34a)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36,
        boxShadow: "0 8px 24px rgba(34,197,94,0.35)",
      }}>
        ✅
      </div>

      <div>
        <Title order={3} mb={6}>¡Solicitud enviada!</Title>
        <Text size="sm" c="dimmed">
          Te contactaremos pronto para confirmar tu cita.
        </Text>
      </div>

      {/* Resumen */}
      <div style={{
        background: "#f8fafc", borderRadius: 14, padding: 16,
        border: "1px solid #f1f5f9", width: "100%", textAlign: "left",
      }}>
        {selectedService && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            paddingBottom: 10, borderBottom: "1px solid #f1f5f9",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: `${primaryColor}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>💼</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>Servicio</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{selectedService.name}</div>
            </div>
          </div>
        )}

        {selectedDate && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            paddingTop: 10, paddingBottom: 10, borderBottom: "1px solid #f1f5f9",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "#eff6ff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>📅</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>Fecha</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{formatDate(selectedDate)}</div>
            </div>
          </div>
        )}

        {selectedTime && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            paddingTop: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: "#f0fdf4",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>🕛</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8" }}>Hora</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{formatTime(selectedTime)}</div>
            </div>
          </div>
        )}
      </div>

      <Button
        variant="outline"
        fullWidth
        onClick={onBookAnother}
        style={{ borderColor: "#e2e8f0", color: "#64748b" }}
      >
        Agendar otra cita
      </Button>
    </Stack>
  );
}