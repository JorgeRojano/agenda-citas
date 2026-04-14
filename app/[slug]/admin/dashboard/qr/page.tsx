import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import QRClient from "./QRClient";

type Props = { params: Promise<{ slug: string }> };

export default async function QRPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, slug: true, logoUrl: true, description: true, primaryColor: true },
  });
  if (!business) notFound();

  return (
    <QRClient
      businessName={business.name}
      slug={business.slug}
      logoUrl={business.logoUrl ?? null}
      description={business.description ?? null}
      primaryColor={business.primaryColor ?? "blue"}
    />
  );
}
