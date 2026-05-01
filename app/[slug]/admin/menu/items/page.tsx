import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ItemsAdmin from "./ItemsAdmin";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminItemsPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true },
  });
  if (!business) notFound();

  const [items, categories] = await Promise.all([
    prisma.menuItem.findMany({
      where:   { businessId: business.id },
      orderBy: [{ categoryId: "asc" }, { name: "asc" }],
      include: { category: { select: { id: true, name: true, emoji: true } } },
    }),
    prisma.menuCategory.findMany({
      where:   { businessId: business.id, isActive: true },
      orderBy: { displayOrder: "asc" },
      select:  { id: true, name: true, emoji: true },
    }),
  ]);

  return (
    <ItemsAdmin
      slug={slug}
      categories={categories}
      items={items.map((i) => ({
        id:           i.id,
        categoryId:   i.categoryId,
        categoryName: i.category.name,
        categoryEmoji: i.category.emoji,
        name:         i.name,
        description:  i.description,
        price:        i.price.toString(),
        originalPrice: i.originalPrice?.toString() ?? null,
        emoji:        i.emoji,
        isActive:     i.isActive,
        isAvailable:  i.isAvailable,
        isPopular:    i.isPopular,
        isVegetarian: i.isVegetarian,
        isGlutenFree: i.isGlutenFree,
        spiceLevel:   i.spiceLevel,
        allergens:    i.allergens,
      }))}
    />
  );
}
