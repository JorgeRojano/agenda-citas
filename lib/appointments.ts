import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "./supabaseServer";
import { revalidatePath } from "next/cache";
import { validateBusinessAccess } from "./validateBusinessAccess";

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
  revalidatePath(`/${slug}/admin/dashboard/bookings`);
}
