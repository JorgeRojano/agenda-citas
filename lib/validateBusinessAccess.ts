import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export async function validateBusinessAccess(businessId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autorizado");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { businessId: true, role: true },
  });

  if (profile?.role !== "SUPER_ADMIN" && profile?.businessId !== businessId) {
    throw new Error("Acceso no autorizado a este negocio");
  }
}