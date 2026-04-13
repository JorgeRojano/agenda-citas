import { prisma } from "@/lib/prisma";
import { validateBusinessAccess } from "@/lib/validateBusinessAccess";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: {
      slug: true,
      name: true,
      description: true,
      primaryColor: true,
      logoUrl: true,
      bannerUrl: true,
      hasStaff: true,
      address: true,
      mapsUrl: true,
      whatsapp: true,
      facebook: true,
      instagram: true,
      website: true,
    },
  });

  if (!business)
    return NextResponse.json({ error: "Business not found" }, { status: 404 });

  return NextResponse.json(business);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await validateBusinessAccess(business.id);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const {
    name, description, primaryColor,
    logoUrl, bannerUrl, hasStaff,
    address, mapsUrl,
    whatsapp, facebook, instagram, website,
    slug: newSlug,
  } = body;

  if (newSlug !== undefined && newSlug !== slug) {
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(newSlug)) {
      return NextResponse.json(
        { error: "Slug inválido. Solo letras minúsculas, números y guiones (sin empezar ni terminar con guión)." },
        { status: 400 },
      );
    }
    const existing = await prisma.business.findUnique({ where: { slug: newSlug } });
    if (existing) {
      return NextResponse.json({ error: "Este enlace ya está en uso." }, { status: 409 });
    }
  }

  const updatedBusiness = await prisma.business.update({
    where: { slug },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(primaryColor && { primaryColor }),
      ...(logoUrl !== undefined && { logoUrl }),
      ...(bannerUrl !== undefined && { bannerUrl }),
      ...(hasStaff !== undefined && { hasStaff }),
      ...(address !== undefined && { address }),
      ...(mapsUrl !== undefined && { mapsUrl }),
      ...(whatsapp !== undefined && { whatsapp }),
      ...(facebook !== undefined && { facebook }),
      ...(instagram !== undefined && { instagram }),
      ...(website !== undefined && { website }),
      ...(newSlug !== undefined && newSlug !== slug && { slug: newSlug }),
    },
  });

  return NextResponse.json({ slug: updatedBusiness.slug });
}