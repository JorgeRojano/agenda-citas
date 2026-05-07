import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ModifiersAdmin from "./ModifiersAdmin";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminModifiersPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true },
  });
  if (!business) notFound();

  const modifiers = await prisma.menuModifier.findMany({
    where:   { businessId: business.id },
    orderBy: { name: "asc" },
    include: {
      options: { orderBy: { displayOrder: "asc" } },
      _count:  { select: { itemModifiers: true } },
    },
  });

  return (
    <ModifiersAdmin
      slug={slug}
      modifiers={modifiers.map((m) => ({
        id:            m.id,
        name:          m.name,
        selectionType: m.selectionType,
        isRequired:    m.isRequired,
        usedByItems:   m._count.itemModifiers,
        options:       m.options.map((o) => ({
          id:           o.id,
          name:         o.name,
          extraPrice:   o.extraPrice.toString(),
          displayOrder: o.displayOrder,
        })),
      }))}
    />
  );
}
