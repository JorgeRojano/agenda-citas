/**
 * Ruta de prueba — NO usar en producción.
 * Llama getCoverageAlerts con la semana actual y devuelve el resultado en JSON.
 *
 * Uso:  GET /api/test/coverage-alerts?slug=<tu-slug>
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCoverageAlerts } from "@/lib/coverageAlerts";
import { startOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIME_ZONE = "America/Mexico_City";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Parámetro 'slug' requerido" }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  }

  // Semana actual (lunes como inicio) en zona México
  const nowMexico = toZonedTime(new Date(), TIME_ZONE);
  const weekStart = startOfWeek(nowMexico, { weekStartsOn: 1 });

  const alerts = await getCoverageAlerts(business.id, weekStart);

  // También vuelca en los logs del servidor para fácil inspección
  console.log(
    `[coverage-alerts] slug=${slug} | semana desde ${weekStart.toISOString()} | ${alerts.length} alerta(s)`,
  );
  console.log(JSON.stringify(alerts, null, 2));

  return NextResponse.json({
    slug,
    businessId: business.id,
    hasStaff: business.hasStaff,
    weekStart: weekStart.toISOString(),
    alertCount: alerts.length,
    alerts,
  });
}
