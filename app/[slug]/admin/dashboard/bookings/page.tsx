import { prisma } from "@/lib/prisma";
import { getAppointmentsByDay, getBlockedTimeByDay } from "@/lib/appointments";
import BookingsClient from "./BookingsClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function AdminBookingsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { date } = await searchParams;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return <div>Negocio no encontrado</div>;

  const dateString = date ?? new Date().toLocaleDateString("en-CA");
  const startOfDay = new Date(`${dateString}T00:00:00`);
  const endOfDay = new Date(`${dateString}T23:59:59`);

  const appointments = await getAppointmentsByDay(business.id, startOfDay, endOfDay);
  const blockedTimes = await getBlockedTimeByDay(business.id, startOfDay, endOfDay);

  const items = [
    ...appointments.map((a) => ({
      type: "appointment" as const,
      id: a.id,
      start: a.startTime,
      end: a.endTime,
      clientName: a.clientName,
      service: a.service.name,
      status: a.status,
      phone: a.phone,
      assignedTo: a.assignedTo?.name ?? null,
    })),
    ...blockedTimes.map((b) => ({
      type: "blocked" as const,
      id: b.id,
      start: b.start,
      end: b.end,
    })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <BookingsClient
      items={items}
      slug={slug}
      business={business}
    />
  );
}