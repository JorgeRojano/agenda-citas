import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PromotionsClient from "./PromotionsClient";

type Props = {
  params: Promise<{ slug: string }>;
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

const TYPE_LABELS: Record<string, string> = {
  combo:    "Combo",
  discount: "Descuento",
  special:  "Especial",
};

export default async function PromotionsPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true, primaryColor: true },
  });
  if (!business) notFound();

  const now         = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const todayKey    = DAY_KEYS[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const allPromotions = await prisma.menuPromotion.findMany({
    where:   { businessId: business.id, isActive: true, validDays: { has: todayKey } },
    orderBy: { name: "asc" },
    include: {
      items: {
        include: { item: { select: { id: true, name: true, emoji: true, price: true } } },
      },
    },
  });

  const promotions = allPromotions
    .filter((p) => {
      if (!p.startTime && !p.endTime) return true;
      if (p.startTime && currentTime < p.startTime) return false;
      if (p.endTime   && currentTime > p.endTime)   return false;
      return true;
    })
    .map((p) => ({
      id:              p.id,
      name:            p.name,
      type:            p.type,
      typeLabel:       TYPE_LABELS[p.type] ?? p.type,
      description:     p.description,
      discountPercent: p.discountPercent?.toString() ?? null,
      startTime:       p.startTime,
      endTime:         p.endTime,
      items: p.items.map((pi) => ({
        itemId:   pi.itemId,
        quantity: pi.quantity,
        name:     pi.item.name,
        emoji:    pi.item.emoji,
        price:    pi.item.price.toString(),
      })),
    }));

  return (
    <PromotionsClient
      slug={slug}
      color={business.primaryColor ?? "blue"}
      promotions={promotions}
      currentTime={currentTime}
    />
  );
}
