import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { Sidebar } from "@/components/sidebar";
import { getSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="ledger-grid min-h-screen p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:flex-row">
        <Sidebar role={session.role} />
        <div className="flex-1 space-y-4">
          <header className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3">
            <div>
              <h1 className="text-lg font-semibold">Welcome to Daybook</h1>
              <p className="text-sm text-slate-500">
                {session.name} • {session.mobile}
                {session.email ? ` • ${session.email}` : ""} • {session.role}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <LogoutButton />
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
