import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ItemsClient from "./ItemsClient";

type Props = {
  params: Promise<{ slug: string; categoryId: string }>;
};

export default async function ItemsPage({ params }: Props) {
  const { slug, categoryId } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true, primaryColor: true },
  });
  if (!business) notFound();

  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, businessId: business.id, isActive: true },
  });
  if (!category) notFound();

  const items = await prisma.menuItem.findMany({
    where:   { categoryId, businessId: business.id, isActive: true },
    orderBy: [{ isPopular: "desc" }, { name: "asc" }],
  });

  return (
    <ItemsClient
      slug={slug}
      color={business.primaryColor ?? "blue"}
      categoryName={category.name}
      categoryEmoji={category.emoji}
      items={items.map((i) => ({ ...i, price: i.price.toString(), originalPrice: i.originalPrice?.toString() ?? null }))}
    />
  );
}
