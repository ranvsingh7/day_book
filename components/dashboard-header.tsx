type Props = {
  title: string;
  subtitle: string;
};

export function DashboardHeader({ title, subtitle }: Props) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
        {title}
      </h1>
      <p className="text-sm text-slate-500 md:text-base">{subtitle}</p>
    </header>
  );
}
