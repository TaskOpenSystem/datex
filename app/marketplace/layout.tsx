'use client';

import MarketplaceSidebar from '@/components/marketplace/MarketplaceSidebar';
import { MarketplaceFilterProvider } from '@/contexts/MarketplaceFilterContext';

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MarketplaceFilterProvider>
      <div className="flex min-h-screen w-full flex-row overflow-hidden font-sans antialiased selection:bg-accent-lime selection:text-ink">
        <MarketplaceSidebar />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-background-light">
          {children}
        </main>
      </div>
    </MarketplaceFilterProvider>
  );
}
