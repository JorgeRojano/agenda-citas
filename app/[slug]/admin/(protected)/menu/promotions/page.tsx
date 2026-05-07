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

  const [promotions, menuItems] = await Promise.all([
    prisma.menuPromotion.findMany({
      where:   { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { item: { select: { id: true, name: true, emoji: true, price: true } } },
        },
      },
    }),
    prisma.menuItem.findMany({
      where:   { businessId: business.id, isActive: true },
      select:  { id: true, name: true, emoji: true, price: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <PromotionsAdminClient
      slug={slug}
      promotions={promotions.map((p) => ({
        id:              p.id,
        name:            p.name,
        type:            p.type,
        description:     p.description,
        discountAmount:  p.discountAmount?.toString()  ?? null,
        discountPercent: p.discountPercent?.toString() ?? null,
        validDays:       p.validDays,
        startTime:       p.startTime,
        endTime:         p.endTime,
        isActive:        p.isActive,
        items: p.items.map((pi) => ({
          itemId:   pi.itemId,
          quantity: pi.quantity,
          name:     pi.item.name,
          emoji:    pi.item.emoji,
          price:    pi.item.price.toString(),
        })),
      }))}
      menuItems={menuItems.map((i) => ({
        id:    i.id,
        name:  i.name,
        emoji: i.emoji,
        price: i.price.toString(),
      }))}
    />
  );
}
