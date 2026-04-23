import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantMenu } from "../../_tenant";

type Params = { slug: string; itemId: string };

export async function GET(_req: Request, context: { params: Promise<Params> }) {
  try {
    const { slug, itemId } = await context.params;
    const resolved = await resolveTenantMenu(slug);
    if (resolved.error) return resolved.error;
    const { business } = resolved;

    const item = await prisma.menuItem.findFirst({
      where: { id: itemId, businessId: business.id, isActive: true },
      include: {
        category: { select: { id: true, name: true, emoji: true } },
        itemModifiers: {
          include: {
            modifier: {
              include: { options: { orderBy: { displayOrder: "asc" } } },
            },
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Platillo no encontrado" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Error al obtener platillo" }, { status: 500 });
  }
}
