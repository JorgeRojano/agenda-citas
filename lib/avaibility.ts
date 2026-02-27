import { prisma } from "./prisma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const TIME_ZONE = "America/Mexico_City";

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

function generateSlotsFromTimeRanges(
  mexicoDate: Date,
  timeRanges: any[],
  serviceDuration: number
) {
  const slots: Date[] = [];

  timeRanges.forEach((range) => {
    const [startHour, startMinute] = range.startTime.split(":").map(Number);
    const [endHour, endMinute] = range.endTime.split(":").map(Number);

    const startLocal = new Date(mexicoDate);
    startLocal.setHours(startHour, startMinute, 0, 0);

    const endLocal = new Date(mexicoDate);
    endLocal.setHours(endHour, endMinute, 0, 0);

    // 🔥 v3 usa fromZonedTime
    let currentUTC = fromZonedTime(startLocal, TIME_ZONE);
    const endUTC = fromZonedTime(endLocal, TIME_ZONE);

    while (currentUTC < endUTC) {
      slots.push(new Date(currentUTC));
      currentUTC = addMinutes(currentUTC, serviceDuration);
    }
  });

  return slots;
}

export async function getAvailableSlots(
  businessId: string,
  date: string,
  serviceDuration: number
) {
  // 🔥 convertir UTC → México
  const mexicoDate = toZonedTime(new Date(date), TIME_ZONE);
  console.log("Calculando disponibilidad para fecha (México):", mexicoDate);

  const dayOfWeek = mexicoDate.getDay();

  const startOfDayMexico = new Date(mexicoDate);
  startOfDayMexico.setHours(0, 0, 0, 0);

  const endOfDayMexico = new Date(mexicoDate);
  endOfDayMexico.setHours(23, 59, 59, 999);

  // 🔥 convertir México → UTC
  const dayStartUTC = fromZonedTime(startOfDayMexico, TIME_ZONE);
  const dayEndUTC = fromZonedTime(endOfDayMexico, TIME_ZONE);

  const timeRanges = await prisma.businessTimeSlot.findMany({
    where: {
      businessId,
      dayOfWeek,
    },
  });

  if (!timeRanges.length) return [];

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startTime: { lt: dayEndUTC },
      endTime: { gt: dayStartUTC },
    },
  });

  const blocked = await prisma.blockedTime.findMany({
    where: {
      businessId,
      start: { lt: dayEndUTC },
      end: { gt: dayStartUTC },
    },
  });

  const slots = generateSlotsFromTimeRanges(
    mexicoDate,
    timeRanges,
    serviceDuration
  );

  return slots.filter((slotUTC) => {
    const slotEndUTC = addMinutes(slotUTC, serviceDuration);

    const overlapsAppointment = appointments.some((a) =>
      isOverlapping(slotUTC, slotEndUTC, a.startTime, a.endTime)
    );

    const overlapsBlocked = blocked.some((b) =>
      isOverlapping(slotUTC, slotEndUTC, b.start, b.end)
    );

    return !overlapsAppointment && !overlapsBlocked;
  });
}