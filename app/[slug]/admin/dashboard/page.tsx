import { prisma } from "@/lib/prisma";
import DashboardAdmin from "./DashboardAdmin";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks } from "date-fns";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminDashboardPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return <div>Negocio no encontrado</div>;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const [
    todayAppointments,
    weekCount,
    lastWeekCount,
    monthCompleted,
    monthCancelled,
    upcomingToday,
    weekDayCounts,
  ] = await Promise.all([
    // Citas de hoy por status
    prisma.appointment.groupBy({
      by: ["status"],
      where: { businessId: business.id, startTime: { gte: todayStart, lte: todayEnd } },
      _count: true,
    }),
    // Esta semana
    prisma.appointment.count({
      where: { businessId: business.id, startTime: { gte: weekStart, lte: weekEnd }, status: { not: "CANCELLED" } },
    }),
    // Semana anterior
    prisma.appointment.count({
      where: { businessId: business.id, startTime: { gte: lastWeekStart, lte: lastWeekEnd }, status: { not: "CANCELLED" } },
    }),
    // Este mes completadas
    prisma.appointment.count({
      where: { businessId: business.id, startTime: { gte: monthStart, lte: monthEnd }, status: "CONFIRMED" },
    }),
    // Este mes canceladas
    prisma.appointment.count({
      where: { businessId: business.id, startTime: { gte: monthStart, lte: monthEnd }, status: "CANCELLED" },
    }),
    // Próximas citas hoy
    prisma.appointment.findMany({
      where: { businessId: business.id, startTime: { gte: now, lte: todayEnd }, status: { in: ["PENDING", "CONFIRMED"] } },
      include: { service: true },
      orderBy: { startTime: "asc" },
      take: 5,
    }),
    // Citas por día esta semana
    prisma.appointment.findMany({
      where: { businessId: business.id, startTime: { gte: weekStart, lte: weekEnd }, status: { not: "CANCELLED" } },
      select: { startTime: true },
    }),
  ]);

  const todayPending = todayAppointments.find((a) => a.status === "PENDING")?._count ?? 0;
  const todayConfirmed = todayAppointments.find((a) => a.status === "CONFIRMED")?._count ?? 0;
  const todayTotal = todayPending + todayConfirmed;

  const weekGrowth = lastWeekCount > 0
    ? Math.round(((weekCount - lastWeekCount) / lastWeekCount) * 100)
    : null;

  // Agrupar por día de la semana (1=Lun ... 5=Vie)
  const dayCountMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  weekDayCounts.forEach(({ startTime }) => {
    const day = new Date(startTime).getDay(); // 0=Dom, 1=Lun...
    if (day >= 1 && day <= 5) dayCountMap[day] = (dayCountMap[day] ?? 0) + 1;
  });

  return (
    <DashboardAdmin
      business={{ id: business.id, name: business.name, slug }}
      stats={{
        todayTotal,
        todayPending,
        todayConfirmed,
        weekCount,
        weekGrowth,
        monthCompleted,
        monthCancelled,
      }}
      upcomingToday={upcomingToday.map((a) => ({
        id: a.id,
        clientName: a.clientName,
        service: a.service.name,
        startTime: a.startTime.toISOString(),
        status: a.status,
      }))}
      weekDayCounts={dayCountMap}
    />
  );
}