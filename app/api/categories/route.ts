import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAdmin, requireAuth } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { categorySchema } from "@/lib/validators";
import { CategoryModel } from "@/models/Category";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const categories = await CategoryModel.find({})
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const body = await request.json();
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const exists = await CategoryModel.findOne({
    name: parsed.data.name,
  });

  if (exists) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 });
  }

  const category = await CategoryModel.create({
    name: parsed.data.name,
    userId: new Types.ObjectId(auth.session.userId),
  });

  return NextResponse.json({ category }, { status: 201 });
}
