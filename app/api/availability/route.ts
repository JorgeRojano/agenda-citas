import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/avaibility";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!date || !serviceId) {
    return NextResponse.json(
      { error: "Missing params" },
      { status: 400 }
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    return NextResponse.json(
      { error: "Service not found" },
      { status: 404 }
    );
  }

  const slots = await getAvailableSlots(
    new Date(date),
    service.duration
  );

  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  try {
    const { date, startTime, endTime } = await req.json();

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [year, month, day] = date.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const start = new Date(year, month - 1, day, startHour, startMinute);
    const end = new Date(year, month - 1, day, endHour, endMinute);

    if (start >= end) {
      return NextResponse.json(
        { error: "La hora de inicio debe ser menor a la hora fin" },
        { status: 400 }
      );
    }

    /* 1️⃣ Validar contra citas confirmadas */
    const appointments = await prisma.appointment.findMany({
      where: {
        status: "confirmed",
        dateTime: { lt: end },
      },
    });

    const appointmentOverlap = appointments.some((a) => {
      const appointmentEnd = new Date(
        a.dateTime.getTime() + a.durationMinutes * 60000
      );
      return start < appointmentEnd && end > a.dateTime;
    });

    if (appointmentOverlap) {
      return NextResponse.json(
        { error: "El horario se cruza con una cita existente" },
        { status: 409 }
      );
    }

    /* 2️⃣ Validar contra otros bloqueos */
    const blockedOverlap = await prisma.blockedTime.findFirst({
      where: {
        start: { lt: end },
        end: { gt: start },
      },
    });

    if (blockedOverlap) {
      return NextResponse.json(
        { error: "El horario ya está bloqueado" },
        { status: 409 }
      );
    }

    /* 3️⃣ Crear bloqueo */
    const blockedTime = await prisma.blockedTime.create({
      data: { start, end },
    });

    return NextResponse.json(blockedTime, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo bloquear el tiempo" },
      { status: 500 }
    );
  }
}

