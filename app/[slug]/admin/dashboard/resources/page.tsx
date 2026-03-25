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
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!business) notFound();

  return (
    <ResourcesClient
      business={{ id: business.id, name: business.name }}
      staff={business.users.map((u) => ({
        id: u.id,
        name: u.name ?? "",
        email: u.email ?? "",
        specialty: u.specialty ?? "",
        role: u.role,
        activeDays: [...new Set(u.resourceTimeSlots.map((t) => t.dayOfWeek))],
      }))}
    />
  );
}