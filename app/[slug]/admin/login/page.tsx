import { prisma } from "@/lib/prisma";
import AdminLoginPage from "./AdminLoginPage";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      name: true,
      primaryColor: true,
      logoUrl: true,
      description: true,
    },
  });

  if (!business) notFound();

  return <AdminLoginPage business={business} />;
}