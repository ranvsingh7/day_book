import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api";
import { endOfMonth, startOfMonth, toDateString } from "@/lib/date";
import { connectToDatabase } from "@/lib/db";
import { TransactionModel } from "@/models/Transaction";

type TransactionLite = {
  amount: number;
  type: "income" | "expense";
  date: Date;
};

export async function GET(request: Request) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const params = new URL(request.url).searchParams;
  const year = Number(params.get("year")) || new Date().getFullYear();
  const monthIndex = Number(params.get("month")) || new Date().getMonth();

  const monthStart = startOfMonth(new Date(year, monthIndex, 1));
  const monthEnd = endOfMonth(monthStart);

  const rows = (await TransactionModel.find({
    date: { $gte: monthStart, $lte: monthEnd },
  })
    .select("amount type date")
    .sort({ date: 1 })
    .lean()) as unknown as TransactionLite[];

  let totalIncome = 0;
  let totalExpense = 0;

  const dailyMap = new Map<string, { date: string; income: number; expense: number }>();

  for (const row of rows) {
    if (row.type === "income") {
      totalIncome += row.amount;
    } else {
      totalExpense += row.amount;
    }

    const key = toDateString(new Date(row.date));
    const existing = dailyMap.get(key) ?? { date: key, income: 0, expense: 0 };
    if (row.type === "income") {
      existing.income += row.amount;
    } else {
      existing.expense += row.amount;
    }
    dailyMap.set(key, existing);
  }

  return NextResponse.json({
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    chartData: Array.from(dailyMap.values()),
  });
}
