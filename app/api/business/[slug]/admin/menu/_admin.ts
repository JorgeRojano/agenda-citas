import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateBusinessAccess } from "@/lib/validateBusinessAccess";
import { isModuleActive } from "@/lib/modules";

export async function resolveAdminMenu(slug: string) {
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) {
    return { error: NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 }) };
  }

  let profile: Awaited<ReturnType<typeof validateBusinessAccess>>;
  try {
    profile = await validateBusinessAccess(business.id);
  } catch {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  const active = await isModuleActive(business.id, "digital-menu");
  if (!active) {
    return { error: NextResponse.json({ error: "Módulo de menú no activo" }, { status: 403 }) };
  }

  return { business, profile };
}

export function isStaff(profile: { role: string }) {
  return profile.role === "STAFF";
}
