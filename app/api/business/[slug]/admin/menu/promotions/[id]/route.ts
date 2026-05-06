import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../../_admin";

type Params = { slug: string; id: string };

const DAY_KEYS = ["mon","tue","wed","thu","fri","sat","sun"] as const;

const itemSchema = z.object({
  itemId:   z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

const updateSchema = z.object({
  name:            z.string().min(1).optional(),
  type:            z.enum(["combo", "discount", "special"]).optional(),
  description:     z.string().nullable().optional(),
  discountAmount:  z.number().positive().nullable().optional(),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
  validDays:       z.array(z.enum(DAY_KEYS)).min(1).optional(),
  startTime:       z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  endTime:         z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  isActive:        z.boolean().optional(),
  items:           z.array(itemSchema).optional(),
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

  const existing = await prisma.menuPromotion.findFirst({
    where: { id, businessId: resolved.business.id },
  });
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const { items, ...promoData } = body.data;

  await prisma.$transaction(async (tx) => {
    await tx.menuPromotion.update({ where: { id }, data: promoData });
    if (items !== undefined) {
      await tx.menuPromotionItem.deleteMany({ where: { promotionId: id } });
      if (items.length > 0) {
        await tx.menuPromotionItem.createMany({
          data: items.map((i) => ({ promotionId: id, itemId: i.itemId, quantity: i.quantity })),
        });
      }
    }
  });

  revalidatePath(`/${slug}/menu/promotions`);
  revalidatePath(`/${slug}/menu/categories`);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, id } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  await prisma.menuPromotion.deleteMany({ where: { id, businessId: resolved.business.id } });
  revalidatePath(`/${slug}/menu/promotions`);
  revalidatePath(`/${slug}/menu/categories`);
  return NextResponse.json({ ok: true });
}
