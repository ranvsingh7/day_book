export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="ledger-grid min-h-screen px-4 py-10 md:py-16">{children}</div>;
}
