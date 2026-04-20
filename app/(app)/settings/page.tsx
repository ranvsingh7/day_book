"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";

type Role = "admin" | "user";

type MePayload = {
  user: {
    userId: string;
    name: string;
    mobile: string;
    email?: string;
    role: Role;
  };
};

type ManagedUser = {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  role: Role;
  createdAt: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(true);
  const [me, setMe] = useState<MePayload["user"] | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      if (!response.ok) {
        setUsers([]);
        return;
      }

      const payload = (await response.json()) as { users: ManagedUser[] };
      setUsers(payload.users);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.json() as Promise<MePayload>;
      })
      .then((payload) => {
        if (!payload?.user) {
          router.replace("/login");
          return;
        }

        setMe(payload.user);
        if (payload.user.role !== "admin") {
          router.replace("/dashboard");
          return;
        }

        void loadUsers();
      })
      .finally(() => setCheckingRole(false));
  }, [router]);

  const onCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          email: email.trim() ? email.trim() : undefined,
          password,
          role,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to create user");
        return;
      }

      toast.success("User created");
      setName("");
      setMobile("");
      setEmail("");
      setPassword("");
      setRole("user");
      void loadUsers();
    } finally {
      setPending(false);
    }
  };

  if (checkingRole || !me || me.role !== "admin") {
    return null;
  }

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-500">Manage your profile and create users as admin.</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Admin Profile</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Name</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{me.name}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Mobile</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{me.mobile}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Email</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{me.email || "-"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Role</p>
            <p className="mt-1 text-sm font-medium text-slate-800 capitalize">{me.role}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Create New User</h2>
        <form onSubmit={onCreateUser} className="mt-3 grid gap-3 md:grid-cols-2">
          <InputField label="Name" value={name} onChange={setName} required />
          <InputField
            label="Mobile"
            value={mobile}
            onChange={setMobile}
            required
            placeholder="10 digits only"
            inputMode="numeric"
          />
          <InputField
            label="Email (optional)"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="optional"
          />
          <InputField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
          />
          <SelectField
            label="Role"
            value={role}
            onChange={(value) => setRole(value as Role)}
            options={[
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" },
            ]}
          />
          <div className="md:col-span-2">
            <Button type="submit" variant="secondary" size="md" disabled={pending}>
              {pending ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Users</h2>
        {loadingUsers ? (
          <p className="mt-3 text-sm text-slate-500">Loading users...</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-2">Name</th>
                  <th className="py-2">Mobile</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-200">
                    <td className="py-2">{user.name || "-"}</td>
                    <td className="py-2">{user.mobile || "-"}</td>
                    <td className="py-2">{user.email || "-"}</td>
                    <td className="py-2 capitalize">{user.role || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
