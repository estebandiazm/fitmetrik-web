export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-dim">
      {children}
    </div>
  );
}
