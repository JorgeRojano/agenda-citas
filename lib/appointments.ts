import { prisma } from "@/lib/prisma";

export async function getAppointmentsByDay(
  start: Date,
  end: Date
) {
  return prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: start,
        lte: end,
      },
    },
    include: {
      service: true,
    },
    orderBy: {
      dateTime: "asc",
    },
  });
}

export async function getBlockedTimeByDay(
  start: Date,
  end: Date
) {
  return prisma.blockedTime.findMany({
    where: {
      start: {
        gte: start,
      },
      end: {
        lte: end,
      },
    },
    orderBy: {
      start: "asc",
    },
  });
}
