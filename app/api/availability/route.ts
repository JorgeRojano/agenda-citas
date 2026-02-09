import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/avaibility";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!date || !serviceId) {
    return NextResponse.json(
      { error: "Missing params" },
      { status: 400 }
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    return NextResponse.json(
      { error: "Service not found" },
      { status: 404 }
    );
  }

  const slots = await getAvailableSlots(
    new Date(date),
    service.duration
  );

  return NextResponse.json(slots);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, startTime, endTime } = body;

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: date, startTime, endTime" },
        { status: 400 }
      );
    }

    // Parse date and times
    const [year, month, day] = date.split("-").map(Number);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const start = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    const end = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

    if (start >= end) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // Create blocked time
    const blockedTime = await prisma.blockedTime.create({
      data: {
        start,
        end,
      },
    });

    return NextResponse.json(blockedTime, { status: 201 });
  } catch (error) {
    console.error("Error blocking time:", error);
    return NextResponse.json(
      { error: "Failed to block time" },
      { status: 500 }
    );
  }
}
