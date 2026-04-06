import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import { AppShellAdmin } from "./AppShell";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [business, supabase] = await Promise.all([
    prisma.business.findUnique({ where: { slug } }),
    createServerSupabaseClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const profile = user
    ? await prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } })
    : null;

  return (
    <AppShellAdmin business={business} userRole={profile?.role ?? "STAFF"}>
      {children}
    </AppShellAdmin>
  );
}
