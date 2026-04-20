"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onLogout = () => {
    startTransition(async () => {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        toast.error("Could not logout. Try again.");
        return;
      }
      toast.success("Logged out");
      router.replace("/login");
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={pending}
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60"
    >
      {pending ? "Logging out..." : "Logout"}
    </button>
  );
}
