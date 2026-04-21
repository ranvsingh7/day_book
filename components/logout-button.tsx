"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
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
      className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
    >
      <LogOut size={16} />
      {pending ? "Logging out..." : "Logout"}
    </button>
  );
}
