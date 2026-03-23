import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

type Params = { slug: string };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, isResource: true, specialty: true, email: true },
  });

  return NextResponse.json(profile);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isResource, name, specialty, email } = await req.json();

  const updated = await prisma.profile.update({
    where: { id: user.id },
    data: {
      ...(isResource !== undefined && { isResource }),
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(specialty !== undefined && { specialty }),
    },
  });

  return NextResponse.json(updated);
}