import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ItemDetailClient from "./ItemDetailClient";

type Props = {
  params: Promise<{ slug: string; itemId: string }>;
};

export default async function ItemDetailPage({ params }: Props) {
  const { slug, itemId } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true, primaryColor: true },
  });
  if (!business) notFound();

  const item = await prisma.menuItem.findFirst({
    where:   { id: itemId, businessId: business.id, isActive: true },
    include: {
      category: { select: { id: true } },
      itemModifiers: {
        include: {
          modifier: {
            include: { options: { orderBy: { displayOrder: "asc" } } },
          },
        },
      },
    },
  });
  if (!item) notFound();

  return (
    <ItemDetailClient
      slug={slug}
      color={business.primaryColor ?? "blue"}
      categoryId={item.category.id}
      item={{
        ...item,
        price:         item.price.toString(),
        originalPrice: item.originalPrice?.toString() ?? null,
        itemModifiers: item.itemModifiers.map((im) => ({
          modifier: {
            ...im.modifier,
            options: im.modifier.options.map((o) => ({
              ...o,
              extraPrice: o.extraPrice.toString(),
            })),
          },
        })),
      }}
    />
  );
}
