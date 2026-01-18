'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useListing, useAccountBalance, usePurchaseDataset, usePurchasedDatasets } from '@/hooks/useMarketplace';
import { formatSize, formatPrice, shortenAddress } from '@/lib/marketplace';
import DecryptionPreviewModal from '@/components/marketplace/DecryptionPreviewModal';
import confetti from 'canvas-confetti';

export default function DatasetDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const account = useCurrentAccount();
  const { data: listing, isLoading } = useListing(id);
  const { data: balance } = useAccountBalance();
  const { purchase, isPending: isPurchasing } = usePurchaseDataset();
  const { data: purchases } = usePurchasedDatasets(account?.address);

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPurchasedState, setIsPurchasedState] = useState(false);
  const [purchaseTxDigest, setPurchaseTxDigest] = useState('');
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Check if already purchased from blockchain data
  const existingPurchase = useMemo(() => {
    if (!purchases || !id) return null;
    return purchases.find(p => p.datasetId === id);
  }, [purchases, id]);

  const isPurchased = isPurchasedState || !!existingPurchase;
  const displayTxDigest = purchaseTxDigest || existingPurchase?.txDigest || '';

  const isOwner = listing && account?.address === listing.seller;

  const fireConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } });
    }, 150);
    setTimeout(() => {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, colors: ['#ccff00', '#3B82F6', '#FF5C00', '#9747FF'] });
    }, 300);
  };

  const handlePurchase = () => {
    if (!account || !listing) {
      alert('Please connect your wallet');
      return;
    }
    setPurchaseError(null);
    purchase(
      listing,
      (result) => {
        setIsPurchasedState(true);
        setPurchaseTxDigest(result.digest);
        setIsBuyModalOpen(false);
        fireConfetti();
      },
      (error) => {
        const errorMessage = error.message || 'Transaction failed';
        if (errorMessage.includes('rejected') || errorMessage.includes('Rejected')) {
          setPurchaseError('Transaction cancelled. You declined the payment request.');
        } else {
          setPurchaseError(errorMessage);
        }
      }
    );
  };

  const handleDownloadClick = async () => {
    if (!account || !listing || !isPurchased) return;
    setIsDownloading(true);
    try {
      const payload = {
        dataset_id: listing.id,
        blob_id: listing.blobId,
        payment_tx_digest: displayTxDigest,
        buyer_address: account.address,
        mime_type: listing.mimeType || 'application/octet-stream',
        file_name: listing.fileName || 'data.bin',
      };
      const response = await fetch('/api/nautilus/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Download failed: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = listing.fileName || 'data.bin';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreviewClick = () => setIsPreviewModalOpen(true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-6xl text-gray-400 animate-spin">sync</span>
          <p className="text-xl font-bold text-gray-500">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-6xl text-gray-400">search_off</span>
          <p className="text-xl font-bold text-gray-500">Dataset not found</p>
          <Link href="/marketplace" className="text-primary font-bold hover:underline">Back to Marketplace</Link>
        </div>
      </div>
    );
  }

  const dummyData = {
    qualityScore: 98,
    formats: ['JSON', 'CSV'],
    updatedAt: 'Recently',
    publisher: { name: shortenAddress(listing.seller), initials: listing.seller.slice(2, 4).toUpperCase(), verified: true },
    versionHistory: [
      { version: 'v1.2', date: 'Oct 12, 2024', isCurrent: true },
      { version: 'v1.1', date: 'Sep 28, 2024', isCurrent: false },
      { version: 'v1.0', date: 'Sep 15, 2024', isCurrent: false },
    ],
    reviews: [
      { id: 'r1', user: 'CryptoWhale_99', initials: 'CW', rating: 5, date: '2 days ago', comment: 'Extremely high quality data. Worth every SUI.', bgColor: 'bg-blue-500' },
      { id: 'r2', user: 'AlphaLab Research', initials: 'AL', rating: 4, date: '5 days ago', comment: 'Solid dataset. Would recommend for DeFi analysis.', bgColor: 'bg-primary' },
    ],
    features: ['Verified on-chain data', 'Encrypted with Seal Protocol', 'Stored on Walrus'],
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
      {/* LEFT PANEL */}
      <div className="w-full lg:w-[400px] shrink-0 bg-accent-lime border-b-2 lg:border-b-0 lg:border-r-2 border-ink flex flex-col p-6 lg:p-8 gap-6 overflow-y-auto z-10">
        <Link href="/marketplace" className="inline-flex items-center gap-2 font-bold text-ink hover:underline uppercase tracking-wide text-sm">
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Marketplace
        </Link>

        <div className="flex flex-col gap-2 mt-4">
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm text-ink">
              <span className="material-symbols-outlined text-[14px]">dataset</span>
              Dataset
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm text-ink">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Seal Verified
            </span>
            {isOwner && (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-primary bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-primary">
                Your Listing
              </span>
            )}
            {isPurchased && !isOwner && (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-green-500 bg-green-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-green-600">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Purchased
              </span>
            )}
          </div>
          <h2 className="text-3xl font-black leading-tight text-ink">{listing.name}</h2>
          <p className="text-sm font-bold text-ink opacity-80">Updated: {dummyData.updatedAt}</p>
        </div>

        <hr className="border-t-2 border-ink border-dashed opacity-50" />

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between p-4 bg-white border-2 border-ink rounded-xl shadow-hard-sm">
            <span className="text-sm font-bold text-gray-500 uppercase">Storage Size</span>
            <span className="text-xl font-black text-ink">{formatSize(Number(listing.totalSize))}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white border-2 border-ink rounded-xl shadow-hard-sm">
            <span className="text-sm font-bold text-gray-500 uppercase">Preview Size</span>
            <span className="text-xl font-black text-ink">{formatSize(Number(listing.previewSize))}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white border-2 border-ink rounded-xl shadow-hard-sm">
            <span className="text-sm font-bold text-gray-500 uppercase">Quality Score</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-primary">{dummyData.qualityScore}</span>
              <span className="text-xs font-bold text-gray-400">/100</span>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-white border-2 border-ink rounded-xl shadow-hard-sm">
            <span className="text-sm font-bold text-gray-500 uppercase">Format</span>
            <span className="text-xl font-black text-ink">{listing.mimeType || dummyData.formats.join(' / ')}</span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold uppercase tracking-widest text-ink opacity-60">Current Price</span>
            <span className="text-5xl font-black tracking-tighter text-ink">{formatPrice(listing.price)}</span>
            <span className="text-sm font-bold text-ink opacity-60">≈ ${(Number(listing.price) / 1e9 * 1.25).toFixed(2)} USD</span>
          </div>

          {isOwner ? (
            <div className="bg-white/50 border-2 border-ink rounded-xl p-4">
              <p className="font-bold text-ink flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                This is your listing
              </p>
            </div>
          ) : isPurchased ? (
            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="group w-full rounded-xl border-2 border-ink bg-ink py-4 text-white shadow-hard transition-all hover:-translate-y-1 hover:bg-primary hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <div className="flex items-center justify-center gap-3">
                {isDownloading ? (
                  <>
                    <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
                    <span className="text-xl font-black uppercase tracking-wide">Downloading...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl">download</span>
                    <span className="text-xl font-black uppercase tracking-wide">Download</span>
                  </>
                )}
              </div>
            </button>
          ) : (
            <button onClick={() => setIsBuyModalOpen(true)} disabled={isPurchasing || !account} className="group w-full rounded-xl border-2 border-ink bg-ink py-4 text-white shadow-hard transition-all hover:-translate-y-1 hover:bg-primary hover:text-ink disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="flex items-center justify-center gap-3">
                {isPurchasing ? (
                  <>
                    <span className="material-symbols-outlined text-2xl animate-spin">sync</span>
                    <span className="text-xl font-black uppercase tracking-wide">Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-2xl group-hover:animate-bounce">shopping_cart_checkout</span>
                    <span className="text-xl font-black uppercase tracking-wide">Buy Now</span>
                  </>
                )}
              </div>
            </button>
          )}
          {!account && !isOwner && <p className="text-center text-xs font-bold text-ink opacity-60">Connect wallet to purchase</p>}
          <p className="text-center text-xs font-bold text-ink opacity-60">Secured by Walrus Protocol</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-white overflow-y-auto relative">
        <div className="absolute right-0 top-0 h-64 w-64 bg-gray-50 rounded-bl-[100px] z-0"></div>
        <div className="max-w-5xl mx-auto p-6 lg:p-12 flex flex-col gap-12 relative z-10">
          {/* Hero Image */}
          <section>
            <div className="relative w-full aspect-2/1 rounded-2xl border-2 border-ink overflow-hidden shadow-hard-lg group">
              {listing.imageUrl ? (
                <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-linear-to-br from-gray-800 to-gray-900" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[120px] text-gray-600">dataset</span>
                  </div>
                </>
              )}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button onClick={handlePreviewClick} className="h-10 px-4 bg-white border-2 border-ink rounded-lg flex items-center justify-center gap-2 hover:bg-accent-lime transition-colors shadow-hard-sm text-ink">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  <span className="font-bold text-xs uppercase">Preview</span>
                </button>
                <button className="h-10 w-10 bg-white border-2 border-ink rounded-lg flex items-center justify-center hover:bg-accent-lime transition-colors shadow-hard-sm text-ink">
                  <span className="material-symbols-outlined">fullscreen</span>
                </button>
                <button onClick={handleDownloadClick} disabled={!isPurchased || isDownloading} className="h-10 w-10 bg-white border-2 border-ink rounded-lg flex items-center justify-center hover:bg-accent-lime transition-colors shadow-hard-sm text-ink disabled:opacity-50">
                  <span className={`material-symbols-outlined ${isDownloading ? 'animate-spin' : ''}`}>{isDownloading ? 'sync' : 'download'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Details Grid */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-center gap-3 border-b-2 border-ink pb-4">
                <span className="material-symbols-outlined text-3xl text-ink">info</span>
                <h3 className="text-2xl font-black uppercase text-ink">About this Data</h3>
              </div>
              <div className="prose prose-lg font-medium">
                <p className="mb-4 text-ink">{listing.description}</p>
                <ul className="list-disc list-inside space-y-2 ml-2 text-sm font-bold text-gray-600">
                  {dummyData.features.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>

              {/* IDs Section */}
              <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 uppercase w-20">Object ID:</span>
                  <code className="text-xs font-mono text-ink bg-white px-2 py-1 rounded border">{listing.id.slice(0, 16)}...{listing.id.slice(-8)}</code>
                  <a href={`https://suiscan.xyz/testnet/object/${listing.id}`} target="_blank" rel="noopener noreferrer" className="h-6 w-6 rounded bg-white hover:bg-gray-100 flex items-center justify-center border" title="SuiScan">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 234 234" fill="none"><path d="M0 100C0 65 0 47.5 6.8 33C12.7 21.3 22.3 11.8 34 5.8C47.3 0 64.7 0 99.5 0H133.8C168.6 0 186 0 199.3 6.8C211 12.8 220.6 22.3 226.5 34C233.3 47.4 233.3 64.9 233.3 99.8V134.2C233.3 169.1 233.3 186.6 226.5 199.9C220.6 211.6 211 221.2 199.3 227.2C186 234 168.6 234 133.8 234H99.5C64.7 234 47.3 234 34 227.2C22.3 221.2 12.7 211.7 6.8 200C0 186.6 0 169.1 0 134.2V100Z" fill="#4C72FF"/><path d="M177 87C178.7 85.9 180.8 85.6 182.4 86.3C183.2 86.6 183.9 87.1 184.3 87.8C184.7 88.5 185 89.4 184.9 90.2L181.4 148.2C181 155.7 178.2 163.4 173.6 170.4C160.4 190.4 133.2 200 112.8 191.8C107.1 189.5 102.5 186 99.2 181.7C100 181.8 100.8 181.7 101.5 181.7C122.4 181.7 143.5 170.3 155.1 152.7C160.7 144.1 164 134.7 164.6 125.6L166.5 93.3L177 87Z" fill="white"/><path d="M150 63.6C151.7 62.5 153.8 62.3 155.5 62.9C156.3 63.3 156.9 63.8 157.4 64.5C157.9 65.2 158.1 66.1 158 66.9L154.5 125C154 132.5 151.3 140.1 146.7 147.1C133.5 167.2 106.3 176.7 85.9 168.5C80.1 166.2 75.6 162.7 72.3 158.4C73.1 158.4 73.9 158.4 74.6 158.4C95.6 158.4 116.6 147.1 128.2 129.4C133.9 120.8 137.1 111.4 137.7 102.3L139.6 70L150 63.6Z" fill="white"/><path d="M123 40.3C124.7 39.2 126.8 39 128.5 39.6C129.2 39.9 129.9 40.5 130.3 41.2C130.8 41.9 131 42.7 130.9 43.5L127.4 101.6C127 109.1 124.2 116.7 119.6 123.7C106.4 143.8 79.2 153.3 58.8 145.1C38.5 136.9 32.7 114 45.9 93.9C50.5 86.9 57.1 80.7 64.6 76.1L123 40.3Z" fill="white"/></svg>
                  </a>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gray-500 uppercase w-20">Blob ID:</span>
                  <code className="text-xs font-mono text-ink bg-white px-2 py-1 rounded border">{listing.blobId.slice(0, 16)}...{listing.blobId.slice(-8)}</code>
                  <a href={`https://walruscan.com/testnet/blob/${listing.blobId}`} target="_blank" rel="noopener noreferrer" className="h-6 w-6 rounded bg-white hover:bg-gray-100 flex items-center justify-center border" title="WalrusScan">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="8" fill="#36B5A8"/><ellipse cx="12" cy="22" rx="6" ry="2" fill="#36B5A8" opacity="0.5"/><circle cx="9" cy="8" r="1.5" fill="white"/><circle cx="15" cy="8" r="1.5" fill="white"/><path d="M9 13C9 13 10.5 15 12 15C13.5 15 15 13 15 13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </a>
                </div>
                {isPurchased && displayTxDigest && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-200 mt-1">
                    <span className="text-xs font-bold text-green-600 uppercase w-20 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Purchase TX:
                    </span>
                    <code className="text-xs font-mono text-ink bg-green-50 px-2 py-1 rounded border border-green-200">{displayTxDigest.slice(0, 16)}...{displayTxDigest.slice(-8)}</code>
                    <a href={`https://suiscan.xyz/testnet/tx/${displayTxDigest}`} target="_blank" rel="noopener noreferrer" className="h-6 w-6 rounded bg-green-100 hover:bg-green-200 flex items-center justify-center border border-green-300" title="View Transaction">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 234 234" fill="none"><path d="M0 100C0 65 0 47.5 6.8 33C12.7 21.3 22.3 11.8 34 5.8C47.3 0 64.7 0 99.5 0H133.8C168.6 0 186 0 199.3 6.8C211 12.8 220.6 22.3 226.5 34C233.3 47.4 233.3 64.9 233.3 99.8V134.2C233.3 169.1 233.3 186.6 226.5 199.9C220.6 211.6 211 221.2 199.3 227.2C186 234 168.6 234 133.8 234H99.5C64.7 234 47.3 234 34 227.2C22.3 221.2 12.7 211.7 6.8 200C0 186.6 0 169.1 0 134.2V100Z" fill="#22c55e"/><path d="M177 87C178.7 85.9 180.8 85.6 182.4 86.3C183.2 86.6 183.9 87.1 184.3 87.8C184.7 88.5 185 89.4 184.9 90.2L181.4 148.2C181 155.7 178.2 163.4 173.6 170.4C160.4 190.4 133.2 200 112.8 191.8C107.1 189.5 102.5 186 99.2 181.7C100 181.8 100.8 181.7 101.5 181.7C122.4 181.7 143.5 170.3 155.1 152.7C160.7 144.1 164 134.7 164.6 125.6L166.5 93.3L177 87Z" fill="white"/><path d="M150 63.6C151.7 62.5 153.8 62.3 155.5 62.9C156.3 63.3 156.9 63.8 157.4 64.5C157.9 65.2 158.1 66.1 158 66.9L154.5 125C154 132.5 151.3 140.1 146.7 147.1C133.5 167.2 106.3 176.7 85.9 168.5C80.1 166.2 75.6 162.7 72.3 158.4C73.1 158.4 73.9 158.4 74.6 158.4C95.6 158.4 116.6 147.1 128.2 129.4C133.9 120.8 137.1 111.4 137.7 102.3L139.6 70L150 63.6Z" fill="white"/><path d="M123 40.3C124.7 39.2 126.8 39 128.5 39.6C129.2 39.9 129.9 40.5 130.3 41.2C130.8 41.9 131 42.7 130.9 43.5L127.4 101.6C127 109.1 124.2 116.7 119.6 123.7C106.4 143.8 79.2 153.3 58.8 145.1C38.5 136.9 32.7 114 45.9 93.9C50.5 86.9 57.1 80.7 64.6 76.1L123 40.3Z" fill="white"/></svg>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border-2 border-ink bg-gray-50 p-5 shadow-hard-sm">
                <h4 className="font-black text-lg mb-3 flex items-center gap-2 text-ink"><span className="material-symbols-outlined">history</span> Version History</h4>
                <div className="flex flex-col gap-3">
                  {dummyData.versionHistory.map((ver, i) => (
                    <div key={i} className={`flex justify-between items-center text-sm ${!ver.isCurrent ? 'opacity-60' : ''}`}>
                      <span className="font-bold text-ink">{ver.version} {ver.isCurrent && '(Current)'}</span>
                      <span className="text-gray-500">{ver.date}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border-2 border-ink bg-accent-orange p-5 shadow-hard-sm">
                <h4 className="font-black text-lg mb-2 text-white">Publisher</h4>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white border-2 border-ink rounded-full flex items-center justify-center font-bold">{dummyData.publisher.initials}</div>
                  <div className="flex flex-col">
                    <span className="font-bold leading-none text-white">{dummyData.publisher.name}</span>
                    <span className="text-xs font-bold text-white/80 mt-1">{dummyData.publisher.verified ? 'Verified Publisher' : 'Community Publisher'}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section className="flex flex-col gap-6 pt-6">
            <div className="flex items-center justify-between border-b-2 border-ink pb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-ink">reviews</span>
                <h3 className="text-2xl font-black uppercase text-ink">Community Reviews</h3>
                <span className="rounded-full bg-ink text-white px-3 py-1 text-sm font-bold">{dummyData.reviews.length}</span>
              </div>
              <button className="text-sm font-bold text-primary hover:underline">Write a Review</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dummyData.reviews.map(review => (
                <div key={review.id} className="rounded-xl border-2 border-ink bg-white p-6 shadow-hard-sm hover:shadow-hard transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full border-2 border-ink flex items-center justify-center font-bold text-white shadow-sm ${review.bgColor}`}>{review.initials}</div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-ink">{review.user}</span>
                        <div className="flex text-accent-orange">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`material-symbols-outlined text-[16px] ${i < review.rating ? '' : 'text-gray-300'}`}>star</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-400">{review.date}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-ink">{review.comment}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="mt-10 border-t-2 border-ink pt-8 flex items-center justify-between opacity-60 pb-8">
            <p className="text-sm font-bold font-mono">ID: {listing.id.slice(0, 16)}...</p>
            <div className="flex gap-4">
              <span className="material-symbols-outlined cursor-pointer hover:opacity-100">flag</span>
              <span className="material-symbols-outlined cursor-pointer hover:opacity-100">share</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border-2 border-ink shadow-hard-lg p-6 relative">
            <button onClick={() => { setIsBuyModalOpen(false); setPurchaseError(null); }} className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
              <span className="material-symbols-outlined text-ink">close</span>
            </button>
            <div className="flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-accent-lime border-2 border-ink flex items-center justify-center shadow-hard-sm">
                <span className="material-symbols-outlined text-2xl text-ink">shopping_cart_checkout</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-ink uppercase leading-none mb-2">Confirm Purchase</h3>
                <p className="text-gray-600 font-medium">You are about to purchase <span className="font-bold text-ink">{listing.name}</span>.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500 uppercase">Total</span>
                <span className="text-2xl font-black text-ink">{formatPrice(listing.price)}</span>
              </div>
              {balance && Number(balance.sui) < Number(listing.price) / 1e9 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3">
                  <p className="font-bold text-red-800 text-sm flex items-center gap-2"><span className="material-symbols-outlined text-sm">warning</span>Insufficient balance</p>
                </div>
              )}
              {purchaseError && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3">
                  <p className="font-bold text-orange-800 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    {purchaseError}
                  </p>
                </div>
              )}
              <div className="flex gap-3 mt-2">
                <button onClick={() => { setIsBuyModalOpen(false); setPurchaseError(null); }} className="flex-1 h-12 rounded-xl border-2 border-ink bg-white text-ink font-bold hover:bg-gray-100">Cancel</button>
                <button onClick={handlePurchase} disabled={isPurchasing} className="flex-1 h-12 rounded-xl border-2 border-ink bg-primary text-ink font-bold shadow-hard-sm hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isPurchasing ? <><span className="material-symbols-outlined animate-spin">sync</span>Processing...</> : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <DecryptionPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        datasetId={listing.id}
        blobId={listing.blobId}
        datasetName={listing.name}
        previewBytes={Number(listing.previewSize)}
        requesterAddress={account?.address || ''}
        mimeType={listing.mimeType || 'application/octet-stream'}
      />
    </div>
  );
}
