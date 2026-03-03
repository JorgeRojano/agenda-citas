import { prisma } from "@/lib/prisma";
import { AppShellAdmin } from "./AppShell";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
  });

  return <AppShellAdmin business={business}>{children}</AppShellAdmin>;
}
