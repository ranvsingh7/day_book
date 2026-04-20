"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InputField } from "@/components/input-field";
import type { Category } from "@/types/daybook";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const load = async () => {
    const response = await fetch("/api/categories", { cache: "no-store" });
    if (!response.ok) {
      setCategories([]);
      return;
    }
    const payload = (await response.json()) as { categories: Category[] };
    setCategories(payload.categories);
  };

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.json() as Promise<{ user: { role: "admin" | "user" } }>;
      })
      .then((payload) => {
        const admin = payload?.user.role === "admin";
        setIsAdmin(admin);
        if (!admin) {
          router.replace("/dashboard");
        }
      })
      .finally(() => setCheckingRole(false));
  }, [router]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    fetch("/api/categories", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.json() as Promise<{ categories: Category[] }>;
      })
      .then((payload) => {
        setCategories(payload?.categories ?? []);
      });
  }, [isAdmin]);

  if (checkingRole || !isAdmin) {
    return null;
  }

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Unable to add category");
        return;
      }

      setName("");
      toast.success("Category added");
      void load();
    } finally {
      setPending(false);
    }
  };

  const deleteCategory = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletePending(true);
    const response = await fetch(`/api/categories/${deleteTarget}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Could not delete category");
      setDeletePending(false);
      return;
    }
    toast.success("Category deleted");
    setDeleteTarget(null);
    setDeletePending(false);
    void load();
  };

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-slate-500">Manage your personal transaction categories.</p>
      </header>

      <form onSubmit={addCategory} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
        <InputField
          label="Category"
          value={name}
          onChange={setName}
          placeholder="New category"
          required
          containerClassName="flex-1"
        />
        <Button
          type="submit"
          disabled={pending}
          variant="secondary"
          size="md"
        >
          {pending ? "Adding..." : "Add Category"}
        </Button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <ul className="grid gap-2">
          {categories.map((category) => (
            <li
              key={category._id}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
            >
              <span>{category.name}</span>
              <button
                type="button"
                onClick={() => deleteCategory(category._id)}
                className="rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        confirmText="Delete"
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
