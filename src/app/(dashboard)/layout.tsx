export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="surface-coach min-h-screen bg-bg text-text-primary">
      {children}
    </div>
  );
}
