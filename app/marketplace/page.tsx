'use client';

import React, { useState } from 'react';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import FeaturedCollections from '@/components/marketplace/FeaturedCollections';
import AssetCard from '@/components/marketplace/AssetCard';
import DataDetail from '@/components/marketplace/DataDetail';
import { DATA_ASSETS } from '@/constants/marketplace';
import { DataAsset } from '@/types/marketplace';

export default function MarketplacePage() {
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);

  if (selectedAsset) {
    return <DataDetail asset={selectedAsset} onBack={() => setSelectedAsset(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <MarketplaceHeader />
      <div className="flex-1 px-8 pb-12 flex flex-col gap-10 z-10">
        <FeaturedCollections />
        
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
              All Data Assets <span className="text-gray-400 text-lg font-normal ml-2">({DATA_ASSETS.length + 137} items)</span>
            </h2>
            <div className="flex gap-2 text-sm font-bold">
              <span className="text-gray-400">Sort by:</span>
              <span className="text-ink cursor-pointer hover:text-primary transition-colors">Newest</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {DATA_ASSETS.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset} 
                onClick={() => setSelectedAsset(asset)}
              />
            ))}
          </div>
          
          <div className="mt-12 flex justify-center">
            <button className="rounded-xl border-2 border-ink bg-white px-8 py-3 font-bold text-ink shadow-hard hover:bg-gray-50 hover:scale-105 transition-all">
              Load More Data
            </button>
          </div>
        </section>
        
        <footer className="mt-10 border-t-2 border-ink pt-8 flex flex-col items-center gap-4 text-center opacity-60 pb-8">
          <p className="text-sm font-bold">Powered by Sui Network</p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined">dataset</span>
            <span className="material-symbols-outlined">security</span>
            <span className="material-symbols-outlined">hub</span>
          </div>
        </footer>
      </div>

      {/* Floating Decorative Element */}
      <div className="absolute right-10 top-32 pointer-events-none opacity-20 hidden xl:block z-0">
        <span className="material-symbols-outlined text-[300px] text-primary rotate-12 select-none">blur_on</span>
      </div>
    </div>
  );
}
