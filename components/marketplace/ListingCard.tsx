"use client";

import { useCallback, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { usePurchaseDataset } from "@/hooks/useMarketplace";
import { DatasetListing } from "@/types/marketplace";
import { formatPrice, formatSize, shortenAddress } from "@/lib/marketplace";

interface ListingCardProps {
  listing: DatasetListing;
  isOwner?: boolean;
  onPurchased?: () => void;
}

export function ListingCard({
  listing,
  isOwner,
  onPurchased,
}: ListingCardProps) {
  const account = useCurrentAccount();
  const { purchase, isPending } = usePurchaseDataset();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = useCallback(() => {
    if (!account) {
      alert("Please connect your wallet to purchase");
      return;
    }

    setIsPurchasing(true);
    purchase(listing, (result) => {
      setIsPurchasing(false);
      alert(`Purchase successful! Receipt ID: ${result.receiptId}`);
      onPurchased?.();
    });
  }, [account, listing, purchase, onPurchased]);

  return (
    <div
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-black"
      style={{ boxShadow: "6px_6px_0px_0px_rgba(0,0,0,1)" }}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3
            className="text-xl font-bold truncate pr-4"
            style={{ color: "#1A1A1A" }}
          >
            {listing.name}
          </h3>
          <span className="bg-[#3B82F6] text-white px-3 py-1 rounded-full text-sm font-bold">
            {formatPrice(listing.price)}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {listing.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-icons text-sm">storage</span>
            <span style={{ color: "#1A1A1A" }}>
              {formatSize(listing.totalSize)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-icons text-sm">visibility</span>
            <span style={{ color: "#1A1A1A" }}>
              Preview: {formatSize(listing.previewSize)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span className="material-icons text-sm">person</span>
            <span className="font-mono" style={{ color: "#1A1A1A" }}>
              {shortenAddress(listing.seller)}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-100 border-t-2 border-black">
        {isOwner ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-bold uppercase">
              Your listing
            </span>
            <span className="material-icons text-[#00D68F]">check_circle</span>
          </div>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={isPurchasing || isPending}
            className="w-full bg-black text-white py-3 rounded-lg font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {isPurchasing || isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="material-icons animate-spin">sync</span>
                Purchasing...
              </span>
            ) : (
              "Purchase Dataset"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface ListingsGridProps {
  listings: DatasetListing[];
  emptyMessage?: string;
  showOwnerIndicator?: boolean;
  onPurchased?: () => void;
}

export function ListingsGrid({
  listings,
  emptyMessage = "No listings found",
  showOwnerIndicator = false,
  onPurchased,
}: ListingsGridProps) {
  const account = useCurrentAccount();

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="material-icons text-6xl text-gray-400 mb-4">
          inventory_2
        </div>
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isOwner={showOwnerIndicator && account?.address === listing.seller}
          onPurchased={onPurchased}
        />
      ))}
    </div>
  );
}
