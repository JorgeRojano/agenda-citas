import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../_admin";

type Params = { slug: string };

const itemSchema = z.object({
  categoryId:   z.string().uuid(),
  name:         z.string().min(1),
  description:  z.string().optional(),
  price:        z.number().positive(),
  originalPrice: z.number().positive().optional(),
  emoji:        z.string().optional(),
  imageUrl:     z.string().url().optional(),
  isActive:     z.boolean().optional(),
  isAvailable:  z.boolean().optional(),
  isPopular:    z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  spiceLevel:   z.number().int().min(0).max(3).optional(),
  allergens:    z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;

  const items = await prisma.menuItem.findMany({
    where:   { businessId: resolved.business.id },
    orderBy: { name: "asc" },
    include: { category: { select: { id: true, name: true } } },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = itemSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const item = await prisma.menuItem.create({
    data: { businessId: resolved.business.id, ...body.data },
  });
  return NextResponse.json(item, { status: 201 });
}
