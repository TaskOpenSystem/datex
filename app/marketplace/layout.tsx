import MarketplaceSidebar from '@/components/marketplace/MarketplaceSidebar';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-row overflow-hidden font-sans antialiased selection:bg-accent-lime selection:text-ink">
      <MarketplaceSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-background-light">
        {children}
      </main>
    </div>
  );
}
