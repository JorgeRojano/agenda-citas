"use server";

import { prisma } from "@/lib/prisma";
import { validateBusinessAccess } from "@/lib/validateBusinessAccess";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function createStaffMember(
  businessId: string,
  data: { name: string; email: string; password: string; specialty?: string }
) {
  await validateBusinessAccess(businessId);

  const { data: authData, error } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });

  if (error) throw new Error(error.message);
  if (!authData.user) throw new Error("No se pudo crear el usuario");

  await prisma.profile.upsert({
    where: { id: authData.user.id },
    update: {
      role: "STAFF",
      businessId,
      email: data.email,
      name: data.name,
      specialty: data.specialty ?? null,
    },
    create: {
      id: authData.user.id,
      role: "STAFF",
      businessId,
      email: data.email,
      name: data.name,
      specialty: data.specialty ?? null,
    },
  });

  revalidatePath(`/[slug]/admin/appointments/resources`);
}

export async function updateStaffMember(
  businessId: string,
  profileId: string,
  data: { name: string; specialty: string; email?: string }
) {
  await validateBusinessAccess(businessId);

  if (data.email) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(profileId, {
      email: data.email,
    });
    if (error) throw new Error(error.message);
  }

  await prisma.profile.update({
    where: { id: profileId },
    data: {
      name: data.name,
      specialty: data.specialty || null,
      ...(data.email && { email: data.email }),
    },
  });

  revalidatePath(`/[slug]/admin/appointments/resources`);
}

export async function changeStaffPassword(
  businessId: string,
  profileId: string,
  newPassword: string,
) {
  await validateBusinessAccess(businessId);

  const { error } = await supabaseAdmin.auth.admin.updateUserById(profileId, {
    password: newPassword,
  });
  if (error) throw new Error(error.message);
}

export async function deleteStaffMember(businessId: string, profileId: string) {
  await validateBusinessAccess(businessId);

  await supabaseAdmin.auth.admin.deleteUser(profileId);
  await prisma.profile.delete({ where: { id: profileId } });

  revalidatePath(`/[slug]/admin/appointments/resources`);
}