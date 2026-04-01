import { prisma } from "@/lib/prisma";
import { validateBusinessAccess } from "@/lib/validateBusinessAccess";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

type Params = { params: Promise<{ slug: string }> };

// GET — listar imágenes del negocio
export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const images = await prisma.businessImage.findMany({
    where: { businessId: business.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(images);
}

// POST — subir imagen a Supabase Storage y guardar URL en BD
export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await validateBusinessAccess(business.id);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Subir a Supabase Storage
  const supabase  = await createServerSupabaseClient();
  const ext       = file.name.split(".").pop();
  const fileName  = `${business.id}/${Date.now()}.${ext}`;
  const buffer    = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("business-assets")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from("business-assets")
    .getPublicUrl(fileName);

  // Calcular el orden (al final de la lista)
  const lastImage = await prisma.businessImage.findFirst({
    where: { businessId: business.id },
    orderBy: { order: "desc" },
  });
  const order = (lastImage?.order ?? -1) + 1;

  const image = await prisma.businessImage.create({
    data: { businessId: business.id, url: publicUrl, order },
  });

  return NextResponse.json(image);
}

// DELETE — eliminar imagen de Storage y BD
export async function DELETE(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await validateBusinessAccess(business.id);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const imageId = searchParams.get("id");
  if (!imageId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const image = await prisma.businessImage.findFirst({
    where: { id: imageId, businessId: business.id },
  });
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Eliminar de Supabase Storage
  const supabase  = await createServerSupabaseClient();
  const filePath  = image.url.split("/business-assets/")[1];
  if (filePath) {
    await supabase.storage.from("business-images").remove([filePath]);
  }

  await prisma.businessImage.delete({ where: { id: imageId } });

  return NextResponse.json({ ok: true });
}