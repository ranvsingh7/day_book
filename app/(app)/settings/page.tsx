"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash } from "lucide-react";

import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editPending, setEditPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");

  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>("user");
  const [editPassword, setEditPassword] = useState("");

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
      setCreateOpen(false);
      void loadUsers();
    } finally {
      setPending(false);
    }
  };

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    setEditName(user.name ?? "");
    setEditMobile(user.mobile ?? "");
    setEditEmail(user.email ?? "");
    setEditRole(user.role ?? "user");
    setEditPassword("");
  };

  const onUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    setEditPending(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          mobile: editMobile,
          email: editEmail.trim() ? editEmail.trim() : undefined,
          role: editRole,
          password: editPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to update user");
        return;
      }

      toast.success("User updated");
      setEditingUser(null);
      void loadUsers();
    } finally {
      setEditPending(false);
    }
  };

  const onDeleteUser = async () => {
    if (!editingUser) {
      return;
    }

    setDeletePending(true);
    try {
      const response = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to delete user");
        return;
      }

      toast.success("User deleted");
      setConfirmDeleteOpen(false);
      setEditingUser(null);
      void loadUsers();
    } finally {
      setDeletePending(false);
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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Users</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            Create User
          </Button>
        </div>
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
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-200">
                    <td className="py-2">{user.name || "-"}</td>
                    <td className="py-2">{user.mobile || "-"}</td>
                    <td className="py-2">{user.email || "-"}</td>
                    <td className="py-2 capitalize">{user.role || "-"}</td>
                    <td className="py-2 text-right">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => openEditModal(user)}
                        className="gap-1"
                      >
                        <Pencil size={14} />
                        Action
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create New User</h3>
              <Button type="button" variant="outline" size="xs" onClick={() => setCreateOpen(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={onCreateUser} className="grid gap-3 md:grid-cols-2">
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
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" variant="secondary" size="sm" disabled={pending}>
                  {pending ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Manage User</h3>
              <Button type="button" variant="outline" size="xs" onClick={() => setEditingUser(null)}>
                Close
              </Button>
            </div>

            <form onSubmit={onUpdateUser} className="grid gap-3 md:grid-cols-2">
              <InputField label="Name" value={editName} onChange={setEditName} required />
              <InputField
                label="Mobile"
                value={editMobile}
                onChange={setEditMobile}
                required
                placeholder="10 digits only"
                inputMode="numeric"
              />
              <InputField
                label="Email (optional)"
                type="email"
                value={editEmail}
                onChange={setEditEmail}
                placeholder="optional"
              />
              <InputField
                label="Change Password (optional)"
                type="password"
                value={editPassword}
                onChange={setEditPassword}
                minLength={6}
                placeholder="Leave empty to keep same"
              />
              <SelectField
                label="Role"
                value={editRole}
                onChange={(value) => setEditRole(value as Role)}
                options={[
                  { value: "user", label: "User" },
                  { value: "admin", label: "Admin" },
                ]}
              />

              <div className="md:col-span-2 flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="gap-1"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={deletePending || editPending}
                >
                  <Trash size={14} />
                  Delete User
                </Button>

                <Button type="submit" variant="secondary" size="sm" disabled={editPending || deletePending}>
                  {editPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        loading={deletePending}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void onDeleteUser()}
      />
    </main>
  );
}
