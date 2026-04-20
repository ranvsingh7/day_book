import { SkeletonBlock } from "@/components/ui";

export default function AppLoading() {
  return (
    <main className="grid gap-4">
      <SkeletonBlock className="h-10 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
        <SkeletonBlock className="h-28 w-full" />
      </div>
      <SkeletonBlock className="h-72 w-full" />
    </main>
  );
}
