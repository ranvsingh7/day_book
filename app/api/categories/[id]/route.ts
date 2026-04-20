import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { requireAdmin } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { CategoryModel } from "@/models/Category";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/categories/[id]">
) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  await connectToDatabase();
  const deleted = await CategoryModel.findOneAndDelete({
    _id: id,
  });

  if (!deleted) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
