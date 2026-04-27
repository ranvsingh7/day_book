import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireAuth } from "@/lib/api";
import { endOfDay, startOfDay, startOfMonth } from "@/lib/date";
import { connectToDatabase } from "@/lib/db";
import { TransactionModel } from "@/models/Transaction";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) {
    return auth.error;
  }

  await connectToDatabase();

  const userId = new Types.ObjectId(auth.session.userId);
  const matchBase = auth.session.role === "admin" ? {} : { userId };

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const sevenDaysStart = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const addSplitFields = {
    $addFields: {
      cashAmount: {
        $cond: [
          { $ifNull: ["$splitPayment.cashAmount", false] },
          "$splitPayment.cashAmount",
          { $cond: [{ $eq: ["$paymentMode", "online"] }, 0, "$amount"] },
        ],
      },
      onlineAmount: {
        $cond: [
          { $ifNull: ["$splitPayment.onlineAmount", false] },
          "$splitPayment.onlineAmount",
          { $cond: [{ $eq: ["$paymentMode", "online"] }, "$amount", 0] },
        ],
      },
    },
  };

  const [
    totalAgg,
    todayAgg,
    monthAgg,
    monthlyBarsAgg,
    categoryBreakdownAgg,
    dailyTrendAgg,
    recentRaw,
  ] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { ...matchBase } },
      addSplitFields,
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          ownerTakenTotal: {
            $sum: { $cond: [{ $eq: ["$type", "owner"] }, "$amount", 0] },
          },
          cashDelta: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", "income"] }, then: "$cashAmount" },
                  {
                    case: { $in: ["$type", ["expense", "owner"]] },
                    then: { $multiply: ["$cashAmount", -1] },
                  },
                ],
                default: 0,
              },
            },
          },
          onlineDelta: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", "income"] }, then: "$onlineAmount" },
                  {
                    case: { $in: ["$type", ["expense", "owner"]] },
                    then: { $multiply: ["$onlineAmount", -1] },
                  },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ]),
    TransactionModel.aggregate([
      { $match: { ...matchBase, date: { $gte: todayStart, $lte: todayEnd } } },
      addSplitFields,
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          ownerTakenToday: {
            $sum: { $cond: [{ $eq: ["$type", "owner"] }, "$amount", 0] },
          },
          incomeCash: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$cashAmount", 0] },
          },
          incomeOnline: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$onlineAmount", 0] },
          },
          expenseCash: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$cashAmount", 0] },
          },
          expenseOnline: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$onlineAmount", 0] },
          },
        },
      },
    ]),
    TransactionModel.aggregate([
      { $match: { ...matchBase, date: { $gte: monthStart, $lte: todayEnd } } },
      addSplitFields,
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          ownerTakenMonth: {
            $sum: { $cond: [{ $eq: ["$type", "owner"] }, "$amount", 0] },
          },
          incomeCash: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$cashAmount", 0] },
          },
          incomeOnline: {
            $sum: { $cond: [{ $eq: ["$type", "income"] }, "$onlineAmount", 0] },
          },
          expenseCash: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$cashAmount", 0] },
          },
          expenseOnline: {
            $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$onlineAmount", 0] },
          },
          totalCash: { $sum: "$cashAmount" },
          totalOnline: { $sum: "$onlineAmount" },
        },
      },
    ]),
    TransactionModel.aggregate([
      { $match: { ...matchBase, date: { $gte: monthStart, $lte: todayEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%m-%d", date: "$date" } },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        },
      },
      { $project: { _id: 0, date: "$_id", income: 1, expense: 1 } },
      { $sort: { date: 1 } },
    ]),
    TransactionModel.aggregate([
      {
        $match: {
          ...matchBase,
          date: { $gte: monthStart, $lte: todayEnd },
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          value: { $sum: "$amount" },
        },
      },
      { $project: { _id: 0, name: "$_id", value: 1 } },
    ]),
    TransactionModel.aggregate([
      { $match: { ...matchBase, date: { $gte: sevenDaysStart, $lte: todayEnd } } },
      {
        $group: {
          _id: { $dateToString: { format: "%m-%d", date: "$date" } },
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
        },
      },
      { $project: { _id: 0, date: "$_id", income: 1, expense: 1 } },
      { $sort: { date: 1 } },
    ]),
    TransactionModel.find({ ...matchBase })
      .sort({ date: -1, createdAt: -1 })
      .limit(10)
      .populate({ path: "userId", select: "name" })
      .lean(),
  ]);

  const totalRow = totalAgg[0] ?? {
    income: 0,
    expense: 0,
    ownerTakenTotal: 0,
    cashDelta: 0,
    onlineDelta: 0,
  };
  const todayRow = todayAgg[0] ?? {
    income: 0,
    expense: 0,
    ownerTakenToday: 0,
    incomeCash: 0,
    incomeOnline: 0,
    expenseCash: 0,
    expenseOnline: 0,
  };
  const monthRow = monthAgg[0] ?? {
    income: 0,
    expense: 0,
    ownerTakenMonth: 0,
    incomeCash: 0,
    incomeOnline: 0,
    expenseCash: 0,
    expenseOnline: 0,
    totalCash: 0,
    totalOnline: 0,
  };

  const total = { income: totalRow.income, expense: totalRow.expense };
  const today = { income: todayRow.income, expense: todayRow.expense };
  const month = { income: monthRow.income, expense: monthRow.expense };
  const ownerTakenToday = todayRow.ownerTakenToday;
  const ownerTakenMonth = monthRow.ownerTakenMonth;
  const ownerTakenTotal = totalRow.ownerTakenTotal;
  const todayIncomeByPaymentMode = {
    cash: todayRow.incomeCash,
    online: todayRow.incomeOnline,
  };
  const todayExpenseByPaymentMode = {
    cash: todayRow.expenseCash,
    online: todayRow.expenseOnline,
  };
  const monthIncomeByPaymentMode = {
    cash: monthRow.incomeCash,
    online: monthRow.incomeOnline,
  };
  const monthExpenseByPaymentMode = {
    cash: monthRow.expenseCash,
    online: monthRow.expenseOnline,
  };
  const monthByPaymentMode = {
    cash: monthRow.totalCash,
    online: monthRow.totalOnline,
  };

  const currentBalance = total.income - total.expense - ownerTakenTotal;
  const currentBalanceByPaymentMode = {
    cash: totalRow.cashDelta,
    online: totalRow.onlineDelta,
  };
  const dailyClosingBalance = currentBalance;
  const dailyClosingBalanceByPaymentMode = currentBalanceByPaymentMode;

  const dailyTrendMap = new Map<string, { date: string; income: number; expense: number }>();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(sevenDaysStart.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(5, 10);
    dailyTrendMap.set(key, { date: key, income: 0, expense: 0 });
  }

  for (const row of dailyTrendAgg) {
    const existing = dailyTrendMap.get(row.date);
    if (existing) {
      existing.income = row.income;
      existing.expense = row.expense;
    }
  }

  const recent = recentRaw.map((transaction) => {
    const user = transaction.userId as { name?: string } | null | undefined;

    return {
      ...transaction,
      createdBy: user?.name ?? "Unknown",
    };
  });

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
      ownerTaken: {
        today: ownerTakenToday,
        month: ownerTakenMonth,
        total: ownerTakenTotal,
      },
    },
    monthlyBars: monthlyBarsAgg,
    categoryBreakdown: categoryBreakdownAgg,
    dailyTrend: Array.from(dailyTrendMap.values()),
    recent,
  });
}
