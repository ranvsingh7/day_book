export type TransactionType = "income" | "expense" | "owner";
export type PaymentMode = "cash" | "online";

export type Transaction = {
  _id: string;
  type: TransactionType;
  amount: number;
  paymentMode: PaymentMode;
  splitPayment?: {
    cashAmount: number;
    onlineAmount: number;
  };
  category: string;
  description?: string;
  date: string;
  createdAt?: string;
  createdBy?: string;
};

export type Category = {
  _id: string;
  name: string;
};

export type ContactCategory = {
  _id: string;
  name: string;
};

export type Contact = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  notes?: string;
  categoryId:
    | string
    | {
        _id: string;
        name: string;
      };
  createdAt?: string;
};

export type CustomerQuery = {
  _id: string;
  customerName: string;
  mobile: string;
  queryText: string;
  status: "open" | "in-progress" | "resolved";
  followUpNote?: string;
  followUpDate?: string;
  lastFollowedUpAt?: string;
  createdAt?: string;
};

export type DashboardResponse = {
  totals: {
    today: { income: number; expense: number };
    todayIncomeByPaymentMode: { cash: number; online: number };
    todayExpenseByPaymentMode: { cash: number; online: number };
    month: { income: number; expense: number };
    monthIncomeByPaymentMode: { cash: number; online: number };
    monthExpenseByPaymentMode: { cash: number; online: number };
    monthByPaymentMode: { cash: number; online: number };
    currentBalance: number;
    currentBalanceByPaymentMode: { cash: number; online: number };
    dailyClosingBalance: number;
    dailyClosingBalanceByPaymentMode: { cash: number; online: number };
    ownerTaken: {
      today: number;
      month: number;
      total: number;
    };
  };
  monthlyBars: Array<{ date: string; income: number; expense: number }>;
  categoryBreakdown: Array<{ name: string; value: number }>;
  dailyTrend: Array<{ date: string; income: number; expense: number }>;
  recent: Transaction[];
};
