"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Info, Wallet } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard-header";
import { TablePagination } from "@/components/table-pagination";
import { ChartCard, SkeletonBlock } from "@/components/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { DashboardResponse } from "@/types/daybook";

const MonthlyBarsChart = dynamic(
  () => import("../../../components/dashboard-charts").then((mod) => mod.MonthlyBarsChart),
  {
    loading: () => <SkeletonBlock className="h-72 w-full" />,
  }
);

const ExpenseBreakdownChart = dynamic(
  () =>
    import("../../../components/dashboard-charts").then((mod) => mod.ExpenseBreakdownChart),
  {
    loading: () => <SkeletonBlock className="h-72 w-full" />,
  }
);

const DailyTrendChart = dynamic(
  () => import("../../../components/dashboard-charts").then((mod) => mod.DailyTrendChart),
  {
    loading: () => <SkeletonBlock className="h-72 w-full" />,
  }
);

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function DashboardPage() {
  const PAGE_SIZE = 5;
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [splitInfoFor, setSplitInfoFor] = useState<string | null>(null);

  const recentTransactions = data?.recent ?? [];
  const totalPages = Math.max(1, Math.ceil(recentTransactions.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedRecent = recentTransactions.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        if (!response.ok) {
          setData(null);
          return;
        }
        const payload = (await response.json()) as DashboardResponse;
        setData(payload);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (!loading && !data) {
    return <p className="text-sm text-rose-600">Unable to load dashboard.</p>;
  }

  return (
    <main className="space-y-6">
      <DashboardHeader
        title="Financial Dashboard"
        subtitle="Track your daily and monthly performance with clean visual analytics"
      />

      <section className="card-soft rounded-2xl p-4 sm:p-5">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <ArrowUpRight size={14} className="text-emerald-600" />
              Income today
            </p>
            <p className="mt-1 text-base font-semibold text-emerald-600">
              {loading ? "..." : formatCurrency(data?.totals.today.income ?? 0)}
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
              {loading
                ? "C: ... | O: ..."
                : `C: ${formatCurrency(data?.totals.todayIncomeByPaymentMode.cash ?? 0)} | O: ${formatCurrency(
                    data?.totals.todayIncomeByPaymentMode.online ?? 0
                  )}`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <ArrowDownRight size={14} className="text-rose-600" />
              Expense today
            </p>
            <p className="mt-1 text-base font-semibold text-rose-600">
              {loading ? "..." : formatCurrency(data?.totals.today.expense ?? 0)}
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
              {loading
                ? "C: ... | O: ..."
                : `C: ${formatCurrency(data?.totals.todayExpenseByPaymentMode.cash ?? 0)} | O: ${formatCurrency(
                    data?.totals.todayExpenseByPaymentMode.online ?? 0
                  )}`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Wallet size={14} className="text-slate-600" />
              Current balance
            </p>
            <p
              className={`mt-1 text-base font-semibold ${
                (data?.totals.currentBalance ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {loading ? "..." : formatCurrency(data?.totals.currentBalance ?? 0)}
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
              {loading
                ? "C: ... | O: ..."
                : `C: ${formatCurrency(data?.totals.currentBalanceByPaymentMode.cash ?? 0)} | O: ${formatCurrency(
                    data?.totals.currentBalanceByPaymentMode.online ?? 0
                  )}`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <ArrowUpRight size={14} className="text-emerald-600" />
              Income this month
            </p>
            <p className="mt-1 text-base font-semibold text-emerald-600">
              {loading ? "..." : formatCurrency(data?.totals.month.income ?? 0)}
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
              {loading
                ? "C: ... | O: ..."
                : `C: ${formatCurrency(data?.totals.monthIncomeByPaymentMode.cash ?? 0)} | O: ${formatCurrency(
                    data?.totals.monthIncomeByPaymentMode.online ?? 0
                  )}`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <ArrowDownRight size={14} className="text-rose-600" />
              Expense this month
            </p>
            <p className="mt-1 text-base font-semibold text-rose-600">
              {loading ? "..." : formatCurrency(data?.totals.month.expense ?? 0)}
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
              {loading
                ? "C: ... | O: ..."
                : `C: ${formatCurrency(data?.totals.monthExpenseByPaymentMode.cash ?? 0)} | O: ${formatCurrency(
                    data?.totals.monthExpenseByPaymentMode.online ?? 0
                  )}`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Wallet size={14} className="text-slate-600" />
              Daily closing balance
            </p>
            <p
              className={`mt-1 text-base font-semibold ${
                (data?.totals.dailyClosingBalance ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {loading ? "..." : formatCurrency(data?.totals.dailyClosingBalance ?? 0)}
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
              {loading
                ? "C: ... | O: ..."
                : `C: ${formatCurrency(data?.totals.dailyClosingBalanceByPaymentMode.cash ?? 0)} | O: ${formatCurrency(
                    data?.totals.dailyClosingBalanceByPaymentMode.online ?? 0
                  )}`}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              <Wallet size={14} className="text-amber-600" />
              Owner taken
            </p>
            <p className="mt-1 text-base font-semibold text-amber-600">
              {loading ? "..." : formatCurrency(data?.totals.ownerTaken.total ?? 0)}
            </p>
            <p className="mt-0.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
              {loading
                ? "Today: ... | Month: ..."
                : `Today: ${formatCurrency(data?.totals.ownerTaken.today ?? 0)} | Month: ${formatCurrency(
                    data?.totals.ownerTaken.month ?? 0
                  )}`}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Monthly Income vs Expense"
          description="Daily aggregation for the current month"
        >
          {loading ? (
            <SkeletonBlock className="h-72 w-full" />
          ) : data && data.monthlyBars.length > 0 ? (
            <MonthlyBarsChart data={data.monthlyBars} />
          ) : (
            <EmptyState message="No monthly transactions yet." />
          )}
        </ChartCard>

        <ChartCard
          title="Expense Breakdown"
          description="Category-wise split for this month"
        >
          {loading ? (
            <SkeletonBlock className="h-72 w-full" />
          ) : data && data.categoryBreakdown.length > 0 ? (
            <ExpenseBreakdownChart data={data.categoryBreakdown} />
          ) : (
            <EmptyState message="No expense data available." />
          )}
        </ChartCard>
      </section>

      <ChartCard title="Daily Trend" description="Income and expense trend for last 7 days">
        {loading ? (
          <SkeletonBlock className="h-72 w-full" />
        ) : data && data.dailyTrend.length > 0 ? (
          <DailyTrendChart data={data.dailyTrend} />
        ) : (
          <EmptyState message="No trend data for the past week." />
        )}
      </ChartCard>

      <section className="card-soft rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Type</th>
                <th className="py-2 text-left">Payment</th>
                <th className="py-2">Category</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Description</th>
                <th className="py-2">Created by</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecent.map((entry) => (
                <tr key={entry._id} className="border-t border-slate-200">
                  <td className="py-2">{formatDate(entry.date)}</td>
                  <td className="py-2 capitalize">{entry.type}</td>
                  <td
                    className="max-w-[220px] py-2 text-left capitalize leading-snug whitespace-normal break-words"
                    title={
                      entry.splitPayment
                        ? `split (C ${formatCurrency(entry.splitPayment.cashAmount)} + O ${formatCurrency(
                            entry.splitPayment.onlineAmount
                          )})`
                        : (entry.paymentMode ?? "cash")
                    }
                  >
                    {entry.splitPayment ? (
                      <div className="relative inline-flex items-center gap-1.5">
                        <p className="font-medium text-slate-700">Split</p>
                        <button
                          type="button"
                          aria-label="Show split payment details"
                          onClick={() =>
                            setSplitInfoFor((current) =>
                              current === entry._id ? null : entry._id
                            )
                          }
                          className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:bg-slate-50"
                        >
                          <Info size={10} />
                        </button>
                        {splitInfoFor === entry._id ? (
                          <div className="absolute left-1/2 top-full z-20 mt-1 w-44 -translate-x-1/2 rounded-md border border-slate-200 bg-white p-2 text-left text-xs normal-case text-slate-600 shadow-md">
                            <p>C:{formatCurrency(entry.splitPayment.cashAmount)}</p>
                            <p>O:{formatCurrency(entry.splitPayment.onlineAmount)}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      entry.paymentMode ?? "cash"
                    )}
                  </td>
                  <td className="py-2">{entry.category}</td>
                  <td className="py-2 whitespace-nowrap">{formatCurrency(entry.amount)}</td>
                  <td className="max-w-[220px] py-2 pr-3 text-slate-500">
                    <p className="truncate" title={entry.description || "-"}>
                      {entry.description || "-"}
                    </p>
                  </td>
                  <td className="py-2">
                    <p className="font-medium text-slate-700">{entry.createdBy || "Unknown"}</p>
                    <p className="whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(entry.createdAt || entry.date)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <TablePagination
            totalItems={recentTransactions.length}
            pageSize={PAGE_SIZE}
            currentPage={safeCurrentPage}
            onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
          />
        </div>
      </section>
    </main>
  );
}
