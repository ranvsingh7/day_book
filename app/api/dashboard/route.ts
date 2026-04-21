import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/api";
import { endOfDay, startOfDay, startOfMonth } from "@/lib/date";
import { connectToDatabase } from "@/lib/db";
import { TransactionModel } from "@/models/Transaction";

type TxRow = {
  type: "income" | "expense";
  amount: number;
  paymentMode?: "cash" | "online";
  date: Date;
  category?: string;
};

function summarize(transactions: Array<{ type: "income" | "expense"; amount: number }>) {
  return transactions.reduce(
    (acc, item) => {
      if (item.type === "income") {
        acc.income += item.amount;
      } else {
        acc.expense += item.amount;
      }
      return acc;
    },
    { income: 0, expense: 0 }
  );
}

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const sevenDaysStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [allTxRaw, todayTxRaw, monthTxRaw, last7TxRaw, recent] = await Promise.all([
    TransactionModel.find({}).select("type amount paymentMode date").lean(),
    TransactionModel.find({
      date: { $gte: todayStart, $lte: todayEnd },
    })
      .select("type amount paymentMode")
      .lean(),
    TransactionModel.find({
      date: { $gte: monthStart, $lte: todayEnd },
    })
      .select("type amount paymentMode date category")
      .lean(),
    TransactionModel.find({
      date: { $gte: sevenDaysStart, $lte: todayEnd },
    })
      .select("type amount date")
      .lean(),
    TransactionModel.find({}).sort({ date: -1, createdAt: -1 }).limit(10).lean(),
  ]);

  const allTx = allTxRaw as unknown as TxRow[];
  const todayTx = todayTxRaw as unknown as TxRow[];
  const monthTx = monthTxRaw as unknown as TxRow[];
  const last7Tx = last7TxRaw as unknown as TxRow[];

  const total = summarize(allTx);
  const today = summarize(todayTx);
  const todayIncomeByPaymentMode = todayTx.reduce(
    (acc, item) => {
      if (item.type !== "income") {
        return acc;
      }

      if (item.paymentMode === "online") {
        acc.online += item.amount;
      } else {
        acc.cash += item.amount;
      }

      return acc;
    },
    { cash: 0, online: 0 }
  );
  const todayExpenseByPaymentMode = todayTx.reduce(
    (acc, item) => {
      if (item.type !== "expense") {
        return acc;
      }

      if (item.paymentMode === "online") {
        acc.online += item.amount;
      } else {
        acc.cash += item.amount;
      }

      return acc;
    },
    { cash: 0, online: 0 }
  );
  const month = summarize(monthTx);
  const monthIncomeByPaymentMode = monthTx.reduce(
    (acc, item) => {
      if (item.type !== "income") {
        return acc;
      }

      if (item.paymentMode === "online") {
        acc.online += item.amount;
      } else {
        acc.cash += item.amount;
      }

      return acc;
    },
    { cash: 0, online: 0 }
  );
  const monthExpenseByPaymentMode = monthTx.reduce(
    (acc, item) => {
      if (item.type !== "expense") {
        return acc;
      }

      if (item.paymentMode === "online") {
        acc.online += item.amount;
      } else {
        acc.cash += item.amount;
      }

      return acc;
    },
    { cash: 0, online: 0 }
  );
  const monthByPaymentMode = monthTx.reduce(
    (acc, item) => {
      if (item.paymentMode === "online") {
        acc.online += item.amount;
      } else {
        acc.cash += item.amount;
      }
      return acc;
    },
    { cash: 0, online: 0 }
  );

  const currentBalance = total.income - total.expense;
  const currentBalanceByPaymentMode = allTx.reduce(
    (acc, tx) => {
      const key = tx.paymentMode === "online" ? "online" : "cash";
      if (tx.type === "income") {
        acc[key] += tx.amount;
      } else {
        acc[key] -= tx.amount;
      }
      return acc;
    },
    { cash: 0, online: 0 }
  );
  const dailyClosingBalance = allTx.reduce((acc, tx) => {
    return tx.type === "income" ? acc + tx.amount : acc - tx.amount;
  }, 0);
  const dailyClosingBalanceByPaymentMode = currentBalanceByPaymentMode;

  const monthlyBarsMap = new Map<string, { date: string; income: number; expense: number }>();
  for (const tx of monthTx) {
    const key = new Date(tx.date).toISOString().slice(5, 10);
    const existing = monthlyBarsMap.get(key) ?? { date: key, income: 0, expense: 0 };

    if (tx.type === "income") {
      existing.income += tx.amount;
    } else {
      existing.expense += tx.amount;
    }

    monthlyBarsMap.set(key, existing);
  }

  const categoryExpenseMap = new Map<string, number>();
  for (const tx of monthTx) {
    if (tx.type !== "expense") {
      continue;
    }

    const key = tx.category || "Other";
    categoryExpenseMap.set(key, (categoryExpenseMap.get(key) ?? 0) + tx.amount);
  }

  const dailyTrendMap = new Map<string, { date: string; income: number; expense: number }>();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(sevenDaysStart.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(5, 10);
    dailyTrendMap.set(key, { date: key, income: 0, expense: 0 });
  }

  for (const tx of last7Tx) {
    const key = new Date(tx.date).toISOString().slice(5, 10);
    const existing = dailyTrendMap.get(key);
    if (!existing) {
      continue;
    }

    if (tx.type === "income") {
      existing.income += tx.amount;
    } else {
      existing.expense += tx.amount;
    }
  }

  return NextResponse.json({
    totals: {
      today,
      todayIncomeByPaymentMode,
      todayExpenseByPaymentMode,
      month,
      monthIncomeByPaymentMode,
      monthExpenseByPaymentMode,
      monthByPaymentMode,
      currentBalance,
      currentBalanceByPaymentMode,
      dailyClosingBalance,
      dailyClosingBalanceByPaymentMode,
    },
    monthlyBars: Array.from(monthlyBarsMap.values()),
    categoryBreakdown: Array.from(categoryExpenseMap.entries()).map(([name, value]) => ({
      name,
      value,
    })),
    dailyTrend: Array.from(dailyTrendMap.values()),
    recent,
  });
}
