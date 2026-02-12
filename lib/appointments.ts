import { prisma } from "@/lib/prisma";

/**
 * Obtener citas por día para un negocio específico
 * Incluye citas PENDING y CONFIRMED
 */
export async function getAppointmentsByDay(
  businessId: string,
  start: Date,
  end: Date
) {
  return prisma.appointment.findMany({
    where: {
      businessId,
      startTime: {
        gte: start,
        lte: end,
      },
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
    include: {
      service: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

/**
 * Obtener bloqueos por día para un negocio específico
 */
export async function getBlockedTimeByDay(
  businessId: string,
  start: Date,
  end: Date
) {
  return prisma.blockedTime.findMany({
    where: {
      businessId,
      start: {
        lt: end,
      },
      end: {
        gt: start,
      },
    },
    orderBy: {
      start: "asc",
    },
  });
}
