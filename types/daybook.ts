export type TransactionType = "income" | "expense";

export type Transaction = {
  _id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description?: string;
  date: string;
};

export type Category = {
  _id: string;
  name: string;
};

export type DashboardResponse = {
  totals: {
    today: { income: number; expense: number };
    month: { income: number; expense: number };
    currentBalance: number;
    dailyClosingBalance: number;
  };
  monthlyBars: Array<{ date: string; income: number; expense: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
  dailyTrend: Array<{ date: string; income: number; expense: number }>;
  recent: Transaction[];
};
