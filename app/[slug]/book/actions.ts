"use server";

import { sendPushNotification } from "@/lib/oneSignal.server";
import { sendNewAppointmentEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { formatDateTimeForInput, formatDateTimetoDisplay } from "@/lib/utils";

export async function createAppointment(
  slug: string,
  slot: string,
  serviceId: string,
  clientName: string,
  phone: string,
  assignedToId?: string | null,
) {
  try {
    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) throw new Error("Negocio no encontrado");

    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId: business.id },
    });
    if (!service) throw new Error("Servicio inválido");

    const startTime = new Date(slot);
    const endTime   = new Date(startTime.getTime() + service.duration * 60000);

    // Validar solapamiento — si hay recurso, solo contra citas de ese recurso
    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        status:    { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime:   { gt: startTime },
        ...(assignedToId ? { assignedToId } : {}),
      },
    });
    if (overlapping) throw new Error("Horario ya ocupado");

    await prisma.appointment.create({
      data: {
        businessId:   business.id,
        serviceId:    service.id,
        clientName,
        phone,
        startTime,
        endTime,
        status:       "PENDING",
        assignedToId: assignedToId ?? null,
      },
    });

    const date           = formatDateTimeForInput(startTime);
    const formattedDate  = formatDateTimetoDisplay(startTime);
    const dashboardUrl   = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/admin/dashboard/bookings?date=${date}`;

    const adminProfile = await prisma.profile.findFirst({
      where: { businessId: business.id, role: "ADMIN" },
      select: { id: true, email: true },
    });

    await Promise.all([
      sendPushNotification({
        title:   "📅 Nueva cita",
        message: `${clientName} - ${service.name}\n${formattedDate}`,
        url:     dashboardUrl,
      }),
      adminProfile?.email
        ? sendNewAppointmentEmail({
            adminEmail:   adminProfile.email,
            clientName,
            serviceName:  service.name,
            dateTime:     formattedDate,
            businessName: business.name,
            dashboardUrl,
          })
        : Promise.resolve(),
    ]);

  } catch (error: any) {
    if (error.code === "P2002") throw new Error("Horario ya ocupado");
    throw error;
  }
}