import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isModuleActive } from "@/lib/modules";

export async function resolveTenantMenu(slug: string) {
  const business = await prisma.business.findUnique({ where: { slug } });

  if (!business) {
    return { error: NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 }) };
  }

  const active = await isModuleActive(business.id, "digital-menu");
  if (!active) {
    return { error: NextResponse.json({ error: "Módulo de menú no activo" }, { status: 403 }) };
  }

  return { business };
}
