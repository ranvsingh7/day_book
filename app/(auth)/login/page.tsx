"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPending(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Authentication failed");
        return;
      }

      toast.success("Logged in");
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-md pt-8">
      <div className="glass-panel rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Daybook</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600">
          Login using your mobile number or email.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <InputField
            label="Mobile or Email"
            value={identifier}
            onChange={setIdentifier}
            required
            autoComplete="username"
          />

          <InputField
            label="Password"
            type="password"
            minLength={6}
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            disabled={pending}
            variant="secondary"
            size="md"
            fullWidth
          >
            {pending ? "Please wait..." : "Login"}
          </Button>
        </form>
      </div>
    </main>
  );
}
