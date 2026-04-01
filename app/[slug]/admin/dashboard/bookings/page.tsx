import { prisma } from "@/lib/prisma";
import { getAppointmentsByDay } from "@/lib/appointments";
import BookingsClient from "./BookingsClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function AdminBookingsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { date } = await searchParams;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      services: {
        orderBy: { createdAt: "asc" },
        include: {
          resources: {
            include: {
              profile: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
  if (!business) return <div>Negocio no encontrado</div>;

  const dateString = date ?? new Date().toLocaleDateString("en-CA");
  const startOfDay = new Date(`${dateString}T00:00:00`);
  const endOfDay   = new Date(`${dateString}T23:59:59`);

  const appointments = await getAppointmentsByDay(business.id, startOfDay, endOfDay);

  const items = appointments.map((a) => ({
    type: "appointment" as const,
    id: a.id,
    start: a.startTime,
    end: a.endTime,
    clientName: a.clientName,
    service: a.service.name,
    status: a.status,
    phone: a.phone,
    assignedTo: a.assignedTo?.name ?? null,
    serviceId: a.serviceId,
    assignedToId: a.assignedToId ?? null,
  }));

  // Staff disponible ese día — rol STAFF o isResource:true + tienen slot ese dayOfWeek
  const selectedDayOfWeek = new Date(`${dateString}T12:00:00Z`).getUTCDay();

  const startOfSelectedDay = new Date(`${dateString}T00:00:00`);
  const endOfSelectedDay   = new Date(`${dateString}T23:59:59`);

  const staff = business.hasStaff
    ? await prisma.profile.findMany({
        where: {
          businessId: business.id,
          OR: [{ role: "STAFF" }, { isResource: true }],
          resourceTimeSlots: {
            some: { dayOfWeek: selectedDayOfWeek },
          },
          resourceVacations: {
            none: {
              start: { lte: endOfSelectedDay },
              end:   { gte: startOfSelectedDay },
            },
          },
        },
        select: { id: true, name: true, specialty: true },
        orderBy: { name: "asc" },
      }).then((rows) => rows.map((r) => ({ ...r, name: r.name ?? "" })))
    : [];

  return (
    <BookingsClient
      items={items}
      slug={slug}
      business={business}
      staff={staff}
    />
  );
}