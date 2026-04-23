import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantMenu } from "../_tenant";

type Params = { slug: string };

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export async function GET(_req: Request, context: { params: Promise<Params> }) {
  try {
    const { slug } = await context.params;
    const resolved = await resolveTenantMenu(slug);
    if (resolved.error) return resolved.error;
    const { business } = resolved;

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    const todayKey = DAY_KEYS[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const promotions = await prisma.menuPromotion.findMany({
      where: {
        businessId: business.id,
        isActive:   true,
        validDays:  { has: todayKey },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filtrar por horario si la promoción tiene startTime/endTime definidos
    const active = promotions.filter((p) => {
      if (!p.startTime && !p.endTime) return true;
      if (p.startTime && currentTime < p.startTime) return false;
      if (p.endTime   && currentTime > p.endTime)   return false;
      return true;
    });

    return NextResponse.json(active);
  } catch {
    return NextResponse.json({ error: "Error al obtener promociones" }, { status: 500 });
  }
}
