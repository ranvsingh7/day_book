"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { InputField, TextAreaField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";
import type { Transaction } from "@/types/daybook";

type Props = {
  categories: string[];
  initial?: Transaction;
  onSuccess?: () => void;
};

type FormData = {
  type: "income" | "expense" | "owner";
  paymentMode: "cash" | "online";
  splitPayment: boolean;
  cashAmount: string;
  onlineAmount: string;
  amount: string;
  category: string;
  description: string;
  date: string;
};

function toFormData(entry?: Transaction): FormData {
  const hasSplit = Boolean(entry?.splitPayment);

  return {
    type: entry?.type ?? "income",
    paymentMode: entry?.paymentMode ?? "cash",
    splitPayment: hasSplit,
    cashAmount: hasSplit ? String(entry?.splitPayment?.cashAmount ?? "") : "",
    onlineAmount: hasSplit ? String(entry?.splitPayment?.onlineAmount ?? "") : "",
    amount: entry ? String(entry.amount) : "",
    category: entry?.category ?? "",
    description: entry?.description ?? "",
    date: entry ? entry.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

export function TransactionForm({ categories, initial, onSuccess }: Props) {
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => toFormData(initial));

  const endpoint = useMemo(
    () => (initial?._id ? `/api/transactions/${initial._id}` : "/api/transactions"),
    [initial?._id]
  );

  const method = initial?._id ? "PUT" : "POST";

  const buildPayload = () => {
    const parsedAmount = Number(formData.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than zero");
      return null;
    }

    if (!formData.category.trim()) {
      toast.error("Category is required");
      return null;
    }

    if (formData.splitPayment) {
      const cashAmount = Number(formData.cashAmount);
      const onlineAmount = Number(formData.onlineAmount);

      if (!Number.isFinite(cashAmount) || cashAmount <= 0) {
        toast.error("Cash amount must be greater than zero");
        return null;
      }

      if (!Number.isFinite(onlineAmount) || onlineAmount <= 0) {
        toast.error("Online amount must be greater than zero");
        return null;
      }

      if (Math.abs(cashAmount + onlineAmount - parsedAmount) >= 0.01) {
        toast.error("Cash + Online amount should match total amount");
        return null;
      }

      return {
        type: formData.type,
        amount: parsedAmount,
        paymentMode: "cash" as const,
        splitPayment: {
          cashAmount,
          onlineAmount,
        },
        category: formData.category,
        description: formData.description,
        date: formData.date,
      };
    }

    return {
      type: formData.type,
      amount: parsedAmount,
      paymentMode: formData.paymentMode,
      splitPayment: initial ? null : undefined,
      category: formData.category,
      description: formData.description,
      date: formData.date,
    };
  };

  const saveTransaction = async () => {
    const payloadToSubmit = buildPayload();
    if (!payloadToSubmit) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSubmit),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Unable to save transaction");
        return;
      }

      toast.success(initial ? "Entry updated" : "Entry added");
      if (!initial) {
        setFormData(toFormData());
      }
      setConfirmOpen(false);
      onSuccess?.();
    } finally {
      setPending(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payloadToSubmit = buildPayload();
    if (!payloadToSubmit) {
      return;
    }

    if (initial) {
      await saveTransaction();
      return;
    }

    setConfirmOpen(true);
  };

  return (
    <>
      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            value={formData.type}
            onChange={(value) =>
              setFormData((current) => ({ ...current, type: value as "income" | "expense" | "owner" }))
            }
            options={[
              { value: "income", label: "Income" },
              { value: "expense", label: "Expense" },
              { value: "owner", label: "Owner Taken" },
            ]}
            required
          />

          <SelectField
            label="Payment Mode"
            value={formData.paymentMode}
            onChange={(value) =>
              setFormData((current) => ({ ...current, paymentMode: value as "cash" | "online" }))
            }
            options={[
              { value: "cash", label: "Cash" },
              { value: "online", label: "Online" },
            ]}
            required
            disabled={formData.splitPayment}
          />

        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.splitPayment}
              onChange={(event) =>
                setFormData((current) => ({
                  ...current,
                  splitPayment: event.target.checked,
                  paymentMode: event.target.checked ? "cash" : current.paymentMode,
                  cashAmount: event.target.checked ? current.cashAmount : "",
                  onlineAmount: event.target.checked ? current.onlineAmount : "",
                }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            Split payment (Cash + Online)
          </label>

          {formData.splitPayment ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <InputField
                label="Cash amount"
                type="number"
                value={formData.cashAmount}
                onChange={(value) => setFormData((current) => ({ ...current, cashAmount: value }))}
                required
                min={0.01}
                step="0.01"
                inputMode="decimal"
              />
              <InputField
                label="Online amount"
                type="number"
                value={formData.onlineAmount}
                onChange={(value) => setFormData((current) => ({ ...current, onlineAmount: value }))}
                required
                min={0.01}
                step="0.01"
                inputMode="decimal"
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <InputField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(value) => setFormData((current) => ({ ...current, amount: value }))}
            required
            min={0.01}
            step="0.01"
            inputMode="decimal"
          />

          <SelectField
            label="Category"
            value={formData.category}
            onChange={(value) => setFormData((current) => ({ ...current, category: value }))}
            options={categories.map((category) => ({ value: category, label: category }))}
            placeholder="Select category"
            required
            searchable
            searchPlaceholder="Search category..."
          />

          <InputField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(value) => setFormData((current) => ({ ...current, date: value }))}
            required
          />
        </div>

        <TextAreaField
          label="Description (optional)"
          value={formData.description}
          onChange={(value) => setFormData((current) => ({ ...current, description: value }))}
          placeholder="Notes for this transaction"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {pending ? "Saving..." : initial ? "Update Entry" : "Add Entry"}
        </button>
      </form>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Confirm Entry</h3>
            <p className="mt-1 text-sm text-slate-500">Please review details before submitting.</p>

            <dl className="mt-4 grid grid-cols-[100px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-slate-500">Type</dt>
              <dd
                className={`inline-flex items-center gap-1 font-medium capitalize ${
                  formData.type === "income"
                    ? "text-emerald-600"
                    : formData.type === "expense"
                      ? "text-rose-600"
                      : "text-slate-700"
                }`}
              >
                {formData.type === "income" ? (
                  <ArrowUpRight size={14} />
                ) : formData.type === "expense" ? (
                  <ArrowDownRight size={14} />
                ) : null}
                {formData.type}
              </dd>
              <dt className="text-slate-500">Amount</dt>
              <dd className="font-medium text-slate-800">{formData.amount}</dd>
              <dt className="text-slate-500">Payment</dt>
              <dd className="font-medium capitalize text-slate-800">
                {formData.splitPayment
                  ? `split (cash ${formData.cashAmount || 0} + online ${formData.onlineAmount || 0})`
                  : formData.paymentMode}
              </dd>
              <dt className="text-slate-500">Category</dt>
              <dd className="font-medium text-slate-800">{formData.category}</dd>
              <dt className="text-slate-500">Date</dt>
              <dd className="font-medium text-slate-800">{formData.date}</dd>
              <dt className="text-slate-500">Description</dt>
              <dd className="font-medium text-slate-800">{formData.description || "-"}</dd>
            </dl>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => void saveTransaction()}
                disabled={pending}
              >
                {pending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
