import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../_admin";

type Params = { slug: string };

const DAY_KEYS = ["mon","tue","wed","thu","fri","sat","sun"] as const;

const itemSchema = z.object({
  itemId:   z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

const promotionSchema = z.object({
  name:            z.string().min(1),
  type:            z.enum(["combo", "discount", "special"]),
  description:     z.string().optional(),
  discountAmount:  z.number().positive().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  validDays:       z.array(z.enum(DAY_KEYS)).min(1),
  startTime:       z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime:         z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isActive:        z.boolean().optional(),
  items:           z.array(itemSchema).optional(),
});

const ITEM_SELECT = {
  id:       true,
  name:     true,
  emoji:    true,
  price:    true,
  quantity: true,
} as const;

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;

  const promotions = await prisma.menuPromotion.findMany({
    where:   { businessId: resolved.business.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { item: { select: { id: true, name: true, emoji: true, price: true } } },
      },
    },
  });

  return NextResponse.json(
    promotions.map((p) => ({
      ...p,
      discountAmount:  p.discountAmount?.toString()  ?? null,
      discountPercent: p.discountPercent?.toString() ?? null,
      items: p.items.map((pi) => ({
        itemId:   pi.itemId,
        quantity: pi.quantity,
        name:     pi.item.name,
        emoji:    pi.item.emoji,
        price:    pi.item.price.toString(),
      })),
    }))
  );
}

export async function POST(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = promotionSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { items, ...promoData } = body.data;

  const promotion = await prisma.menuPromotion.create({
    data: {
      businessId: resolved.business.id,
      ...promoData,
      items: items?.length
        ? { create: items.map((i) => ({ itemId: i.itemId, quantity: i.quantity })) }
        : undefined,
    },
    include: {
      items: {
        include: { item: { select: { id: true, name: true, emoji: true, price: true } } },
      },
    },
  });

  revalidatePath(`/${slug}/menu/promotions`);
  revalidatePath(`/${slug}/menu/categories`);

  return NextResponse.json({
    ...promotion,
    discountAmount:  promotion.discountAmount?.toString()  ?? null,
    discountPercent: promotion.discountPercent?.toString() ?? null,
    items: promotion.items.map((pi) => ({
      itemId:   pi.itemId,
      quantity: pi.quantity,
      name:     pi.item.name,
      emoji:    pi.item.emoji,
      price:    pi.item.price.toString(),
    })),
  }, { status: 201 });
}
