import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/avaibility";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const businessSlug = searchParams.get("businessSlug");

  if (!date || !serviceId || !businessSlug) {
    return NextResponse.json(
      { error: "Missing params" },
      { status: 400 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
  });

  if (!business) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  const service = await prisma.service.findFirst({
    where: {
      id: serviceId,
      businessId: business.id,
    },
  });

  if (!service) {
    return NextResponse.json(
      { error: "Service not found for this business" },
      { status: 404 }
    );
  }

  const slots = await getAvailableSlots(
    new Date(date),
    service.duration,
    business.id
  );

  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  try {
    const { date, startTime, endTime, businessSlug } = await req.json();

    if (!date || !startTime || !endTime || !businessSlug) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1️⃣ Find business
    const business = await prisma.business.findUnique({
      where: { slug: businessSlug },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Parse date & time
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

    /* 3️⃣ Validate against confirmed appointments (ONLY this business) */
    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
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

    /* 4️⃣ Validate against other blocked times (ONLY this business) */
    const blockedOverlap = await prisma.blockedTime.findFirst({
      where: {
        businessId: business.id,
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

    /* 5️⃣ Create blocked time */
    const blockedTime = await prisma.blockedTime.create({
      data: {
        start,
        end,
        businessId: business.id,
      },
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

