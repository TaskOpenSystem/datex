"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentAccount, useDisconnectWallet, ConnectButton, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { useMarketplaceFilterContext } from "@/contexts/MarketplaceFilterContext";

const WAL_COIN_TYPE = "0x8270feb7375eee355e64fdb69c50abb6b5f9393a722883c1cf45f8e26048810a::wal::WAL";

export default function MarketplaceSidebar() {
  const pathname = usePathname();
  const isExplore = pathname === "/marketplace";
  const isMyData = pathname === "/marketplace/my-data";

  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();

  // Copy address state
  const [copied, setCopied] = useState(false);

  // Get filter state from context
  const {
    filters,
    setCategory,
    setPriceRange,
    setVerifiedOnly,
    resetFilters,
  } = useMarketplaceFilterContext();

  // Price slider state
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const maxPrice = 1000;

  // Fetch SuiNS name
  const { data: suinsName } = useQuery({
    queryKey: ["suins-name", account?.address],
    queryFn: async () => {
      if (!account?.address) return null;
      const result = await suiClient.resolveNameServiceNames({
        address: account.address,
      });
      return result.data?.[0] || null;
    },
    enabled: !!account?.address,
  });

  // Fetch SUI balance
  const { data: suiBalance } = useQuery({
    queryKey: ["sui-balance", account?.address],
    queryFn: async () => {
      if (!account?.address) return "0";
      const balance = await suiClient.getBalance({
        owner: account.address,
      });
      return (Number(balance.totalBalance) / 1e9).toFixed(2);
    },
    enabled: !!account?.address,
    refetchInterval: 10000,
  });

  // Fetch WAL balance
  const { data: walBalance } = useQuery({
    queryKey: ["wal-balance", account?.address],
    queryFn: async () => {
      if (!account?.address) return "0";
      const balance = await suiClient.getBalance({
        owner: account.address,
        coinType: WAL_COIN_TYPE,
      });
      return (Number(balance.totalBalance) / 1e9).toFixed(2);
    },
    enabled: !!account?.address,
    refetchInterval: 10000,
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = () => {
    sessionStorage.clear();
    disconnect();
  };

  // Copy address to clipboard
  const handleCopyAddress = async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Open SuiVision explorer
  const openSuiVision = () => {
    if (!account?.address) return;
    window.open(`https://suivision.xyz/account/${account.address}`, "_blank");
  };

  // Price slider handlers
  const handleSliderMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePriceFromMouse(e);
  };

  const updatePriceFromMouse = (e: MouseEvent | React.MouseEvent) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newMax = Math.round(percentage * maxPrice);
    setPriceRange(0, Math.max(10, newMax));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updatePriceFromMouse(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const pricePercentage = (filters.priceRange.max / maxPrice) * 100;

  // Local state filter for My Data page (not connected to main filters)
  const [localAssetStatus, setLocalAssetStatus] = useState({
    active: true,
    drafts: false,
    archived: false,
  });

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r-2 border-ink bg-white h-screen sticky top-0 z-20 overflow-y-auto">
      <div className="flex flex-col gap-6 p-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-primary shadow-hard-sm">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: "28px" }}
            >
              dataset
            </span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold leading-none tracking-tight">
              SUI DATA
            </h1>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Marketplace
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          <Link
            href="/marketplace"
            className={
              isExplore
                ? "group flex items-center gap-3 rounded-lg border-2 border-ink bg-accent-lime px-3 py-3 shadow-hard-sm transition-transform hover:-translate-y-1 cursor-pointer"
                : "group flex items-center gap-3 rounded-lg border-2 border-transparent px-3 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
            }
          >
            <span
              className={`material-symbols-outlined ${isExplore ? "text-ink" : "text-gray-600"}`}
            >
              storefront
            </span>
            <span
              className={`font-bold ${isExplore ? "text-ink" : "text-gray-600 group-hover:text-ink"}`}
            >
              Explore
            </span>
          </Link>

          <Link
            href="/marketplace/my-data"
            className={
              isMyData
                ? "group flex items-center gap-3 rounded-lg border-2 border-ink bg-accent-lime px-3 py-3 shadow-hard-sm transition-transform hover:-translate-y-1 cursor-pointer"
                : "group flex items-center gap-3 rounded-lg border-2 border-transparent px-3 py-3 hover:bg-gray-100 transition-colors cursor-pointer"
            }
          >
            <span
              className={`material-symbols-outlined ${isMyData ? "text-ink" : "text-gray-600"}`}
            >
              folder_open
            </span>
            <span
              className={`font-bold ${isMyData ? "text-ink" : "text-gray-600 group-hover:text-ink"}`}
            >
              My Data
            </span>
          </Link>

          <a
            href="#"
            className="group flex items-center gap-3 rounded-lg border-2 border-transparent px-3 py-3 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-600">
              account_balance_wallet
            </span>
            <span className="font-medium text-gray-600 group-hover:text-ink">
              Wallet
            </span>
          </a>
          <a
            href="#"
            className="group flex items-center gap-3 rounded-lg border-2 border-transparent px-3 py-3 hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-600">
              settings
            </span>
            <span className="font-medium text-gray-600 group-hover:text-ink">
              Settings
            </span>
          </a>
        </nav>

        <hr className="border-t-2 border-gray-200 border-dashed" />

        {/* Filters */}
        {isExplore ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Filters
              </h3>
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-primary hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-sm text-ink">Category</p>
              {filters.categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setCategory(category.id, !category.checked)}
                >
                  <div
                    className={`w-5 h-5 border-2 border-ink rounded-full flex items-center justify-center group-hover:border-primary transition-colors bg-white`}
                  >
                    {category.checked && (
                      <div className="w-2.5 h-2.5 bg-ink rounded-full"></div>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium capitalize ${category.checked ? "text-ink" : "text-gray-600 group-hover:text-ink"}`}
                  >
                    {category.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <p className="font-bold text-sm text-ink">Price Range (SUI)</p>
              <div
                ref={sliderRef}
                className="h-2 w-full rounded-full bg-gray-200 relative cursor-pointer"
                onMouseDown={handleSliderMouseDown}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-ink transition-all"
                  style={{ width: `${pricePercentage}%` }}
                ></div>
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-ink bg-primary cursor-pointer hover:scale-110 transition-transform shadow-sm"
                  style={{ left: `calc(${pricePercentage}% - 10px)` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>0 SUI</span>
                <span>{filters.priceRange.max} SUI</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* <p className="font-bold text-sm text-ink">Reliability Score</p> */}
              <div
                className="flex items-center justify-between p-2 rounded-lg border-2 border-gray-100 bg-gray-50 cursor-pointer"
                onClick={() => setVerifiedOnly(!filters.verifiedOnly)}
              >
                <span className="text-sm font-bold text-ink">Verified Source</span>
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${filters.verifiedOnly ? "bg-ink" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 rounded-full transition-all ${filters.verifiedOnly ? "right-1 bg-accent-lime" : "left-1 bg-white"}`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Asset Status</h3>
            <div className="space-y-3">
              <label
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setLocalAssetStatus((prev) => ({ ...prev, active: !prev.active }))}
              >
                <div className={`w-5 h-5 border-2 border-ink rounded flex items-center justify-center ${localAssetStatus.active ? "bg-primary" : "bg-white group-hover:border-primary"}`}>
                  {localAssetStatus.active && <span className="material-symbols-outlined text-white text-xs font-bold">check</span>}
                </div>
                <span className={`text-sm font-bold ${localAssetStatus.active ? "text-ink" : "text-ink"}`}>Active Listings</span>
              </label>
              <label
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setLocalAssetStatus((prev) => ({ ...prev, drafts: !prev.drafts }))}
              >
                <div className={`w-5 h-5 border-2 border-ink rounded flex items-center justify-center ${localAssetStatus.drafts ? "bg-primary" : "bg-white group-hover:border-primary"}`}>
                  {localAssetStatus.drafts && <span className="material-symbols-outlined text-white text-xs font-bold">check</span>}
                </div>
                <span className="text-sm font-medium text-ink group-hover:text-ink">Drafts</span>
              </label>
              <label
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setLocalAssetStatus((prev) => ({ ...prev, archived: !prev.archived }))}
              >
                <div className={`w-5 h-5 border-2 border-ink rounded flex items-center justify-center ${localAssetStatus.archived ? "bg-primary" : "bg-white group-hover:border-primary"}`}>
                  {localAssetStatus.archived && <span className="material-symbols-outlined text-white text-xs font-bold">check</span>}
                </div>
                <span className="text-sm font-medium text-ink group-hover:text-ink">Archived</span>
              </label>
            </div>

            <div className="p-4 bg-gray-100 rounded-xl border-2 border-ink border-dashed mt-4">
              <p className="text-xs font-bold text-ink uppercase mb-2">Storage Usage</p>
              <div className="h-3 w-full rounded-full bg-white border border-gray-300 overflow-hidden">
                <div className="h-full bg-primary w-3/4"></div>
              </div>
              <p className="text-xs font-bold text-right mt-1 text-ink">750MB / 1GB</p>
            </div>
          </div>
        )}
      </div>

      {/* User Profile / Wallet Connection */}
      <div className="mt-auto border-t-2 border-ink p-4 bg-gray-50">
        {account ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-ink bg-linear-to-br from-primary to-accent-lime flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>
                  account_balance_wallet
                </span>
              </div>
              <div
                className="flex flex-col flex-1 min-w-0 cursor-pointer group"
                onClick={handleCopyAddress}
                title="Click to copy address"
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-ink truncate group-hover:text-primary transition-colors">
                    {suinsName ? `@${suinsName}` : formatAddress(account.address)}
                  </span>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors" style={{ fontSize: "14px" }}>
                    {copied ? "check" : "content_copy"}
                  </span>
                </div>
                {suinsName && (
                  <span className="text-xs text-gray-500 truncate group-hover:text-primary transition-colors">
                    {formatAddress(account.address)}
                  </span>
                )}
              </div>
              <button
                onClick={openSuiVision}
                className="h-8 w-8 rounded-lg border-2 border-ink bg-white flex items-center justify-center hover:bg-accent-lime transition-colors shrink-0"
                title="View on SuiVision"
              >
                <span className="material-symbols-outlined text-ink" style={{ fontSize: "18px" }}>
                  open_in_new
                </span>
              </button>
            </div>

            {/* Balances */}
            <div className="flex gap-2">
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-gray-200">
                <p className="text-xs text-gray-500 font-medium">SUI</p>
                <p className="text-sm font-bold text-ink truncate">{suiBalance || "0.00"}</p>
              </div>
              <div className="flex-1 px-2 py-1.5 rounded-lg bg-white border border-gray-200">
                <p className="text-xs text-gray-500 font-medium">WAL</p>
                <p className="text-sm font-bold text-ink truncate">{walBalance || "0.00"}</p>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border-2 border-ink bg-white text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-gray-600">Connect your wallet to get started</p>
            <ConnectButton
              connectText="Connect Wallet"
              className="w-full! rounded-lg! border-2! border-ink! bg-primary! px-4! py-3! font-bold! text-white! shadow-hard-sm! hover:-translate-y-1! transition-transform!"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
