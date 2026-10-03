export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="surface-client min-h-screen bg-bg text-text-primary">
      {children}
    </div>
  );
}
