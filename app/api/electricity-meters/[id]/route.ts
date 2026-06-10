import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";

import { requireAdmin } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { electricityMeterCreateSchema } from "@/lib/validators";
import { ElectricityMeterModel } from "@/models/ElectricityMeter";
import { ElectricityReadingModel } from "@/models/ElectricityReading";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/electricity-meters/[id]">
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
  const parsed = electricityMeterCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid meter data" }, { status: 400 });
  }

  const userId = new Types.ObjectId(auth.session.userId);
  const existing = await ElectricityMeterModel.findOne({
    userId,
    meterNumber: parsed.data.meterNumber,
    _id: { $ne: id },
  });

  if (existing) {
    return NextResponse.json({ error: "Meter number already exists" }, { status: 409 });
  }

  const meter = await ElectricityMeterModel.findOneAndUpdate(
    { _id: id, userId },
    parsed.data,
    { new: true }
  );

  if (!meter) {
    return NextResponse.json({ error: "Meter not found" }, { status: 404 });
  }

  return NextResponse.json({
    meter: {
      ...meter.toObject(),
      _id: String(meter._id),
      userId: String(meter.userId),
      startDate: meter.startDate.toISOString(),
    },
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/electricity-meters/[id]">
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

  const userId = new Types.ObjectId(auth.session.userId);
  const meter = await ElectricityMeterModel.findOneAndDelete({
    _id: id,
    userId,
  });

  if (!meter) {
    return NextResponse.json({ error: "Meter not found" }, { status: 404 });
  }

  await ElectricityReadingModel.deleteMany({ meterId: meter._id, userId });

  return NextResponse.json({ ok: true });
}
