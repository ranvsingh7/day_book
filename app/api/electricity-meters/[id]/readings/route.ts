import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";

import { requireAdmin, requireAuth } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { electricityReadingCreateSchema } from "@/lib/validators";
import { ElectricityMeterModel } from "@/models/ElectricityMeter";
import { ElectricityReadingModel } from "@/models/ElectricityReading";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/electricity-meters/[id]/readings">
) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid meter ID" }, { status: 400 });
  }

  await connectToDatabase();

  const userId = new Types.ObjectId(auth.session.userId);
  const meter = await ElectricityMeterModel.findOne({ _id: id, userId }).lean();

  if (!meter) {
    return NextResponse.json({ error: "Meter not found" }, { status: 404 });
  }

  const readings = await ElectricityReadingModel.find({
    meterId: meter._id,
    userId,
  })
    .sort({ readingMonth: -1, createdAt: -1 })
    .lean();

  const payload = readings.map((reading) => ({
    ...reading,
    _id: String(reading._id),
    meterId: String(reading.meterId),
    userId: String(reading.userId),
  }));

  return NextResponse.json({ readings: payload });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/electricity-meters/[id]/readings">
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid meter ID" }, { status: 400 });
  }

  await connectToDatabase();

  const body = await request.json();
  const parsed = electricityReadingCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reading data" }, { status: 400 });
  }

  const userId = new Types.ObjectId(auth.session.userId);
  const meter = await ElectricityMeterModel.findOne({ _id: id, userId }).lean();

  if (!meter) {
    return NextResponse.json({ error: "Meter not found" }, { status: 404 });
  }

  const existing = await ElectricityReadingModel.findOne({
    meterId: meter._id,
    readingMonth: parsed.data.readingMonth,
  }).lean();

  if (existing) {
    return NextResponse.json(
      { error: "Reading already exists for this month" },
      { status: 409 }
    );
  }

  const latest = await ElectricityReadingModel.findOne({ meterId: meter._id })
    .sort({ readingMonth: -1, createdAt: -1 })
    .lean();

  if (latest) {
    if (parsed.data.readingMonth < latest.readingMonth) {
      return NextResponse.json(
        { error: "Reading month must be after the latest entry" },
        { status: 400 }
      );
    }

    if (parsed.data.reading < latest.reading) {
      return NextResponse.json(
        { error: "Reading must be greater than or equal to latest reading" },
        { status: 400 }
      );
    }
  }

  const reading = await ElectricityReadingModel.create({
    meterId: meter._id,
    readingMonth: parsed.data.readingMonth,
    reading: parsed.data.reading,
    userId,
  });

  return NextResponse.json(
    {
      reading: {
        ...reading.toObject(),
        _id: String(reading._id),
        meterId: String(reading.meterId),
        userId: String(reading.userId),
      },
    },
    { status: 201 }
  );
}
