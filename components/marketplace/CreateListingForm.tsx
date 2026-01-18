'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useListDataset, useAccountBalance } from '@/hooks/useMarketplace';
import { CreateListingInput } from '@/types/marketplace';
import { formatPrice, formatSize } from '@/lib/marketplace';

interface CreateListingFormProps {
  blobId: string;
  encryptedObject: string;
  totalSizeBytes: number;
  initialFormData?: {
    name: string;
    description: string;
    priceSUI: string;
    previewSizeBytes: number;
    imageUrl?: string;
    mimeType?: string;
    fileName?: string;
    contentType?: string;
    fileCount?: number;
  };
}

export function CreateListingForm({ blobId, encryptedObject, totalSizeBytes, initialFormData }: CreateListingFormProps) {
  const account = useCurrentAccount();
  const router = useRouter();
  const { createListing, isPending, error } = useListDataset();
  const { data: balance } = useAccountBalance();

  const [name, setName] = useState(initialFormData?.name ?? '');
  const [description, setDescription] = useState(initialFormData?.description ?? '');
  const [priceSUI, setPriceSUI] = useState(initialFormData?.priceSUI ?? '');
  const [previewSizeBytes, setPreviewSizeBytes] = useState(initialFormData?.previewSizeBytes ?? 1024);
  const [imageUrl, setImageUrl] = useState(initialFormData?.imageUrl ?? 'https://iili.io/fUOriLN.webp');
  const [mimeType] = useState(initialFormData?.mimeType ?? 'application/octet-stream');
  const [fileName] = useState(initialFormData?.fileName ?? 'unknown');
  const [contentType, setContentType] = useState(initialFormData?.contentType ?? initialFormData?.mimeType ?? 'application/octet-stream');
  const [fileCount, setFileCount] = useState(initialFormData?.fileCount ?? 1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [listingId, setListingId] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!account) {
        alert('Please connect your wallet first');
        return;
      }

      const price = parseFloat(priceSUI);
      if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price');
        return;
      }

      if (previewSizeBytes > totalSizeBytes) {
        alert('Preview size cannot be larger than total size');
        return;
      }

      const input: CreateListingInput = {
        name,
        description,
        priceSUI: price,
        blobId,
        encryptedObject,
        previewSizeBytes,
        totalSizeBytes,
        imageUrl,
        mimeType,
        fileName,
        contentType,
        fileCount,
      };

      createListing(input, (result) => {
        setListingId(result.listingId);
        setIsSuccess(true);
      });
    },
    [account, name, description, priceSUI, blobId, encryptedObject, previewSizeBytes, totalSizeBytes, createListing]
  );

  if (!account) {
    return (
      <div className="text-center py-12">
        <div className="material-icons text-6xl text-gray-400 mb-4">account_balance_wallet</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Connect Your Wallet</h3>
        <p className="text-gray-600">
          Please connect your wallet to list a dataset for sale.
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center py-12">
        <div className="material-icons text-6xl text-[#00D68F] mb-4">check_circle</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#1A1A1A' }}>Listing Created Successfully!</h3>
        <p className="text-gray-600 mb-4">
          Your dataset has been listed on the marketplace.
        </p>
        <div className="bg-gray-100 rounded-lg p-4 mb-4 text-left border-2 border-black" style={{ boxShadow: '4px_4px_0px_0px_rgba(0,0,0,1)' }}>
          <p className="text-sm text-gray-500">Listing ID:</p>
          <p className="font-mono text-sm break-all" style={{ color: '#1A1A1A' }}>{listingId}</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/marketplace/dashboard?section=my-listings')}
            className="bg-black text-white px-6 py-3 rounded-full font-bold uppercase tracking-wide hover:scale-105 transition-transform shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            View My Listings
          </button>
          <button
            onClick={() => {
              setIsSuccess(false);
              setName('');
              setDescription('');
              setPriceSUI('');
              setListingId('');
            }}
            className="bg-white text-black border-2 border-black px-6 py-3 rounded-full font-bold uppercase tracking-wide hover:scale-105 transition-transform"
          >
            Create Another Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Dataset Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter dataset name"
          maxLength={100}
          className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 text-lg"
          style={{ color: '#1A1A1A' }}
          required
        />
        <p className="text-xs text-gray-500 mt-1">{name.length}/100 characters</p>
      </div>

      <div>
        <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your dataset..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 resize-none text-lg"
          style={{ color: '#1A1A1A' }}
          required
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/1000 characters</p>
      </div>

      <div>
        <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Price (SUI)</label>
        <div className="relative">
          <input
            type="number"
            value={priceSUI}
            onChange={(e) => setPriceSUI(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-4 py-4 rounded-xl border-2 border-gray-300 bg-white focus:outline-none focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/20 text-lg pr-12"
            style={{ color: '#1A1A1A' }}
            required
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">SUI</span>
        </div>
        {balance && (
          <p className="text-xs text-gray-500 mt-1">
            Balance: {balance.sui.toFixed(4)} SUI
          </p>
        )}
      </div>

      <div>
        <label className="block font-bold uppercase text-sm mb-2 tracking-wide" style={{ color: '#1A1A1A' }}>Preview Size</label>
        <input
          type="range"
          value={previewSizeBytes}
          onChange={(e) => setPreviewSizeBytes(Number(e.target.value))}
          min={1024}
          max={3072}
          step={128}
          className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>1 KB</span>
          <span className="text-[#3B82F6] font-bold">{formatSize(previewSizeBytes)}</span>
          <span>3 KB</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Free preview data size available to buyers (1KB - 3KB)
        </p>
      </div>

      <div className="bg-gray-100 rounded-xl p-4 border-2 border-black" style={{ boxShadow: '4px_4px_0px_0px_rgba(0,0,0,1)' }}>
        <h4 className="font-bold uppercase text-sm mb-3" style={{ color: '#1A1A1A' }}>Dataset Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Total Size</p>
            <p className="font-semibold" style={{ color: '#1A1A1A' }}>{formatSize(totalSizeBytes)}</p>
          </div>
          <div>
            <p className="text-gray-500">Blob ID</p>
            <p className="font-mono text-xs break-all" style={{ color: '#1A1A1A' }}>{blobId.slice(0, 16)}...</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Wallet</p>
            <p className="font-mono text-xs" style={{ color: '#1A1A1A' }}>{account.address.slice(0, 12)}...{account.address.slice(-6)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-bold">Error</p>
          <p>{error.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !name || !description || !priceSUI}
        className="w-full bg-black text-white py-5 rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="material-icons animate-spin">sync</span>
            Creating Listing...
          </span>
        ) : (
          `List Dataset for ${priceSUI ? formatPrice(BigInt(Math.floor(parseFloat(priceSUI) * 1000000000))) : '0 SUI'}`
        )}
      </button>
    </form>
  );
}
