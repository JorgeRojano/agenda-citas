import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CategoriesClient from "./CategoriesClient";

type Props = {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export default async function CategoriesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const query    = await searchParams;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true, primaryColor: true },
  });
  if (!business) notFound();

  const now       = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const todayKey  = DAY_KEYS[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [categories, allPromotions] = await Promise.all([
    prisma.menuCategory.findMany({
      where:   { businessId: business.id, isActive: true },
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { items: { where: { isActive: true } } } } },
    }),
    prisma.menuPromotion.findMany({
      where: { businessId: business.id, isActive: true, validDays: { has: todayKey } },
    }),
  ]);

  const promotions = allPromotions.filter((p) => {
    if (!p.startTime && !p.endTime) return true;
    if (p.startTime && currentTime < p.startTime) return false;
    if (p.endTime   && currentTime > p.endTime)   return false;
    return true;
  });

  return (
    <CategoriesClient
      slug={slug}
      color={business.primaryColor ?? "blue"}
      tableNum={query.mesa ?? query.table}
      categories={categories}
      promotions={promotions}
    />
  );
}
