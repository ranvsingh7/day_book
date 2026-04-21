"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  Tags,
  ChartNoAxesCombined,
  Settings,
  Menu,
  X,
} from "lucide-react";

const adminOnlyLinks = new Set(["/categories", "/settings"]);

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/add-entry", label: "Add Entry", icon: PlusCircle },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/categories", label: "Categories", icon: Tags },
  {
    href: "/monthly-summary",
    label: "Monthly Summary",
    icon: ChartNoAxesCombined,
  },
  { href: "/settings", label: "Settings", icon: Settings },
];

type SidebarProps = {
  role: "admin" | "user";
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleLinks = links.filter((link) => role === "admin" || !adminOnlyLinks.has(link.href));

  return (
    <>
      <aside className="hidden max-h-[700px] card-soft rounded-2xl p-3 lg:sticky lg:top-4 lg:block lg:w-64">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Daybook Ledger
        </p>
        <nav className="flex max-h-[450px] flex-col gap-2 overflow-y-auto pr-1">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition whitespace-nowrap",
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                )}
              >
                <Icon size={17} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="card-soft flex items-center justify-between rounded-2xl p-3 lg:hidden">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Daybook Ledger
        </p>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
        >
          <Menu size={16} />
        </button>
      </div>

      <div
        className={clsx(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className={clsx(
            "absolute inset-0 bg-slate-900/40 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />

        <aside
          className={clsx(
            "absolute right-0 top-0 h-full w-72 border-l border-slate-200 bg-white p-4 shadow-xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Daybook Ledger
            </p>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {visibleLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition whitespace-nowrap",
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  )}
                >
                  <Icon size={17} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
}
