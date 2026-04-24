import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuth } from "@/lib/api";
import { contactCreateSchema } from "@/lib/validators";
import { connectToDatabase } from "@/lib/db";
import { ContactCategoryModel } from "@/models/ContactCategory";
import { ContactModel } from "@/models/Contact";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const userId = new Types.ObjectId(auth.session.userId);
  const contacts = await ContactModel.find({ userId })
    .sort({ createdAt: -1 })
    .populate({ path: "categoryId", select: "name" })
    .lean();

  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const body = await request.json();
  const parsed = contactCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact data" }, { status: 400 });
  }

  const userId = new Types.ObjectId(auth.session.userId);

  const category = await ContactCategoryModel.findOne({
    _id: parsed.data.categoryId,
    userId,
  });

  if (!category) {
    return NextResponse.json({ error: "Invalid contact category" }, { status: 400 });
  }

  const contact = await ContactModel.create({
    ...parsed.data,
    userId,
  });

  return NextResponse.json({ contact }, { status: 201 });
}
