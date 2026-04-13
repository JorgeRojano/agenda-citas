import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIME_ZONE = "America/Mexico_City";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const dateParam  = searchParams.get("date");      // opcional
  const serviceId  = searchParams.get("serviceId"); // opcional
  const timeParam  = searchParams.get("time");      // opcional — ISO string del slot elegido

  // Calcular dayOfWeek en zona México si viene date
  let dayOfWeek: number | null = null;
  if (dateParam) {
    const mexicoDate = toZonedTime(new Date(dateParam), TIME_ZONE);
    dayOfWeek = mexicoDate.getDay(); // 0–6, nunca undefined
  }

  // Calcular rango del día para verificar vacaciones
  let dayStartUTC: Date | undefined;
  let dayEndUTC: Date | undefined;
  if (dateParam) {
    const mexicoDate = toZonedTime(new Date(dateParam), TIME_ZONE);
    const startOfDay = new Date(mexicoDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(mexicoDate);
    endOfDay.setHours(23, 59, 59, 999);
    dayStartUTC = fromZonedTime(startOfDay, TIME_ZONE);
    dayEndUTC   = fromZonedTime(endOfDay, TIME_ZONE);
  }

  // Calcular rango exacto del slot para filtrar citas solapadas
  let slotStart: Date | undefined;
  let slotEnd:   Date | undefined;
  if (timeParam && serviceId) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId: business.id },
      select: { duration: true },
    });
    if (service) {
      slotStart = new Date(timeParam);
      slotEnd   = new Date(slotStart.getTime() + service.duration * 60000);
    }
  }

  const staff = await prisma.profile.findMany({
    where: {
      businessId: business.id,
      OR: [{ role: "STAFF" }, { role: "ADMIN", isResource: true }],
      ...(serviceId
        ? { services: { some: { serviceId } } }
        : {}),
      ...(dayOfWeek !== null
        ? { resourceTimeSlots: { some: { dayOfWeek } } }
        : {}),
      // Excluir recursos con vacaciones activas ese día
      ...(dayStartUTC && dayEndUTC
        ? {
            resourceVacations: {
              none: {
                start: { lte: dayEndUTC },
                end:   { gte: dayStartUTC },
              },
            },
          }
        : {}),
      // Excluir recursos con cita solapada en el slot exacto
      ...(slotStart && slotEnd
        ? {
            appointments: {
              none: {
                status:    { in: ["PENDING", "CONFIRMED"] },
                startTime: { lt: slotEnd },
                endTime:   { gt: slotStart },
              },
            },
          }
        : {}),
    },
    select: { id: true, name: true, specialty: true },
  });

  return NextResponse.json(staff);
}