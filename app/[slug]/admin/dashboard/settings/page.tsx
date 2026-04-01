import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SettingsClient from "./SettingsClient";

type Props = { params: Promise<{ slug: string }> };

export default async function SettingsPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      images: {
        orderBy: { order: "asc" },
        select: { id: true, url: true, order: true },
      },
    },
  });
  if (!business) notFound();

  return <SettingsClient initialImages={business.images} />;
}