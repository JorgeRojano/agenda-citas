"use server";

import { prisma } from "@/lib/prisma";

export async function createAppointment(slot: string, serviceId: string) {
  try {
    await prisma.appointment.create({
      data: {
        serviceId,
        clientName: "Cliente Demo",
        phone: "0000000000",
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
