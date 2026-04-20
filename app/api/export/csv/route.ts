import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { transactionQuerySchema } from "@/lib/validators";
import { TransactionModel } from "@/models/Transaction";

function escapeCsv(value: string | number) {
  const asString = String(value ?? "");
  if (asString.includes(",") || asString.includes("\"") || asString.includes("\n")) {
    return `"${asString.replaceAll('"', '""')}"`;
  }
  return asString;
}

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

  const rows = await TransactionModel.find(where)
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const csvRows = [
    ["Date", "Type", "Category", "Amount", "Description"],
    ...rows.map((row) => [
      new Date(row.date).toISOString().slice(0, 10),
      row.type,
      row.category,
      row.amount,
      row.description || "",
    ]),
  ];

  const csv = csvRows
    .map((line) => line.map((value) => escapeCsv(value)).join(","))
    .join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=daybook-export-${Date.now()}.csv`,
    },
  });
}
