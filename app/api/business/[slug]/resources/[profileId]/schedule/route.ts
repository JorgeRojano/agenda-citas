import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string; profileId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug, profileId } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const slots = await prisma.resourceTimeSlot.findMany({
    where: { profileId },
    select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(slots);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { slug, profileId } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verificar que el profile pertenece al negocio
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, businessId: business.id },
  });
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { slots } = await req.json() as {
    slots: { dayOfWeek: number; startTime: string; endTime: string }[];
  };

  // Reemplazar todos los slots del recurso (delete + create)
  await prisma.$transaction([
    prisma.resourceTimeSlot.deleteMany({ where: { profileId } }),
    prisma.resourceTimeSlot.createMany({
      data: slots.map((s) => ({ profileId, ...s })),
    }),
  ]);

  return NextResponse.json({ ok: true });
}