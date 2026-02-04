"use server";

import { prisma } from "@/lib/prisma";

export async function createAppointment(
  slot: string,
  serviceId: string,
  clientName: string,
  phone: string
) {
  try {
    await prisma.appointment.create({
      data: {
        serviceId,
        clientName,
        phone,
        dateTime: new Date(slot),
        durationMinutes: await prisma.service
          .findUnique({ where: { id: serviceId } })
          .then((s) => s?.duration || 30),
      },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      throw new Error("Horario ya ocupado");
    }
    throw error;
  }
}
