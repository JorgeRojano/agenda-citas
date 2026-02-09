import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  id: string;
};

export async function DELETE(
  _req: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing blockedTime id" },
        { status: 400 }
      );
    }

    const exists = await prisma.blockedTime.findUnique({
      where: { id },
    });

    if (!exists) {
      return NextResponse.json(
        { error: "Blocked time not found" },
        { status: 404 }
      );
    }

    await prisma.blockedTime.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE blockedTime error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
