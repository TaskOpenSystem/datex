'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import FeaturedCollections from '@/components/marketplace/FeaturedCollections';
import AssetCard from '@/components/marketplace/AssetCard';
import { DATA_ASSETS } from '@/constants/marketplace';
import { DataAsset, SortOption } from '@/types/marketplace';
import { useMarketplaceFilterContext } from '@/contexts/MarketplaceFilterContext';
import DataDetail from '@/components/marketplace/DataDetail';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

export default function MarketplacePage() {
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const {
    filters,
    setSearch,
    setSortBy,
    resetFilters,
    filterAssets,
  } = useMarketplaceFilterContext();

  const filteredAssets = filterAssets(DATA_ASSETS);

  if (selectedAsset) {
    return <DataDetail asset={selectedAsset} onBack={() => setSelectedAsset(null)} />;
  }

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label || 'Newest';

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <MarketplaceHeader
        search={filters.search}
        onSearchChange={setSearch}
        onSearch={() => { }} // Search happens automatically on change
      />
      <div className="flex-1 px-8 pb-12 flex flex-col gap-10 z-10">
        <FeaturedCollections />

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
              All Data Assets{' '}
              <span className="text-gray-400 text-lg font-normal ml-2">
                ({filteredAssets.length} items)
              </span>
            </h2>
            <div className="relative flex gap-2 text-sm font-bold">
              <span className="text-gray-400">Sort by:</span>
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="text-ink cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
              >
                {currentSortLabel}
                <span className="material-symbols-outlined text-sm">
                  {showSortDropdown ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* Sort Dropdown */}
              {showSortDropdown && (
                <div className="absolute right-0 top-8 bg-white border-2 border-ink rounded-lg shadow-hard z-20 min-w-[160px] overflow-hidden">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-100 transition-colors ${filters.sortBy === option.value ? 'bg-accent-lime text-ink' : 'text-gray-700'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => setSelectedAsset(asset)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                search_off
              </span>
              <h3 className="text-xl font-bold text-ink mb-2">No assets found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or search query
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2 rounded-lg border-2 border-ink bg-white font-bold text-ink hover:bg-gray-50 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}

          {filteredAssets.length > 0 && (
            <div className="mt-12 flex justify-center">
              <button className="rounded-xl border-2 border-ink bg-white px-8 py-3 font-bold text-ink shadow-hard hover:bg-gray-50 hover:scale-105 transition-all">
                Load More Data
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Floating Decorative Element */}
      <div className="absolute right-10 top-32 pointer-events-none opacity-20 hidden xl:block z-0">
        <span className="material-symbols-outlined text-[300px] text-primary rotate-12 select-none">blur_on</span>
      </div>

      {/* Click outside to close dropdown */}
      {showSortDropdown && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowSortDropdown(false)}
        />
      )}
    </div>
  );
}
