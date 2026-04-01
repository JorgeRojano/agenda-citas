import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { slug: string };

export async function GET(req: NextRequest, context: { params: Promise<Params> }) {
  const { slug } = await context.params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business)
    return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const slots = await prisma.businessTimeSlot.findMany({
    where: { businessId: business.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(slots);
}

export async function POST(req: NextRequest, context: { params: Promise<Params> }) {
  try {
    const { slug } = await context.params;
    const body     = await req.json();
    const { slots } = body;

    if (!Array.isArray(slots))
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Días que el negocio tendrá abiertos después de guardar
    const newOpenDays = [...new Set(slots.map((s: any) => s.dayOfWeek as number))];

    // Días que quedan CERRADOS (todos los posibles menos los nuevos abiertos)
    const allDays    = [0, 1, 2, 3, 4, 5, 6];
    const closedDays = allDays.filter((d) => !newOpenDays.includes(d));

    await prisma.$transaction(async (tx) => {
      // 1. Reemplazar slots del negocio
      await tx.businessTimeSlot.deleteMany({ where: { businessId: business.id } });
      if (slots.length > 0) {
        await tx.businessTimeSlot.createMany({
          data: slots.map((s: any) => ({
            businessId: business.id,
            dayOfWeek:  s.dayOfWeek,
            startTime:  s.startTime,
            endTime:    s.endTime,
          })),
        });
      }

      // 2. Limpiar slots de recursos en días que el negocio ya no abre
      if (closedDays.length > 0) {
        await tx.resourceTimeSlot.deleteMany({
          where: {
            dayOfWeek: { in: closedDays },
            profile:   { businessId: business.id },
          },
        });
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}