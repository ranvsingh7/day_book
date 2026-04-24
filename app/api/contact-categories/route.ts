import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuth } from "@/lib/api";
import { contactCategorySchema } from "@/lib/validators";
import { connectToDatabase } from "@/lib/db";
import { ContactCategoryModel } from "@/models/ContactCategory";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const categories = await ContactCategoryModel.find({
    userId: new Types.ObjectId(auth.session.userId),
  })
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const body = await request.json();
  const parsed = contactCategorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const userId = new Types.ObjectId(auth.session.userId);

  const exists = await ContactCategoryModel.findOne({
    userId,
    name: parsed.data.name,
  });

  if (exists) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 });
  }

  const category = await ContactCategoryModel.create({
    name: parsed.data.name,
    userId,
  });

  return NextResponse.json({ category }, { status: 201 });
}
