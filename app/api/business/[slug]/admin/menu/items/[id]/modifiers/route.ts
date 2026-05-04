import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { resolveAdminMenu, isStaff } from "../../../_admin";

type Params = { slug: string; id: string };

const schema = z.object({
  modifierIds: z.array(z.string().uuid()),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, id } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;

  const links = await prisma.itemModifier.findMany({
    where:  { itemId: id },
    select: { modifierId: true },
  });
  return NextResponse.json(links.map((l) => l.modifierId));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<Params> }) {
  const { slug, id } = await params;
  const resolved = await resolveAdminMenu(slug);
  if (resolved.error) return resolved.error;
  if (isStaff(resolved.profile)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  await prisma.$transaction([
    prisma.itemModifier.deleteMany({ where: { itemId: id } }),
    prisma.itemModifier.createMany({
      data: body.data.modifierIds.map((modifierId) => ({ itemId: id, modifierId })),
    }),
  ]);

  revalidatePath(`/${slug}/menu/items/${id}`);
  return NextResponse.json({ ok: true });
}
