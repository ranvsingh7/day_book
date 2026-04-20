import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuth } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import {
  transactionCreateSchema,
  transactionQuerySchema,
} from "@/lib/validators";
import { TransactionModel } from "@/models/Transaction";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const queryParsed = transactionQuerySchema.safeParse({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? "all",
    category: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!queryParsed.success) {
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  const { from, to, type, category, search } = queryParsed.data;

  const where: Record<string, unknown> = {};

  if (type && type !== "all") {
    where.type = type;
  }

  if (category) {
    where.category = category;
  }

  if (from || to) {
    const dateFilter: Record<string, Date> = {};
    if (from) {
      dateFilter.$gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      dateFilter.$lte = toDate;
    }
    where.date = dateFilter;
  }

  if (search) {
    where.$or = [
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  const transactions = await TransactionModel.find(where)
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return NextResponse.json({ transactions });
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const body = await request.json();
  const parsed = transactionCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transaction data" }, { status: 400 });
  }

  const transaction = await TransactionModel.create({
    ...parsed.data,
    userId: new Types.ObjectId(auth.session.userId),
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
