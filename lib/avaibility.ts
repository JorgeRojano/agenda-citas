// lib/availability.ts
import { prisma } from "./prisma";

/* ========= HELPERS ========= */
export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60000);
}

export function isOverlapping(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
) {
  return startA < endB && endA > startB;
}

/* ========= SLOT GENERATION ========= */
/**
 * Business hours:
 * 09:00 – 18:00 MX (UTC-6)
 * Stored and processed in UTC
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
export async function getAvailableSlots(date: Date, serviceDuration: number) {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: { gte: dayStart, lte: dayEnd },
    },
    include: {
      service: true,
    },
  });

  const blocked = await prisma.blockedTime.findMany({
    where: {
      start: { lte: dayEnd },
      end: { gte: dayStart },
    },
  });

  const slots = generateDaySlots(date, serviceDuration);

  return slots.filter((slot) => {
    const slotEnd = addMinutes(slot, serviceDuration);

    return (
      !appointments.some((a) =>
        isOverlapping(
          slot,
          slotEnd,
          a.dateTime,
          addMinutes(a.dateTime, a.service.duration),
        ),
      ) && !blocked.some((b) => isOverlapping(slot, slotEnd, b.start, b.end))
    );
  });
}
