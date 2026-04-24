import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuth } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { customerQueryCreateSchema } from "@/lib/validators";
import { CustomerQueryModel } from "@/models/CustomerQuery";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const queries = await CustomerQueryModel.find({
    userId: new Types.ObjectId(auth.session.userId),
  })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ queries });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const body = await request.json();
  const parsed = customerQueryCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid customer query data" }, { status: 400 });
  }

  const query = await CustomerQueryModel.create({
    ...parsed.data,
    userId: new Types.ObjectId(auth.session.userId),
  });

  return NextResponse.json({ query }, { status: 201 });
}
