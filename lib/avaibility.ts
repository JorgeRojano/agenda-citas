import { prisma } from "./prisma";

/* ========= HELPERS ========= */

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

export function isOverlapping(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}

/* ========= GENERATE DAY SLOTS ========= */
/**
 * Business hours:
 * 09:00 – 18:00 MX (UTC-6)
 * Stored in UTC
 */
function generateDaySlots(date: Date, serviceDuration: number) {
  const slots: Date[] = [];

  const start = new Date(date);
  start.setUTCHours(15, 0, 0, 0); // 09:00 MX

  const end = new Date(date);
  end.setUTCHours(24, 0, 0, 0); // 18:00 MX

  let current = start;

  while (current < end) {
    const slotEnd = addMinutes(current, serviceDuration);

    if (slotEnd <= end) {
      slots.push(new Date(current));
    }

    current = addMinutes(current, serviceDuration);
  }

  return slots;
}

/* ========= MAIN FUNCTION ========= */

export async function getAvailableSlots(
  businessId: string,
  date: Date,
  serviceDuration: number
) {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  /* 🔒 Traer citas que bloquean horario */
  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
  });

  /* 🔒 Traer bloqueos manuales */
  const blocked = await prisma.blockedTime.findMany({
    where: {
      businessId,
      start: { lt: dayEnd },
      end: { gt: dayStart },
    },
  });

  const slots = generateDaySlots(date, serviceDuration);

  return slots.filter((slot) => {
    const slotEnd = addMinutes(slot, serviceDuration);

    const overlapsAppointment = appointments.some((a) =>
      isOverlapping(slot, slotEnd, a.startTime, a.endTime)
    );

    const overlapsBlocked = blocked.some((b) =>
      isOverlapping(slot, slotEnd, b.start, b.end)
    );

    return !overlapsAppointment && !overlapsBlocked;
  });
}
