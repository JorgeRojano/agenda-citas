import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import AvailabilityClient from "./AvailabilityClient";

type Props = { params: Promise<{ slug: string }> };

export default async function AvailabilityPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) notFound();

  const [scheduleSlots, blockedTimes] = await Promise.all([
    prisma.businessTimeSlot.findMany({
      where: { businessId: business.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.blockedTime.findMany({
      where: { businessId: business.id },
      orderBy: { start: "asc" },
    }),
  ]);

  return (
    <AvailabilityClient
      slug={slug}
      initialSchedule={scheduleSlots.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime:   s.endTime,
      }))}
      initialBlockedTimes={blockedTimes.map((b) => ({
        id:    b.id,
        name:  b.name,
        start: b.start.toISOString(),
        end:   b.end.toISOString(),
      }))}
    />
  );
}