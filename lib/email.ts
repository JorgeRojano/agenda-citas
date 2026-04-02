import { Resend } from "resend";
import { NewAppointmentEmail } from "@/emails/NewAppointmentEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND_COLORS: Record<string, { main: string; light: string; textOnMain: string }> = {
  red:    { main: "#e03131", light: "#fff5f5", textOnMain: "#ffffff" },
  pink:   { main: "#c2255c", light: "#fff0f6", textOnMain: "#ffffff" },
  grape:  { main: "#9c36b5", light: "#f8f0fc", textOnMain: "#ffffff" },
  violet: { main: "#7048e8", light: "#f3f0ff", textOnMain: "#ffffff" },
  indigo: { main: "#3764eb", light: "#edf2ff", textOnMain: "#ffffff" },
  blue:   { main: "#1971c2", light: "#e7f5ff", textOnMain: "#ffffff" },
  cyan:   { main: "#0e9ac8", light: "#e3fafc", textOnMain: "#ffffff" },
  teal:   { main: "#0f9460", light: "#e6fcf5", textOnMain: "#ffffff" },
  green:  { main: "#2f9e44", light: "#ebfbee", textOnMain: "#ffffff" },
  lime:   { main: "#66a80f", light: "#f4fce3", textOnMain: "#1a2e05" },
  yellow: { main: "#f08c00", light: "#fff9db", textOnMain: "#4a2000" },
  orange: { main: "#e8590c", light: "#fff4e6", textOnMain: "#ffffff" },
  gray:   { main: "#495057", light: "#f8f9fa", textOnMain: "#ffffff" },
  dark:   { main: "#212529", light: "#f1f3f5", textOnMain: "#ffffff" },
};

export const sendNewAppointmentEmail = async ({
  adminEmail,
  adminName,
  clientName,
  serviceName,
  dateTime,
  businessName,
  dashboardUrl,
  phone,
  duration,
  price,
  primaryColor,
}: {
  adminEmail: string;
  adminName?: string;
  clientName: string;
  serviceName: string;
  dateTime: string;
  businessName: string;
  dashboardUrl: string;
  phone?: string;
  duration?: number;
  price?: number;
  primaryColor?: string | null;
}) => {
  const businessInitials = businessName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const serviceDetail = [
    duration ? `${duration} min` : null,
    price ? `$${(price / 100).toFixed(2)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to:
      process.env.NODE_ENV === "production"
        ? adminEmail
        : "jorge.rojano.tovar@gmail.com",
    subject: `Nueva cita · ${clientName} — ${businessName}`,
    react: NewAppointmentEmail({
      adminName,
      clientName,
      clientPhone: phone,
      serviceName,
      serviceDetail: serviceDetail || undefined,
      dateTime,
      businessName,
      businessInitials,
      dashboardUrl,
      brandColor:       BRAND_COLORS[primaryColor ?? "blue"]?.main,
      brandColorLight:  BRAND_COLORS[primaryColor ?? "blue"]?.light,
      brandTextOnMain:  BRAND_COLORS[primaryColor ?? "blue"]?.textOnMain,
    }),
  });
};
