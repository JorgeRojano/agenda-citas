import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../_admin";

type Params = { slug: string };

const categorySchema = z.object({
  name:         z.string().min(1),
  emoji:        z.string().min(1),
  displayOrder: z.number().int().optional(),
  isActive:     z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;

  const categories = await prisma.menuCategory.findMany({
    where:   { businessId: resolved.business.id },
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = categorySchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const category = await prisma.menuCategory.create({
    data: { businessId: resolved.business.id, ...body.data },
  });
  revalidatePath(`/${slug}/menu/categories`);
  return NextResponse.json(category, { status: 201 });
}
