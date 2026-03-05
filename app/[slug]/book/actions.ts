"use server";

import { sendPushNotification } from "@/lib/oneSignal.server";
import { prisma } from "@/lib/prisma";
import { formatDateTimeForInput, formatDateTimetoDisplay } from "@/lib/utils";

export async function createAppointment(
  slug: string,
  slot: string,
  serviceId: string,
  clientName: string,
  phone: string,
) {
  try {
    // 1️⃣ Buscar el negocio por slug
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) {
      throw new Error("Negocio no encontrado");
    }

    // 2️⃣ Buscar el servicio y validar que pertenezca al negocio
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId: business.id,
      },
    });

    if (!service) {
      throw new Error("Servicio inválido");
    }

    // 3️⃣ Calcular start y end
    const startTime = new Date(slot);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    // 4️⃣ Validar que no exista cruce (extra seguridad)
    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlapping) {
      throw new Error("Horario ya ocupado");
    }

    // 5️⃣ Crear la cita
    await prisma.appointment.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        clientName,
        phone,
        startTime,
        endTime,
        status: "PENDING",
      },
    });

    const date = formatDateTimeForInput(startTime);
    const formattedDate = formatDateTimetoDisplay(startTime);

    await sendPushNotification({
      title: "📅 Nueva cita",
      message: `${clientName} - ${service.name}\n${formattedDate}`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/admin/dashboard/bookings?date=${date}`,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Horario ya ocupado");
    }

    throw error;
  }
}
