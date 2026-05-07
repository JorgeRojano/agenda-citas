import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../_admin";

type Params = { slug: string };

const daySchema = z.union([
  z.null(),
  z.object({ open: z.string(), close: z.string() }),
]);

const schema = z.object({
  welcomeMessage: z.string().optional(),
  tableParam:     z.string().optional(),
  wifiName:       z.string().optional(),
  wifiPassword:   z.string().optional(),
  hours: z.object({
    mon: daySchema,
    tue: daySchema,
    wed: daySchema,
    thu: daySchema,
    fri: daySchema,
    sat: daySchema,
    sun: daySchema,
  }).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;

  const mod = await prisma.businessModule.findUnique({
    where:  { businessId_moduleKey: { businessId: resolved.business.id, moduleKey: "digital-menu" } },
    select: { settings: true },
  });
  return NextResponse.json(mod?.settings ?? {});
}

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  await prisma.businessModule.update({
    where: { businessId_moduleKey: { businessId: resolved.business.id, moduleKey: "digital-menu" } },
    data:  { settings: body.data },
  });

  revalidatePath(`/${slug}/menu`);
  revalidatePath(`/${slug}/menu/categories`);
  return NextResponse.json({ ok: true });
}
