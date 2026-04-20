"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard-header";
import { TablePagination } from "@/components/table-pagination";
import { ChartCard, SkeletonBlock, SummaryCard } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DashboardResponse } from "@/types/daybook";

const PIE_COLORS = ["#4F46E5", "#22C55E", "#F97316", "#EC4899", "#06B6D4", "#EF4444"];

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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Income today"
          value={loading ? "..." : formatCurrency(data?.totals.today.income ?? 0)}
          tone="income"
          icon={<ArrowUpRight className="text-emerald-600" size={18} />}
        />
        <SummaryCard
          label="Expense today"
          value={loading ? "..." : formatCurrency(data?.totals.today.expense ?? 0)}
          tone="expense"
          icon={<ArrowDownRight className="text-rose-600" size={18} />}
        />
        <SummaryCard
          label="Current balance"
          value={loading ? "..." : formatCurrency(data?.totals.currentBalance ?? 0)}
        />
        <SummaryCard
          label="Income this month"
          value={loading ? "..." : formatCurrency(data?.totals.month.income ?? 0)}
          tone="income"
          icon={<ArrowUpRight className="text-emerald-600" size={18} />}
        />
        <SummaryCard
          label="Expense this month"
          value={loading ? "..." : formatCurrency(data?.totals.month.expense ?? 0)}
          tone="expense"
          icon={<ArrowDownRight className="text-rose-600" size={18} />}
        />
        <SummaryCard
          label="Daily closing balance"
          value={loading ? "..." : formatCurrency(data?.totals.dailyClosingBalance ?? 0)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Monthly Income vs Expense"
          description="Daily aggregation for the current month"
        >
          {loading ? (
            <SkeletonBlock className="h-72 w-full" />
          ) : data && data.monthlyBars.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyBars}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#22C55E" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={95}
                    paddingAngle={2}
                    label
                  >
                    {data.categoryBreakdown.map((item, index) => (
                      <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message="No expense data available." />
          )}
        </ChartCard>
      </section>

      <ChartCard title="Daily Trend" description="Income and expense trend for last 7 days">
        {loading ? (
          <SkeletonBlock className="h-72 w-full" />
        ) : data && data.dailyTrend.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyTrend}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="No trend data for the past week." />
        )}
      </ChartCard>

      <section className="card-soft rounded-2xl p-5">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Type</th>
                <th className="py-2">Category</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecent.map((entry) => (
                <tr key={entry._id} className="border-t border-slate-200">
                  <td className="py-2">{formatDate(entry.date)}</td>
                  <td className="py-2 capitalize">{entry.type}</td>
                  <td className="py-2">{entry.category}</td>
                  <td className="py-2">{formatCurrency(entry.amount)}</td>
                  <td className="py-2 text-slate-500">{entry.description || "-"}</td>
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
