import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocked = await prisma.blockedTime.findMany({
    where: { businessId: business.id },
    orderBy: { start: "asc" },
  });

  return NextResponse.json(blocked);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, start, end } = await req.json();

  if (!start || !end)
    return NextResponse.json({ error: "Faltan fechas" }, { status: 400 });

  const s = new Date(start);
  const e = new Date(end);

  if (isNaN(s.getTime()) || isNaN(e.getTime()) || s > e)
    return NextResponse.json({ error: "Rango de tiempo inválido" }, { status: 400 });

  // Verificar solapamiento
  const overlap = await prisma.blockedTime.findFirst({
    where: {
      businessId: business.id,
      start: { lt: e },
      end:   { gt: s },
    },
  });

  if (overlap) {
    const overlapName = overlap.name ?? "un cierre existente";
    return NextResponse.json(
      { error: `Las fechas se solapan con "${overlapName}"` },
      { status: 409 },
    );
  }

  const blocked = await prisma.blockedTime.create({
    data: { businessId: business.id, name: name || null, start: s, end: e },
  });

  return NextResponse.json(blocked, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.blockedTime.deleteMany({
    where: { id, businessId: business.id },
  });

  return NextResponse.json({ ok: true });
}