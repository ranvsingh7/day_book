"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Info, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InputField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";
import { TablePagination } from "@/components/table-pagination";
import { TransactionForm } from "@/components/transaction-form";
import { SkeletonBlock } from "@/components/ui";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Category, Transaction } from "@/types/daybook";

type Filters = {
  from: string;
  to: string;
  type: "all" | "income" | "expense";
  category: string;
};

type Viewer = {
  role: "admin" | "user";
};

export default function TransactionsPage() {
  const PAGE_SIZE = 8;
  const [filters, setFilters] = useState<Filters>({
    from: "",
    to: "",
    type: "all",
    category: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [openActionFor, setOpenActionFor] = useState<string | null>(null);
  const [splitInfoFor, setSplitInfoFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const debouncedFilters = useDebounce(filters, 350);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedFilters.from) params.set("from", debouncedFilters.from);
    if (debouncedFilters.to) params.set("to", debouncedFilters.to);
    if (debouncedFilters.type) params.set("type", debouncedFilters.type);
    if (debouncedFilters.category) params.set("category", debouncedFilters.category);
    return params.toString();
  }, [debouncedFilters]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [safeCurrentPage, transactions]);

  const load = async () => {
    setLoading(true);
    try {
      const [txResponse, categoryResponse, meResponse] = await Promise.all([
        fetch(`/api/transactions?${queryString}`, { cache: "no-store" }),
        fetch("/api/categories", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      if (txResponse.ok) {
        const txPayload = (await txResponse.json()) as { transactions: Transaction[] };
        setTransactions(txPayload.transactions);
      } else {
        setTransactions([]);
      }

      if (categoryResponse.ok) {
        const categoryPayload = (await categoryResponse.json()) as {
          categories: Category[];
        };
        setCategories(categoryPayload.categories.map((item) => item.name));
      }

      if (meResponse.ok) {
        const mePayload = (await meResponse.json()) as { user: Viewer };
        setViewer(mePayload.user);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch(`/api/transactions?${queryString}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.json() as Promise<{ transactions: Transaction[] }>;
      })
      .then((payload) => {
        setTransactions(payload?.transactions ?? []);
      })
      .finally(() => setLoading(false));

    fetch("/api/categories", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.json() as Promise<{ categories: Category[] }>;
      })
      .then((payload) => {
        setCategories((payload?.categories ?? []).map((item) => item.name));
      });

    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.json() as Promise<{ user: Viewer }>;
      })
      .then((payload) => {
        setViewer(payload?.user ?? null);
      });
  }, [queryString]);

  useEffect(() => {
    if (!openActionFor) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest("[data-action-popover='true']")) {
        setOpenActionFor(null);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenActionFor(null);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [openActionFor]);

  const canManage = viewer?.role === "admin";

  const onDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletePending(true);
    const response = await fetch(`/api/transactions/${deleteTarget}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Failed to delete");
      setDeletePending(false);
      return;
    }
    toast.success("Transaction deleted");
    setDeleteTarget(null);
    setDeletePending(false);
    void load();
  };

  const exportCsv = async () => {
    const response = await fetch(`/api/export/csv?${queryString}`);
    if (!response.ok) {
      toast.error("Unable to export");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "daybook-export.csv";
    anchor.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-sm text-slate-500">Filter, search, and manage your entries.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="cursor-pointer rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Export CSV
        </button>
      </header>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <InputField
          label="From"
          type="date"
          value={filters.from}
          onChange={(value) => {
            setCurrentPage(1);
            setFilters((current) => ({ ...current, from: value }));
          }}
        />
        <InputField
          label="To"
          type="date"
          value={filters.to}
          onChange={(value) => {
            setCurrentPage(1);
            setFilters((current) => ({ ...current, to: value }));
          }}
        />
        <SelectField
          label="Type"
          value={filters.type}
          onChange={(value) => {
            setCurrentPage(1);
            setFilters((current) => ({ ...current, type: value as Filters["type"] }));
          }}
          options={[
            { value: "all", label: "All Types" },
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
          ]}
        />
        <SelectField
          label="Category"
          value={filters.category}
          onChange={(value) => {
            setCurrentPage(1);
            setFilters((current) => ({ ...current, category: value }));
          }}
          options={categories.map((category) => ({ value: category, label: category }))}
          placeholder="All Categories"
          searchable
          searchPlaceholder="Search category..."
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        {loading ? (
          <div className="space-y-3">
            <SkeletonBlock className="h-4 w-40" />
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-11 w-full" />
            <SkeletonBlock className="h-8 w-52" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Date</th>
                  <th className="py-2">Type</th>
                  <th className="py-2 text-left">Payment</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Created by</th>
                  {canManage ? <th className="py-2 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((entry) => (
                  <tr key={entry._id} className="border-t border-slate-200">
                    <td className="py-2">{formatDate(entry.date)}</td>
                    <td className="py-2 capitalize">{entry.type}</td>
                    <td
                      className="max-w-[240px] py-2 text-left capitalize leading-snug whitespace-normal break-words"
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
                    <td className="max-w-[220px] py-2 pr-3">
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
                    {canManage ? (
                      <td className="py-2">
                        <div className="relative flex justify-end" data-action-popover="true">
                          <button
                            type="button"
                            aria-label="Open actions"
                            onClick={() =>
                              setOpenActionFor((current) =>
                                current === entry._id ? null : entry._id
                              )
                            }
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {openActionFor === entry._id ? (
                            <div className="absolute right-0 top-9 z-20 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionFor(null);
                                  setEditing(entry);
                                }}
                                className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                              >
                                <Pencil size={12} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionFor(null);
                                  void onDelete(entry._id);
                                }}
                                className="mt-1 flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>

            <TablePagination
              totalItems={transactions.length}
              pageSize={PAGE_SIZE}
              currentPage={safeCurrentPage}
              onPageChange={(page) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))}
            />
          </div>
        )}
      </section>

      {editing && canManage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Transaction</h2>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setEditing(null)}
              >
                Close
              </Button>
            </div>
            <TransactionForm
              key={editing._id}
              categories={categories}
              initial={editing}
              onSuccess={() => {
                setEditing(null);
                void load();
              }}
            />
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction?"
        confirmText="Delete"
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
