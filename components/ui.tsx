import clsx from "clsx";
import type { ReactNode } from "react";

export function SummaryCard({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: "neutral" | "income" | "expense";
}) {
  return (
    <article
      className={clsx(
        "card-soft rounded-2xl p-5",
        tone === "income" && "border-emerald-200/80 bg-emerald-50/70",
        tone === "expense" && "border-rose-200/80 bg-rose-50/70",
        tone === "neutral" && "border-slate-200 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

export function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="card-soft rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function SkeletonBlock({ className }: { className: string }) {
  return <div className={clsx("animate-pulse rounded-xl bg-slate-200", className)} />;
}
