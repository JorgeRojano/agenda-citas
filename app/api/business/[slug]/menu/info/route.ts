import { NextResponse } from "next/server";
import { getModuleSettings } from "@/lib/modules";
import { resolveTenantMenu } from "../_tenant";

type Params = { slug: string };

export async function GET(_req: Request, context: { params: Promise<Params> }) {
  try {
    const { slug } = await context.params;
    const resolved = await resolveTenantMenu(slug);
    if (resolved.error) return resolved.error;
    const { business } = resolved;

    const settings = await getModuleSettings(business.id, "digital-menu");

    return NextResponse.json({
      name:        business.name,
      description: business.description,
      logoUrl:     business.logoUrl,
      primaryColor: business.primaryColor,
      settings,
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener info del menú" }, { status: 500 });
  }
}
