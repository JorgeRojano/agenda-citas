import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  id: string;
};

export async function POST(
  _req: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing appointment id" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    await prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 }
    );
  }
}
