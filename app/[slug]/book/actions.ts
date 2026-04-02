"use server";

import { sendPushNotification } from "@/lib/oneSignal.server";
import { sendNewAppointmentEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { formatDateTimetoDisplay } from "@/lib/utils";

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

    const adminProfile = await prisma.profile.findFirst({
      where: { businessId: business.id, role: "ADMIN" },
      select: { id: true, name: true, email: true },  // ← name agregado
    });

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

    const pendingCount = await prisma.appointment.count({
      where: { businessId: business.id, status: "PENDING" },
    });

    const dashboardUrl  = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/admin/dashboard`;
    const formattedDate = formatDateTimetoDisplay(startTime);

    await Promise.all([
      sendPushNotification({
        title:      `📅 ${pendingCount} cita${pendingCount !== 1 ? "s" : ""} pendiente${pendingCount !== 1 ? "s" : ""}`,
        message:    `Última: ${clientName} - ${service.name}\n${formattedDate}`,
        url:        dashboardUrl,
        logoUrl:    business.logoUrl,
        collapseId: `pending-${business.id}`,
      }),
      adminProfile?.email
        ? sendNewAppointmentEmail({
            adminEmail:    adminProfile.email,
            adminName:     adminProfile.name ?? undefined,
            clientName,
            serviceName:   service.name,
            dateTime:      formattedDate,
            businessName:  business.name,
            dashboardUrl,
            phone,
            duration:      service.duration,
            price:         service.price,
            primaryColor:  business.primaryColor,
          })
        : Promise.resolve(),
    ]);

  } catch (error: any) {
    if (error.code === "P2002") throw new Error("Horario ya ocupado");
    throw error;
  }
}