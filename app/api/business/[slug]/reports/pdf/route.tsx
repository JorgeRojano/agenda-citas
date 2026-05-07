import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { fromZonedTime } from "date-fns-tz";
import { AppointmentsReportPDF } from "@/components/pdf/AppointmentsReportPDF";

const TZ = "America/Mexico_City";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);

    const from      = searchParams.get("from");      // YYYY-MM-DD | null
    const to        = searchParams.get("to");        // YYYY-MM-DD | null
    const serviceId = searchParams.get("serviceId"); // uuid | null
    const staffId   = searchParams.get("staffId");   // uuid | null
    const status    = searchParams.get("status");    // AppointmentStatus | null

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });

    // Resolve human-readable filter labels for the PDF header band
    const [serviceRecord, staffRecord] = await Promise.all([
      serviceId
        ? prisma.service.findUnique({ where: { id: serviceId }, select: { name: true } })
        : null,
      staffId
        ? prisma.profile.findUnique({ where: { id: staffId }, select: { name: true } })
        : null,
    ]);

    const fromUTC = from ? fromZonedTime(new Date(`${from}T00:00:00`), TZ) : undefined;
    const toUTC   = to   ? fromZonedTime(new Date(`${to}T23:59:59.999`), TZ) : undefined;

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        ...(fromUTC || toUTC
          ? { startTime: { ...(fromUTC ? { gte: fromUTC } : {}), ...(toUTC ? { lte: toUTC } : {}) } }
          : {}),
        ...(serviceId ? { serviceId } : {}),
        ...(staffId   ? { assignedToId: staffId } : {}),
        ...(status    ? { status: status as any  } : {}),
      },
      include: {
        service:    { select: { name: true, price: true, duration: true } },
        assignedTo: { select: { name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    const buffer = await renderToBuffer(
      <AppointmentsReportPDF
        businessName={business.name}
        from={from ?? "—"}
        to={to ?? "—"}
        serviceName={serviceRecord?.name ?? "Todos los servicios"}
        staffName={staffRecord?.name ?? "Todos los proveedores"}
        appointments={appointments.map((a) => ({
          id:         a.id,
          clientName: a.clientName,
          startTime:  a.startTime.toISOString(),
          status:     a.status,
          service:    { name: a.service.name, price: a.service.price, duration: a.service.duration },
          assignedTo: a.assignedTo?.name ? { name: a.assignedTo.name } : null,
        }))}
      />,
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="appointments-report.pdf"`,
      },
    });
  } catch (error) {
    console.error("[reports/pdf]", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
