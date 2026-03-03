import { prisma } from "@/lib/prisma";
import DashboardAdmin from "./DashboardAdmin";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function AdminDashboardPage({
  params,
  searchParams,
}: Props) {

  return (
    <DashboardAdmin />
  );
}
