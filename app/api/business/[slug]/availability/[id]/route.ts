import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = {
  slug: string;
  id: string;
};

export async function DELETE(
  _req: Request,
  context: { params: Promise<Params> }
) {
  try {
    const { slug, id } = await context.params;

    if (!id || !slug) {
      return NextResponse.json(
        { error: "Faltan parámetros obligatorios" },
        { status: 400 }
      );
    }

    const blockedTime = await prisma.blockedTime.findFirst({
      where: {
        id: id,
        business: {
          slug: slug,
        },
      },
    });

    if (!blockedTime) {
      return NextResponse.json(
        { error: "El tiempo bloqueado no existe para este negocio" },
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
      { error: "No se pudo eliminar el bloqueo" },
      { status: 500 }
    );
  }
}