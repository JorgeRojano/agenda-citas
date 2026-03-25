import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ slug: string; profileId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug, profileId } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const vacations = await prisma.resourceVacation.findMany({
    where: { profileId },
    orderBy: { start: "asc" },
  });

  return NextResponse.json(vacations);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { slug, profileId } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, businessId: business.id },
  });
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { name, start, end } = await req.json();

  if (!start || !end)
    return NextResponse.json({ error: "Faltan fechas" }, { status: 400 });

  if (new Date(start) > new Date(end))
    return NextResponse.json({ error: "Fecha inicio mayor a fecha fin" }, { status: 400 });

  const vacation = await prisma.resourceVacation.create({
    data: { profileId, name: name || null, start: new Date(start), end: new Date(end) },
  });

  return NextResponse.json(vacation, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { profileId } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await prisma.resourceVacation.deleteMany({
    where: { id, profileId },
  });

  return NextResponse.json({ ok: true });
}