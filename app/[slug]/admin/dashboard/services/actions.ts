"use server";

import { prisma } from "@/lib/prisma";
import { validateBusinessAccess } from "@/lib/validateBusinessAccess";
import { revalidatePath } from "next/cache";

export async function createService(
  businessId: string,
  data: { name: string; duration: number; price: number; showPrice: boolean },
) {
  await validateBusinessAccess(businessId);

  await prisma.service.create({
    data: {
      businessId,
      name: data.name,
      duration: data.duration,
      price: data.price * 100,
      showPrice: data.showPrice,
    },
  });

  revalidatePath(`/[slug]/admin/dashboard/services`);
}

export async function updateService(
  businessId: string,
  serviceId: string,
  data: { name: string; duration: number; price: number; showPrice: boolean },
) {
  await validateBusinessAccess(businessId);

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: data.name,
      duration: data.duration,
      price: data.price * 100,
      showPrice: data.showPrice,
    },
  });

  revalidatePath(`/[slug]/admin/dashboard/services`);
}

export async function deleteService(businessId: string, serviceId: string) {
  await validateBusinessAccess(businessId);

  await prisma.service.delete({
    where: { id: serviceId },
  });

  revalidatePath(`/[slug]/admin/dashboard/services`);
}