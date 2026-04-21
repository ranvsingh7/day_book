"use client";

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

const PIE_COLORS = ["#4F46E5", "#22C55E", "#F97316", "#EC4899", "#06B6D4", "#EF4444"];

type MonthlyBarsPoint = {
  date: string;
  income: number;
  expense: number;
};

type CategoryBreakdownPoint = {
  name: string;
  value: number;
};

type DailyTrendPoint = {
  date: string;
  income: number;
  expense: number;
};

export function MonthlyBarsChart({ data }: { data: MonthlyBarsPoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#22C55E" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ExpenseBreakdownChart({ data }: { data: CategoryBreakdownPoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={95}
            paddingAngle={2}
            label
          >
            {data.map((item, index) => (
              <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DailyTrendChart({ data }: { data: DailyTrendPoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} />
          <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
