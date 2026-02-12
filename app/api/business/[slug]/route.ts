import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  slug: string;
};

export async function GET(
  request: Request,
  context: { params: Promise<Params> }
) {
  const { slug } = await context.params;

  if (!slug) {
    return NextResponse.json(
      { error: "Slug is required" },
      { status: 400 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { slug },
    include: { services: true },
  });

  if (!business) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(business);
}
