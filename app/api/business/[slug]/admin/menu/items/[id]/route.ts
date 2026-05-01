import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../../_admin";

type Params = { slug: string; id: string };

// STAFF solo puede cambiar isAvailable
const staffSchema = z.object({
  isAvailable: z.boolean(),
});

const adminSchema = z.object({
  categoryId:   z.string().uuid().optional(),
  name:         z.string().min(1).optional(),
  description:  z.string().optional(),
  price:        z.number().positive().optional(),
  originalPrice: z.number().positive().nullable().optional(),
  emoji:        z.string().optional(),
  imageUrl:     z.string().url().nullable().optional(),
  isActive:     z.boolean().optional(),
  isAvailable:  z.boolean().optional(),
  isPopular:    z.boolean().optional(),
  isVegetarian: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  spiceLevel:   z.number().int().min(0).max(3).optional(),
  allergens:    z.array(z.string()).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, id } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;

  const rawBody = await req.json();

  const body = isStaff(resolved.profile)
    ? staffSchema.safeParse(rawBody)
    : adminSchema.safeParse(rawBody);

  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const updated = await prisma.menuItem.updateMany({
    where: { id, businessId: resolved.business.id },
    data:  body.data,
  });
  if (!updated.count) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  revalidatePath(`/${slug}/menu/categories`);
  revalidatePath(`/${slug}/menu/items/${id}`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, id } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  await prisma.menuItem.deleteMany({ where: { id, businessId: resolved.business.id } });
  revalidatePath(`/${slug}/menu/categories`);
  return NextResponse.json({ ok: true });
}
