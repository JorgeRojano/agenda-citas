import { prisma } from "@/lib/prisma";
import { getTenantModules } from "@/lib/modules";
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

  const [profile, activeModules] = await Promise.all([
    user
      ? prisma.profile.findUnique({ where: { id: user.id }, select: { role: true } })
      : Promise.resolve(null),
    business
      ? getTenantModules(business.id).then((mods) => mods.map((m) => m.moduleKey))
      : Promise.resolve([] as string[]),
  ]);

  return (
    <AppShellAdmin
      business={business}
      userRole={profile?.role ?? "STAFF"}
      activeModules={activeModules}
    >
      {children}
    </AppShellAdmin>
  );
}
