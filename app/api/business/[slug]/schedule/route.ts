import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  slug: string;
};

/////////////////////////////////////
// GET - Obtener horarios por slug
/////////////////////////////////////

export async function GET(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  const { slug } = await context.params;

  // 1️⃣ Buscar business por slug
  const business = await prisma.business.findUnique({
    where: { slug },
  });

  if (!business) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  // 2️⃣ Obtener sus time slots
  const slots = await prisma.businessTimeSlot.findMany({
    where: { businessId: business.id },
    orderBy: [
      { dayOfWeek: "asc" },
      { startTime: "asc" },
    ],
  });

  return NextResponse.json(slots);
}

/////////////////////////////////////
// POST - Guardar horarios por slug
/////////////////////////////////////

export async function POST(
  req: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { slug } = await context.params;
    const body = await req.json();
    const { slots } = body;

    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // 1️⃣ Buscar business
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Transacción segura
    await prisma.$transaction(async (tx) => {
      // borrar anteriores
      await tx.businessTimeSlot.deleteMany({
        where: { businessId: business.id },
      });

      // insertar nuevos
      if (slots.length > 0) {
        await tx.businessTimeSlot.createMany({
          data: slots.map((slot: any) => ({
            businessId: business.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}