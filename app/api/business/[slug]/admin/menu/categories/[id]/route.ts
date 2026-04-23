import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../../_admin";

type Params = { slug: string; id: string };

const updateSchema = z.object({
  name:         z.string().min(1).optional(),
  emoji:        z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
  isActive:     z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, id } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = updateSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const category = await prisma.menuCategory.updateMany({
    where: { id, businessId: resolved.business.id },
    data:  body.data,
  });
  if (!category.count) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, id } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  await prisma.menuCategory.deleteMany({ where: { id, businessId: resolved.business.id } });
  return NextResponse.json({ ok: true });
}
