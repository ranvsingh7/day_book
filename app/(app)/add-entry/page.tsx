"use client";

import { useEffect, useState } from "react";

import { TransactionForm } from "@/components/transaction-form";
import type { Category } from "@/types/daybook";

export default function AddEntryPage() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const response = await fetch("/api/categories", { cache: "no-store" });
      if (!response.ok) {
        setCategories([]);
        return;
      }

      const payload = (await response.json()) as { categories: Category[] };
      setCategories(payload.categories.map((category) => category.name));
    };

    void loadCategories();
  }, []);

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Add Entry</h1>
        <p className="text-sm text-slate-500">Record income or expense and update balance instantly.</p>
      </header>
      <TransactionForm categories={categories} />
    </main>
  );
}
