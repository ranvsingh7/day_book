import { SkeletonBlock } from "@/components/ui";

export default function DashboardLoading() {
  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <SkeletonBlock className="h-8 w-64" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>

      <section className="card-soft rounded-2xl p-4 sm:p-5">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SkeletonBlock className="h-96 w-full" />
        <SkeletonBlock className="h-96 w-full" />
      </section>

      <SkeletonBlock className="h-96 w-full" />
      <SkeletonBlock className="h-72 w-full" />
    </main>
  );
}
