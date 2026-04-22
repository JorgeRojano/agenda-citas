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

    const startTime = new Date(slot);
    const endTime   = new Date(startTime.getTime() + service.duration * 60000);

    let resolvedAssignedToId: string | null = !business.hasStaff
      ? (adminProfile?.id ?? null)
      : (assignedToId ?? null);

    // Auto-asignar cuando hasStaff y el cliente eligió "Sin preferencia"
    if (business.hasStaff && !resolvedAssignedToId) {
      const dateStr  = startTime.toISOString().slice(0, 10);
      const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dayEnd   = new Date(`${dateStr}T23:59:59.999Z`);

      const candidates = await prisma.profile.findMany({
        where: {
          businessId: business.id,
          OR: [{ role: "STAFF" }, { role: "ADMIN", isResource: true }],
          // Asignado al servicio solicitado
          services: { some: { serviceId: service.id } },
          // Sin vacaciones activas durante el slot
          resourceVacations: {
            none: { start: { lte: endTime }, end: { gte: startTime } },
          },
          // Sin cita que se traslape
          appointments: {
            none: {
              status:    { in: ["PENDING", "CONFIRMED"] },
              startTime: { lt: endTime },
              endTime:   { gt: startTime },
            },
          },
        },
        select: {
          id: true,
          _count: {
            select: {
              appointments: {
                where: {
                  status:    { in: ["PENDING", "CONFIRMED"] },
                  startTime: { gte: dayStart, lt: dayEnd },
                },
              },
            },
          },
        },
      });

      if (candidates.length === 0) throw new Error("Sin disponibilidad para este horario");

      // Elegir el recurso con menos citas hoy (reparto de carga)
      candidates.sort((a, b) => a._count.appointments - b._count.appointments);
      resolvedAssignedToId = candidates[0].id;
    }

    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        status:    { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime:   { gt: startTime },
        assignedToId: resolvedAssignedToId,
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

    const dashboardUrl  = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/admin/appointments/dashboard`;
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