"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SummaryCard } from "@/components/ui";
import { SelectField } from "@/components/select-field";
import { formatCurrency } from "@/lib/format";

type SummaryData = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  chartData: Array<{ date: string; income: number; expense: number }>;
};

export default function MonthlySummaryPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [data, setData] = useState<SummaryData | null>(null);

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => {
        const optionYear = currentYear - 5 + index;
        return { value: String(optionYear), label: String(optionYear) };
      }),
    [currentYear]
  );

  const url = useMemo(
    () => `/api/monthly-summary?year=${year}&month=${month}`,
    [month, year]
  );

  useEffect(() => {
    const load = async () => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        setData(null);
        return;
      }
      const payload = (await response.json()) as SummaryData;
      setData(payload);
    };

    void load();
  }, [url]);

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Monthly Summary</h1>
          <p className="text-sm text-slate-500">Track performance with profit/loss and trend lines.</p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[380px] sm:grid-cols-2">
          <div className="sm:min-w-[140px]">
            <SelectField
              label="Year"
              value={String(year)}
              onChange={(value) => setYear(Number(value))}
              options={yearOptions}
            />
          </div>
          <div className="sm:min-w-[220px]">
            <SelectField
              label="Month"
              value={String(month)}
              onChange={(value) => setMonth(Number(value))}
              options={Array.from({ length: 12 }).map((_, index) => ({
                value: String(index),
                label: new Date(2000, index, 1).toLocaleString("en-US", { month: "long" }),
              }))}
            />
          </div>
        </div>
      </header>

      {data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard label="Total Income" value={formatCurrency(data.totalIncome)} tone="income" />
            <SummaryCard label="Total Expense" value={formatCurrency(data.totalExpense)} tone="expense" />
            <SummaryCard label="Net Profit/Loss" value={formatCurrency(data.net)} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Daily Trend</h2>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData}>
                  <CartesianGrid strokeDasharray="4 4" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#059669" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      ) : (
        <p className="text-sm text-slate-500">No summary data available.</p>
      )}
    </main>
  );
}
