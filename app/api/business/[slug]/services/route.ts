import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  slug: string;
};

export async function GET(
  req: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { slug } = await context.params;
    // 1️⃣ Find business by slug
    const business = await prisma.business.findUnique({
      where: { slug },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Get services only for this business
    const services = await prisma.service.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: { duration: "asc" },
    });

    return NextResponse.json(services);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
