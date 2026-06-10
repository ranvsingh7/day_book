import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";

import { requireAdmin } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { electricityReadingCreateSchema } from "@/lib/validators";
import { ElectricityMeterModel } from "@/models/ElectricityMeter";
import { ElectricityReadingModel } from "@/models/ElectricityReading";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/electricity-meters/[id]/readings/[readingId]">
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  const { id, readingId } = await context.params;
  if (!isValidObjectId(id) || !isValidObjectId(readingId)) {
    return NextResponse.json({ error: "Invalid reading ID" }, { status: 400 });
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

  const conflict = await ElectricityReadingModel.findOne({
    meterId: meter._id,
    readingMonth: parsed.data.readingMonth,
    _id: { $ne: readingId },
  }).lean();

  if (conflict) {
    return NextResponse.json(
      { error: "Reading already exists for this month" },
      { status: 409 }
    );
  }

  const reading = await ElectricityReadingModel.findOneAndUpdate(
    { _id: readingId, meterId: meter._id, userId },
    parsed.data,
    { new: true }
  );

  if (!reading) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  return NextResponse.json({
    reading: {
      ...reading.toObject(),
      _id: String(reading._id),
      meterId: String(reading.meterId),
      userId: String(reading.userId),
    },
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/electricity-meters/[id]/readings/[readingId]">
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  const { id, readingId } = await context.params;
  if (!isValidObjectId(id) || !isValidObjectId(readingId)) {
    return NextResponse.json({ error: "Invalid reading ID" }, { status: 400 });
  }

  await connectToDatabase();

  const userId = new Types.ObjectId(auth.session.userId);
  const deleted = await ElectricityReadingModel.findOneAndDelete({
    _id: readingId,
    meterId: id,
    userId,
  });

  if (!deleted) {
    return NextResponse.json({ error: "Reading not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
