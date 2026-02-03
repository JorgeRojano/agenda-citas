"use server";

import { prisma } from "@/lib/prisma";

export async function createAppointment(
  slot: string,
  serviceId: string
) {
  await prisma.appointment.create({
    data: {
      serviceId,
      clientName: "Cliente Demo",
      phone: "0000000000",
      dateTime: new Date(slot),
    },
  });
}
