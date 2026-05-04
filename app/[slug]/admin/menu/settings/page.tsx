import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SettingsAdminClient from "./SettingsAdminClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function AdminMenuSettingsPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where:  { slug },
    select: { id: true },
  });
  if (!business) notFound();

  const mod = await prisma.businessModule.findUnique({
    where:  { businessId_moduleKey: { businessId: business.id, moduleKey: "digital-menu" } },
    select: { settings: true },
  });

  const settings = (mod?.settings ?? {}) as Record<string, unknown>;

  return <SettingsAdminClient slug={slug} settings={settings} />;
}
