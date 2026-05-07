import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CategoriesAdmin from "./CategoriesAdmin";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminCategoriesPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true },
  });
  if (!business) notFound();

  const categories = await prisma.menuCategory.findMany({
    where:   { businessId: business.id },
    orderBy: { displayOrder: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <CategoriesAdmin
      slug={slug}
      categories={categories.map((c) => ({
        id:           c.id,
        name:         c.name,
        emoji:        c.emoji,
        displayOrder: c.displayOrder,
        isActive:     c.isActive,
        itemCount:    c._count.items,
      }))}
    />
  );
}
