import { prisma } from "@/lib/prisma";
import DashboardAdmin from "./DashboardAdmin";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIME_ZONE = "America/Mexico_City";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return <div>Negocio no encontrado</div>;

  const now        = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);
  const weekStart  = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd    = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd   = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const [
    todayAppointments,
    weekCount,
    lastWeekCount,
    monthCompleted,
    monthCancelled,
    upcomingToday,
    weekDayCounts,
    allPending,
  ] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["status"],
      where: { businessId: business.id, startTime: { gte: todayStart, lte: todayEnd } },
      _count: true,
    }),
    prisma.appointment.count({
      where: { businessId: business.id, startTime: { gte: weekStart, lte: weekEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.appointment.count({
      where: { businessId: business.id, startTime: { gte: lastWeekStart, lte: lastWeekEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.appointment.count({
      where: { businessId: business.id, startTime: { gte: monthStart, lte: monthEnd }, status: "CONFIRMED" },
    }),
    prisma.appointment.count({
      where: { businessId: business.id, startTime: { gte: monthStart, lte: monthEnd }, status: "CANCELLED" },
    }),
    prisma.appointment.findMany({
      where: { businessId: business.id, startTime: { gte: now, lte: todayEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { service: true },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { businessId: business.id, startTime: { gte: weekStart, lte: weekEnd }, status: { not: "CANCELLED" } },
      select: { startTime: true },
    }),
    // Todas las citas PENDING desde hoy en adelante
    prisma.appointment.findMany({
      where: { businessId: business.id, startTime: { gte: todayStart }, status: "PENDING" },
      include: { service: true },
      orderBy: { startTime: "asc" },
    }),
  ]);

  const todayPending   = todayAppointments.find((a) => a.status === "PENDING")?._count ?? 0;
  const todayConfirmed = todayAppointments.find((a) => a.status === "CONFIRMED")?._count ?? 0;
  const todayTotal     = todayPending + todayConfirmed;

  const weekGrowth = lastWeekCount > 0
    ? Math.round(((weekCount - lastWeekCount) / lastWeekCount) * 100)
    : null;

  const dayCountMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  weekDayCounts.forEach(({ startTime }) => {
    const day = new Date(startTime).getDay();
    if (day >= 1 && day <= 5) dayCountMap[day] = (dayCountMap[day] ?? 0) + 1;
  });

  // Agrupar pendientes por fecha (YYYY-MM-DD en zona México)
  const pendingByDay: Record<string, { clientName: string; service: string; time: string }[]> = {};
  allPending.forEach((a) => {
    const mexicoDate = toZonedTime(a.startTime, TIME_ZONE);
    const dateKey    = mexicoDate.toLocaleDateString("en-CA"); // YYYY-MM-DD
    const time       = mexicoDate.toLocaleTimeString("es-MX", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
    if (!pendingByDay[dateKey]) pendingByDay[dateKey] = [];
    pendingByDay[dateKey].push({ clientName: a.clientName, service: a.service.name, time });
  });

  return (
    <DashboardAdmin
      business={{ id: business.id, name: business.name, slug }}
      stats={{ todayTotal, todayPending, todayConfirmed, weekCount, weekGrowth, monthCompleted, monthCancelled }}
      upcomingToday={upcomingToday.map((a) => ({
        id: a.id,
        clientName: a.clientName,
        service: a.service.name,
        startTime: a.startTime.toISOString(),
        status: a.status,
      }))}
      weekDayCounts={dayCountMap}
      pendingByDay={pendingByDay}
    />
  );
}