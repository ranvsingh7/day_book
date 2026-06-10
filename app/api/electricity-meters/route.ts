import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin, requireAuth } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { electricityMeterCreateSchema } from "@/lib/validators";
import { ElectricityMeterModel } from "@/models/ElectricityMeter";
import { ElectricityReadingModel } from "@/models/ElectricityReading";

function toMonthString(date: Date) {
  return date.toISOString().slice(0, 7);
}

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const userId = new Types.ObjectId(auth.session.userId);
  const meters = await ElectricityMeterModel.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  const meterIds = meters.map((meter) => meter._id);
  const latestReadings = meterIds.length
    ? await ElectricityReadingModel.aggregate([
        {
          $match: {
            userId,
            meterId: { $in: meterIds },
          },
        },
        { $sort: { readingMonth: -1, createdAt: -1 } },
        {
          $group: {
            _id: "$meterId",
            readingMonth: { $first: "$readingMonth" },
            reading: { $first: "$reading" },
          },
        },
      ])
    : [];

  const latestReadingMap = new Map(
    latestReadings.map((reading) => [String(reading._id), reading])
  );

  const payload = meters.map((meter) => {
    const latestReading = latestReadingMap.get(String(meter._id));

    return {
      ...meter,
      _id: String(meter._id),
      userId: String(meter.userId),
      startDate: meter.startDate.toISOString(),
      latestReading: latestReading
        ? {
            readingMonth: latestReading.readingMonth,
            reading: latestReading.reading,
          }
        : null,
    };
  });

  return NextResponse.json({ meters: payload });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
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
  });

  if (existing) {
    return NextResponse.json({ error: "Meter already exists" }, { status: 409 });
  }

  const meter = await ElectricityMeterModel.create({
    ...parsed.data,
    userId,
  });

  const readingMonth = toMonthString(parsed.data.startDate);
  const initialReading = await ElectricityReadingModel.create({
    meterId: meter._id,
    readingMonth,
    reading: parsed.data.startReading,
    userId,
  });

  return NextResponse.json(
    {
      meter: {
        ...meter.toObject(),
        _id: String(meter._id),
        userId: String(meter.userId),
        startDate: meter.startDate.toISOString(),
      },
      initialReading: {
        ...initialReading.toObject(),
        _id: String(initialReading._id),
        meterId: String(initialReading.meterId),
        userId: String(initialReading.userId),
      },
    },
    { status: 201 }
  );
}
