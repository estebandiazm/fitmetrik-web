export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="surface-coach min-h-screen bg-surface-dim">
      {children}
    </div>
  );
}
