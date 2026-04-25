import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ListClient from "./ListClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ListPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { primaryColor: true },
  });
  if (!business) notFound();

  return <ListClient slug={slug} color={business.primaryColor ?? "blue"} />;
}
