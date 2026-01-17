'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { useAllListings, useAccountBalance, usePurchaseDataset, useDownloadDataset, usePurchasedDatasets } from '@/hooks/useMarketplace';
import { formatSize, formatPrice, shortenAddress } from '@/lib/marketplace';
import { DatasetListing } from '@/types/marketplace';
import { marketplaceConfig } from '@/config/marketplace';

type ViewMode = 'grid' | 'list';

export default function MarketplacePage() {
  const account = useCurrentAccount();
  const { data: listings, isLoading, error, refetch } = useAllListings();
  const { data: balance } = useAccountBalance();
  const { purchase, isPending: isPurchasing } = usePurchaseDataset();
  const { downloadFile, isPending: isDownloading } = useDownloadDataset();
  const { data: purchases } = usePurchasedDatasets(account?.address);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedListing, setSelectedListing] = useState<DatasetListing | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseTxDigest, setPurchaseTxDigest] = useState('');
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');

  // Debug info
  const debugListings = () => {
    console.log('=== DEBUG ===');
    console.log('Listings:', listings);
    console.log('IsLoading:', isLoading);
    console.log('Error:', error);
    console.log('Account:', account?.address);
    alert(`Listings: ${listings?.length || 0}\nError: ${error?.message || 'none'}`);
  };

  const handleViewListing = (listing: DatasetListing) => {
    setSelectedListing(listing);
    setIsDetailOpen(true);
    setIsPurchased(false);
    setPurchaseTxDigest('');
    setDownloadStatus('idle');
  };

  const handlePurchase = (listing: DatasetListing) => {
    if (!account) {
      alert('Please connect your wallet');
      return;
    }

    purchase(listing, (result) => {
      setIsPurchased(true);
      setPurchaseTxDigest(result.digest);
      setDownloadStatus('idle');
    });
  };

  const handleDownload = async (listing: DatasetListing) => {
    if (!account || !purchaseTxDigest) {
      alert('Please complete purchase first');
      return;
    }

    setDownloadStatus('downloading');
    try {
      await downloadFile(listing, account.address, purchaseTxDigest, listing.name);
      setDownloadStatus('success');
    } catch (err) {
      console.error('Download error:', err);
      setDownloadStatus('error');
    }
  };

  const isOwner = (listing: DatasetListing) => {
    return account?.address === listing.seller;
  };

  const isInvalidBlobId = (blobId: string) => {
    // Valid Walrus blob IDs are base64-like strings (no 0x prefix)
    // Invalid blobIds start with 0x (hex content hash)
    return blobId.startsWith('0x');
  };

  const isPurchasedByUser = (listingId: string) => {
    return purchases?.some(p => p.datasetId === listingId);
  };

  const validListings = listings?.filter(l => !isInvalidBlobId(l.blobId)) || [];

  return (
    <>
      <header className="px-8 pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-500">
              <Link href="/" className="hover:text-primary transition-colors">Dashboard</Link>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-ink">Marketplace</span>
            </div>
            <h1 className="text-4xl font-black text-ink uppercase tracking-tight">Dataset Marketplace</h1>
            <p className="text-gray-500 mt-1">Discover and purchase high-quality datasets</p>
            
            {/* Debug info */}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className={isLoading ? 'text-blue-600' : 'text-green-600'}>
                {isLoading ? 'Loading...' : `${validListings.length} valid listings`}
              </span>
              {error && (
                <span className="text-red-600">Error: {error.message}</span>
              )}
              <button 
                onClick={() => refetch()}
                className="text-primary hover:underline"
              >
                ↻ Refresh
              </button>
              <button 
                onClick={debugListings}
                className="text-gray-400 hover:text-gray-600"
              >
                [Debug]
              </button>
            </div>
          </div>

          {balance && (
            <div className="flex items-center gap-4">
              <div className="bg-white border-2 border-ink rounded-xl px-4 py-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Balance</span>
                <p className="font-bold text-ink">{balance.sui.toFixed(4)} SUI</p>
              </div>
              {account && (
                <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                  {account.address.slice(0, 8)}...{account.address.slice(-6)}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="px-8 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold tracking-tight text-ink flex items-center gap-2">
            All Listings <span className="text-gray-400 text-base font-normal ml-1">({validListings.length} items)</span>
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border-2 ${viewMode === 'grid' ? 'border-ink bg-gray-100' : 'border-gray-300'}`}
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border-2 ${viewMode === 'list' ? 'border-ink bg-gray-100' : 'border-gray-300'}`}
            >
              <span className="material-symbols-outlined">view_list</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="rounded-xl border-2 border-ink bg-white p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : validListings && validListings.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {validListings.map(listing => (
              <article
                key={listing.id}
                onClick={() => handleViewListing(listing)}
                className={`flex flex-col rounded-xl border-2 border-ink bg-white p-4 shadow-hard-sm hover:shadow-hard transition-all cursor-pointer ${
                  isOwner(listing) ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-12 w-12 rounded-lg border-2 border-ink bg-accent-blue flex items-center justify-center">
                    <span className="material-symbols-outlined text-white">dataset</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded bg-green-100 text-green-800 px-2 py-1 text-[10px] font-bold border border-green-200">
                      ACTIVE
                    </span>
                    {isOwner(listing) && (
                      <span className="text-xs font-bold text-primary">Your Listing</span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-ink mb-1 truncate">{listing.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{listing.description}</p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{formatSize(Number(listing.totalSize))}</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(listing.price)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-sm">person</span>
                    <span>{shortenAddress(listing.seller)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : validListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="material-symbols-outlined text-6xl text-gray-400 mb-4">search_off</div>
            <h3 className="text-xl font-bold text-ink mb-2">No Valid Listings</h3>
            <p className="text-gray-500 mb-6">There are currently no downloadable datasets available.</p>
            <Link
              href="/marketplace/my-data"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:translate-y-0.5 transition-all"
            >
              <span className="material-symbols-outlined">add</span>
              Create Listing
            </Link>
          </div>
        ) : null}
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border-2 border-ink shadow-hard-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b-2 border-ink">
              <h2 className="text-xl font-black text-ink uppercase">Dataset Details</h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg border-2 border-transparent hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-ink">close</span>
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-start gap-4 mb-6">
                <div className="h-16 w-16 rounded-xl border-2 border-ink bg-accent-blue flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-3xl text-white">dataset</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-ink uppercase">{selectedListing.name}</h3>
                  <p className="text-gray-500">by {shortenAddress(selectedListing.seller)}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-ink">{selectedListing.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-ink">
                    <p className="text-sm font-bold text-gray-500 uppercase">Price</p>
                    <p className="text-2xl font-black text-primary">{formatPrice(selectedListing.price)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-ink">
                    <p className="text-sm font-bold text-gray-500 uppercase">Size</p>
                    <p className="text-2xl font-black text-ink">{formatSize(Number(selectedListing.totalSize))}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-ink">
                    <p className="text-sm font-bold text-gray-500 uppercase">Preview</p>
                    <p className="text-2xl font-black text-ink">{formatSize(Number(selectedListing.previewSize))}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-ink">
                    <p className="text-sm font-bold text-gray-500 uppercase">Status</p>
                    <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {isOwner(selectedListing) ? (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
                  <p className="font-bold text-blue-800 flex items-center gap-2">
                    <span className="material-symbols-outlined">info</span>
                    This is your listing
                  </p>
                </div>
              ) : isPurchasedByUser(selectedListing.id) ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                    <p className="font-bold text-green-800 flex items-center gap-2">
                      <span className="material-symbols-outlined">check_circle</span>
                      You own this dataset
                    </p>
                  </div>

                  {downloadStatus === 'success' ? (
                    <div className="bg-green-100 border-2 border-green-400 rounded-xl p-4">
                      <p className="font-bold text-green-800 flex items-center gap-2">
                        <span className="material-symbols-outlined">download_done</span>
                        Download Complete!
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDownload(selectedListing)}
                      disabled={isDownloading}
                      className="w-full h-12 rounded-xl border-2 border-ink bg-primary text-white font-bold shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isDownloading ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">sync</span>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">download</span>
                          Download Dataset
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {balance && Number(balance.sui) < Number(selectedListing.price) / 1000000000 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                      <p className="font-bold text-red-800 flex items-center gap-2">
                        <span className="material-symbols-outlined">warning</span>
                        Insufficient balance
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => handlePurchase(selectedListing)}
                    disabled={isPurchasing || !account}
                    className="w-full h-12 rounded-xl border-2 border-ink bg-primary text-white font-bold shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isPurchasing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">sync</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">shopping_cart</span>
                        Purchase for {formatPrice(selectedListing.price)}
                      </>
                    )}
                  </button>

                  {!account && (
                    <p className="text-center text-gray-500 text-sm">Connect your wallet to purchase</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto border-t-2 border-ink pt-8 flex flex-col items-center gap-4 text-center opacity-60 pb-8 bg-[#f6f7f9]">
        <p className="text-sm font-bold">Powered by Sui Network</p>
        <div className="flex gap-4">
          <span className="material-symbols-outlined">dataset</span>
          <span className="material-symbols-outlined">security</span>
          <span className="material-symbols-outlined">hub</span>
        </div>
      </footer>
    </>
  );
}
