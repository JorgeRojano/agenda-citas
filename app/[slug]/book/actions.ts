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
) {
  try {
    // 1️⃣ Buscar el negocio por slug
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) throw new Error("Negocio no encontrado");

    // 2️⃣ Buscar el servicio y validar que pertenezca al negocio
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        businessId: business.id,
      },
    });

    if (!service) throw new Error("Servicio inválido");

    // 3️⃣ Calcular start y end
    const startTime = new Date(slot);
    const endTime = new Date(startTime.getTime() + service.duration * 60000);

    // 4️⃣ Validar que no exista cruce
    const overlapping = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (overlapping) throw new Error("Horario ya ocupado");

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
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/admin/dashboard/bookings?date=${date}`;

    // 6️⃣ Buscar el email del admin
    const adminProfile = await prisma.profile.findFirst({
      where: { businessId: business.id, role: "ADMIN" },
      select: { id: true, email: true },
    });

    // 7️⃣ Enviar push y email en paralelo
    await Promise.all([
      sendPushNotification({
        title: "📅 Nueva cita",
        message: `${clientName} - ${service.name}\n${formattedDate}`,
        url: dashboardUrl,
      }),
      adminProfile?.email
        ? sendNewAppointmentEmail({
            adminEmail: adminProfile.email,
            clientName,
            serviceName: service.name,
            dateTime: formattedDate,
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