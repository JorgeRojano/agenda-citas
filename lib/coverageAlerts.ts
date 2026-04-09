import { prisma } from "./prisma";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { addMinutes, isOverlapping } from "./avaibility";

const TIME_ZONE = "America/Mexico_City";

export type CoverageAlert = {
  type: "no_coverage" | "partial_coverage";
  date: Date;
  slots: string[]; // rangos sin cobertura, ej. ['09:00 – 12:00', '14:00 – 15:30']
  message: string;
};

/**
 * Agrupa slots individuales (HH:mm) en rangos contiguos.
 * Ej: ['09:00','09:30','10:00','11:00'] con duración 30 → ['09:00 – 10:30', '11:00 – 11:30']
 */
function groupSlotsIntoRanges(slots: string[], durationMin: number): string[] {
  if (!slots.length) return [];

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const fromMin = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

  const sorted = [...slots].sort((a, b) => toMin(a) - toMin(b));
  const ranges: string[] = [];

  let rangeStart = sorted[0];
  let rangeEndMin = toMin(sorted[0]) + durationMin;

  for (let i = 1; i < sorted.length; i++) {
    if (toMin(sorted[i]) === rangeEndMin) {
      // Slot contiguo: extiende el rango actual
      rangeEndMin += durationMin;
    } else {
      // Brecha: guarda el rango actual y empieza uno nuevo
      ranges.push(`${rangeStart} – ${fromMin(rangeEndMin)}`);
      rangeStart = sorted[i];
      rangeEndMin = toMin(sorted[i]) + durationMin;
    }
  }
  ranges.push(`${rangeStart} – ${fromMin(rangeEndMin)}`);

  return ranges;
}

/**
 * Detecta slots del horario del negocio que no tienen cobertura de recursos.
 *
 * @param businessId  - ID del negocio
 * @param weekStart   - Primer día de la semana a analizar (lunes)
 * @returns Lista de alertas: no_coverage (día completo) o partial_coverage (algunos slots)
 */
export async function getCoverageAlerts(
  businessId: string,
  weekStart: Date,
): Promise<CoverageAlert[]> {
  // Solo aplica si el negocio trabaja con recursos/staff
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { hasStaff: true },
  });
  if (!business?.hasStaff) return [];

  // Construir los 7 días de la semana
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfDay(weekStart), i),
  );
  const weekEnd = endOfDay(weekDates[6]);

  // Recursos activos del negocio con su horario semanal y vacaciones en la semana.
  // Convención del proyecto: STAFF siempre es recurso; ADMIN solo si isResource=true.
  const resources = await prisma.profile.findMany({
    where: {
      businessId,
      OR: [{ role: "STAFF" }, { role: "ADMIN", isResource: true }],
    },
    select: {
      id: true,
      resourceTimeSlots: {
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
      resourceVacations: {
        where: { start: { lte: weekEnd }, end: { gte: weekDates[0] } },
        select: { start: true, end: true },
      },
    },
  });
  if (!resources.length) return [];

  // Granularidad: duración mínima de servicio, fallback 30 min
  const services = await prisma.service.findMany({
    where: { businessId },
    select: { duration: true },
  });
  const slotDuration = services.length
    ? Math.min(...services.map((s) => s.duration))
    : 30;

  // Horario del negocio y bloqueos de toda la semana
  const [businessTimeSlots, blockedTimes] = await Promise.all([
    prisma.businessTimeSlot.findMany({ where: { businessId } }),
    prisma.blockedTime.findMany({
      where: { businessId, start: { lt: weekEnd }, end: { gt: weekDates[0] } },
    }),
  ]);

  const alerts: CoverageAlert[] = [];

  for (const date of weekDates) {
    const mexicoDate = toZonedTime(date, TIME_ZONE);
    const dayOfWeek = mexicoDate.getDay();

    // Rangos horarios del negocio para este día
    const dayRanges = businessTimeSlots.filter((s) => s.dayOfWeek === dayOfWeek);
    if (!dayRanges.length) continue; // Negocio cerrado este día

    // Generar todos los slots del día según el horario del negocio
    const allSlots: Date[] = [];
    for (const range of dayRanges) {
      const [sh, sm] = range.startTime.split(":").map(Number);
      const [eh, em] = range.endTime.split(":").map(Number);

      const startLocal = new Date(mexicoDate);
      startLocal.setHours(sh, sm, 0, 0);
      const endLocal = new Date(mexicoDate);
      endLocal.setHours(eh, em, 0, 0);

      let current = fromZonedTime(startLocal, TIME_ZONE);
      const end = fromZonedTime(endLocal, TIME_ZONE);

      while (current < end) {
        allSlots.push(new Date(current));
        current = addMinutes(current, slotDuration);
      }
    }

    // Descartar slots que caen dentro de un BlockedTime del negocio
    const openSlots = allSlots.filter((slotStart) => {
      const slotEnd = addMinutes(slotStart, slotDuration);
      return !blockedTimes.some((b) => isOverlapping(slotStart, slotEnd, b.start, b.end));
    });
    if (!openSlots.length) continue; // Día completamente bloqueado

    // Verificar cobertura slot por slot
    const uncoveredSlots: string[] = [];

    for (const slotStart of openSlots) {
      const slotEnd = addMinutes(slotStart, slotDuration);

      const isCovered = resources.some((resource) => {
        // Recurso de vacaciones en este slot?
        const onVacation = resource.resourceVacations.some((v) =>
          isOverlapping(slotStart, slotEnd, v.start, v.end),
        );
        if (onVacation) return false;

        // Recurso tiene un rango horario que cubre completamente este slot?
        return resource.resourceTimeSlots
          .filter((ts) => ts.dayOfWeek === dayOfWeek)
          .some((range) => {
            const [rsh, rsm] = range.startTime.split(":").map(Number);
            const [reh, rem] = range.endTime.split(":").map(Number);

            const rangeStartLocal = new Date(mexicoDate);
            rangeStartLocal.setHours(rsh, rsm, 0, 0);
            const rangeEndLocal = new Date(mexicoDate);
            rangeEndLocal.setHours(reh, rem, 0, 0);

            const rangeStartUTC = fromZonedTime(rangeStartLocal, TIME_ZONE);
            const rangeEndUTC = fromZonedTime(rangeEndLocal, TIME_ZONE);

            // El slot debe quedar completamente dentro del rango del recurso
            return slotStart >= rangeStartUTC && slotEnd <= rangeEndUTC;
          });
      });

      if (!isCovered) {
        const m = toZonedTime(slotStart, TIME_ZONE);
        uncoveredSlots.push(
          `${String(m.getHours()).padStart(2, "0")}:${String(m.getMinutes()).padStart(2, "0")}`,
        );
      }
    }

    if (!uncoveredSlots.length) continue; // Cobertura completa

    const isFullDay = uncoveredSlots.length === openSlots.length;
    const dayLabel = mexicoDate.toLocaleDateString("es-MX", { weekday: "long" });
    const ranges = groupSlotsIntoRanges(uncoveredSlots, slotDuration);

    alerts.push({
      type: isFullDay ? "no_coverage" : "partial_coverage",
      date: date,
      slots: ranges,
      message: isFullDay
        ? `Sin cobertura el ${dayLabel}: ningún recurso disponible todo el día`
        : `Cobertura parcial el ${dayLabel}: ${ranges.join(", ")}`,
    });
  }

  return alerts;
}
