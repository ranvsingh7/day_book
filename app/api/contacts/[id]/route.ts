import { NextResponse } from "next/server";
import { isValidObjectId, Types } from "mongoose";

import { requireAuth } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { contactCreateSchema } from "@/lib/validators";
import { ContactCategoryModel } from "@/models/ContactCategory";
import { ContactModel } from "@/models/Contact";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/contacts/[id]">
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

  const contact = await ContactModel.findOneAndUpdate(
    {
      _id: id,
      userId,
    },
    parsed.data,
    { new: true }
  );

  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ contact });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/contacts/[id]">
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

  const deleted = await ContactModel.findOneAndDelete({
    _id: id,
    userId: new Types.ObjectId(auth.session.userId),
  });

  if (!deleted) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
