"use server";

import { prisma } from "@/lib/prisma";
import { validateBusinessAccess } from "@/lib/validateBusinessAccess";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/oneSignal.server";
import { sendNewAppointmentEmail } from "@/lib/email";
import { formatDateTimeForInput, formatDateTimetoDisplay } from "@/lib/utils";

export async function createAppointmentByAdmin(
  slug: string,
  data: {
    clientName: string;
    phone: string;
    serviceId: string;
    slot: string;
    assignedToId?: string | null;
  },
) {
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) throw new Error("Negocio no encontrado");

  const adminProfile = await validateBusinessAccess(business.id);

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, businessId: business.id },
  });
  if (!service) throw new Error("Servicio inválido");

  // Si el negocio no tiene staff, asignar automáticamente al admin
  const assignedToId = !business.hasStaff
    ? adminProfile.id
    : (data.assignedToId ?? null);

  const startTime = new Date(data.slot);
  const endTime   = new Date(startTime.getTime() + service.duration * 60000);

  const overlapping = await prisma.appointment.findFirst({
    where: {
      businessId: business.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime:   { gt: startTime },
      ...(assignedToId ? { assignedToId } : {}),
    },
  });

  if (overlapping) throw new Error("Horario ya ocupado");

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId:  service.id,
      clientName: data.clientName,
      phone:      data.phone,
      startTime,
      endTime,
      status:     "CONFIRMED",
      assignedToId,
    },
  });

  revalidatePath(`/${slug}/admin/dashboard/bookings`);
}