import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import AvailabilityClient from "./AvailabilityClient";

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
    // Admin: horario del negocio + cierres especiales
    const blockedTimes = await prisma.blockedTime.findMany({
      where: { businessId: business.id },
      orderBy: { start: "asc" },
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
    />
  );
}
