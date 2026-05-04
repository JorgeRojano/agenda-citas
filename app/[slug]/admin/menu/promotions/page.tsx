import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PromotionsAdminClient from "./PromotionsAdminClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminPromotionsPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true },
  });
  if (!business) notFound();

  const promotions = await prisma.menuPromotion.findMany({
    where:   { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PromotionsAdminClient
      slug={slug}
      promotions={promotions.map((p) => ({
        id:             p.id,
        name:           p.name,
        type:           p.type,
        description:    p.description,
        discountAmount: p.discountAmount?.toString() ?? null,
        validDays:      p.validDays,
        startTime:      p.startTime,
        endTime:        p.endTime,
        isActive:       p.isActive,
      }))}
    />
  );
}
