import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const { slug, id } = await params;
    const { status } = await req.json();

    if (!id || !status || !slug) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Validamos que la cita pertenezca al negocio con ese slug
    // Esto es seguridad básica en multi-tenant
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: id,
        business: {
          slug: slug,
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found in this business" },
        { status: 404 },
      );
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        service: true,
        business: true,
      },
    });

    return NextResponse.json({ ok: true, appointment: updated });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
