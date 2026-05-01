import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../_admin";

type Params = { slug: string };

const DAY_KEYS = ["mon","tue","wed","thu","fri","sat","sun"] as const;

const promotionSchema = z.object({
  name:           z.string().min(1),
  type:           z.enum(["combo", "discount", "special"]),
  description:    z.string().optional(),
  discountAmount: z.number().positive().optional(),
  validDays:      z.array(z.enum(DAY_KEYS)).min(1),
  startTime:      z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime:        z.string().regex(/^\d{2}:\d{2}$/).optional(),
  isActive:       z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;

  const promotions = await prisma.menuPromotion.findMany({
    where:   { businessId: resolved.business.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(promotions);
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

  const promotion = await prisma.menuPromotion.create({
    data: { businessId: resolved.business.id, ...body.data },
  });
  revalidatePath(`/${slug}/menu/promotions`);
  revalidatePath(`/${slug}/menu/categories`);
  return NextResponse.json(promotion, { status: 201 });
}
