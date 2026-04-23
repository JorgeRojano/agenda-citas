import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantMenu } from "../_tenant";

type Params = { slug: string };

export async function GET(_req: Request, context: { params: Promise<Params> }) {
  try {
    const { slug } = await context.params;
    const resolved = await resolveTenantMenu(slug);
    if (resolved.error) return resolved.error;
    const { business } = resolved;

    const categories = await prisma.menuCategory.findMany({
      where:   { businessId: business.id, isActive: true },
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { items: { where: { isActive: true } } } } },
    });

    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
  }
}
