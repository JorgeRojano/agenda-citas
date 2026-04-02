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

    // Traer admin siempre — lo necesitamos para asignación automática y notificaciones
    const adminProfile = await prisma.profile.findFirst({
      where: { businessId: business.id, role: "ADMIN" },
      select: { id: true, email: true },
    });

    // Si no tiene staff, asignar automáticamente al admin
    const resolvedAssignedToId = !business.hasStaff
      ? (adminProfile?.id ?? null)
      : (assignedToId ?? null);

    const startTime = new Date(slot);
    const endTime   = new Date(startTime.getTime() + service.duration * 60000);

    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        status:    { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime:   { gt: startTime },
        ...(resolvedAssignedToId ? { assignedToId: resolvedAssignedToId } : {}),
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
        assignedToId: resolvedAssignedToId,
      },
    });

    const date          = formatDateTimeForInput(startTime);
    const formattedDate = formatDateTimetoDisplay(startTime);
    const dashboardUrl  = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/admin/dashboard/bookings?date=${date}`;

    await Promise.all([
      sendPushNotification({
        title:   "📅 Nueva cita",
        message: `${clientName} - ${service.name}\n${formattedDate}`,
        url:     dashboardUrl,
        logoUrl: business.logoUrl,
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