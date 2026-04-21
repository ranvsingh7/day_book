import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";

import { requireAdmin } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { transactionUpdateSchema } from "@/lib/validators";
import { TransactionModel } from "@/models/Transaction";

export async function PUT(
  request: Request,
  context: RouteContext<"/api/transactions/[id]">
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
  const body = await request.json();
  const parsed = transactionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transaction data" }, { status: 400 });
  }

  const update: Record<string, unknown> = { ...parsed.data };
  if (update.date instanceof Date) {
    update.date = parsed.data.date;
  }

  if (parsed.data.splitPayment === null) {
    delete update.splitPayment;

    const transaction = await TransactionModel.findOneAndUpdate(
      { _id: id },
      {
        $set: update,
        $unset: { splitPayment: "" },
      },
      { new: true }
    );

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ transaction });
  }

  const transaction = await TransactionModel.findOneAndUpdate(
    { _id: id },
    update,
    { new: true }
  );

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({ transaction });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/transactions/[id]">
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

  const deleted = await TransactionModel.findOneAndDelete({
    _id: id,
  });

  if (!deleted) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
