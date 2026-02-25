import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "./supabaseServer";
import { revalidatePath } from "next/cache";

/**
 * Función interna para validar que el usuario pertenece al negocio que pide
 */
async function validateBusinessAccess(businessId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autorizado");

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { businessId: true, role: true }
  });

  // Si no es SuperAdmin y el ID no coincide, bloqueamos el acceso
  if (profile?.role !== "SUPER_ADMIN" && profile?.businessId !== businessId) {
    throw new Error("Acceso no autorizado a este negocio");
  }
}

/**
 * Obtener citas por día para un negocio específico
 * Incluye citas PENDING y CONFIRMED
 */
export async function getAppointmentsByDay(
  businessId: string,
  start: Date,
  end: Date
) {
  await validateBusinessAccess(businessId);
  return prisma.appointment.findMany({
    where: {
      businessId,
      startTime: {
        gte: start,
        lte: end,
      },
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
    },
    include: {
      service: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

/**
 * Obtener bloqueos por día para un negocio específico
 */
export async function getBlockedTimeByDay(
  businessId: string,
  start: Date,
  end: Date
) {
  return prisma.blockedTime.findMany({
    where: {
      businessId,
      start: {
        lt: end,
      },
      end: {
        gt: start,
      },
    },
    orderBy: {
      start: "asc",
    },
  });
}

export async function updateAppointmentStatus(
  appointmentId: string,
  slug: string,
  newStatus: string
) {

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { business: true }
  });

  if (!appointment) throw new Error("Cita no encontrada");

  await validateBusinessAccess(appointment.businessId);

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: newStatus as any },
  });

  // Refrescar los datos en el cliente
  revalidatePath(`/${slug}/admin/dashboard`);
}
