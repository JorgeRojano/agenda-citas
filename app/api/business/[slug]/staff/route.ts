import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const staff = await prisma.profile.findMany({
    where: {
      businessId: business.id,
      OR: [
        { role: "STAFF" },
        { role: "ADMIN", isResource: true },
      ],
    },
    select: { id: true, name: true, specialty: true },
  });

  return NextResponse.json(staff);
}