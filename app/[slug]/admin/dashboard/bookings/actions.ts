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
  }
) {
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) throw new Error("Negocio no encontrado");

  await validateBusinessAccess(business.id);

  const service = await prisma.service.findFirst({
    where: { id: data.serviceId, businessId: business.id },
  });
  if (!service) throw new Error("Servicio inválido");

  const startTime = new Date(data.slot);
  const endTime = new Date(startTime.getTime() + service.duration * 60000);

  const overlapping = await prisma.appointment.findFirst({
    where: {
      businessId: business.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (overlapping) throw new Error("Horario ya ocupado");

  await prisma.appointment.create({
    data: {
      businessId: business.id,
      serviceId: service.id,
      clientName: data.clientName,
      phone: data.phone,
      startTime,
      endTime,
      status: "CONFIRMED", // 👈 directo a confirmada
    },
  });

  revalidatePath(`/${slug}/admin/dashboard/bookings`);
}