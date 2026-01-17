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
              <article key={i} className="flex flex-col rounded-xl border-2 border-ink bg-white overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-200" />
                <div className="p-4 flex flex-col flex-1">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                    <div>
                      <div className="h-2 bg-gray-100 rounded w-12 mb-1" />
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </div>
                    <div>
                      <div className="h-2 bg-gray-100 rounded w-12 mb-1" />
                      <div className="h-4 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto pt-3 border-t border-gray-200">
                    <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : validListings && validListings.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {validListings.map(listing => (
              <article
                key={listing.id}
                onClick={() => handleViewListing(listing)}
                className={`flex flex-col rounded-xl border-2 border-ink bg-white overflow-hidden cursor-pointer hover:shadow-hard transition-all ${
                  isOwner(listing) ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                {/* Image/Preview Area */}
                <div className="relative h-36 bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-20">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,50 Q25,30 50,50 T100,50" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-accent-lime" />
                      <path d="M0,60 Q25,40 50,60 T100,60" stroke="currentColor" strokeWidth="0.5" fill="none" className="text-accent-lime" />
                    </svg>
                  </div>
                  <span className="material-symbols-outlined text-5xl text-gray-600">dataset</span>
                  
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="rounded bg-accent-lime text-ink px-2 py-0.5 text-[10px] font-bold border border-ink">ACTIVE</span>
                    {isOwner(listing) && (
                      <span className="rounded bg-primary text-white px-2 py-0.5 text-[10px] font-bold">YOUR LISTING</span>
                    )}
                  </div>
                  
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
                  <h3 className="text-base font-bold text-ink mb-1 line-clamp-2">{listing.name}</h3>
                  
                  {/* Object ID */}
                  <p className="text-[10px] text-gray-400 font-mono mb-1 truncate" title={listing.id}>
                    ID: {listing.id.slice(0, 8)}...{listing.id.slice(-6)}
                  </p>
                  
                  {/* Blob ID with Walrus link */}
                  <div className="flex items-center gap-1 mb-3" onClick={(e) => e.stopPropagation()}>
                    <p className="text-[10px] text-gray-400 font-mono truncate flex-1" title={listing.blobId}>
                      Blob: {listing.blobId.slice(0, 8)}...{listing.blobId.slice(-6)}
                    </p>
                    <a
                      href={`https://walruscan.com/testnet/blob/${listing.blobId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-5 w-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
                      title="View on WalrusScan"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="10" r="8" fill="#36B5A8"/>
                        <ellipse cx="12" cy="22" rx="6" ry="2" fill="#36B5A8" opacity="0.5"/>
                        <circle cx="9" cy="8" r="1.5" fill="white"/>
                        <circle cx="15" cy="8" r="1.5" fill="white"/>
                        <path d="M9 13C9 13 10.5 15 12 15C13.5 15 15 13 15 13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </a>
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-200">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Price</p>
                      <p className="text-sm font-bold text-ink">{formatPrice(listing.price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Size</p>
                      <p className="text-sm font-bold text-accent-lime">{formatSize(Number(listing.totalSize))}</p>
                    </div>
                  </div>
                  
                  {/* Seller */}
                  <div className="flex items-center gap-1 pt-3 border-t border-gray-200 text-xs text-gray-400">
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
    </>
  );
}
