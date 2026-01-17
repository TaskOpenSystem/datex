"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentAccount, useDisconnectWallet, ConnectButton, useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

const WAL_COIN_TYPE = "0x9f992cc2430a1f442ca7a5ca7638169f5d5c00e0ebc3977a65e9ac6e497fe5ef::wal::WAL";

export default function MarketplaceSidebar() {
  const pathname = usePathname();
  const isExplore = pathname === "/marketplace";
  const isMyData = pathname === "/marketplace/my-data";
  
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();

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

  const [categories, setCategories] = useState({
    defi: true,
    social: false,
    healthcare: false,
    gaming: false,
  });
  const [verified, setVerified] = useState(true);

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
              <button className="text-xs font-bold text-primary hover:underline">
                Reset
              </button>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-sm text-ink">Category</p>
              {Object.entries(categories).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() =>
                    setCategories((prev) => ({
                      ...prev,
                      [key]: !prev[key as keyof typeof prev],
                    }))
                  }
                >
                  <div
                    className={`w-5 h-5 border-2 border-ink rounded-full flex items-center justify-center group-hover:border-primary transition-colors bg-white`}
                  >
                    {value && (
                      <div className="w-2.5 h-2.5 bg-ink rounded-full"></div>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium capitalize ${value ? "text-ink" : "text-gray-600 group-hover:text-ink"}`}
                  >
                    {key === "defi"
                      ? "Finance (DeFi)"
                      : key === "social"
                        ? "Social Graph"
                        : key}
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-3">
              <p className="font-bold text-sm text-ink">Price Range (SUI)</p>
              <div className="h-2 w-full rounded-full bg-gray-200 relative">
                <div className="absolute left-0 top-0 h-full w-2/3 rounded-full bg-ink"></div>
                <div className="absolute left-2/3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 border-ink bg-primary cursor-pointer hover:scale-110 transition-transform shadow-sm"></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-gray-500">
                <span>0 SUI</span>
                <span>1000 SUI</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-bold text-sm text-ink">Reliability Score</p>
              <div
                className="flex items-center justify-between p-2 rounded-lg border-2 border-gray-100 bg-gray-50 cursor-pointer"
                onClick={() => setVerified(!verified)}
              >
                <span className="text-sm font-bold text-ink">Verified Source</span>
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${verified ? "bg-ink" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 rounded-full transition-all ${verified ? "right-1 bg-accent-lime" : "left-1 bg-white"}`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink">Asset Status</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 border-2 border-ink rounded bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-xs font-bold">check</span>
                </div>
                <span className="text-sm font-bold text-ink">Active Listings</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 border-2 border-ink rounded bg-white flex items-center justify-center group-hover:border-primary transition-colors"></div>
                <span className="text-sm font-medium text-ink group-hover:text-ink">Drafts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-5 h-5 border-2 border-ink rounded bg-white flex items-center justify-center group-hover:border-primary transition-colors"></div>
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
              <div className="h-10 w-10 rounded-full border-2 border-ink bg-gradient-to-br from-primary to-accent-lime flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: "20px" }}>
                  account_balance_wallet
                </span>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold truncate">
                  {suinsName ? `@${suinsName}` : formatAddress(account.address)}
                </span>
                {suinsName && (
                  <span className="text-xs text-gray-500 truncate">{formatAddress(account.address)}</span>
                )}
              </div>
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
              className="!w-full !rounded-lg !border-2 !border-ink !bg-primary !px-4 !py-3 !font-bold !text-white !shadow-hard-sm hover:!-translate-y-1 !transition-transform"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
