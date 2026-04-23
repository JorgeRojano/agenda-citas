import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantMenu } from "../../../../menu/_tenant";

type Params = { slug: string; categoryId: string };

export async function GET(_req: Request, context: { params: Promise<Params> }) {
  try {
    const { slug, categoryId } = await context.params;
    const resolved = await resolveTenantMenu(slug);
    if (resolved.error) return resolved.error;
    const { business } = resolved;

    const items = await prisma.menuItem.findMany({
      where:   { businessId: business.id, categoryId, isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Error al obtener platillos" }, { status: 500 });
  }
}
