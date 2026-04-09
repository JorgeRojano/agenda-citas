import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import AvailabilityClient from "./AvailabilityClient";
import { getCoverageAlerts } from "@/lib/coverageAlerts";
import { startOfWeek, startOfDay, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TIME_ZONE = "America/Mexico_City";

type Props = { params: Promise<{ slug: string }> };

export default async function AvailabilityPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } })
    : null;
  const userRole = profile?.role ?? "STAFF";
  const currentUserId = user?.id ?? null;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) notFound();

  // Horario del negocio — siempre se carga (admin lo edita, staff lo ve como referencia)
  const businessSlots = await prisma.businessTimeSlot.findMany({
    where: { businessId: business.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const businessSchedule = businessSlots.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
  }));

  if (userRole !== "STAFF" || !currentUserId) {
    // Admin: horario del negocio + cierres especiales + cobertura de recursos
    const nowMexico = toZonedTime(new Date(), TIME_ZONE);
    const weekStart = startOfWeek(nowMexico, { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(weekStart), i));

    const [blockedTimes, rawCoverageAlerts] = await Promise.all([
      prisma.blockedTime.findMany({
        where: { businessId: business.id },
        orderBy: { start: "asc" },
      }),
      getCoverageAlerts(business.id, weekStart),
    ]);

    // Construir snapshot de los 7 días con estado de cobertura
    const weekCoverage = weekDates.map((date) => {
      const mexicoDate = toZonedTime(date, TIME_ZONE);
      const dayOfWeek  = mexicoDate.getDay();
      const dateKey    = mexicoDate.toLocaleDateString("en-CA");
      const dayLabel   = mexicoDate.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });

      const isOpen = businessSlots.some((s) => s.dayOfWeek === dayOfWeek);
      if (!isOpen) return { dateKey, dayLabel, dayOfWeek, status: "closed" as const, slots: [] as string[] };

      const alert = rawCoverageAlerts.find((a) => {
        const alertMexico = toZonedTime(a.date, TIME_ZONE);
        return alertMexico.toLocaleDateString("en-CA") === dateKey;
      });
      if (!alert) return { dateKey, dayLabel, dayOfWeek, status: "covered" as const, slots: [] as string[] };

      return { dateKey, dayLabel, dayOfWeek, status: alert.type, slots: alert.slots };
    });

    return (
      <AvailabilityClient
        slug={slug}
        userRole={userRole}
        currentUserId={currentUserId}
        initialSchedule={businessSchedule}
        businessSchedule={businessSchedule}
        initialBlockedTimes={blockedTimes.map((b) => ({
          id:    b.id,
          name:  b.name,
          start: b.start.toISOString(),
          end:   b.end.toISOString(),
        }))}
        weekCoverage={weekCoverage}
      />
    );
  }

  // Staff: sus propios slots + sus vacaciones
  const [resourceSlots, resourceVacations] = await Promise.all([
    prisma.resourceTimeSlot.findMany({
      where: { profileId: currentUserId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.resourceVacation.findMany({
      where: { profileId: currentUserId },
      orderBy: { start: "asc" },
    }),
  ]);

  return (
    <AvailabilityClient
      slug={slug}
      userRole={userRole}
      currentUserId={currentUserId}
      initialSchedule={resourceSlots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }))}
      businessSchedule={businessSchedule}
      initialBlockedTimes={resourceVacations.map((v) => ({
        id:    v.id,
        name:  v.name,
        start: v.start.toISOString(),
        end:   v.end.toISOString(),
      }))}
      weekCoverage={[]}
    />
  );
}
