import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import WaiterClient from "./WaiterClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function WaiterPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { primaryColor: true },
  });
  if (!business) notFound();

  return <WaiterClient slug={slug} color={business.primaryColor ?? "blue"} />;
}
