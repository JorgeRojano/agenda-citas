import { prisma } from "@/lib/prisma";
import { BusinessModule } from "@prisma/client";

type CacheEntry = {
  modules: BusinessModule[];
  expiresAt: number;
};

// La gestión de módulos (activar/desactivar por tenant) la hace el SUPER_ADMIN
// directamente en Supabase Table Editor → tabla BusinessModule. No hay UI para esto.
const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 minutos

export async function getTenantModules(businessId: string): Promise<BusinessModule[]> {
  const hit = cache.get(businessId);
  if (hit && hit.expiresAt > Date.now()) return hit.modules;

  const modules = await prisma.businessModule.findMany({
    where: { businessId, isActive: true },
  });

  cache.set(businessId, { modules, expiresAt: Date.now() + TTL_MS });
  return modules;
}

export async function isModuleActive(businessId: string, moduleKey: string): Promise<boolean> {
  const modules = await getTenantModules(businessId);
  return modules.some((m) => m.moduleKey === moduleKey);
}

export async function getModuleSettings(businessId: string, moduleKey: string): Promise<unknown> {
  const modules = await getTenantModules(businessId);
  return modules.find((m) => m.moduleKey === moduleKey)?.settings ?? null;
}
