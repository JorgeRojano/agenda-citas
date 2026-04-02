import {
  Html, Head, Body, Container, Section, Row, Column,
  Text, Button, Hr, Preview,
} from "@react-email/components";

interface Props {
  adminName?: string;
  clientName: string;
  clientPhone?: string;
  serviceName: string;
  serviceDetail?: string; // "60 min · $200.00"
  dateTime: string;
  businessName: string;
  businessInitials: string;
  dashboardUrl: string;
  brandColor?: string;       // ej: "#2563eb"
  brandColorLight?: string;  // ej: "#eff6ff"
  brandTextOnMain?: string;  // ej: "#ffffff" o "#1a2e05" para colores claros
}

export function NewAppointmentEmail({
  adminName,
  clientName,
  clientPhone,
  serviceName,
  serviceDetail,
  dateTime,
  businessName,
  businessInitials,
  dashboardUrl,
  brandColor = "#2563eb",
  brandColorLight = "#eff6ff",
  brandTextOnMain = "#ffffff",
}: Props) {

  const header: React.CSSProperties = { background: brandColor, borderRadius: "12px 12px 0 0", padding: "28px 32px", textAlign: "center" };
  const ctaButton: React.CSSProperties = { background: brandColor, color: brandTextOnMain, fontSize: 14, fontWeight: 600, padding: "12px 28px", borderRadius: 8, textDecoration: "none" };
  const footerLogo: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, background: brandColor, textAlign: "center", lineHeight: "32px", fontSize: 12, fontWeight: 700, color: brandTextOnMain };
  const headerTitleStyled: React.CSSProperties = { ...headerTitle, color: brandTextOnMain };
  const headerSubStyled: React.CSSProperties = { ...headerSub, color: `${brandTextOnMain}bf` }; // bf = ~75% opacity en hex
  const iconBoxBrand: React.CSSProperties = { ...iconBox, background: brandColorLight };

  return (
    <Html lang="es">
      <Head />
      <Preview>Nueva cita recibida · {clientName} — {businessName}</Preview>
      <Body style={body}>
        <Container style={container}>

          {/* Header */}
          <Section style={header}>
            <div style={headerIconWrap}>
              <CalendarIcon />
            </div>
            <Text style={headerTitleStyled}>Nueva cita recibida</Text>
            <Text style={headerSubStyled}>{businessName} · {dateTime}</Text>
          </Section>

          {/* Body */}
          <Section style={bodySection}>
            <Text style={greeting}>Hola{adminName ? `, ${adminName}` : ""}</Text>
            <Text style={intro}>
              Has recibido una nueva solicitud de cita. Revisa los detalles a continuación y confírmala o recházala desde tu panel.
            </Text>

            {/* Badge pendiente */}
            <div style={badge}>
              <span style={badgeDot} />
              Pendiente de revisión
            </div>

            {/* Detail card */}
            <Section style={detailCard}>

              {/* Cliente */}
              <Row style={detailRow}>
                <Column style={iconCol}>
                  <div style={iconBoxBrand}>
                    <UserIcon />
                  </div>
                </Column>
                <Column>
                  <Text style={detailLabel}>Cliente</Text>
                  <Text style={detailValue}>{clientName}</Text>
                  {clientPhone && <Text style={detailSub}>{clientPhone}</Text>}
                </Column>
              </Row>

              <Hr style={rowDivider} />

              {/* Servicio */}
              <Row style={detailRow}>
                <Column style={iconCol}>
                  <div style={{ ...iconBox, background: "#f0fdf4" }}>
                    <TagIcon />
                  </div>
                </Column>
                <Column>
                  <Text style={detailLabel}>Servicio</Text>
                  <Text style={detailValue}>{serviceName}</Text>
                  {serviceDetail && <Text style={detailSub}>{serviceDetail}</Text>}
                </Column>
              </Row>

              <Hr style={rowDivider} />

              {/* Fecha y hora */}
              <Row style={detailRow}>
                <Column style={iconCol}>
                  <div style={iconBoxBrand}>
                    <ClockIcon />
                  </div>
                </Column>
                <Column>
                  <Text style={detailLabel}>Fecha y hora</Text>
                  <Text style={detailValue}>{dateTime}</Text>
                </Column>
              </Row>

            </Section>

            {/* CTA principal */}
            <Section style={{ textAlign: "center", marginBottom: 8 }}>
              <Button href={dashboardUrl} style={ctaButton}>
                Ver cita en el panel →
              </Button>
            </Section>

          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Row style={{ marginBottom: 10 }}>
              <Column style={{ width: 42 }}>
                <div style={footerLogo}>{businessInitials}</div>
              </Column>
              <Column>
                <Text style={footerName}>{businessName}</Text>
              </Column>
            </Row>
            <Text style={footerText}>
              Este correo fue enviado automáticamente porque tienes una nueva cita pendiente. Si tienes dudas, accede a tu panel de administración.
            </Text>
          </Section>

          {/* Meta */}
          <Text style={meta}>© 2026 · {businessName} · Enviado por tu plataforma de citas</Text>

        </Container>
      </Body>
    </Html>
  );
}

// ── Emoji icons ──
const CalendarIcon = () => <span style={{ fontSize: 22 }}>📅</span>;
const UserIcon = () => <span style={{ fontSize: 16 }}>👤</span>;
const TagIcon = () => <span style={{ fontSize: 16 }}>🏷️</span>;
const ClockIcon = () => <span style={{ fontSize: 16 }}>🕐</span>;

// ── Styles ──
const body:        React.CSSProperties = { background: "#f4f4f5", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" };
const container:   React.CSSProperties = { maxWidth: 520, margin: "32px auto" };
const headerIconWrap: React.CSSProperties = { width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.15)", textAlign: "center", lineHeight: "48px", marginBottom: 12, margin: "0 auto 12px" };
const headerTitle: React.CSSProperties = { fontSize: 20, fontWeight: 600, color: "#ffffff", margin: "0 0 4px" };
const headerSub:   React.CSSProperties = { fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0 };
const bodySection: React.CSSProperties = { background: "#ffffff", padding: "28px 32px" };
const greeting:    React.CSSProperties = { fontSize: 15, fontWeight: 500, color: "#18181b", margin: "0 0 6px" };
const intro:       React.CSSProperties = { fontSize: 14, color: "#71717a", lineHeight: "1.6", margin: "0 0 20px" };
const badge:       React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, background: "#fef9c3", color: "#854d0e", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, marginBottom: 20 };
const badgeDot:    React.CSSProperties = { width: 6, height: 6, borderRadius: "50%", background: "#ca8a04", display: "inline-block" };
const detailCard:  React.CSSProperties = { background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 20, overflow: "hidden" };
const detailRow:   React.CSSProperties = { padding: "12px 16px" };
const iconCol:     React.CSSProperties = { width: 44 };
const iconBox:     React.CSSProperties = { width: 32, height: 32, borderRadius: 8, textAlign: "center", lineHeight: "32px" };
const rowDivider:  React.CSSProperties = { borderColor: "#e2e8f0", margin: 0 };
const detailLabel: React.CSSProperties = { fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", margin: 0 };
const detailValue: React.CSSProperties = { fontSize: 14, color: "#0f172a", fontWeight: 600, margin: "1px 0 0" };
const detailSub:   React.CSSProperties = { fontSize: 12, color: "#64748b", margin: "1px 0 0" };

const footer:      React.CSSProperties = { padding: "20px 32px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderRadius: "0 0 12px 12px" };
const footerName:  React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", margin: 0 };
const footerText:  React.CSSProperties = { fontSize: 12, color: "#9ca3af", lineHeight: "1.5", margin: 0 };
const meta:        React.CSSProperties = { fontSize: 11, color: "#a1a1aa", textAlign: "center", padding: "16px 0" };
