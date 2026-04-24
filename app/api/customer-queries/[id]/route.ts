import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";

import { requireAuth } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { customerQueryFollowupSchema } from "@/lib/validators";
import { CustomerQueryModel } from "@/models/CustomerQuery";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/customer-queries/[id]">
) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await connectToDatabase();

  const body = await request.json();
  const parsed = customerQueryFollowupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid follow-up data" }, { status: 400 });
  }

  const update: Record<string, unknown> = {
    status: parsed.data.status,
    followUpNote: parsed.data.followUpNote,
    lastFollowedUpAt: new Date(),
  };

  if (parsed.data.followUpDate) {
    update.followUpDate = parsed.data.followUpDate;
  }

  const query = await CustomerQueryModel.findOneAndUpdate(
    {
      _id: id,
      userId: new Types.ObjectId(auth.session.userId),
    },
    {
      $set: update,
      ...(parsed.data.followUpDate ? {} : { $unset: { followUpDate: "" } }),
    },
    { new: true }
  );

  if (!query) {
    return NextResponse.json({ error: "Customer query not found" }, { status: 404 });
  }

  return NextResponse.json({ query });
}
