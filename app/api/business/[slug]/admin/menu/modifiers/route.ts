import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../_admin";

type Params = { slug: string };

const modifierSchema = z.object({
  name:          z.string().min(1),
  selectionType: z.enum(["single", "multiple"]).optional(),
  isRequired:    z.boolean().optional(),
  options: z.array(z.object({
    name:         z.string().min(1),
    extraPrice:   z.number().min(0).optional(),
    displayOrder: z.number().int().optional(),
  })).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;

  const modifiers = await prisma.menuModifier.findMany({
    where:   { businessId: resolved.business.id },
    orderBy: { name: "asc" },
    include: {
      options: { orderBy: { displayOrder: "asc" } },
      _count:  { select: { itemModifiers: true } },
    },
  });
  return NextResponse.json(modifiers);
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = modifierSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { options, ...modifierData } = body.data;
  const modifier = await prisma.menuModifier.create({
    data: {
      businessId: resolved.business.id,
      ...modifierData,
      ...(options?.length ? { options: { create: options } } : {}),
    },
    include: { options: true },
  });
  return NextResponse.json(modifier, { status: 201 });
}
