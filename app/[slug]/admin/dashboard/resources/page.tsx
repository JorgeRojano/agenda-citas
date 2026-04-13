import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ResourcesClient from "./ResourcesClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ResourcesPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      users: {
        where: {
          OR: [
            { role: "STAFF" },
            { role: "ADMIN", isResource: true },
          ],
        },
        include: {
          resourceTimeSlots: {
            select: { dayOfWeek: true },
          },
          resourceVacations: {
            select: { name: true, start: true, end: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      timeSlots: {           // horario completo del negocio
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  });

  if (!business) notFound();

  const businessSchedule = business.timeSlots.map((t) => ({
    dayOfWeek: t.dayOfWeek,
    startTime: t.startTime,
    endTime:   t.endTime,
  }));

  return (
    <ResourcesClient
      business={{ id: business.id, name: business.name }}
      businessSchedule={businessSchedule}
      staff={business.users.map((u) => ({
        id: u.id,
        name: u.name ?? "",
        email: u.email ?? "",
        specialty: u.specialty ?? "",
        role: u.role,
        activeDays: [...new Set(u.resourceTimeSlots.map((t) => t.dayOfWeek))],
        activeVacation: (() => {
          const now = new Date();
          const v = u.resourceVacations.find(
            (v) => new Date(v.start) <= now && new Date(v.end) >= now
          );
          return v ? { name: v.name, start: v.start.toISOString(), end: v.end.toISOString() } : null;
        })(),
      }))}
    />
  );
}