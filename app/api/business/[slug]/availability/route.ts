import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/avaibility";

type Params = {
  slug: string;
};

export async function GET(req: Request, context: { params: Promise<Params> }) {
  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!dateParam || !serviceId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }
  const date = dateParam

  const business = await prisma.business.findUnique({
    where: { slug },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
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
    business.id,
    date,
    service.duration
  );

  return NextResponse.json(slots);
}

export async function POST(req: Request, context: { params: Promise<Params> }) {
  try {
    const { slug } = await context.params;
    const { date, startTime, endTime } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // 1️⃣ Buscar negocio por slug (como en el GET)
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    // 2️⃣ Parsear fechas usando el nuevo formato de tu schema (DateTime)
    // Asumimos que date es "YYYY-MM-DD" y times son "HH:mm"
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { error: "Rango de tiempo inválido" },
        { status: 400 }
      );
    }

    /* 3️⃣ Validar contra citas existentes (Nuevo Schema: startTime/endTime) */
    // Buscamos cualquier cita CONFIRMADA que se traslape
    const appointmentOverlap = await prisma.appointment.findFirst({
      where: {
        businessId: business.id,
        status: {
          in: ["CONFIRMED", "PENDING"]
        },
        // Lógica de traslape: (StartA < EndB) AND (EndA > StartB)
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (appointmentOverlap) {
      const message = appointmentOverlap.status === "PENDING" 
        ? "Hay una solicitud pendiente en este horario. Debes aceptarla o rechazarla antes de bloquear."
        : "El horario se cruza con una cita confirmada.";

      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    /* 4️⃣ Validar contra otros bloqueos */
    const blockedOverlap = await prisma.blockedTime.findFirst({
      where: {
        businessId: business.id,
        start: { lt: end },
        end: { gt: start },
      },
    });

    if (blockedOverlap) {
      return NextResponse.json(
        { error: "Este horario ya está bloqueado" },
        { status: 409 }
      );
    }

    /* 5️⃣ Crear tiempo bloqueado */
    const blockedTime = await prisma.blockedTime.create({
      data: {
        start,
        end,
        businessId: business.id,
      },
    });

    return NextResponse.json(blockedTime, { status: 201 });
  } catch (error) {
    console.error("Error al bloquear tiempo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
