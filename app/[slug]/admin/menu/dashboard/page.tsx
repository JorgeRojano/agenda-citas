import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import MenuDashboard from "./MenuDashboard";

type Props = {
  params: Promise<{ slug: string }>;
};

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export default async function MenuDashboardPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true, name: true },
  });
  if (!business) notFound();

  const now         = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const todayKey    = DAY_KEYS[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [
    totalCategories,
    activeCategories,
    totalItems,
    activeItems,
    unavailableItems,
    totalModifiers,
    allTodayPromos,
  ] = await Promise.all([
    prisma.menuCategory.count({ where: { businessId: business.id } }),
    prisma.menuCategory.count({ where: { businessId: business.id, isActive: true } }),
    prisma.menuItem.count({ where: { businessId: business.id } }),
    prisma.menuItem.count({ where: { businessId: business.id, isActive: true } }),
    prisma.menuItem.count({ where: { businessId: business.id, isActive: true, isAvailable: false } }),
    prisma.menuModifier.count({ where: { businessId: business.id } }),
    prisma.menuPromotion.findMany({
      where:  { businessId: business.id, isActive: true, validDays: { has: todayKey } },
      select: { startTime: true, endTime: true, name: true, type: true },
    }),
  ]);

  const activePromos = allTodayPromos.filter((p) => {
    if (!p.startTime && !p.endTime) return true;
    if (p.startTime && currentTime < p.startTime) return false;
    if (p.endTime   && currentTime > p.endTime)   return false;
    return true;
  });

  return (
    <MenuDashboard
      slug={slug}
      stats={{
        totalCategories,
        activeCategories,
        totalItems,
        activeItems,
        unavailableItems,
        totalModifiers,
        activePromos: activePromos.length,
      }}
    />
  );
}
