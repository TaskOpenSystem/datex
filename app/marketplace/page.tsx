'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useAllListings } from '@/hooks/useMarketplace';
import { formatPrice } from '@/lib/marketplace';
import { DatasetListing } from '@/types/marketplace';
import { useMarketplaceFilterContext } from '@/contexts/MarketplaceFilterContext';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import FeaturedCollections from '@/components/marketplace/FeaturedCollections';

type SortOption = 'newest' | 'oldest' | 'price_asc' | 'price_desc';

export default function MarketplacePage() {
  const router = useRouter();
  const account = useCurrentAccount();
  const { data: listings, isLoading } = useAllListings();
  const { filters, setSearch } = useMarketplaceFilterContext();

  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const handleViewListing = (listing: DatasetListing) => {
    router.push(`/marketplace/dataset/${listing.id}`);
  };

  const isOwner = (listing: DatasetListing) => {
    return account?.address === listing.seller;
  };

  const isInvalidBlobId = (blobId: string) => {
    return blobId.startsWith('0x');
  };

  // Filter and sort listings
  const filteredListings = listings?.filter(l => {
    if (isInvalidBlobId(l.blobId)) return false;
    if (filters.search && !l.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    const priceInSui = Number(l.price) / 1e9;
    if (priceInSui < filters.priceRange.min || priceInSui > filters.priceRange.max) return false;
    return true;
  }) || [];

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return Number(a.price) - Number(b.price);
      case 'price_desc': return Number(b.price) - Number(a.price);
      default: return 0;
    }
  });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Search Header */}
      <MarketplaceHeader
        search={filters.search}
        onSearchChange={setSearch}
        onSearch={() => {}}
      />

      <div className="px-8 pb-8 flex flex-col gap-8">
        {/* Featured Collections */}
        <FeaturedCollections />

        {/* All Data Assets */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2">
              All Data Assets <span className="text-gray-400 text-lg font-normal ml-2">({sortedListings.length} items)</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border-2 border-ink bg-white px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:ring-0"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <article key={i} className="flex flex-col rounded-xl border-2 border-ink bg-white overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-200" />
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-200 rounded-full" />
                      <div className="h-5 w-20 bg-gray-200 rounded-full" />
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                      <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : sortedListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedListings.map(listing => (
                <article
                  key={listing.id}
                  onClick={() => handleViewListing(listing)}
                  className={`flex flex-col rounded-xl border-2 border-ink bg-white overflow-hidden cursor-pointer hover:shadow-hard hover:-translate-y-1 transition-all ${
                    isOwner(listing) ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                >
                  {/* Image/Preview Area */}
                  <div className="relative h-40 bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0,50 Q25,30 50,50 T100,50" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-accent-lime" />
                        <path d="M0,60 Q25,40 50,60 T100,60" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-accent-lime" />
                      </svg>
                    </div>
                    <span className="material-symbols-outlined text-6xl text-gray-600">dataset</span>
                    
                    {/* Badge */}
                    {isOwner(listing) && (
                      <span className="absolute top-3 left-3 rounded-full bg-primary text-white px-3 py-1 text-[10px] font-bold border border-ink">
                        YOUR LISTING
                      </span>
                    )}
                    
                    {/* Explorer Links */}
                    <div className="absolute top-3 right-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={`https://suiscan.xyz/testnet/object/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 w-7 rounded bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                        title="View on SuiScan"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 234 234" fill="none">
                          <path d="M0 100C0 65 0 47.5 6.8 33C12.7 21.3 22.3 11.8 34 5.8C47.3 0 64.7 0 99.5 0H133.8C168.6 0 186 0 199.3 6.8C211 12.8 220.6 22.3 226.5 34C233.3 47.4 233.3 64.9 233.3 99.8V134.2C233.3 169.1 233.3 186.6 226.5 199.9C220.6 211.6 211 221.2 199.3 227.2C186 234 168.6 234 133.8 234H99.5C64.7 234 47.3 234 34 227.2C22.3 221.2 12.7 211.7 6.8 200C0 186.6 0 169.1 0 134.2V100Z" fill="#4C72FF"/>
                          <path d="M177 87C178.7 85.9 180.8 85.6 182.4 86.3C183.2 86.6 183.9 87.1 184.3 87.8C184.7 88.5 185 89.4 184.9 90.2L181.4 148.2C181 155.7 178.2 163.4 173.6 170.4C160.4 190.4 133.2 200 112.8 191.8C107.1 189.5 102.5 186 99.2 181.7C100 181.8 100.8 181.7 101.5 181.7C122.4 181.7 143.5 170.3 155.1 152.7C160.7 144.1 164 134.7 164.6 125.6L166.5 93.3L177 87Z" fill="white"/>
                          <path d="M150 63.6C151.7 62.5 153.8 62.3 155.5 62.9C156.3 63.3 156.9 63.8 157.4 64.5C157.9 65.2 158.1 66.1 158 66.9L154.5 125C154 132.5 151.3 140.1 146.7 147.1C133.5 167.2 106.3 176.7 85.9 168.5C80.1 166.2 75.6 162.7 72.3 158.4C73.1 158.4 73.9 158.4 74.6 158.4C95.6 158.4 116.6 147.1 128.2 129.4C133.9 120.8 137.1 111.4 137.7 102.3L139.6 70L150 63.6Z" fill="white"/>
                          <path d="M123 40.3C124.7 39.2 126.8 39 128.5 39.6C129.2 39.9 129.9 40.5 130.3 41.2C130.8 41.9 131 42.7 130.9 43.5L127.4 101.6C127 109.1 124.2 116.7 119.6 123.7C106.4 143.8 79.2 153.3 58.8 145.1C38.5 136.9 32.7 114 45.9 93.9C50.5 86.9 57.1 80.7 64.6 76.1L123 40.3Z" fill="white"/>
                        </svg>
                      </a>
                      <a
                        href={`https://testnet.suivision.xyz/object/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 w-7 rounded bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                        title="View on SuiVision"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M0 6C0 2.68629 2.68629 0 6 0H18C21.3137 0 24 2.68629 24 6V18C24 21.3137 21.3137 24 18 24H6C2.68629 24 0 21.3137 0 18V6Z" fill="#4DA2FF"/>
                          <path d="M6.99748 5.28362L6.99748 11.0148L8.71768 12.0008L6.99731 12.987L6.99731 18.7182L11.9972 21.584L16.9971 18.7182L16.9971 12.9866L15.2769 12.0007L16.9973 11.0147L16.9973 5.28308L11.997 2.41732L6.99748 5.28362ZM11.6464 3.42366L11.6464 7.94789L7.69961 10.2105L7.69961 5.68623L11.6464 3.42366ZM12.3482 20.5781L12.3482 16.0535L16.2954 13.7912L16.2954 18.3159L12.3482 20.5781ZM15.9441 13.1879L11.9973 15.4501L8.05048 13.1879L9.41994 12.4031L11.9973 13.8803L14.575 12.4031L15.9441 13.1879ZM11.9973 10.1208L9.41964 11.5982L8.05048 10.8134L11.9973 8.55113L15.9445 10.8134L14.575 11.5982L11.9973 10.1208Z" fill="white"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Tags */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Seal Verified
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="10" r="6" fill="currentColor"/>
                          <ellipse cx="12" cy="20" rx="4" ry="1.5" fill="currentColor" opacity="0.5"/>
                        </svg>
                        Walrus
                      </span>
                    </div>
                    
                    <h3 className="text-base font-bold text-ink mb-1 line-clamp-1">{listing.name}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{listing.description}</p>
                    
                    {/* Price and Action */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 mt-auto">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price</p>
                        <p className="text-lg font-bold text-ink">{formatPrice(listing.price)}</p>
                      </div>
                      <button 
                        className="h-10 w-10 rounded-lg border-2 border-ink bg-white flex items-center justify-center hover:bg-accent-lime transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewListing(listing);
                        }}
                      >
                        <span className="material-symbols-outlined">shopping_cart</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="material-symbols-outlined text-6xl text-gray-400 mb-4">search_off</div>
              <h3 className="text-xl font-bold text-ink mb-2">No Datasets Found</h3>
              <p className="text-gray-500 mb-6">There are currently no datasets matching your criteria.</p>
              <Link
                href="/marketplace/my-data"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl border-2 border-ink shadow-hard-sm hover:-translate-y-1 transition-all"
              >
                <span className="material-symbols-outlined">add</span>
                Create Listing
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
