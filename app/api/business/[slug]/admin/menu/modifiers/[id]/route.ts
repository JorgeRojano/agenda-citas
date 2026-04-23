import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../../_admin";

type Params = { slug: string; id: string };

const updateSchema = z.object({
  name:          z.string().min(1).optional(),
  selectionType: z.enum(["single", "multiple"]).optional(),
  isRequired:    z.boolean().optional(),
  options: z.array(z.object({
    id:           z.string().optional(),
    name:         z.string().min(1),
    extraPrice:   z.number().min(0).optional(),
    displayOrder: z.number().int().optional(),
  })).optional(),
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

  const { options, ...modifierData } = body.data;

  await prisma.$transaction(async (tx) => {
    await tx.menuModifier.updateMany({
      where: { id, businessId: resolved.business.id },
      data:  modifierData,
    });
    if (options) {
      // Reemplaza todas las opciones
      await tx.modifierOption.deleteMany({ where: { modifierId: id } });
      await tx.modifierOption.createMany({
        data: options.map((o) => ({ modifierId: id, ...o })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, id } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  await prisma.menuModifier.deleteMany({ where: { id, businessId: resolved.business.id } });
  return NextResponse.json({ ok: true });
}
