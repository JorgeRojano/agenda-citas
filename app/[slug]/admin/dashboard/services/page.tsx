import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ServicesClient from "./ServicesClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ServicesPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: { services: { orderBy: { createdAt: "asc" } } },
  });

  if (!business) notFound();

  return <ServicesClient business={business} services={business.services} />;
}