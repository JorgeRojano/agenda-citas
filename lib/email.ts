import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendNewAppointmentEmail = async ({
  adminEmail,
  clientName,
  serviceName,
  dateTime,
  businessName,
  dashboardUrl,
}: {
  adminEmail: string;
  clientName: string;
  serviceName: string;
  dateTime: string;
  businessName: string;
  dashboardUrl: string;
}) => {
  await resend.emails.send({
    from: "onboarding@resend.dev", // cambia por tu dominio cuando tengas uno
    to: adminEmail,
    subject: `📅 Nueva cita - ${clientName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #2d1f14;">Nueva solicitud de cita</h2>
        <p><strong>Negocio:</strong> ${businessName}</p>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Servicio:</strong> ${serviceName}</p>
        <p><strong>Fecha y hora:</strong> ${dateTime}</p>
        <a 
          href="${dashboardUrl}" 
          style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #2563eb; color: white; border-radius: 8px; text-decoration: none;"
        >
          Ver cita →
        </a>
      </div>
    `,
  });
};